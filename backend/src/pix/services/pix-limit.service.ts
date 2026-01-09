import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface PixLimits {
  dailyLimit: number;
  nightlyLimit: number;
  perTransactionLimit: number;
  monthlyLimit: number;
  usedToday: number;
  usedThisMonth: number;
  availableToday: number;
  availableThisMonth: number;
}

@Injectable()
export class PixLimitService {
  private readonly logger = new Logger(PixLimitService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateLimits(userId: string): Promise<PixLimits> {
    let limits = await this.prisma.pixLimit.findUnique({
      where: { userId },
    });

    if (!limits) {
      limits = await this.prisma.pixLimit.create({
        data: {
          userId,
          dailyLimit: new Decimal(5000),
          nightlyLimit: new Decimal(1000),
          perTransactionLimit: new Decimal(2000),
          monthlyLimit: new Decimal(50000),
        },
      });
    }

    // Reset daily/monthly counters if needed
    await this.resetCountersIfNeeded(userId, limits);

    // Refresh limits after potential reset
    limits = await this.prisma.pixLimit.findUnique({
      where: { userId },
    });

    if (!limits) {
      throw new Error('Failed to retrieve limits');
    }

    const dailyLimit = Number(limits.dailyLimit);
    const nightlyLimit = Number(limits.nightlyLimit);
    const perTransactionLimit = Number(limits.perTransactionLimit);
    const monthlyLimit = Number(limits.monthlyLimit);
    const usedToday = Number(limits.usedToday);
    const usedThisMonth = Number(limits.usedThisMonth);

    return {
      dailyLimit,
      nightlyLimit,
      perTransactionLimit,
      monthlyLimit,
      usedToday,
      usedThisMonth,
      availableToday: Math.max(0, dailyLimit - usedToday),
      availableThisMonth: Math.max(0, monthlyLimit - usedThisMonth),
    };
  }

  private async resetCountersIfNeeded(userId: string, limits: any): Promise<void> {
    const now = new Date();
    const lastReset = new Date(limits.lastResetAt);

    // Check if we need to reset daily counter
    const isNewDay = now.toDateString() !== lastReset.toDateString();
    
    // Check if we need to reset monthly counter
    const isNewMonth = now.getMonth() !== lastReset.getMonth() || 
                       now.getFullYear() !== lastReset.getFullYear();

    if (isNewDay || isNewMonth) {
      await this.prisma.pixLimit.update({
        where: { userId },
        data: {
          usedToday: isNewDay ? new Decimal(0) : undefined,
          usedThisMonth: isNewMonth ? new Decimal(0) : undefined,
          lastResetAt: now,
        },
      });

      this.logger.log(`Reset PIX limits for user ${userId}: day=${isNewDay}, month=${isNewMonth}`);
    }
  }

  async consumeLimit(userId: string, amount: number): Promise<void> {
    await this.prisma.pixLimit.update({
      where: { userId },
      data: {
        usedToday: { increment: amount },
        usedThisMonth: { increment: amount },
      },
    });
  }

  async releaseLimit(userId: string, amount: number): Promise<void> {
    const limits = await this.prisma.pixLimit.findUnique({
      where: { userId },
    });

    if (limits) {
      const newUsedToday = Math.max(0, Number(limits.usedToday) - amount);
      const newUsedThisMonth = Math.max(0, Number(limits.usedThisMonth) - amount);

      await this.prisma.pixLimit.update({
        where: { userId },
        data: {
          usedToday: new Decimal(newUsedToday),
          usedThisMonth: new Decimal(newUsedThisMonth),
        },
      });
    }
  }

  async updateLimits(
    userId: string,
    updates: Partial<{
      dailyLimit: number;
      nightlyLimit: number;
      perTransactionLimit: number;
      monthlyLimit: number;
    }>,
  ): Promise<PixLimits> {
    const data: any = {};
    
    if (updates.dailyLimit !== undefined) {
      data.dailyLimit = new Decimal(updates.dailyLimit);
    }
    if (updates.nightlyLimit !== undefined) {
      data.nightlyLimit = new Decimal(updates.nightlyLimit);
    }
    if (updates.perTransactionLimit !== undefined) {
      data.perTransactionLimit = new Decimal(updates.perTransactionLimit);
    }
    if (updates.monthlyLimit !== undefined) {
      data.monthlyLimit = new Decimal(updates.monthlyLimit);
    }

    await this.prisma.pixLimit.update({
      where: { userId },
      data,
    });

    return this.getOrCreateLimits(userId);
  }

  async canTransact(userId: string, amount: number, isNightTime: boolean): Promise<{
    allowed: boolean;
    reason?: string;
    limits: PixLimits;
  }> {
    const limits = await this.getOrCreateLimits(userId);

    // Check per-transaction limit
    if (amount > limits.perTransactionLimit) {
      return {
        allowed: false,
        reason: `Valor excede limite por transação (R$ ${limits.perTransactionLimit.toFixed(2)})`,
        limits,
      };
    }

    // Check daily/nightly limit
    const currentLimit = isNightTime ? limits.nightlyLimit : limits.dailyLimit;
    const available = currentLimit - limits.usedToday;

    if (amount > available) {
      return {
        allowed: false,
        reason: `Limite ${isNightTime ? 'noturno' : 'diário'} insuficiente. Disponível: R$ ${available.toFixed(2)}`,
        limits,
      };
    }

    // Check monthly limit
    if (amount > limits.availableThisMonth) {
      return {
        allowed: false,
        reason: `Limite mensal insuficiente. Disponível: R$ ${limits.availableThisMonth.toFixed(2)}`,
        limits,
      };
    }

    return { allowed: true, limits };
  }
}
