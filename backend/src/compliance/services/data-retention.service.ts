import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DataRetentionService {
  private readonly logger = new Logger(DataRetentionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async seedDefaultPolicies(): Promise<void> {
    const policies = [
      { entityType: 'audit_logs', retentionDays: 2555, description: 'Logs de auditoria (7 anos - requisito regulatório)' },
      { entityType: 'transactions', retentionDays: 1825, description: 'Transações financeiras (5 anos - requisito fiscal)' },
      { entityType: 'chat_messages', retentionDays: 365, description: 'Mensagens do AI Copilot (1 ano)' },
      { entityType: 'security_events', retentionDays: 730, description: 'Eventos de segurança (2 anos)' },
      { entityType: 'pix_webhook_events', retentionDays: 365, description: 'Webhooks PIX (1 ano)' },
      { entityType: 'open_finance_sync_logs', retentionDays: 180, description: 'Logs de sincronização Open Finance (6 meses)' },
    ];

    for (const policy of policies) {
      await this.prisma.dataRetentionPolicy.upsert({
        where: { entityType: policy.entityType },
        create: policy,
        update: { retentionDays: policy.retentionDays, description: policy.description },
      });
    }

    this.logger.log('Default data retention policies seeded');
  }

  async getPolicies() {
    return this.prisma.dataRetentionPolicy.findMany({
      orderBy: { entityType: 'asc' },
    });
  }

  async updatePolicy(entityType: string, retentionDays: number) {
    return this.prisma.dataRetentionPolicy.update({
      where: { entityType },
      data: { retentionDays },
    });
  }

  async executeRetentionPolicies(): Promise<Record<string, number>> {
    const policies = await this.prisma.dataRetentionPolicy.findMany({
      where: { isActive: true },
    });

    const results: Record<string, number> = {};

    for (const policy of policies) {
      try {
        const cutoffDate = new Date(Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000);
        let deletedCount = 0;

        switch (policy.entityType) {
          case 'audit_logs':
            const auditResult = await this.prisma.auditLog.deleteMany({
              where: { createdAt: { lt: cutoffDate } },
            });
            deletedCount = auditResult.count;
            break;

          case 'chat_messages':
            const chatResult = await this.prisma.chatMessage.deleteMany({
              where: { createdAt: { lt: cutoffDate } },
            });
            deletedCount = chatResult.count;
            break;

          case 'security_events':
            const securityResult = await this.prisma.securityEvent.deleteMany({
              where: { createdAt: { lt: cutoffDate } },
            });
            deletedCount = securityResult.count;
            break;

          case 'pix_webhook_events':
            const webhookResult = await this.prisma.pixWebhookEvent.deleteMany({
              where: { createdAt: { lt: cutoffDate } },
            });
            deletedCount = webhookResult.count;
            break;

          case 'open_finance_sync_logs':
            const syncResult = await this.prisma.openFinanceSyncLog.deleteMany({
              where: { createdAt: { lt: cutoffDate } },
            });
            deletedCount = syncResult.count;
            break;
        }

        results[policy.entityType] = deletedCount;

        await this.prisma.dataRetentionPolicy.update({
          where: { id: policy.id },
          data: { lastExecutedAt: new Date() },
        });

        if (deletedCount > 0) {
          this.logger.log(`Retention policy executed: ${policy.entityType} - deleted ${deletedCount} records`);
        }
      } catch (error) {
        this.logger.error(`Failed to execute retention for ${policy.entityType}: ${error.message}`);
        results[policy.entityType] = -1;
      }
    }

    return results;
  }

  async getRetentionStats() {
    const policies = await this.prisma.dataRetentionPolicy.findMany();
    const stats: any[] = [];

    for (const policy of policies) {
      const cutoffDate = new Date(Date.now() - policy.retentionDays * 24 * 60 * 60 * 1000);
      let expiredCount = 0;
      let totalCount = 0;

      try {
        switch (policy.entityType) {
          case 'audit_logs':
            [expiredCount, totalCount] = await Promise.all([
              this.prisma.auditLog.count({ where: { createdAt: { lt: cutoffDate } } }),
              this.prisma.auditLog.count(),
            ]);
            break;
          case 'chat_messages':
            [expiredCount, totalCount] = await Promise.all([
              this.prisma.chatMessage.count({ where: { createdAt: { lt: cutoffDate } } }),
              this.prisma.chatMessage.count(),
            ]);
            break;
        }
      } catch {
        // Entity might not exist yet
      }

      stats.push({
        entityType: policy.entityType,
        retentionDays: policy.retentionDays,
        lastExecutedAt: policy.lastExecutedAt,
        expiredRecords: expiredCount,
        totalRecords: totalCount,
      });
    }

    return stats;
  }
}
