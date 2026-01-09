import { Module, Global } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { EventTrackingService } from './services/event-tracking.service';
import { MetricsAggregationService } from './services/metrics-aggregation.service';
import { FunnelService } from './services/funnel.service';
import { CohortService } from './services/cohort.service';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    EventTrackingService,
    MetricsAggregationService,
    FunnelService,
    CohortService,
  ],
  exports: [AnalyticsService, EventTrackingService],
})
export class AnalyticsModule {}
