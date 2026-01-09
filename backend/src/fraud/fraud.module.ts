import { Module } from '@nestjs/common';
import { FraudService } from './fraud.service';
import { FraudController } from './fraud.controller';
import { FraudEngineService } from './services/fraud-engine.service';
import { RiskProfileService } from './services/risk-profile.service';
import { DeviceService } from './services/device.service';
import { AlertService } from './services/alert.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FraudController],
  providers: [
    FraudService,
    FraudEngineService,
    RiskProfileService,
    DeviceService,
    AlertService,
  ],
  exports: [FraudService, FraudEngineService],
})
export class FraudModule {}
