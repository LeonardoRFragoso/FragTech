import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, options?: {
    page?: number;
    limit?: number;
    category?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (options?.category) {
      where.category = options.category;
    }

    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        where.createdAt.gte = options.startDate;
      }
      if (options.endDate) {
        where.createdAt.lte = options.endDate;
      }
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMonthlyStats(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const income = transactions
      .filter((t) => Number(t.amount) > 0)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = transactions
      .filter((t) => Number(t.amount) < 0)
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    const byCategory = transactions.reduce((acc, t) => {
      const category = t.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += Math.abs(Number(t.amount));
      return acc;
    }, {} as Record<string, number>);

    return {
      income,
      expenses,
      net: income - expenses,
      byCategory,
      transactionCount: transactions.length,
    };
  }

  async getCategoryBreakdown(userId: string, months: number = 3) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
        amount: { lt: 0 },
      },
    });

    const breakdown = transactions.reduce((acc, t) => {
      const category = t.category;
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0 };
      }
      acc[category].total += Math.abs(Number(t.amount));
      acc[category].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    return Object.entries(breakdown)
      .map(([category, data]) => ({
        category,
        total: data.total,
        count: data.count,
        average: data.total / data.count,
      }))
      .sort((a, b) => b.total - a.total);
  }
}
