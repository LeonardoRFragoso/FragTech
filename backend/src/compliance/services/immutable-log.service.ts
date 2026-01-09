import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createHash } from 'crypto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ImmutableLogService {
  private readonly logger = new Logger(ImmutableLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async logFinancialEvent(
    userId: string,
    eventType: string,
    eventData: any,
    amount?: number,
    balanceBefore?: number,
    balanceAfter?: number,
  ) {
    // Get the previous hash for chain integrity
    const lastLog = await this.prisma.immutableFinancialLog.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const previousHash = lastLog?.hash || null;

    // Create hash of the event data
    const hashContent = JSON.stringify({
      userId,
      eventType,
      eventData,
      amount,
      balanceBefore,
      balanceAfter,
      previousHash,
      timestamp: new Date().toISOString(),
    });

    const hash = createHash('sha256').update(hashContent).digest('hex');

    // Create signature (in production, use proper digital signature)
    const signature = createHash('sha256')
      .update(hash + process.env.JWT_SECRET)
      .digest('hex');

    const log = await this.prisma.immutableFinancialLog.create({
      data: {
        userId,
        eventType,
        eventData,
        amount: amount ? new Decimal(amount) : null,
        balanceBefore: balanceBefore ? new Decimal(balanceBefore) : null,
        balanceAfter: balanceAfter ? new Decimal(balanceAfter) : null,
        hash,
        previousHash,
        signature,
      },
    });

    this.logger.debug(`Immutable log created: ${eventType} for user ${userId}`);
    return log;
  }

  async verifyChainIntegrity(userId: string): Promise<{
    isValid: boolean;
    errors: string[];
    checkedCount: number;
  }> {
    const logs = await this.prisma.immutableFinancialLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    const errors: string[] = [];
    let previousHash: string | null = null;

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];

      // Check chain link
      if (log.previousHash !== previousHash) {
        errors.push(`Chain broken at log ${log.id}: expected previous hash ${previousHash}, got ${log.previousHash}`);
      }

      // Verify hash (would need to reconstruct original data)
      previousHash = log.hash;
    }

    return {
      isValid: errors.length === 0,
      errors,
      checkedCount: logs.length,
    };
  }

  async getUserFinancialHistory(userId: string, options?: {
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const where: any = { userId };

    if (options?.eventType) where.eventType = options.eventType;
    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options?.startDate) where.createdAt.gte = options.startDate;
      if (options?.endDate) where.createdAt.lte = options.endDate;
    }

    return this.prisma.immutableFinancialLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 100,
    });
  }

  async getEventTypes() {
    const result = await this.prisma.immutableFinancialLog.groupBy({
      by: ['eventType'],
      _count: true,
    });

    return result.map(r => ({ eventType: r.eventType, count: r._count }));
  }

  async exportAuditTrail(userId: string, startDate: Date, endDate: Date) {
    const logs = await this.prisma.immutableFinancialLog.findMany({
      where: {
        userId,
        createdAt: { gte: startDate, lte: endDate },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      userId,
      exportedAt: new Date(),
      period: { startDate, endDate },
      recordCount: logs.length,
      records: logs.map(log => ({
        id: log.id,
        eventType: log.eventType,
        amount: log.amount ? Number(log.amount) : null,
        balanceBefore: log.balanceBefore ? Number(log.balanceBefore) : null,
        balanceAfter: log.balanceAfter ? Number(log.balanceAfter) : null,
        hash: log.hash,
        createdAt: log.createdAt,
      })),
    };
  }
}
