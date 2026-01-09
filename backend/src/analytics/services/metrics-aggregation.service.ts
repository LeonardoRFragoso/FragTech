import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MetricsAggregationService {
  private readonly logger = new Logger(MetricsAggregationService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async aggregateDailyMetrics() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const endOfDay = new Date(yesterday);
    endOfDay.setHours(23, 59, 59, 999);

    await this.calculateDailyMetrics(yesterday, endOfDay);
  }

  async calculateDailyMetrics(startDate: Date, endDate: Date) {
    const [
      totalUsers,
      newUsers,
      activeUsers,
      transactions,
      revenue,
      subscriptions,
      aiInteractions,
      pixTransactions,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      this.prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: startDate, lte: endDate }, userId: { not: null } },
      }).then(r => r.length),
      this.prisma.transaction.aggregate({
        where: { createdAt: { gte: startDate, lte: endDate } },
        _count: true,
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'COMPLETED', paidAt: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
      }),
      this.prisma.subscription.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      this.prisma.analyticsEvent.count({
        where: { eventName: 'ai_query', createdAt: { gte: startDate, lte: endDate } },
      }),
      this.prisma.pixTransaction.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
    ]);

    const cancelled = await this.prisma.subscription.count({
      where: { cancelledAt: { gte: startDate, lte: endDate } },
    });

    await this.prisma.dailyMetrics.upsert({
      where: { date: startDate },
      create: {
        date: startDate,
        totalUsers,
        newUsers,
        activeUsers,
        totalTransactions: transactions._count,
        transactionVolume: transactions._sum.amount || 0,
        totalRevenue: revenue._sum.amount || 0,
        newSubscriptions: subscriptions,
        cancelledSubs: cancelled,
        aiInteractions,
        pixTransactions,
      },
      update: {
        totalUsers,
        newUsers,
        activeUsers,
        totalTransactions: transactions._count,
        transactionVolume: transactions._sum.amount || 0,
        totalRevenue: revenue._sum.amount || 0,
        newSubscriptions: subscriptions,
        cancelledSubs: cancelled,
        aiInteractions,
        pixTransactions,
      },
    });

    this.logger.log(`Daily metrics calculated for ${startDate.toISOString().split('T')[0]}`);
  }

  async getMetricsForPeriod(days: number) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return this.prisma.dailyMetrics.findMany({
      where: { date: { gte: since } },
      orderBy: { date: 'asc' },
    });
  }

  async getKeyMetrics() {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [dau, wau, mau, mrr] = await Promise.all([
      this.getDAU(),
      this.getWAU(),
      this.getMAU(),
      this.getMRR(),
    ]);

    return { dau, wau, mau, mrr };
  }

  async getDAU() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.prisma.analyticsEvent.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: today }, userId: { not: null } },
    });

    return result.length;
  }

  async getWAU() {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const result = await this.prisma.analyticsEvent.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: weekAgo }, userId: { not: null } },
    });

    return result.length;
  }

  async getMAU() {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const result = await this.prisma.analyticsEvent.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: monthAgo }, userId: { not: null } },
    });

    return result.length;
  }

  async getMRR() {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { status: { in: ['ACTIVE', 'TRIAL'] } },
      include: { plan: true },
    });

    let mrr = 0;
    for (const sub of subscriptions) {
      const isYearly = (sub.metadata as any)?.isYearly;
      mrr += isYearly
        ? Number(sub.plan.priceYearly) / 12
        : Number(sub.plan.priceMonthly);
    }

    return mrr;
  }

  async getARPU() {
    const [totalRevenue, activeUsers] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.user.count({ where: { isActive: true } }),
    ]);

    return activeUsers > 0 ? Number(totalRevenue._sum.amount || 0) / activeUsers : 0;
  }

  async getChurnRate(days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [cancelled, totalAtStart] = await Promise.all([
      this.prisma.subscription.count({
        where: { cancelledAt: { gte: since } },
      }),
      this.prisma.subscription.count({
        where: { createdAt: { lt: since } },
      }),
    ]);

    return totalAtStart > 0 ? (cancelled / totalAtStart) * 100 : 0;
  }
}
