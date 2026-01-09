import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CohortService {
  constructor(private readonly prisma: PrismaService) {}

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
        select: { id: true, createdAt: true },
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

        retention.push(users.length > 0 ? (activeCount.length / users.length) * 100 : 0);
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

  async getUsersByPlan() {
    const result = await this.prisma.user.groupBy({
      by: ['plan'],
      _count: true,
    });

    return Object.fromEntries(result.map(r => [r.plan, r._count]));
  }

  async getUsersByAIUsage(days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const heavy = await this.prisma.userMetrics.count({
      where: { totalAiInteractions: { gte: 50 } },
    });

    const medium = await this.prisma.userMetrics.count({
      where: { totalAiInteractions: { gte: 10, lt: 50 } },
    });

    const light = await this.prisma.userMetrics.count({
      where: { totalAiInteractions: { gte: 1, lt: 10 } },
    });

    const none = await this.prisma.userMetrics.count({
      where: { totalAiInteractions: 0 },
    });

    return { heavy, medium, light, none };
  }

  async getTopUsers(limit: number = 10) {
    return this.prisma.userMetrics.findMany({
      orderBy: { totalTransactions: 'desc' },
      take: limit,
      select: {
        userId: true,
        totalLogins: true,
        totalTransactions: true,
        totalAiInteractions: true,
        activeDays: true,
        currentStreak: true,
      },
    });
  }
}
