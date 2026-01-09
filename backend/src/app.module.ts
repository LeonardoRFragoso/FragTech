import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AccountsModule } from './accounts/accounts.module';
import { TransactionsModule } from './transactions/transactions.module';
import { CardsModule } from './cards/cards.module';
import { InsightsModule } from './insights/insights.module';
import { GoalsModule } from './goals/goals.module';
import { AIModule } from './ai/ai.module';
import { PixModule } from './pix/pix.module';
import { OpenFinanceModule } from './open-finance/open-finance.module';
import { FraudModule } from './fraud/fraud.module';
import { ComplianceModule } from './compliance/compliance.module';
import { SecurityModule } from './security/security.module';
import { ObservabilityModule } from './observability/observability.module';
import { BillingModule } from './billing/billing.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { GrowthModule } from './growth/growth.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    AccountsModule,
    TransactionsModule,
    CardsModule,
    InsightsModule,
    GoalsModule,
    AIModule,
    PixModule,
    OpenFinanceModule,
    FraudModule,
    ComplianceModule,
    SecurityModule,
    ObservabilityModule,
    BillingModule,
    AnalyticsModule,
    FeatureFlagsModule,
    GrowthModule,
    AdminModule,
  ],
})
export class AppModule {}
