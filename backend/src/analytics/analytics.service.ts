import { Injectable } from '@nestjs/common';
import { EventTrackingService } from './services/event-tracking.service';
import { MetricsAggregationService } from './services/metrics-aggregation.service';
import { FunnelService } from './services/funnel.service';
import { CohortService } from './services/cohort.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly events: EventTrackingService,
    private readonly metrics: MetricsAggregationService,
    private readonly funnels: FunnelService,
    private readonly cohorts: CohortService,
  ) {}

  // Event Tracking
  track = this.events.track.bind(this.events);
  trackSignup = this.events.trackSignup.bind(this.events);
  trackLogin = this.events.trackLogin.bind(this.events);
  trackTransaction = this.events.trackTransaction.bind(this.events);
  trackAIInteraction = this.events.trackAIInteraction.bind(this.events);
  trackFeatureUsage = this.events.trackFeatureUsage.bind(this.events);
  trackSubscriptionEvent = this.events.trackSubscriptionEvent.bind(this.events);

  async getExecutiveDashboard() {
    const [keyMetrics, funnels, cohorts] = await Promise.all([
      this.metrics.getKeyMetrics(),
      this.getGrowthFunnels(),
      this.cohorts.getUsersByPlan(),
    ]);

    return {
      ...keyMetrics,
      funnels,
      usersByPlan: cohorts,
      timestamp: new Date().toISOString(),
    };
  }

  async getGrowthFunnels() {
    const [acquisition, activation, monetization] = await Promise.all([
      this.funnels.getAcquisitionFunnel(),
      this.funnels.getActivationFunnel(),
      this.funnels.getMonetizationFunnel(),
    ]);

    return { acquisition, activation, monetization };
  }

  async getRetentionData(weeks: number = 8) {
    return this.cohorts.getRetentionCohorts(weeks);
  }

  async getMetricsTrend(days: number = 30) {
    return this.metrics.getMetricsForPeriod(days);
  }

  async getConversionMetrics() {
    const [freeToProRate, signupToActiveRate, churnRate] = await Promise.all([
      this.funnels.getConversionRate('signup_completed', 'subscription_created'),
      this.funnels.getConversionRate('signup_completed', 'first_transaction'),
      this.metrics.getChurnRate(),
    ]);

    return {
      freeToProConversion: freeToProRate,
      signupToActiveConversion: signupToActiveRate,
      churnRate,
    };
  }

  async getAIUsageSegments() {
    return this.cohorts.getUsersByAIUsage();
  }

  async getTopUsers(limit: number = 10) {
    return this.cohorts.getTopUsers(limit);
  }

  async getARPU() {
    return this.metrics.getARPU();
  }
}
