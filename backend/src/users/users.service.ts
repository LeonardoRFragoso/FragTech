import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
      include: { account: true },
    });

    const { passwordHash, ...result } = user;
    return result;
  }

  async completeOnboarding(id: string, data: {
    financialProfile: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
    monthlyIncome: number;
    aiPreference: string;
  }) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        financialProfile: data.financialProfile,
        monthlyIncome: data.monthlyIncome,
        aiPreference: data.aiPreference,
        onboardingCompleted: true,
        creditScore: this.calculateInitialScore(data.monthlyIncome),
      },
      include: { account: true },
    });

    const { passwordHash, ...result } = user;
    return result;
  }

  async updatePlan(id: string, plan: 'FREE' | 'PRO' | 'PREMIUM') {
    const user = await this.prisma.user.update({
      where: { id },
      data: { plan },
      include: { account: true },
    });

    const { passwordHash, ...result } = user;
    return result;
  }

  private calculateInitialScore(monthlyIncome: number): number {
    const baseScore = 300;
    const incomeBonus = Math.min(Math.floor(monthlyIncome / 1000) * 50, 400);
    return baseScore + incomeBonus;
  }
}
