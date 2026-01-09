import { Module } from '@nestjs/common';
import { GrowthService } from './growth.service';
import { GrowthController } from './growth.controller';
import { ReferralService } from './services/referral.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GrowthController],
  providers: [GrowthService, ReferralService],
  exports: [GrowthService, ReferralService],
})
export class GrowthModule {}
