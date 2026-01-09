import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  private readonly LIMITS = {
    'auth:login': { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 min
    'auth:signup': { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
    'pix:transfer': { limit: 20, windowMs: 60 * 60 * 1000 }, // 20 per hour
    'pix:key:create': { limit: 5, windowMs: 24 * 60 * 60 * 1000 }, // 5 per day
    'api:general': { limit: 100, windowMs: 60 * 1000 }, // 100 per minute
    'api:sensitive': { limit: 10, windowMs: 60 * 1000 }, // 10 per minute
  };

  constructor(private readonly prisma: PrismaService) {}

  async checkRateLimit(key: string, endpoint: string): Promise<RateLimitResult> {
    const config = this.LIMITS[endpoint as keyof typeof this.LIMITS] || this.LIMITS['api:general'];
    const windowStart = new Date(Date.now() - config.windowMs);
    const windowEnd = new Date(Date.now() + config.windowMs);

    // Get or create rate limit record
    let record = await this.prisma.rateLimitRecord.findFirst({
      where: {
        key,
        endpoint,
        windowStart: { gte: windowStart },
      },
    });

    if (!record) {
      // Create new window
      record = await this.prisma.rateLimitRecord.create({
        data: {
          key,
          endpoint,
          count: 1,
          windowStart: new Date(),
          windowEnd,
        },
      });

      return {
        allowed: true,
        remaining: config.limit - 1,
        resetAt: windowEnd,
      };
    }

    // Check if blocked
    if (record.isBlocked) {
      const retryAfter = Math.ceil((record.windowEnd.getTime() - Date.now()) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetAt: record.windowEnd,
        retryAfter: Math.max(0, retryAfter),
      };
    }

    // Check limit
    if (record.count >= config.limit) {
      // Block for extended period on limit exceeded
      await this.prisma.rateLimitRecord.update({
        where: { id: record.id },
        data: { isBlocked: true },
      });

      this.logger.warn(`Rate limit exceeded for ${key} on ${endpoint}`);

      return {
        allowed: false,
        remaining: 0,
        resetAt: record.windowEnd,
        retryAfter: Math.ceil((record.windowEnd.getTime() - Date.now()) / 1000),
      };
    }

    // Increment counter
    await this.prisma.rateLimitRecord.update({
      where: { id: record.id },
      data: { count: { increment: 1 } },
    });

    return {
      allowed: true,
      remaining: config.limit - record.count - 1,
      resetAt: record.windowEnd,
    };
  }

  async resetRateLimit(key: string, endpoint?: string): Promise<void> {
    const where: any = { key };
    if (endpoint) where.endpoint = endpoint;

    await this.prisma.rateLimitRecord.deleteMany({ where });
    this.logger.log(`Rate limit reset for ${key}${endpoint ? ` on ${endpoint}` : ''}`);
  }

  async cleanupExpiredRecords(): Promise<number> {
    const result = await this.prisma.rateLimitRecord.deleteMany({
      where: {
        windowEnd: { lt: new Date() },
      },
    });

    if (result.count > 0) {
      this.logger.log(`Cleaned up ${result.count} expired rate limit records`);
    }

    return result.count;
  }

  async getBlockedKeys(): Promise<any[]> {
    return this.prisma.rateLimitRecord.findMany({
      where: {
        isBlocked: true,
        windowEnd: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async unblockKey(key: string): Promise<void> {
    await this.prisma.rateLimitRecord.updateMany({
      where: { key, isBlocked: true },
      data: { isBlocked: false },
    });
    this.logger.log(`Unblocked key: ${key}`);
  }

  async getRateLimitStats(endpoint?: string) {
    const where: any = {};
    if (endpoint) where.endpoint = endpoint;

    const [total, blocked, byEndpoint] = await Promise.all([
      this.prisma.rateLimitRecord.count({ where }),
      this.prisma.rateLimitRecord.count({ where: { ...where, isBlocked: true } }),
      this.prisma.rateLimitRecord.groupBy({
        by: ['endpoint'],
        where,
        _count: true,
        _sum: { count: true },
      }),
    ]);

    return {
      total,
      blocked,
      byEndpoint: byEndpoint.map(e => ({
        endpoint: e.endpoint,
        records: e._count,
        totalRequests: e._sum.count,
      })),
    };
  }
}
