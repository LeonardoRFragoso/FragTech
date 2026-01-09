import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PixKeyService } from './pix-key.service';
import { PixValidationService } from './pix-validation.service';
import { PixLimitService } from './pix-limit.service';
import { PspMockService } from '../providers/psp-mock.service';
import { SendPixDto, PixTransactionType } from '../dto/send-pix.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PixTransactionService {
  private readonly logger = new Logger(PixTransactionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pixKeyService: PixKeyService,
    private readonly validationService: PixValidationService,
    private readonly limitService: PixLimitService,
    private readonly pspService: PspMockService,
  ) {}

  async sendPix(userId: string, dto: SendPixDto) {
    this.logger.log(`Initiating PIX transfer for user ${userId}`);

    // Get user account
    const account = await this.prisma.account.findUnique({
      where: { userId },
    });

    if (!account) {
      throw new BadRequestException('Conta não encontrada');
    }

    // Check balance
    if (Number(account.balance) < dto.amount) {
      throw new BadRequestException('Saldo insuficiente');
    }

    // Get sender's PIX key
    let senderKey;
    if (dto.senderKeyId) {
      senderKey = await this.pixKeyService.getKeyById(dto.senderKeyId, userId);
    } else {
      senderKey = await this.pixKeyService.getPrimaryKey(userId);
    }

    if (!senderKey) {
      throw new BadRequestException('Você precisa cadastrar uma chave PIX primeiro');
    }

    // Check limits
    const isNightTime = this.validationService.isNightTime();
    const limitCheck = await this.limitService.canTransact(userId, dto.amount, isNightTime);

    if (!limitCheck.allowed) {
      throw new BadRequestException(limitCheck.reason);
    }

    // Lookup receiver key
    const receiverLookup = await this.pixKeyService.lookupExternalKey(dto.receiverKey);

    if (!receiverLookup.found) {
      throw new BadRequestException('Chave PIX do destinatário não encontrada');
    }

    // Type assertion after found check
    const receiver = receiverLookup as { found: true; isInternal: boolean; key?: string; ownerName?: string; bankName?: string };

    // Prevent self-transfer with same key
    if (receiver.isInternal && receiver.key === senderKey.key) {
      throw new BadRequestException('Não é possível transferir para a mesma chave');
    }

    // Create transaction record
    const transaction = await this.prisma.pixTransaction.create({
      data: {
        userId,
        senderKeyId: senderKey.id,
        receiverKeyId: receiver.isInternal ? 
          (await this.prisma.pixKey.findUnique({ where: { key: dto.receiverKey } }))?.id : null,
        externalReceiverKey: !receiver.isInternal ? dto.receiverKey : null,
        type: (dto.type || PixTransactionType.TRANSFER) as any,
        amount: new Decimal(dto.amount),
        description: dto.description,
        status: 'PROCESSING',
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : null,
      },
    });

    try {
      // If scheduled, don't process now
      if (dto.scheduledFor) {
        await this.prisma.pixTransaction.update({
          where: { id: transaction.id },
          data: { status: 'PENDING' },
        });

        return {
          id: transaction.id,
          status: 'SCHEDULED',
          scheduledFor: dto.scheduledFor,
          message: 'PIX agendado com sucesso',
        };
      }

      // Execute transfer via PSP
      const pspResult = await this.pspService.executeTransfer({
        senderKey: senderKey.key,
        receiverKey: dto.receiverKey,
        amount: dto.amount,
        description: dto.description,
      });

      if (!pspResult.success) {
        // Update transaction as failed
        await this.prisma.pixTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            failureReason: pspResult.failureReason,
            e2eId: pspResult.e2eId,
            pspTransactionId: pspResult.transactionId,
          },
        });

        throw new BadRequestException(pspResult.failureReason || 'Falha na transferência');
      }

      // Debit sender account
      await this.prisma.account.update({
        where: { userId },
        data: {
          balance: { decrement: dto.amount },
        },
      });

      // Credit receiver if internal
      if (receiver.isInternal) {
        const receiverKey = await this.prisma.pixKey.findUnique({
          where: { key: dto.receiverKey },
        });

        if (receiverKey) {
          await this.prisma.account.update({
            where: { id: receiverKey.accountId },
            data: {
              balance: { increment: dto.amount },
            },
          });
        }
      }

      // Consume limit
      await this.limitService.consumeLimit(userId, dto.amount);

      // Update transaction as completed
      await this.prisma.pixTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'COMPLETED',
          e2eId: pspResult.e2eId,
          pspTransactionId: pspResult.transactionId,
          processedAt: new Date(),
        },
      });

      // Create transaction record in main transactions table
      await this.prisma.transaction.create({
        data: {
          userId,
          type: 'PIX_OUT',
          amount: new Decimal(-dto.amount),
          description: dto.description || `PIX para ${this.validationService.maskPixKey(
            this.detectKeyType(dto.receiverKey),
            dto.receiverKey
          )}`,
          category: 'pix',
          recipient: receiver.ownerName,
          status: 'COMPLETED',
          metadata: {
            pixTransactionId: transaction.id,
            e2eId: pspResult.e2eId,
            receiverKey: dto.receiverKey,
          },
        },
      });

      this.logger.log(`PIX transfer completed: ${transaction.id}`);

      return {
        id: transaction.id,
        e2eId: pspResult.e2eId,
        status: 'COMPLETED',
        amount: dto.amount,
        receiver: {
          name: receiver.ownerName,
          key: this.validationService.maskPixKey(
            this.detectKeyType(dto.receiverKey),
            dto.receiverKey
          ),
          bank: receiver.bankName,
        },
        processedAt: new Date(),
        message: 'PIX enviado com sucesso',
      };
    } catch (error) {
      this.logger.error(`PIX transfer failed: ${error.message}`);

      // If error wasn't from PSP (already handled), update transaction
      if (error.message !== 'Falha na transferência') {
        await this.prisma.pixTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            failureReason: error.message,
          },
        });
      }

      throw error;
    }
  }

  async getTransactionHistory(userId: string, options?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options?.startDate) {
        where.createdAt.gte = options.startDate;
      }
      if (options?.endDate) {
        where.createdAt.lte = options.endDate;
      }
    }

    const [transactions, total] = await Promise.all([
      this.prisma.pixTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          senderKey: true,
          receiverKey: true,
        },
      }),
      this.prisma.pixTransaction.count({ where }),
    ]);

    return {
      transactions: transactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: Number(tx.amount),
        description: tx.description,
        status: tx.status,
        e2eId: tx.e2eId,
        senderKey: tx.senderKey ? this.validationService.maskPixKey(
          tx.senderKey.type as any,
          tx.senderKey.key
        ) : null,
        receiverKey: tx.receiverKey ? this.validationService.maskPixKey(
          tx.receiverKey.type as any,
          tx.receiverKey.key
        ) : tx.externalReceiverKey,
        createdAt: tx.createdAt,
        processedAt: tx.processedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTransactionById(transactionId: string, userId: string) {
    const transaction = await this.prisma.pixTransaction.findFirst({
      where: { id: transactionId, userId },
      include: {
        senderKey: true,
        receiverKey: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }

    return {
      id: transaction.id,
      type: transaction.type,
      amount: Number(transaction.amount),
      description: transaction.description,
      status: transaction.status,
      e2eId: transaction.e2eId,
      txId: transaction.txId,
      fraudScore: transaction.fraudScore ? Number(transaction.fraudScore) : null,
      senderKey: transaction.senderKey ? {
        type: transaction.senderKey.type,
        maskedKey: this.validationService.maskPixKey(
          transaction.senderKey.type as any,
          transaction.senderKey.key
        ),
      } : null,
      receiverKey: transaction.receiverKey ? {
        type: transaction.receiverKey.type,
        maskedKey: this.validationService.maskPixKey(
          transaction.receiverKey.type as any,
          transaction.receiverKey.key
        ),
      } : transaction.externalReceiverKey,
      failureReason: transaction.failureReason,
      createdAt: transaction.createdAt,
      processedAt: transaction.processedAt,
      scheduledFor: transaction.scheduledFor,
    };
  }

  async cancelScheduledTransaction(transactionId: string, userId: string) {
    const transaction = await this.prisma.pixTransaction.findFirst({
      where: { 
        id: transactionId, 
        userId,
        status: 'PENDING',
        scheduledFor: { not: null },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transação agendada não encontrada ou não pode ser cancelada');
    }

    await this.prisma.pixTransaction.update({
      where: { id: transactionId },
      data: { status: 'CANCELLED' },
    });

    return { message: 'PIX agendado cancelado com sucesso' };
  }

  private detectKeyType(key: string): any {
    if (/^\d{11}$/.test(key)) return 'CPF';
    if (/^\d{14}$/.test(key)) return 'CNPJ';
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) return 'EMAIL';
    if (/^\+?\d{10,13}$/.test(key.replace(/\D/g, ''))) return 'PHONE';
    return 'RANDOM';
  }
}
