import { Module } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { LgpdService } from './services/lgpd.service';
import { AuditService } from './services/audit.service';
import { DataRetentionService } from './services/data-retention.service';
import { ImmutableLogService } from './services/immutable-log.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ComplianceController],
  providers: [
    ComplianceService,
    LgpdService,
    AuditService,
    DataRetentionService,
    ImmutableLogService,
  ],
  exports: [ComplianceService, AuditService, ImmutableLogService],
})
export class ComplianceModule {}
