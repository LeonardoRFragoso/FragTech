import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface PlanFeatures {
  aiCopilot: boolean;
  aiCopilotLimit?: number;
  unlimitedInsights: boolean;
  advancedGoals: boolean;
  financialAutomation: boolean;
  prioritySupport: boolean;
  predictiveAi: boolean;
  advancedAnalytics: boolean;
  smartCredit: boolean;
  openFinanceFull: boolean;
  exclusiveBenefits: boolean;
  customReports: boolean;
}

export interface PlanLimits {
  monthlyTransactions: number;
  aiQueriesPerDay: number;
  connectedAccounts: number;
  pixKeysLimit: number;
  exportReportsPerMonth: number;
}

const DEFAULT_PLANS = [
  {
    code: 'FREE',
    name: 'Free',
    description: 'Conta digital básica para começar sua jornada financeira',
    priceMonthly: 0,
    priceYearly: 0,
    trialDays: 0,
    sortOrder: 1,
    features: {
      aiCopilot: true,
      aiCopilotLimit: 5,
      unlimitedInsights: false,
      advancedGoals: false,
      financialAutomation: false,
      prioritySupport: false,
      predictiveAi: false,
      advancedAnalytics: false,
      smartCredit: false,
      openFinanceFull: false,
      exclusiveBenefits: false,
      customReports: false,
    },
    limits: {
      monthlyTransactions: 50,
      aiQueriesPerDay: 5,
      connectedAccounts: 1,
      pixKeysLimit: 3,
      exportReportsPerMonth: 1,
    },
  },
  {
    code: 'PRO',
    name: 'Pro',
    description: 'Para quem quer controle total das suas finanças',
    priceMonthly: 29.90,
    priceYearly: 299.00,
    trialDays: 14,
    sortOrder: 2,
    features: {
      aiCopilot: true,
      aiCopilotLimit: null,
      unlimitedInsights: true,
      advancedGoals: true,
      financialAutomation: true,
      prioritySupport: true,
      predictiveAi: false,
      advancedAnalytics: false,
      smartCredit: false,
      openFinanceFull: false,
      exclusiveBenefits: false,
      customReports: true,
    },
    limits: {
      monthlyTransactions: 500,
      aiQueriesPerDay: 50,
      connectedAccounts: 5,
      pixKeysLimit: 5,
      exportReportsPerMonth: 10,
    },
  },
  {
    code: 'PREMIUM',
    name: 'Premium',
    description: 'Experiência financeira completa com IA preditiva',
    priceMonthly: 79.90,
    priceYearly: 799.00,
    trialDays: 14,
    sortOrder: 3,
    features: {
      aiCopilot: true,
      aiCopilotLimit: null,
      unlimitedInsights: true,
      advancedGoals: true,
      financialAutomation: true,
      prioritySupport: true,
      predictiveAi: true,
      advancedAnalytics: true,
      smartCredit: true,
      openFinanceFull: true,
      exclusiveBenefits: true,
      customReports: true,
    },
    limits: {
      monthlyTransactions: -1,
      aiQueriesPerDay: -1,
      connectedAccounts: -1,
      pixKeysLimit: 5,
      exportReportsPerMonth: -1,
    },
  },
];

@Injectable()
export class PlanService implements OnModuleInit {
  private readonly logger = new Logger(PlanService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedPlans();
  }

  async seedPlans() {
    for (const plan of DEFAULT_PLANS) {
      await this.prisma.plan.upsert({
        where: { code: plan.code },
        create: {
          code: plan.code,
          name: plan.name,
          description: plan.description,
          priceMonthly: new Decimal(plan.priceMonthly),
          priceYearly: new Decimal(plan.priceYearly),
          trialDays: plan.trialDays,
          sortOrder: plan.sortOrder,
          features: plan.features,
          limits: plan.limits,
        },
        update: {
          name: plan.name,
          description: plan.description,
          priceMonthly: new Decimal(plan.priceMonthly),
          priceYearly: new Decimal(plan.priceYearly),
          features: plan.features,
          limits: plan.limits,
        },
      });
    }
    this.logger.log('Plans seeded successfully');
  }

  async getAllPlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getPlanByCode(code: string) {
    return this.prisma.plan.findUnique({ where: { code } });
  }

  async getPlanById(id: string) {
    return this.prisma.plan.findUnique({ where: { id } });
  }

  async getPublicPlans() {
    const plans = await this.getAllPlans();
    return plans.map(plan => ({
      code: plan.code,
      name: plan.name,
      description: plan.description,
      priceMonthly: Number(plan.priceMonthly),
      priceYearly: Number(plan.priceYearly),
      trialDays: plan.trialDays,
      features: plan.features as unknown as PlanFeatures,
      limits: plan.limits as unknown as PlanLimits,
      savings: Number(plan.priceMonthly) > 0 
        ? Math.round((1 - Number(plan.priceYearly) / (Number(plan.priceMonthly) * 12)) * 100)
        : 0,
    }));
  }

  async comparePlans(currentPlanCode: string, targetPlanCode: string) {
    const [current, target] = await Promise.all([
      this.getPlanByCode(currentPlanCode),
      this.getPlanByCode(targetPlanCode),
    ]);

    if (!current || !target) {
      throw new Error('Invalid plan codes');
    }

    const isUpgrade = target.sortOrder > current.sortOrder;
    const isDowngrade = target.sortOrder < current.sortOrder;

    return {
      current: { code: current.code, name: current.name },
      target: { code: target.code, name: target.name },
      isUpgrade,
      isDowngrade,
      priceDifference: Number(target.priceMonthly) - Number(current.priceMonthly),
      newFeatures: this.getNewFeatures(
        current.features as unknown as PlanFeatures,
        target.features as unknown as PlanFeatures,
      ),
    };
  }

  private getNewFeatures(current: PlanFeatures, target: PlanFeatures): string[] {
    const newFeatures: string[] = [];
    const featureLabels: Record<string, string> = {
      aiCopilot: 'AI Copilot',
      unlimitedInsights: 'Insights Ilimitados',
      advancedGoals: 'Metas Avançadas',
      financialAutomation: 'Automação Financeira',
      prioritySupport: 'Suporte Prioritário',
      predictiveAi: 'IA Preditiva',
      advancedAnalytics: 'Análise Avançada',
      smartCredit: 'Crédito Inteligente',
      openFinanceFull: 'Open Finance Completo',
      exclusiveBenefits: 'Benefícios Exclusivos',
      customReports: 'Relatórios Personalizados',
    };

    for (const [key, label] of Object.entries(featureLabels)) {
      if (target[key as keyof PlanFeatures] && !current[key as keyof PlanFeatures]) {
        newFeatures.push(label);
      }
    }

    return newFeatures;
  }
}
