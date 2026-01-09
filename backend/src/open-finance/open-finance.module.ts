import { Module } from '@nestjs/common';
import { OpenFinanceService } from './open-finance.service';
import { OpenFinanceController } from './open-finance.controller';
import { ConsentService } from './services/consent.service';
import { ConnectionService } from './services/connection.service';
import { SyncService } from './services/sync.service';
import { InstitutionMockService } from './providers/institution-mock.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OpenFinanceController],
  providers: [
    OpenFinanceService,
    ConsentService,
    ConnectionService,
    SyncService,
    InstitutionMockService,
  ],
  exports: [OpenFinanceService],
})
export class OpenFinanceModule {}
