import { Module } from '@nestjs/common';
import { PixService } from './pix.service';
import { PixController } from './pix.controller';
import { PixKeyService } from './services/pix-key.service';
import { PixTransactionService } from './services/pix-transaction.service';
import { PixValidationService } from './services/pix-validation.service';
import { PixWebhookService } from './services/pix-webhook.service';
import { PixLimitService } from './services/pix-limit.service';
import { PspMockService } from './providers/psp-mock.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PixController],
  providers: [
    PixService,
    PixKeyService,
    PixTransactionService,
    PixValidationService,
    PixWebhookService,
    PixLimitService,
    PspMockService,
  ],
  exports: [PixService, PixKeyService, PixTransactionService],
})
export class PixModule {}
