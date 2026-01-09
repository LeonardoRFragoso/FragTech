import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface FeatureCheck {
  enabled: boolean;
  reason?: string;
}

const DEFAULT_FEATURES = [
  { key: 'ai_copilot', name: 'AI Copilot', plans: ['FREE', 'PRO', 'PREMIUM'] },
  { key: 'ai_copilot_unlimited', name: 'AI Copilot Ilimitado', plans: ['PRO', 'PREMIUM'] },
  { key: 'unlimited_insights', name: 'Insights Ilimitados', plans: ['PRO', 'PREMIUM'] },
  { key: 'advanced_goals', name: 'Metas Avançadas', plans: ['PRO', 'PREMIUM'] },
  { key: 'financial_automation', name: 'Automação Financeira', plans: ['PRO', 'PREMIUM'] },
  { key: 'priority_support', name: 'Suporte Prioritário', plans: ['PRO', 'PREMIUM'] },
  { key: 'predictive_ai', name: 'IA Preditiva', plans: ['PREMIUM'] },
  { key: 'advanced_analytics', name: 'Análise Avançada', plans: ['PREMIUM'] },
  { key: 'smart_credit', name: 'Crédito Inteligente', plans: ['PREMIUM'] },
  { key: 'open_finance_full', name: 'Open Finance Completo', plans: ['PREMIUM'] },
  { key: 'exclusive_benefits', name: 'Benefícios Exclusivos', plans: ['PREMIUM'] },
  { key: 'custom_reports', name: 'Relatórios Personalizados', plans: ['PRO', 'PREMIUM'] },
  { key: 'export_unlimited', name: 'Exportação Ilimitada', plans: ['PRO', 'PREMIUM'] },
];

@Injectable()
export class FeatureFlagsService implements OnModuleInit {
  private readonly logger = new Logger(FeatureFlagsService.name);
  private featureCache: Map<string, any> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedFeatures();
    await this.refreshCache();
  }

  async seedFeatures() {
    for (const feature of DEFAULT_FEATURES) {
      await this.prisma.featureFlag.upsert({
        where: { key: feature.key },
        create: {
          key: feature.key,
          name: feature.name,
          plans: feature.plans,
          isEnabled: true,
        },
        update: { name: feature.name, plans: feature.plans },
      });
    }
    this.logger.log('Feature flags seeded');
  }

  async refreshCache() {
    const features = await this.prisma.featureFlag.findMany();
    this.featureCache.clear();
    features.forEach(f => this.featureCache.set(f.key, f));
  }

  async checkFeature(userId: string, featureKey: string, userPlan: string): Promise<FeatureCheck> {
    // Check user override first
    const override = await this.prisma.userFeatureOverride.findUnique({
      where: { userId_featureKey: { userId, featureKey } },
    });

    if (override) {
      if (override.expiresAt && override.expiresAt < new Date()) {
        await this.prisma.userFeatureOverride.delete({
          where: { id: override.id },
        });
      } else {
        return { enabled: override.isEnabled, reason: 'user_override' };
      }
    }

    // Check feature flag
    let feature = this.featureCache.get(featureKey);
    if (!feature) {
      feature = await this.prisma.featureFlag.findUnique({ where: { key: featureKey } });
      if (feature) this.featureCache.set(featureKey, feature);
    }

    if (!feature || !feature.isEnabled) {
      return { enabled: false, reason: 'feature_disabled' };
    }

    // Check plan access
    const allowedPlans = feature.plans as string[];
    if (!allowedPlans.includes(userPlan)) {
      return { enabled: false, reason: 'plan_required' };
    }

    // Check percentage rollout
    if (feature.percentage < 100) {
      const hash = this.hashUserId(userId, featureKey);
      if (hash > feature.percentage) {
        return { enabled: false, reason: 'rollout_excluded' };
      }
    }

    return { enabled: true };
  }

  async isFeatureEnabled(userId: string, featureKey: string, userPlan: string): Promise<boolean> {
    const check = await this.checkFeature(userId, featureKey, userPlan);
    return check.enabled;
  }

  async getUserFeatures(userId: string, userPlan: string) {
    const features = await this.prisma.featureFlag.findMany({ where: { isEnabled: true } });
    const result: Record<string, boolean> = {};

    for (const feature of features) {
      const check = await this.checkFeature(userId, feature.key, userPlan);
      result[feature.key] = check.enabled;
    }

    return result;
  }

  async setUserOverride(userId: string, featureKey: string, enabled: boolean, expiresAt?: Date) {
    return this.prisma.userFeatureOverride.upsert({
      where: { userId_featureKey: { userId, featureKey } },
      create: { userId, featureKey, isEnabled: enabled, expiresAt },
      update: { isEnabled: enabled, expiresAt },
    });
  }

  async removeUserOverride(userId: string, featureKey: string) {
    return this.prisma.userFeatureOverride.delete({
      where: { userId_featureKey: { userId, featureKey } },
    });
  }

  async getAllFeatures() {
    return this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
  }

  async updateFeature(key: string, data: { isEnabled?: boolean; percentage?: number }) {
    const updated = await this.prisma.featureFlag.update({
      where: { key },
      data,
    });
    this.featureCache.set(key, updated);
    return updated;
  }

  private hashUserId(userId: string, featureKey: string): number {
    let hash = 0;
    const str = `${userId}:${featureKey}`;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash % 100);
  }

  getPaywallMessage(featureKey: string, requiredPlan: string = 'PRO'): string {
    const messages: Record<string, string> = {
      ai_copilot_unlimited: 'Consultas ilimitadas à IA disponíveis no plano Pro',
      unlimited_insights: 'Insights ilimitados disponíveis no plano Pro',
      advanced_goals: 'Metas avançadas disponíveis no plano Pro',
      predictive_ai: 'IA preditiva exclusiva do plano Premium',
      advanced_analytics: 'Análise avançada exclusiva do plano Premium',
      smart_credit: 'Crédito inteligente exclusivo do plano Premium',
      open_finance_full: 'Open Finance completo exclusivo do plano Premium',
    };

    return messages[featureKey] || `Este recurso está disponível no plano ${requiredPlan}`;
  }
}
