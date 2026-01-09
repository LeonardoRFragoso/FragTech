import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface FraudCheckResult {
  score: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  allowed: boolean;
  flags: string[];
  triggeredRules: { id: string; name: string; score: number }[];
  requiresMfa: boolean;
  message?: string;
}

export interface TransactionContext {
  userId: string;
  amount: number;
  type: string;
  recipientKey?: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

@Injectable()
export class FraudEngineService {
  private readonly logger = new Logger(FraudEngineService.name);

  // Score thresholds
  private readonly THRESHOLDS = {
    LOW: 20,
    MEDIUM: 40,
    HIGH: 60,
    CRITICAL: 80,
    BLOCK: 90,
  };

  constructor(private readonly prisma: PrismaService) {}

  async analyzeTransaction(context: TransactionContext): Promise<FraudCheckResult> {
    this.logger.log(`Analyzing transaction for user ${context.userId}`);

    const triggeredRules: { id: string; name: string; score: number }[] = [];
    const flags: string[] = [];

    // Get user's risk profile
    const riskProfile = await this.getOrCreateRiskProfile(context.userId);

    // Check if user is blocked
    if (riskProfile.isBlocked) {
      return {
        score: 100,
        severity: 'CRITICAL',
        allowed: false,
        flags: ['USER_BLOCKED'],
        triggeredRules: [],
        requiresMfa: false,
        message: riskProfile.blockedReason || 'Conta bloqueada por segurança',
      };
    }

    // Get active fraud rules
    const rules = await this.prisma.fraudRule.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' },
    });

    // Evaluate each rule
    for (const rule of rules) {
      const result = await this.evaluateRule(rule, context, riskProfile);
      if (result.triggered) {
        triggeredRules.push({ id: rule.id, name: rule.name, score: rule.score });
        flags.push(...result.flags);
      }
    }

    // Calculate total score
    let totalScore = Number(riskProfile.riskScore);
    for (const rule of triggeredRules) {
      totalScore += rule.score;
    }
    totalScore = Math.min(100, totalScore);

    // Determine severity and action
    const severity = this.getSeverity(totalScore);
    const allowed = totalScore < this.THRESHOLDS.BLOCK;
    const requiresMfa = totalScore >= this.THRESHOLDS.HIGH && totalScore < this.THRESHOLDS.BLOCK;

    const result: FraudCheckResult = {
      score: totalScore,
      severity,
      allowed,
      flags,
      triggeredRules,
      requiresMfa,
    };

    // Log the analysis
    this.logger.log(`Fraud analysis complete: score=${totalScore}, severity=${severity}, allowed=${allowed}`);

