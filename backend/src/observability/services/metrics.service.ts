import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface TransactionMetrics {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  totalVolume: number;
  averageAmount: number;
}

@Injectable()
export class MetricsService {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>) {
    const key = this.buildKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  setGauge(name: string, value: number, labels?: Record<string, string>) {
    const key = this.buildKey(name, labels);
    this.gauges.set(key, value);
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>) {
    const key = this.buildKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    if (values.length > 1000) values.shift();
    this.histograms.set(key, values);
  }

  async getTransactionMetrics(period: 'day' | 'week' | 'month' = 'day'): Promise<TransactionMetrics> {
    const since = this.getPeriodStart(period);

    const [stats, volume] = await Promise.all([
      this.prisma.transaction.groupBy({
        by: ['status'],
        where: { createdAt: { gte: since } },
        _count: true,
      }),
      this.prisma.transaction.aggregate({
        where: { createdAt: { gte: since } },
        _sum: { amount: true },
        _avg: { amount: true },
        _count: true,
      }),
    ]);

    const statusCounts = Object.fromEntries(stats.map(s => [s.status, s._count]));

    return {
      total: volume._count,
      successful: statusCounts['COMPLETED'] || 0,
      failed: statusCounts['FAILED'] || 0,
      pending: statusCounts['PENDING'] || 0,
      totalVolume: Math.abs(Number(volume._sum.amount || 0)),
      averageAmount: Math.abs(Number(volume._avg.amount || 0)),
    };
  }

  async getPixMetrics(period: 'day' | 'week' | 'month' = 'day') {
    const since = this.getPeriodStart(period);

    const [sent, received] = await Promise.all([
      this.prisma.pixTransaction.aggregate({
        where: { createdAt: { gte: since }, type: 'TRANSFER' },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.pixTransaction.count({
        where: { createdAt: { gte: since }, status: 'COMPLETED' },
      }),
    ]);

    return {
      totalTransactions: sent._count,
      completedTransactions: received,
      totalVolume: Number(sent._sum.amount || 0),
      period,
    };
  }

  async getUserMetrics() {
    const [total, active, newToday] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({
        where: { createdAt: { gte: this.getPeriodStart('day') } },
      }),
    ]);

    return { total, active, newToday };
  }

  async getFraudMetrics(period: 'day' | 'week' | 'month' = 'day') {
    const since = this.getPeriodStart(period);

    const alerts = await this.prisma.fraudAlert.groupBy({
      by: ['severity', 'status'],
      where: { createdAt: { gte: since } },
      _count: true,
    });

    return {
      totalAlerts: alerts.reduce((sum, a) => sum + a._count, 0),
      bySeverity: this.groupByField(alerts, 'severity'),
      byStatus: this.groupByField(alerts, 'status'),
      period,
    };
  }

  getPrometheusMetrics(): string {
    const lines: string[] = [];

    this.counters.forEach((value, key) => {
      lines.push(`fragtech_${key} ${value}`);
    });

    this.gauges.forEach((value, key) => {
      lines.push(`fragtech_${key} ${value}`);
    });

    this.histograms.forEach((values, key) => {
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        lines.push(`fragtech_${key}_sum ${sum}`);
        lines.push(`fragtech_${key}_count ${values.length}`);
        lines.push(`fragtech_${key}_avg ${avg}`);
      }
    });

    return lines.join('\n');
  }

  private buildKey(name: string, labels?: Record<string, string>): string {
    if (!labels) return name;
    const labelStr = Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',');
    return `${name}{${labelStr}}`;
  }

  private getPeriodStart(period: 'day' | 'week' | 'month'): Date {
    const now = new Date();
    switch (period) {
      case 'day': return new Date(now.setHours(0, 0, 0, 0));
      case 'week': return new Date(now.setDate(now.getDate() - 7));
      case 'month': return new Date(now.setMonth(now.getMonth() - 1));
    }
  }

  private groupByField(data: any[], field: string): Record<string, number> {
    return data.reduce((acc, item) => {
      acc[item[field]] = (acc[item[field]] || 0) + item._count;
      return acc;
    }, {});
  }
}
