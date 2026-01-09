import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanService } from './plan.service';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly planService: PlanService,
  ) {}

  async getUserSubscription(userId: string) {
    return this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
  }

  async createSubscription(userId: string, planCode: string, isYearly: boolean = false) {
    const plan = await this.planService.getPlanByCode(planCode);
    if (!plan) {
      throw new BadRequestException('Plano não encontrado');
    }

    const existing = await this.getUserSubscription(userId);
    if (existing) {
      throw new BadRequestException('Usuário já possui uma assinatura');
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + (isYearly ? 12 : 1));

    const trialEndsAt = plan.trialDays > 0
      ? new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000)
      : null;

    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        status: plan.trialDays > 0 ? 'TRIAL' : 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialEndsAt,
        metadata: { isYearly },
      },
      include: { plan: true },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { plan: planCode as any },
    });

    this.logger.log(`Subscription created for user ${userId} - Plan: ${planCode}`);
    return subscription;
  }

  async upgradePlan(userId: string, newPlanCode: string) {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) {
      return this.createSubscription(userId, newPlanCode);
    }

    const newPlan = await this.planService.getPlanByCode(newPlanCode);
    if (!newPlan) {
      throw new BadRequestException('Plano não encontrado');
    }

    const currentPlan = subscription.plan;
    if (newPlan.sortOrder <= currentPlan.sortOrder) {
      throw new BadRequestException('Use downgrade para mudar para um plano inferior');
    }

    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        planId: newPlan.id,
        status: 'ACTIVE',
      },
      include: { plan: true },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { plan: newPlanCode as any },
    });

    this.logger.log(`User ${userId} upgraded from ${currentPlan.code} to ${newPlanCode}`);
    return updated;
  }

  async downgradePlan(userId: string, newPlanCode: string) {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) {
      throw new BadRequestException('Usuário não possui assinatura');
    }

    const newPlan = await this.planService.getPlanByCode(newPlanCode);
    if (!newPlan) {
      throw new BadRequestException('Plano não encontrado');
    }

    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        planId: newPlan.id,
        metadata: {
          ...((subscription.metadata as any) || {}),
          downgradeEffectiveAt: subscription.currentPeriodEnd,
        },
      },
      include: { plan: true },
    });

    this.logger.log(`User ${userId} scheduled downgrade to ${newPlanCode}`);
    return updated;
  }

  async cancelSubscription(userId: string, reason?: string) {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) {
      throw new BadRequestException('Usuário não possui assinatura');
    }

    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason,
      },
      include: { plan: true },
    });

    this.logger.log(`Subscription cancelled for user ${userId}. Reason: ${reason}`);
    return updated;
  }

  async reactivateSubscription(userId: string) {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) {
      throw new BadRequestException('Usuário não possui assinatura');
    }

    if (subscription.status !== 'CANCELLED') {
      throw new BadRequestException('Assinatura não está cancelada');
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        cancelledAt: null,
        cancelReason: null,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      include: { plan: true },
    });

    this.logger.log(`Subscription reactivated for user ${userId}`);
    return updated;
  }

  async checkTrialExpiration() {
    const expiredTrials = await this.prisma.subscription.findMany({
      where: {
        status: 'TRIAL',
        trialEndsAt: { lt: new Date() },
      },
    });

    for (const sub of expiredTrials) {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'ACTIVE' },
      });
      this.logger.log(`Trial ended for subscription ${sub.id}`);
    }

    return expiredTrials.length;
  }

  async getSubscriptionStats() {
    const [total, byStatus, byPlan] = await Promise.all([
      this.prisma.subscription.count(),
      this.prisma.subscription.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.subscription.groupBy({
        by: ['planId'],
        _count: true,
      }),
    ]);

    return {
      total,
      byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
      byPlan,
    };
  }
}
