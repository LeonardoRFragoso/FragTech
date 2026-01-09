import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CardsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.card.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createVirtualCard(userId: string) {
    const existingCards = await this.prisma.card.count({
      where: { userId, type: 'VIRTUAL' },
    });

    if (existingCards >= 5) {
      throw new BadRequestException('Maximum virtual cards limit reached');
    }

    const lastFour = this.generateLastFour();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 5);

    return this.prisma.card.create({
      data: {
        userId,
        type: 'VIRTUAL',
        lastFour,
        brand: 'Mastercard',
        status: 'ACTIVE',
        limitAmount: 1000,
        expiresAt,
      },
    });
  }

  async requestPhysicalCard(userId: string) {
    const existingPhysical = await this.prisma.card.findFirst({
      where: { userId, type: 'PHYSICAL', status: { not: 'CANCELLED' } },
    });

    if (existingPhysical) {
      throw new BadRequestException('Physical card already exists');
    }

    const lastFour = this.generateLastFour();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 5);

    return this.prisma.card.create({
      data: {
        userId,
        type: 'PHYSICAL',
        lastFour,
        brand: 'Mastercard',
        status: 'ACTIVE',
        limitAmount: 5000,
        expiresAt,
      },
    });
  }

  async toggleBlock(userId: string, cardId: string) {
    const card = await this.prisma.card.findFirst({
      where: { id: cardId, userId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    const newStatus = card.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';

    return this.prisma.card.update({
      where: { id: cardId },
      data: { status: newStatus },
    });
  }

  async updateLimit(userId: string, cardId: string, limitAmount: number) {
    const card = await this.prisma.card.findFirst({
      where: { id: cardId, userId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    return this.prisma.card.update({
      where: { id: cardId },
      data: { limitAmount },
    });
  }

  async toggleInternational(userId: string, cardId: string) {
    const card = await this.prisma.card.findFirst({
      where: { id: cardId, userId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    return this.prisma.card.update({
      where: { id: cardId },
      data: { isInternationalEnabled: !card.isInternationalEnabled },
    });
  }

  private generateLastFour(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }
}
