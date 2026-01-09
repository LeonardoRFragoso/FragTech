import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(
    action: string,
    entity: string,
    entityId?: string,
    userId?: string,
    oldData?: any,
    newData?: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const auditLog = await this.prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        userId,
        oldData,
        newData,
        ipAddress,
        userAgent,
      },
    });

    this.logger.debug(`Audit: ${action} on ${entity}${entityId ? `:${entityId}` : ''} by ${userId || 'system'}`);
    return auditLog;
  }

  async getAuditLogs(options?: {
    userId?: string;
    entity?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (options?.userId) where.userId = options.userId;
    if (options?.entity) where.entity = options.entity;
    if (options?.action) where.action = options.action;

    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options?.startDate) where.createdAt.gte = options.startDate;
      if (options?.endDate) where.createdAt.lte = options.endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 100,
        skip: options?.offset || 0,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  async getUserActivityLog(userId: string, limit: number = 50) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getEntityHistory(entity: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entity, entityId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getSecurityEvents(limit: number = 100) {
    return this.prisma.securityEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async logSecurityEvent(
    eventType: string,
    severity: string,
    description: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    deviceId?: string,
    metadata?: any,
  ) {
    const event = await this.prisma.securityEvent.create({
      data: {
        eventType,
        severity,
        description,
        userId,
        ipAddress,
        userAgent,
        deviceId,
        metadata,
      },
    });

    if (severity === 'HIGH' || severity === 'CRITICAL') {
      this.logger.warn(`Security Event [${severity}]: ${eventType} - ${description}`);
    }

    return event;
  }

  async getAuditStats(days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totalLogs, byAction, byEntity] = await Promise.all([
      this.prisma.auditLog.count({
        where: { createdAt: { gte: since } },
      }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where: { createdAt: { gte: since } },
        _count: true,
      }),
      this.prisma.auditLog.groupBy({
        by: ['entity'],
        where: { createdAt: { gte: since } },
        _count: true,
      }),
    ]);

    return {
      totalLogs,
      byAction: Object.fromEntries(byAction.map(a => [a.action, a._count])),
      byEntity: Object.fromEntries(byEntity.map(e => [e.entity, e._count])),
      period: `${days} days`,
    };
  }
}
