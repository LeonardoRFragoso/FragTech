import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);
  private readonly REWARD_AMOUNT = 20.00;

  constructor(private readonly prisma: PrismaService) {}

  async createReferralCode(userId: string): Promise<string> {
    const existing = await this.prisma.referralCode.findUnique({ where: { userId } });
    if (existing) return existing.code;

    const code = this.generateCode();
    await this.prisma.referralCode.create({
      data: {
        userId,
        code,
        reward: this.REWARD_AMOUNT,
      },
    });

    this.logger.log(`Referral code created for user ${userId}: ${code}`);
    return code;
  }

  async getReferralCode(userId: string) {
    return this.prisma.referralCode.findUnique({
      where: { userId },
      include: { referrals: true },
    });
  }

  async applyReferralCode(newUserId: string, code: string) {
    const referralCode = await this.prisma.referralCode.findUnique({
      where: { code },
      include: { referrals: true },
    });

    if (!referralCode) {
      throw new BadRequestException('Código de indicação inválido');
    }

    if (!referralCode.isActive) {
      throw new BadRequestException('Código de indicação expirado');
    }

    if (referralCode.maxUses && referralCode.usageCount >= referralCode.maxUses) {
      throw new BadRequestException('Código atingiu limite de uso');
    }

    if (referralCode.userId === newUserId) {
      throw new BadRequestException('Você não pode usar seu próprio código');
    }

    const existingReferral = await this.prisma.referral.findUnique({
      where: { referredUserId: newUserId },
    });

    if (existingReferral) {
      throw new BadRequestException('Você já foi indicado por outro usuário');
    }

    const referral = await this.prisma.referral.create({
      data: {
        referrerId: referralCode.userId,
        referredUserId: newUserId,
        referralCodeId: referralCode.id,
        status: 'pending',
      },
    });

    await this.prisma.referralCode.update({
      where: { id: referralCode.id },
      data: { usageCount: { increment: 1 } },
    });

    this.logger.log(`Referral applied: ${newUserId} referred by ${referralCode.userId}`);
    return referral;
  }

  async convertReferral(referredUserId: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { referredUserId },
      include: { referralCode: true },
    });

    if (!referral || referral.status !== 'pending') return null;

    const updated = await this.prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: 'converted',
        convertedAt: new Date(),
        rewardAmount: referral.referralCode.reward,
      },
    });

    this.logger.log(`Referral converted: ${referredUserId}`);
    return updated;
  }

  async payReward(referralId: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { id: referralId },
    });

    if (!referral || referral.status !== 'converted' || referral.rewardPaid) {
      throw new BadRequestException('Referral não elegível para recompensa');
    }

    const updated = await this.prisma.referral.update({
      where: { id: referralId },
      data: { rewardPaid: true },
    });

    this.logger.log(`Reward paid for referral ${referralId}`);
    return updated;
  }

  async getReferralStats(userId: string) {
    const referralCode = await this.prisma.referralCode.findUnique({
      where: { userId },
      include: { referrals: true },
    });

    if (!referralCode) return { code: null, totalReferrals: 0, converted: 0, pendingRewards: 0, paidRewards: 0 };

    const converted = referralCode.referrals.filter(r => r.status === 'converted').length;
    const paidRewards = referralCode.referrals.filter(r => r.rewardPaid).length;
    const pendingRewards = converted - paidRewards;

    return {
      code: referralCode.code,
      totalReferrals: referralCode.referrals.length,
      converted,
      pendingRewards,
      paidRewards,
      totalEarned: paidRewards * Number(referralCode.reward),
      potentialEarnings: pendingRewards * Number(referralCode.reward),
    };
  }

  async getTopReferrers(limit: number = 10) {
    const codes = await this.prisma.referralCode.findMany({
      orderBy: { usageCount: 'desc' },
      take: limit,
      include: { referrals: { where: { status: 'converted' } } },
    });

    return codes.map(c => ({
      userId: c.userId,
      code: c.code,
      totalReferrals: c.usageCount,
      converted: c.referrals.length,
    }));
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'FRAG';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
