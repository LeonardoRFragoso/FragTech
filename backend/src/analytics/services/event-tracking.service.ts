import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface TrackEventParams {
  userId?: string;
  sessionId?: string;
  eventName: string;
  eventCategory: string;
  properties?: Record<string, any>;
  deviceType?: string;
  browser?: string;
  os?: string;
  country?: string;
  city?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

// Standard event names
export const EVENTS = {
  // Acquisition
  PAGE_VIEW: 'page_view',
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  
  // Activation
  FIRST_LOGIN: 'first_login',
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  FIRST_TRANSACTION: 'first_transaction',
  FIRST_AI_INTERACTION: 'first_ai_interaction',
  
  // Engagement
  LOGIN: 'login',
  DASHBOARD_VIEW: 'dashboard_view',
  AI_QUERY: 'ai_query',
  INSIGHT_VIEWED: 'insight_viewed',
  TRANSACTION_CREATED: 'transaction_created',
  PIX_SENT: 'pix_sent',
  PIX_RECEIVED: 'pix_received',
  GOAL_CREATED: 'goal_created',
  
  // Monetization
  PRICING_PAGE_VIEW: 'pricing_page_view',
  PLAN_SELECTED: 'plan_selected',
  CHECKOUT_STARTED: 'checkout_started',
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  SUBSCRIPTION_DOWNGRADED: 'subscription_downgraded',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  
  // Feature usage
  FEATURE_USED: 'feature_used',
  FEATURE_BLOCKED: 'feature_blocked',
  UPSELL_SHOWN: 'upsell_shown',
  UPSELL_CLICKED: 'upsell_clicked',
  
  // Referral
  REFERRAL_LINK_CREATED: 'referral_link_created',
  REFERRAL_LINK_SHARED: 'referral_link_shared',
  REFERRAL_SIGNUP: 'referral_signup',
  REFERRAL_CONVERTED: 'referral_converted',
};

export const EVENT_CATEGORIES = {
  ACQUISITION: 'acquisition',
  ACTIVATION: 'activation',
  ENGAGEMENT: 'engagement',
  MONETIZATION: 'monetization',
  FEATURE: 'feature',
  REFERRAL: 'referral',
};

@Injectable()
export class EventTrackingService {
  private readonly logger = new Logger(EventTrackingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async track(params: TrackEventParams) {
    const event = await this.prisma.analyticsEvent.create({
      data: {
        userId: params.userId,
        sessionId: params.sessionId,
        eventName: params.eventName,
        eventCategory: params.eventCategory,
        properties: params.properties,
        deviceType: params.deviceType,
        browser: params.browser,
        os: params.os,
        country: params.country,
        city: params.city,
        referrer: params.referrer,
        utmSource: params.utmSource,
        utmMedium: params.utmMedium,
        utmCampaign: params.utmCampaign,
      },
    });

    // Update user metrics if userId is provided
    if (params.userId) {
      await this.updateUserMetrics(params.userId, params.eventName);
    }

    return event;
  }

  async trackSignup(userId: string, source?: string, referralCode?: string) {
    return this.track({
      userId,
      eventName: EVENTS.SIGNUP_COMPLETED,
      eventCategory: EVENT_CATEGORIES.ACQUISITION,
      properties: { source, referralCode },
    });
  }

  async trackLogin(userId: string, deviceInfo?: Record<string, any>) {
    return this.track({
      userId,
      eventName: EVENTS.LOGIN,
      eventCategory: EVENT_CATEGORIES.ENGAGEMENT,
      properties: deviceInfo,
    });
  }

  async trackTransaction(userId: string, type: string, amount: number) {
    return this.track({
      userId,
      eventName: EVENTS.TRANSACTION_CREATED,
      eventCategory: EVENT_CATEGORIES.ENGAGEMENT,
      properties: { type, amount },
    });
  }

  async trackAIInteraction(userId: string, queryType: string) {
    return this.track({
      userId,
      eventName: EVENTS.AI_QUERY,
      eventCategory: EVENT_CATEGORIES.ENGAGEMENT,
      properties: { queryType },
    });
  }

  async trackFeatureUsage(userId: string, featureKey: string, blocked: boolean = false) {
    return this.track({
      userId,
      eventName: blocked ? EVENTS.FEATURE_BLOCKED : EVENTS.FEATURE_USED,
      eventCategory: EVENT_CATEGORIES.FEATURE,
      properties: { featureKey, blocked },
    });
  }

  async trackSubscriptionEvent(userId: string, eventName: string, planCode: string, properties?: Record<string, any>) {
    return this.track({
      userId,
      eventName,
      eventCategory: EVENT_CATEGORIES.MONETIZATION,
      properties: { planCode, ...properties },
    });
  }

  private async updateUserMetrics(userId: string, eventName: string) {
    const now = new Date();

    try {
      await this.prisma.userMetrics.upsert({
        where: { userId },
        create: {
          userId,
          totalLogins: eventName === EVENTS.LOGIN ? 1 : 0,
          totalTransactions: eventName === EVENTS.TRANSACTION_CREATED ? 1 : 0,
          totalAiInteractions: eventName === EVENTS.AI_QUERY ? 1 : 0,
          totalInsightsViewed: eventName === EVENTS.INSIGHT_VIEWED ? 1 : 0,
          lastActiveAt: now,
          firstTransactionAt: eventName === EVENTS.FIRST_TRANSACTION ? now : null,
          firstAiInteractionAt: eventName === EVENTS.FIRST_AI_INTERACTION ? now : null,
        },
        update: {
          totalLogins: eventName === EVENTS.LOGIN ? { increment: 1 } : undefined,
          totalTransactions: eventName === EVENTS.TRANSACTION_CREATED ? { increment: 1 } : undefined,
          totalAiInteractions: eventName === EVENTS.AI_QUERY ? { increment: 1 } : undefined,
          totalInsightsViewed: eventName === EVENTS.INSIGHT_VIEWED ? { increment: 1 } : undefined,
          lastActiveAt: now,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to update user metrics: ${error}`);
    }
  }

  async getEventsByUser(userId: string, options?: { eventName?: string; limit?: number; since?: Date }) {
    return this.prisma.analyticsEvent.findMany({
      where: {
        userId,
        eventName: options?.eventName,
        createdAt: options?.since ? { gte: options.since } : undefined,
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 100,
    });
  }

  async getEventCounts(eventName: string, days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return this.prisma.analyticsEvent.count({
      where: {
        eventName,
        createdAt: { gte: since },
      },
    });
  }
}
