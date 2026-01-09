import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { InsightsModule } from '../insights/insights.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [InsightsModule, TransactionsModule],
  controllers: [AIController],
  providers: [AIService],
  exports: [AIService],
})
export class AIModule {}
