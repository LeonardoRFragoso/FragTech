import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.financialGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActive(userId: string) {
    return this.prisma.financialGoal.findMany({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateGoalDto) {
    return this.prisma.financialGoal.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        targetAmount: dto.targetAmount,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        category: dto.category,
        icon: dto.icon,
        color: dto.color,
      },
    });
  }

  async addProgress(userId: string, goalId: string, amount: number) {
    const goal = await this.prisma.financialGoal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    const newAmount = Number(goal.currentAmount) + amount;
    const isCompleted = newAmount >= Number(goal.targetAmount);

    return this.prisma.financialGoal.update({
      where: { id: goalId },
      data: {
        currentAmount: newAmount,
        status: isCompleted ? 'COMPLETED' : 'ACTIVE',
      },
    });
  }

  async abandon(userId: string, goalId: string) {
    const goal = await this.prisma.financialGoal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return this.prisma.financialGoal.update({
      where: { id: goalId },
      data: { status: 'ABANDONED' },
    });
  }

  async delete(userId: string, goalId: string) {
    const goal = await this.prisma.financialGoal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return this.prisma.financialGoal.delete({
      where: { id: goalId },
    });
  }
}
