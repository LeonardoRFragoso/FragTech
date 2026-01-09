import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getExecutiveDashboard() {
    const [
      userMetrics,
      revenueMetrics,
      growthMetrics,
      aiMetrics,
      alerts,
    ] = await Promise.all([
      this.getUserMetrics(),
      this.getRevenueMetrics(),
      this.getGrowthMetrics(),
      this.getAIUsageMetrics(),
      this.getCriticalAlerts(),
    ]);

    return {
      timestamp: new Date().toISOString(),
      userMetrics,
      revenueMetrics,
      growthMetrics,
      aiMetrics,
      alerts,
    };
  }

  async getUserMetrics() {
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalUsers, newToday, newWeek, newMonth, activeUsers, byPlan] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: today } } }),
      this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.groupBy({ by: ['plan'], _count: true }),
    ]);

    // Calculate DAU/WAU/MAU from analytics events
    const [dau, wau, mau] = await Promise.all([
      this.prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: today }, userId: { not: null } },
      }).then(r => r.length),
      this.prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: weekAgo }, userId: { not: null } },
      }).then(r => r.length),
      this.prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: monthAgo }, userId: { not: null } },
      }).then(r => r.length),
    ]);

    return {
      total: totalUsers,
      active: activeUsers,
      newToday,
      newThisWeek: newWeek,
      newThisMonth: newMonth,
      dau,
      wau,
      mau,
      dauWauRatio: wau > 0 ? ((dau / wau) * 100).toFixed(1) : 0,
      byPlan: Object.fromEntries(byPlan.map(p => [p.plan, p._count])),
    };
  }

  async getRevenueMetrics() {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get active subscriptions for MRR calculation
    const activeSubscriptions = await this.prisma.subscription.findMany({
      where: { status: { in: ['ACTIVE', 'TRIAL'] } },
      include: { plan: true },
    });

    let mrr = 0;
    let arr = 0;
    const subscribersByPlan: Record<string, number> = {};

    for (const sub of activeSubscriptions) {
      const isYearly = (sub.metadata as any)?.isYearly;
      const monthlyValue = isYearly
        ? Number(sub.plan.priceYearly) / 12
        : Number(sub.plan.priceMonthly);
      
      mrr += monthlyValue;
      subscribersByPlan[sub.plan.code] = (subscribersByPlan[sub.plan.code] || 0) + 1;
    }

    arr = mrr * 12;

    // Revenue this month vs last month
    const [revenueThisMonth, revenueLastMonth] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: 'COMPLETED', paidAt: { gte: thisMonth } },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'COMPLETED', paidAt: { gte: lastMonth, lt: lastMonthEnd } },
        _sum: { amount: true },
      }),
    ]);

    const thisMonthRevenue = Number(revenueThisMonth._sum.amount || 0);
    const lastMonthRevenue = Number(revenueLastMonth._sum.amount || 0);
    const revenueGrowth = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
      : 0;

    // ARPU calculation
    const payingUsers = activeSubscriptions.filter(s => s.plan.code !== 'FREE').length;
    const arpu = payingUsers > 0 ? mrr / payingUsers : 0;

    // Churn rate (cancelled in last 30 days / active at start)
    const cancelledLast30 = await this.prisma.subscription.count({
      where: { cancelledAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    });
    const activeAtStart = await this.prisma.subscription.count({
      where: { createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    });
    const churnRate = activeAtStart > 0 ? ((cancelledLast30 / activeAtStart) * 100).toFixed(2) : 0;

    return {
      mrr: mrr.toFixed(2),
      arr: arr.toFixed(2),
      arpu: arpu.toFixed(2),
      revenueThisMonth: thisMonthRevenue.toFixed(2),
      revenueGrowth: `${revenueGrowth}%`,
      churnRate: `${churnRate}%`,
      payingUsers,
      subscribersByPlan,
      ltv: arpu > 0 && Number(churnRate) > 0 
        ? (arpu / (Number(churnRate) / 100)).toFixed(2) 
        : 'N/A',
    };
  }

  async getGrowthMetrics() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Funnel metrics
    const [signups, activated, converted] = await Promise.all([
      this.prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: { eventName: 'signup_completed', createdAt: { gte: thirtyDaysAgo } },
      }).then(r => r.length),
      this.prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: { eventName: 'first_transaction', createdAt: { gte: thirtyDaysAgo } },
      }).then(r => r.length),
      this.prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: { eventName: 'subscription_created', createdAt: { gte: thirtyDaysAgo } },
      }).then(r => r.length),
    ]);

    // Referral stats
    const [totalReferrals, convertedReferrals] = await Promise.all([
      this.prisma.referral.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.referral.count({ 
        where: { status: 'converted', createdAt: { gte: thirtyDaysAgo } } 
      }),
    ]);

    return {
      signups,
      activated,
      converted,
      activationRate: signups > 0 ? ((activated / signups) * 100).toFixed(1) : 0,
      conversionRate: signups > 0 ? ((converted / signups) * 100).toFixed(1) : 0,
      referrals: {
        total: totalReferrals,
        converted: convertedReferrals,
        conversionRate: totalReferrals > 0 
          ? ((convertedReferrals / totalReferrals) * 100).toFixed(1) 
          : 0,
      },
    };
  }

  async getAIUsageMetrics() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalQueries, weeklyQueries, uniqueUsers, avgPerUser] = await Promise.all([
      this.prisma.analyticsEvent.count({
        where: { eventName: 'ai_query', createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.analyticsEvent.count({
        where: { eventName: 'ai_query', createdAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: { eventName: 'ai_query', createdAt: { gte: thirtyDaysAgo }, userId: { not: null } },
      }).then(r => r.length),
      this.prisma.userMetrics.aggregate({
        _avg: { totalAiInteractions: true },
      }),
    ]);

    // AI user segments
    const segments = await Promise.all([
      this.prisma.userMetrics.count({ where: { totalAiInteractions: { gte: 50 } } }),
      this.prisma.userMetrics.count({ where: { totalAiInteractions: { gte: 10, lt: 50 } } }),
      this.prisma.userMetrics.count({ where: { totalAiInteractions: { gte: 1, lt: 10 } } }),
      this.prisma.userMetrics.count({ where: { totalAiInteractions: 0 } }),
    ]);

    return {
      totalQueriesLast30Days: totalQueries,
      weeklyQueries,
      uniqueAIUsers: uniqueUsers,
      avgQueriesPerUser: Number(avgPerUser._avg.totalAiInteractions || 0).toFixed(1),
      segments: {
        powerUsers: segments[0],
        regularUsers: segments[1],
        lightUsers: segments[2],
        nonUsers: segments[3],
      },
    };
  }

  async getCriticalAlerts() {
    const alerts: Array<{ type: string; severity: string; message: string; value?: any }> = [];

    // Check churn rate
    const churnData = await this.getRevenueMetrics();
    if (Number(churnData.churnRate.replace('%', '')) > 5) {
      alerts.push({
        type: 'churn',
        severity: 'warning',
        message: `Churn rate elevado: ${churnData.churnRate}`,
        value: churnData.churnRate,
      });
    }

    // Check failed payments
    const failedPayments = await this.prisma.payment.count({
      where: { 
        status: 'FAILED', 
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
      },
    });
    if (failedPayments > 0) {
      alerts.push({
        type: 'payment',
        severity: 'error',
        message: `${failedPayments} pagamentos falharam nas últimas 24h`,
        value: failedPayments,
      });
    }

    // Check low activation rate
    const growth = await this.getGrowthMetrics();
    if (Number(growth.activationRate) < 30) {
      alerts.push({
        type: 'activation',
        severity: 'warning',
        message: `Taxa de ativação baixa: ${growth.activationRate}%`,
        value: growth.activationRate,
      });
    }

    return alerts;
  }

  async getRetentionCohorts(weeks: number = 8) {
    const cohorts: any[] = [];
    const now = new Date();

    for (let i = 0; i < weeks; i++) {
      const cohortStart = new Date(now);
      cohortStart.setDate(cohortStart.getDate() - (i + 1) * 7);
      const cohortEnd = new Date(cohortStart);
      cohortEnd.setDate(cohortEnd.getDate() + 7);

      const users = await this.prisma.user.findMany({
        where: { createdAt: { gte: cohortStart, lt: cohortEnd } },
        select: { id: true },
      });

      const retention: number[] = [];
      for (let week = 0; week <= i; week++) {
        const checkStart = new Date(cohortStart);
        checkStart.setDate(checkStart.getDate() + week * 7);
        const checkEnd = new Date(checkStart);
        checkEnd.setDate(checkEnd.getDate() + 7);

        const activeCount = await this.prisma.analyticsEvent.groupBy({
          by: ['userId'],
          where: {
            userId: { in: users.map(u => u.id) },
            createdAt: { gte: checkStart, lt: checkEnd },
          },
        });

        retention.push(users.length > 0 ? Math.round((activeCount.length / users.length) * 100) : 0);
      }

      cohorts.push({
        week: `Semana ${weeks - i}`,
        startDate: cohortStart.toISOString().split('T')[0],
        users: users.length,
        retention,
      });
    }

    return cohorts.reverse();
  }

  async getExperimentResults() {
    const experiments = await this.prisma.experiment.findMany({
      where: { status: { in: ['running', 'completed'] } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return experiments.map(exp => {
      const variants = (exp.variants as any[]) || [];
      return {
        id: exp.id,
        name: exp.name,
        status: exp.status,
        startDate: exp.startedAt,
        endDate: exp.endedAt,
        variants: variants.map((v: any) => ({
          name: v.name,
          traffic: v.trafficPercentage,
          participants: v.participantCount || 0,
          conversions: v.conversionCount || 0,
          conversionRate: v.participantCount > 0 
            ? ((v.conversionCount / v.participantCount) * 100).toFixed(2) 
            : 0,
        })),
      };
    });
  }
}
