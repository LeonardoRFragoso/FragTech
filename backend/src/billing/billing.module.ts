import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { PlanService } from './services/plan.service';
import { SubscriptionService } from './services/subscription.service';
import { PaymentService } from './services/payment.service';
import { PaymentGatewayMockService } from './providers/payment-gateway-mock.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BillingController],
  providers: [
    BillingService,
    PlanService,
    SubscriptionService,
    PaymentService,
    PaymentGatewayMockService,
  ],
  exports: [BillingService, PlanService, SubscriptionService, PaymentService],
})
export class BillingModule {}
