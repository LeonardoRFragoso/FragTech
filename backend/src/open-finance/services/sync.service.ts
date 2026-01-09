import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InstitutionMockService } from '../providers/institution-mock.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly institutionService: InstitutionMockService,
  ) {}

  async syncConnection(connectionId: string) {
    const connection = await this.prisma.openFinanceConnection.findUnique({
      where: { id: connectionId },
      include: { institution: true },
    });

    if (!connection || !connection.isActive) {
      throw new Error('Conexão não encontrada ou inativa');
    }

    // Check if token needs refresh
    if (connection.tokenExpiresAt && connection.tokenExpiresAt < new Date()) {
      await this.refreshToken(connection);
    }

    this.logger.log(`Starting sync for connection ${connectionId}`);

    await this.prisma.openFinanceConnection.update({
      where: { id: connectionId },
      data: { syncStatus: 'syncing' },
    });

    const syncLog = await this.prisma.openFinanceSyncLog.create({
      data: {
        connectionId,
        dataType: 'TRANSACTIONS',
        status: 'in_progress',
        startedAt: new Date(),
      },
    });

    try {
      // Sync accounts
      await this.syncAccounts(connection);

      // Sync transactions for each account
      const accounts = await this.prisma.openFinanceAccount.findMany({
        where: { connectionId },
      });

      let totalRecords = 0;
      for (const account of accounts) {
        const count = await this.syncAccountTransactions(connection, account.id);
        totalRecords += count;
      }

      // Update sync log
      await this.prisma.openFinanceSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'completed',
          recordsCount: totalRecords,
          completedAt: new Date(),
        },
      });

      // Update connection
      await this.prisma.openFinanceConnection.update({
        where: { id: connectionId },
        data: {
          syncStatus: 'completed',
          lastSyncAt: new Date(),
          errorMessage: null,
        },
      });

      this.logger.log(`Sync completed for connection ${connectionId}: ${totalRecords} records`);

      return { success: true, recordsCount: totalRecords };
    } catch (error) {
      this.logger.error(`Sync failed for connection ${connectionId}: ${error.message}`);

      await this.prisma.openFinanceSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
          completedAt: new Date(),
        },
      });

      await this.prisma.openFinanceConnection.update({
        where: { id: connectionId },
        data: {
          syncStatus: 'error',
          errorMessage: error.message,
        },
      });

      throw error;
    }
  }

  private async syncAccounts(connection: any) {
    const mockAccounts = await this.institutionService.fetchAccounts(
      connection.institution.code,
      connection.accessToken,
    );

    for (const mockAccount of mockAccounts) {
      await this.prisma.openFinanceAccount.upsert({
        where: {
          connectionId_externalId: {
            connectionId: connection.id,
            externalId: mockAccount.id,
          },
        },
        create: {
          connectionId: connection.id,
          externalId: mockAccount.id,
          accountType: mockAccount.type,
          name: mockAccount.name,
          balance: new Decimal(mockAccount.balance),
          currency: mockAccount.currency,
          lastSyncAt: new Date(),
        },
        update: {
          balance: new Decimal(mockAccount.balance),
          lastSyncAt: new Date(),
        },
      });
    }

    this.logger.log(`Synced ${mockAccounts.length} accounts for connection ${connection.id}`);
  }

  private async syncAccountTransactions(connection: any, accountId: string): Promise<number> {
    const account = await this.prisma.openFinanceAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) return 0;

    // Get last 90 days of transactions
    const endDate = new Date();
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const mockTransactions = await this.institutionService.fetchTransactions(
      connection.institution.code,
      connection.accessToken,
      account.externalId,
      startDate,
      endDate,
    );

    let count = 0;
    for (const tx of mockTransactions) {
      await this.prisma.openFinanceTransaction.upsert({
        where: {
          accountId_externalId: {
            accountId,
            externalId: tx.id,
          },
        },
        create: {
          accountId,
          externalId: tx.id,
          amount: new Decimal(tx.amount),
          description: tx.description,
          category: tx.category,
          date: tx.date,
          type: tx.type,
        },
        update: {
          amount: new Decimal(tx.amount),
          description: tx.description,
          category: tx.category,
        },
      });
      count++;
    }

    this.logger.log(`Synced ${count} transactions for account ${accountId}`);
    return count;
  }

  private async refreshToken(connection: any) {
    const tokens = await this.institutionService.refreshAccessToken(
      connection.institution.code,
      connection.refreshToken,
    );

    await this.prisma.openFinanceConnection.update({
      where: { id: connection.id },
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
      },
    });
  }

  async getSyncHistory(connectionId: string, limit: number = 10) {
    return this.prisma.openFinanceSyncLog.findMany({
      where: { connectionId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async scheduleSync(connectionId: string) {
    // In production, this would add to a job queue
    // For now, we'll just trigger immediate sync
    return this.syncConnection(connectionId);
  }
}
