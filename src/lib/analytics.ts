// Analytics tracking utilities for FragTech
// Integrates with backend analytics service

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface TrackEventParams {
  eventName: string;
  eventCategory: string;
  userId?: string;
  sessionId?: string;
  properties?: Record<string, any>;
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
};

export const CATEGORIES = {
  ACQUISITION: 'acquisition',
  ACTIVATION: 'activation',
  ENGAGEMENT: 'engagement',
  MONETIZATION: 'monetization',
  FEATURE: 'feature',
  REFERRAL: 'referral',
};

// Get or create session ID
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('fragtech_session_id');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('fragtech_session_id', sessionId);
  }
  return sessionId;
}

// Track event
export async function track(params: TrackEventParams): Promise<void> {
  try {
    const sessionId = getSessionId();
    
    await fetch(`${API_URL}/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        sessionId,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.warn('Analytics tracking failed:', error);
  }
}

// Convenience methods
export const analytics = {
  track,
  
  pageView(pageName: string, userId?: string) {
    return track({
      eventName: EVENTS.PAGE_VIEW,
      eventCategory: CATEGORIES.ENGAGEMENT,
      userId,
      properties: { page: pageName },
    });
  },

  signup(userId: string, source?: string) {
    return track({
      eventName: EVENTS.SIGNUP_COMPLETED,
      eventCategory: CATEGORIES.ACQUISITION,
      userId,
      properties: { source },
    });
  },

  login(userId: string) {
    return track({
      eventName: EVENTS.LOGIN,
      eventCategory: CATEGORIES.ENGAGEMENT,
      userId,
    });
  },

  aiQuery(userId: string, queryType?: string) {
    return track({
      eventName: EVENTS.AI_QUERY,
      eventCategory: CATEGORIES.ENGAGEMENT,
      userId,
      properties: { queryType },
    });
  },

  transaction(userId: string, type: string, amount: number) {
    return track({
      eventName: EVENTS.TRANSACTION_CREATED,
      eventCategory: CATEGORIES.ENGAGEMENT,
      userId,
      properties: { type, amount },
    });
  },

  pixSent(userId: string, amount: number) {
    return track({
      eventName: EVENTS.PIX_SENT,
      eventCategory: CATEGORIES.ENGAGEMENT,
      userId,
      properties: { amount },
    });
  },

  featureUsed(userId: string, featureKey: string) {
    return track({
      eventName: EVENTS.FEATURE_USED,
      eventCategory: CATEGORIES.FEATURE,
      userId,
      properties: { featureKey },
    });
  },

  featureBlocked(userId: string, featureKey: string, requiredPlan: string) {
    return track({
      eventName: EVENTS.FEATURE_BLOCKED,
      eventCategory: CATEGORIES.FEATURE,
      userId,
      properties: { featureKey, requiredPlan },
    });
  },

  upsellShown(userId: string, featureKey: string, requiredPlan: string) {
    return track({
      eventName: EVENTS.UPSELL_SHOWN,
      eventCategory: CATEGORIES.MONETIZATION,
      userId,
      properties: { featureKey, requiredPlan },
    });
  },

  upsellClicked(userId: string, featureKey: string, targetPlan: string) {
    return track({
      eventName: EVENTS.UPSELL_CLICKED,
      eventCategory: CATEGORIES.MONETIZATION,
      userId,
      properties: { featureKey, targetPlan },
    });
  },

  pricingViewed(userId?: string) {
    return track({
      eventName: EVENTS.PRICING_PAGE_VIEW,
      eventCategory: CATEGORIES.MONETIZATION,
      userId,
    });
  },

  planSelected(userId: string, planCode: string, isYearly: boolean) {
    return track({
      eventName: EVENTS.PLAN_SELECTED,
      eventCategory: CATEGORIES.MONETIZATION,
      userId,
      properties: { planCode, isYearly },
    });
  },

  subscriptionCreated(userId: string, planCode: string) {
    return track({
      eventName: EVENTS.SUBSCRIPTION_CREATED,
      eventCategory: CATEGORIES.MONETIZATION,
      userId,
      properties: { planCode },
    });
  },

  referralShared(userId: string, channel: string) {
    return track({
      eventName: EVENTS.REFERRAL_LINK_SHARED,
      eventCategory: CATEGORIES.REFERRAL,
      userId,
      properties: { channel },
    });
  },
};

export default analytics;
