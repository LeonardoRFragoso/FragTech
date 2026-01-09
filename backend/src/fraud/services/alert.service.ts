import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createAlert(
    userId: string,
    transactionId: string | null,
    transactionType: string,
    score: number,
    triggeredRules: any[],
    details?: any,
  ) {
    const severity = this.getSeverity(score);

    const alert = await this.prisma.fraudAlert.create({
      data: {
        userId,
        transactionId,
        transactionType,
        severity,
        score: new Decimal(score),
        triggeredRules,
        details,
      },
    });

    this.logger.warn(`Fraud alert created: ${alert.id} (severity: ${severity}, score: ${score})`);

    return alert;
  }

  private getSeverity(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  }

  async getUserAlerts(userId: string, options?: {
    status?: string;
    severity?: string;
    limit?: number;
  }) {
    const where: any = { userId };
    if (options?.status) where.status = options.status;
    if (options?.severity) where.severity = options.severity;

    return this.prisma.fraudAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
    });
  }

  async getAlertById(alertId: string) {
    return this.prisma.fraudAlert.findUnique({
      where: { id: alertId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }

  async updateAlertStatus(
    alertId: string,
    status: 'INVESTIGATING' | 'CONFIRMED' | 'FALSE_POSITIVE' | 'RESOLVED',
    reviewedBy: string,
    resolution?: string,
  ) {
    return this.prisma.fraudAlert.update({
      where: { id: alertId },
      data: {
        status,
        reviewedBy,
        reviewedAt: new Date(),
        resolution,
      },
    });
  }

  async getPendingAlerts(limit: number = 100) {
    return this.prisma.fraudAlert.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: [{ severity: 'desc' }, { createdAt: 'asc' }],
      take: limit,
    });
  }

  async getCriticalAlerts() {
    return this.prisma.fraudAlert.findMany({
      where: {
        severity: 'CRITICAL',
        status: { in: ['PENDING', 'INVESTIGATING'] },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getAlertStats(days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [total, bySeverity, byStatus] = await Promise.all([
      this.prisma.fraudAlert.count({
        where: { createdAt: { gte: since } },
      }),
      this.prisma.fraudAlert.groupBy({
        by: ['severity'],
        where: { createdAt: { gte: since } },
        _count: true,
      }),
      this.prisma.fraudAlert.groupBy({
        by: ['status'],
        where: { createdAt: { gte: since } },
        _count: true,
      }),
    ]);

    return {
      total,
      bySeverity: Object.fromEntries(bySeverity.map(s => [s.severity, s._count])),
      byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
      period: `${days} days`,
    };
  }

  async autoResolveOldAlerts(daysOld: number = 90): Promise<number> {
    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const result = await this.prisma.fraudAlert.updateMany({
      where: {
        status: 'PENDING',
        severity: 'LOW',
        createdAt: { lt: cutoff },
      },
      data: {
        status: 'RESOLVED',
        resolution: 'Auto-resolved due to age',
        reviewedAt: new Date(),
      },
    });

    this.logger.log(`Auto-resolved ${result.count} old low-severity alerts`);
    return result.count;
  }
}
