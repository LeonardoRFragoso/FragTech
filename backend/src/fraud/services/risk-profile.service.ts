import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class RiskProfileService {
  private readonly logger = new Logger(RiskProfileService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateProfile(userId: string) {
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

  async getUserRiskScore(userId: string): Promise<number> {
    const profile = await this.getOrCreateProfile(userId);
    return Number(profile.riskScore);
  }

  async updateRiskScore(userId: string, delta: number): Promise<void> {
    const profile = await this.getOrCreateProfile(userId);
    const newScore = Math.max(0, Math.min(100, Number(profile.riskScore) + delta));

    await this.prisma.userRiskProfile.update({
      where: { userId },
      data: { riskScore: new Decimal(newScore) },
    });

    this.logger.log(`Risk score updated for user ${userId}: ${newScore}`);
  }

  async incrementFlagCount(userId: string): Promise<void> {
    await this.prisma.userRiskProfile.update({
      where: { userId },
      data: {
        flagCount: { increment: 1 },
        lastFlagAt: new Date(),
      },
    });
  }

  async blockUser(userId: string, reason: string): Promise<void> {
    await this.prisma.userRiskProfile.update({
      where: { userId },
      data: {
        isBlocked: true,
        blockedReason: reason,
        blockedAt: new Date(),
      },
    });

    this.logger.warn(`User ${userId} blocked: ${reason}`);
  }

  async unblockUser(userId: string): Promise<void> {
    await this.prisma.userRiskProfile.update({
      where: { userId },
      data: {
        isBlocked: false,
        blockedReason: null,
        blockedAt: null,
        riskScore: new Decimal(30), // Reset to moderate risk
      },
    });

    this.logger.log(`User ${userId} unblocked`);
  }

  async getHighRiskUsers(threshold: number = 70): Promise<any[]> {
    return this.prisma.userRiskProfile.findMany({
      where: {
        riskScore: { gte: threshold },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: { riskScore: 'desc' },
    });
  }

  async getBlockedUsers(): Promise<any[]> {
    return this.prisma.userRiskProfile.findMany({
      where: { isBlocked: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: { blockedAt: 'desc' },
    });
  }

  async decayRiskScores(): Promise<number> {
    // Decay risk scores by 1% daily for users not flagged in 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const profiles = await this.prisma.userRiskProfile.findMany({
      where: {
        riskScore: { gt: 0 },
        OR: [
          { lastFlagAt: null },
          { lastFlagAt: { lt: thirtyDaysAgo } },
        ],
      },
    });

    let updated = 0;
    for (const profile of profiles) {
      const newScore = Math.max(0, Number(profile.riskScore) * 0.99);
      await this.prisma.userRiskProfile.update({
        where: { id: profile.id },
        data: { riskScore: new Decimal(newScore) },
      });
      updated++;
    }

    this.logger.log(`Decayed risk scores for ${updated} users`);
    return updated;
  }
}
