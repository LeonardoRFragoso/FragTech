import { Injectable, Logger } from '@nestjs/common';
import { PixKeyService } from './services/pix-key.service';
import { PixTransactionService } from './services/pix-transaction.service';
import { PixLimitService } from './services/pix-limit.service';
import { PixWebhookService } from './services/pix-webhook.service';
import { PspMockService } from './providers/psp-mock.service';
import { CreatePixKeyDto } from './dto/create-pix-key.dto';
import { SendPixDto, PixQrCodeDto } from './dto/send-pix.dto';

@Injectable()
export class PixService {
  private readonly logger = new Logger(PixService.name);

  constructor(
    private readonly pixKeyService: PixKeyService,
    private readonly pixTransactionService: PixTransactionService,
    private readonly pixLimitService: PixLimitService,
    private readonly pixWebhookService: PixWebhookService,
    private readonly pspService: PspMockService,
  ) {}

  // ==================== PIX KEYS ====================

  async createKey(userId: string, dto: CreatePixKeyDto) {
    return this.pixKeyService.createKey(userId, dto);
  }

  async getUserKeys(userId: string) {
    return this.pixKeyService.getUserKeys(userId);
  }

  async deleteKey(keyId: string, userId: string) {
    return this.pixKeyService.deleteKey(keyId, userId);
  }

  async setPrimaryKey(keyId: string, userId: string) {
    return this.pixKeyService.setPrimaryKey(keyId, userId);
  }

  async lookupKey(key: string) {
    return this.pixKeyService.lookupExternalKey(key);
  }

  // ==================== PIX TRANSFERS ====================

  async sendPix(userId: string, dto: SendPixDto) {
    return this.pixTransactionService.sendPix(userId, dto);
  }

  async getTransactionHistory(userId: string, options?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return this.pixTransactionService.getTransactionHistory(userId, options);
  }

  async getTransactionById(transactionId: string, userId: string) {
    return this.pixTransactionService.getTransactionById(transactionId, userId);
  }

  async cancelScheduledTransaction(transactionId: string, userId: string) {
    return this.pixTransactionService.cancelScheduledTransaction(transactionId, userId);
  }

  // ==================== QR CODE ====================

  async generateQrCode(userId: string, dto: PixQrCodeDto) {
    const primaryKey = await this.pixKeyService.getPrimaryKey(userId);
    
    if (!primaryKey) {
      throw new Error('Você precisa cadastrar uma chave PIX primeiro');
    }

    if (dto.amount) {
      return this.pspService.generateDynamicQrCode(
        primaryKey.key,
        dto.amount,
        dto.description,
      );
    }

    return this.pspService.generateStaticQrCode(
      primaryKey.key,
      undefined,
      dto.description,
    );
  }

  async readQrCode(payload: string) {
    return this.pspService.parseQrCodePayload(payload);
  }

  // ==================== LIMITS ====================

  async getLimits(userId: string) {
    return this.pixLimitService.getOrCreateLimits(userId);
  }

  async updateLimits(userId: string, updates: {
    dailyLimit?: number;
    nightlyLimit?: number;
    perTransactionLimit?: number;
    monthlyLimit?: number;
  }) {
    return this.pixLimitService.updateLimits(userId, updates);
  }

  // ==================== WEBHOOKS ====================

  async processWebhook(payload: any) {
    return this.pixWebhookService.processWebhook(payload);
  }

  // ==================== DASHBOARD DATA ====================

  async getPixDashboard(userId: string) {
    const [keys, limits, recentTransactions] = await Promise.all([
      this.pixKeyService.getUserKeys(userId),
      this.pixLimitService.getOrCreateLimits(userId),
      this.pixTransactionService.getTransactionHistory(userId, { limit: 5 }),
    ]);

    return {
      keys: {
        total: keys.length,
        primary: keys.find(k => k.isPrimary),
        list: keys,
      },
      limits: {
        daily: {
          limit: limits.dailyLimit,
          used: limits.usedToday,
          available: limits.availableToday,
          percentage: (limits.usedToday / limits.dailyLimit) * 100,
        },
        monthly: {
          limit: limits.monthlyLimit,
          used: limits.usedThisMonth,
          available: limits.availableThisMonth,
          percentage: (limits.usedThisMonth / limits.monthlyLimit) * 100,
        },
        perTransaction: limits.perTransactionLimit,
        nightly: limits.nightlyLimit,
      },
      recentTransactions: recentTransactions.transactions,
    };
  }
}