    return result;
  }

  private async evaluateRule(
    rule: any,
    context: TransactionContext,
    riskProfile: any,
  ): Promise<{ triggered: boolean; flags: string[] }> {
    const conditions = rule.conditions as any;
    const flags: string[] = [];

    switch (rule.ruleType) {
      case 'AMOUNT_THRESHOLD':
        if (context.amount > conditions.maxAmount) {
          flags.push(`HIGH_AMOUNT:${context.amount}`);
          return { triggered: true, flags };
        }
        break;

      case 'VELOCITY':
        const recentTxCount = await this.getRecentTransactionCount(
          context.userId,
          conditions.windowMinutes || 60,
        );
        if (recentTxCount >= conditions.maxTransactions) {
          flags.push(`HIGH_VELOCITY:${recentTxCount}`);
          return { triggered: true, flags };
        }
        break;

      case 'TIME_BASED':
        const hour = context.timestamp.getHours();
        if (conditions.suspiciousHours?.includes(hour)) {
          flags.push(`UNUSUAL_TIME:${hour}`);
          return { triggered: true, flags };
        }
        break;

      case 'NEW_DEVICE':
        if (context.deviceFingerprint) {
          const isKnown = await this.isKnownDevice(context.userId, context.deviceFingerprint);
          if (!isKnown) {
            flags.push('NEW_DEVICE');
            return { triggered: true, flags };
          }
        }
        break;

      case 'AMOUNT_DEVIATION':
        const avgAmount = riskProfile.averageTransactionAmount 
          ? Number(riskProfile.averageTransactionAmount) 
          : 0;
        if (avgAmount > 0) {
          const deviation = context.amount / avgAmount;
          if (deviation > (conditions.maxDeviation || 5)) {
            flags.push(`AMOUNT_DEVIATION:${deviation.toFixed(2)}x`);
            return { triggered: true, flags };
          }
        }
        break;

      case 'NEW_RECIPIENT':
        if (context.recipientKey) {
          const isNewRecipient = await this.isNewRecipient(context.userId, context.recipientKey);
          if (isNewRecipient && context.amount > (conditions.thresholdForNew || 1000)) {
            flags.push('NEW_RECIPIENT_HIGH_VALUE');
            return { triggered: true, flags };
          }
        }
        break;

      case 'CUMULATIVE_DAILY':
        const dailyTotal = await this.getDailyTotal(context.userId);
        if (dailyTotal + context.amount > conditions.maxDaily) {
          flags.push(`DAILY_LIMIT_EXCEEDED:${dailyTotal + context.amount}`);
          return { triggered: true, flags };
        }
        break;
    }

    return { triggered: false, flags: [] };
  }

  private getSeverity(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= this.THRESHOLDS.CRITICAL) return 'CRITICAL';
    if (score >= this.THRESHOLDS.HIGH) return 'HIGH';
    if (score >= this.THRESHOLDS.MEDIUM) return 'MEDIUM';
    return 'LOW';
  }

  private async getOrCreateRiskProfile(userId: string) {
    let profile = await this.prisma.userRiskProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await this.prisma.userRiskProfile.create({
        data: { userId },
      });
    }

    return profile;
  }

  private async getRecentTransactionCount(userId: string, windowMinutes: number): Promise<number> {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);
    return this.prisma.transaction.count({
      where: {
        userId,
        createdAt: { gte: since },
      },
    });
  }

  private async isKnownDevice(userId: string, fingerprint: string): Promise<boolean> {
    const device = await this.prisma.userDevice.findFirst({
      where: { userId, fingerprint, isActive: true },
    });
    return !!device;
  }

  private async isNewRecipient(userId: string, recipientKey: string): Promise<boolean> {
    const existingTx = await this.prisma.pixTransaction.findFirst({
      where: {
        userId,
        OR: [
          { externalReceiverKey: recipientKey },
          { receiverKey: { key: recipientKey } },
        ],
        status: 'COMPLETED',
        createdAt: { lt: new Date() },
      },
    });
    return !existingTx;
  }

  private async getDailyTotal(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await this.prisma.transaction.aggregate({
      where: {
        userId,
        createdAt: { gte: today },
        type: { in: ['PIX_OUT', 'TRANSFER', 'PAYMENT'] },
      },
      _sum: { amount: true },
    });

    return Math.abs(Number(result._sum.amount || 0));
  }

  async updateRiskProfile(userId: string, transactionAmount: number): Promise<void> {
    const profile = await this.getOrCreateRiskProfile(userId);

    // Calculate new average
    const txCount = await this.prisma.transaction.count({ where: { userId } });
    const currentAvg = profile.averageTransactionAmount 
      ? Number(profile.averageTransactionAmount) 
      : 0;
    const newAvg = txCount > 0 
      ? (currentAvg * (txCount - 1) + transactionAmount) / txCount 
      : transactionAmount;

    // Get typical hours
    const hourCounts = await this.getTypicalHours(userId);

    await this.prisma.userRiskProfile.update({
      where: { userId },
      data: {
        averageTransactionAmount: new Decimal(newAvg),
        typicalHours: hourCounts,
      },
    });
  }

  private async getTypicalHours(userId: string): Promise<Record<number, number>> {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
      select: { createdAt: true },
      take: 100,
      orderBy: { createdAt: 'desc' },
    });

    const hourCounts: Record<number, number> = {};
    for (const tx of transactions) {
      const hour = tx.createdAt.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }

    return hourCounts;
  }

  async seedDefaultRules(): Promise<void> {
    const defaultRules = [
      {
        name: 'High Amount Transfer',
        description: 'Flag transactions above R$ 5,000',
        ruleType: 'AMOUNT_THRESHOLD',
        conditions: { maxAmount: 5000 },
        score: 15,
        priority: 1,
      },
      {
        name: 'Very High Amount Transfer',
        description: 'Flag transactions above R$ 10,000',
        ruleType: 'AMOUNT_THRESHOLD',
        conditions: { maxAmount: 10000 },
        score: 30,
        priority: 2,
      },
      {
        name: 'High Velocity',
        description: 'Flag more than 5 transactions in 1 hour',
        ruleType: 'VELOCITY',
        conditions: { windowMinutes: 60, maxTransactions: 5 },
        score: 25,
        priority: 3,
      },
      {
        name: 'Night Time Transaction',
        description: 'Flag transactions between midnight and 6am',
        ruleType: 'TIME_BASED',
        conditions: { suspiciousHours: [0, 1, 2, 3, 4, 5] },
        score: 10,
        priority: 4,
      },
      {
        name: 'New Device',
        description: 'Flag transactions from unknown devices',
        ruleType: 'NEW_DEVICE',
        conditions: {},
        score: 20,
        priority: 5,
      },
      {
        name: 'Amount Deviation',
        description: 'Flag transactions 5x above average',
        ruleType: 'AMOUNT_DEVIATION',
        conditions: { maxDeviation: 5 },
        score: 20,
        priority: 6,
      },
      {
        name: 'New Recipient High Value',
        description: 'Flag high value to new recipients',
        ruleType: 'NEW_RECIPIENT',
        conditions: { thresholdForNew: 1000 },
        score: 15,
        priority: 7,
      },
      {
        name: 'Daily Limit',
        description: 'Flag when daily spending exceeds R$ 20,000',
        ruleType: 'CUMULATIVE_DAILY',
        conditions: { maxDaily: 20000 },
        score: 25,
        priority: 8,
      },
    ];

    for (const rule of defaultRules) {
      await this.prisma.fraudRule.upsert({
        where: { id: rule.name.replace(/\s+/g, '_').toLowerCase() },
        create: {
          id: rule.name.replace(/\s+/g, '_').toLowerCase(),
          ...rule,
        },
        update: rule,
      });
    }

    this.logger.log('Default fraud rules seeded');
  }
}
