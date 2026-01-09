import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface PixWebhookPayload {
  eventType: string;
  transactionId?: string;
  e2eId?: string;
  amount?: number;
  status?: string;
  timestamp: string;
  signature?: string;
}

@Injectable()
export class PixWebhookService {
  private readonly logger = new Logger(PixWebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processWebhook(payload: PixWebhookPayload): Promise<void> {
    this.logger.log(`Processing webhook: ${payload.eventType}`);

    // Store webhook event
    const webhookEvent = await this.prisma.pixWebhookEvent.create({
      data: {
        transactionId: payload.transactionId,
        eventType: payload.eventType,
        payload: payload as any,
        signature: payload.signature,
      },
    });

    try {
      switch (payload.eventType) {
        case 'pix.received':
          await this.handlePixReceived(payload);
          break;
        case 'pix.sent':
          await this.handlePixSent(payload);
          break;
        case 'pix.failed':
          await this.handlePixFailed(payload);
          break;
        case 'pix.refunded':
          await this.handlePixRefunded(payload);
          break;
        default:
          this.logger.warn(`Unknown webhook event type: ${payload.eventType}`);
      }

      // Mark as processed
      await this.prisma.pixWebhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          isProcessed: true,
          processedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to process webhook: ${error.message}`);

      // Update with error
      await this.prisma.pixWebhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          errorMessage: error.message,
          retryCount: { increment: 1 },
        },
      });

      throw error;
    }
  }

  private async handlePixReceived(payload: PixWebhookPayload): Promise<void> {
    this.logger.log(`Handling PIX received: ${payload.e2eId}`);

    // Find internal transaction by e2eId
    const transaction = await this.prisma.pixTransaction.findUnique({
      where: { e2eId: payload.e2eId },
      include: { receiverKey: true },
    });

    if (transaction && transaction.receiverKey) {
      // Credit the receiver's account
      await this.prisma.account.update({
        where: { id: transaction.receiverKey.accountId },
        data: {
          balance: { increment: Number(transaction.amount) },
        },
      });

      // Create transaction record
      await this.prisma.transaction.create({
        data: {
          userId: transaction.receiverKey.userId,
          type: 'PIX_IN',
          amount: transaction.amount,
          description: transaction.description || 'PIX recebido',
          category: 'pix',
          status: 'COMPLETED',
          metadata: {
            pixTransactionId: transaction.id,
            e2eId: payload.e2eId,
          },
        },
      });

      this.logger.log(`PIX received credited to account ${transaction.receiverKey.accountId}`);
    }
  }

  private async handlePixSent(payload: PixWebhookPayload): Promise<void> {
    this.logger.log(`Handling PIX sent confirmation: ${payload.e2eId}`);

    // Update transaction status if still processing
    await this.prisma.pixTransaction.updateMany({
      where: {
        e2eId: payload.e2eId,
        status: 'PROCESSING',
      },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    });
  }

  private async handlePixFailed(payload: PixWebhookPayload): Promise<void> {
    this.logger.log(`Handling PIX failed: ${payload.e2eId}`);

    const transaction = await this.prisma.pixTransaction.findUnique({
      where: { e2eId: payload.e2eId },
    });

    if (transaction && transaction.status !== 'FAILED') {
      // Refund the sender
      await this.prisma.account.update({
        where: { userId: transaction.userId },
        data: {
          balance: { increment: Number(transaction.amount) },
        },
      });

      // Update transaction status
      await this.prisma.pixTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          failureReason: 'Transaction failed at receiver institution',
        },
      });

      this.logger.log(`PIX refunded due to failure: ${transaction.id}`);
    }
  }

  private async handlePixRefunded(payload: PixWebhookPayload): Promise<void> {
    this.logger.log(`Handling PIX refund: ${payload.e2eId}`);

    const transaction = await this.prisma.pixTransaction.findUnique({
      where: { e2eId: payload.e2eId },
    });

    if (transaction && transaction.status === 'COMPLETED') {
      // Refund the sender
      await this.prisma.account.update({
        where: { userId: transaction.userId },
        data: {
          balance: { increment: Number(transaction.amount) },
        },
      });

      // Update transaction status
      await this.prisma.pixTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'REFUNDED',
        },
      });

      // Create refund transaction record
      await this.prisma.transaction.create({
        data: {
          userId: transaction.userId,
          type: 'PIX_IN',
          amount: transaction.amount,
          description: `Devolução PIX - ${transaction.description || 'Sem descrição'}`,
          category: 'pix',
          status: 'COMPLETED',
          metadata: {
            pixTransactionId: transaction.id,
            e2eId: payload.e2eId,
            isRefund: true,
          },
        },
      });

      this.logger.log(`PIX refunded: ${transaction.id}`);
    }
  }

  async retryFailedWebhooks(): Promise<number> {
    const failedWebhooks = await this.prisma.pixWebhookEvent.findMany({
      where: {
        isProcessed: false,
        retryCount: { lt: 3 },
      },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    let processedCount = 0;

    for (const webhook of failedWebhooks) {
      try {
        await this.processWebhook(webhook.payload as unknown as PixWebhookPayload);
        processedCount++;
      } catch (error) {
        this.logger.error(`Retry failed for webhook ${webhook.id}: ${error.message}`);
      }
    }

    return processedCount;
  }

  async getWebhookHistory(transactionId?: string, limit: number = 50) {
    const where: any = {};
    if (transactionId) {
      where.transactionId = transactionId;
    }

    return this.prisma.pixWebhookEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
