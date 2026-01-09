import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InsightsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.aIInsight.findMany({
      where: { userId, isDismissed: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findUnread(userId: string) {
    return this.prisma.aIInsight.findMany({
      where: { userId, isRead: false, isDismissed: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(userId: string, insightId: string) {
    return this.prisma.aIInsight.updateMany({
      where: { id: insightId, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.aIInsight.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async dismiss(userId: string, insightId: string) {
    return this.prisma.aIInsight.updateMany({
      where: { id: insightId, userId },
      data: { isDismissed: true },
    });
  }

  async createInsight(userId: string, data: {
    type: 'WARNING' | 'TIP' | 'OPPORTUNITY' | 'ACHIEVEMENT';
    title: string;
    message: string;
    actionLabel?: string;
    actionData?: Record<string, unknown>;
    estimatedImpact?: number;
  }) {
    return this.prisma.aIInsight.create({
      data: {
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        actionLabel: data.actionLabel,
        actionData: data.actionData as any,
        estimatedImpact: data.estimatedImpact,
      },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.aIInsight.count({
      where: { userId, isRead: false, isDismissed: false },
    });
  }
}
