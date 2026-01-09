import { Module, Global } from '@nestjs/common';
import { LoggingService } from './services/logging.service';
import { MetricsService } from './services/metrics.service';
import { AlertingService } from './services/alerting.service';
import { HealthService } from './services/health.service';
import { ObservabilityController } from './observability.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [ObservabilityController],
  providers: [
    LoggingService,
    MetricsService,
    AlertingService,
    HealthService,
  ],
  exports: [LoggingService, MetricsService, AlertingService, HealthService],
})
export class ObservabilityModule {}
