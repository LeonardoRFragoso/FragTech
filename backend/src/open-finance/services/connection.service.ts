import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InstitutionMockService } from '../providers/institution-mock.service';

@Injectable()
export class ConnectionService {
  private readonly logger = new Logger(ConnectionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly institutionService: InstitutionMockService,
  ) {}

  async getUserConnections(userId: string) {
    const connections = await this.prisma.openFinanceConnection.findMany({
      where: { userId, isActive: true },
      include: {
        institution: true,
        accounts: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return connections.map(conn => ({
      id: conn.id,
      institution: {
        code: conn.institution.code,
        name: conn.institution.name,
        logoUrl: conn.institution.logoUrl,
      },
      lastSyncAt: conn.lastSyncAt,
      syncStatus: conn.syncStatus,
      accounts: conn.accounts.map(acc => ({
        id: acc.id,
        type: acc.accountType,
        name: acc.name,
        balance: acc.balance ? Number(acc.balance) : null,
        currency: acc.currency,
        lastSyncAt: acc.lastSyncAt,
      })),
      totalBalance: conn.accounts.reduce((sum, acc) => 
        sum + (acc.balance ? Number(acc.balance) : 0), 0
      ),
    }));
  }

  async getConnectionById(connectionId: string, userId: string) {
    const connection = await this.prisma.openFinanceConnection.findFirst({
      where: { id: connectionId, userId, isActive: true },
      include: {
        institution: true,
        consent: true,
        accounts: {
          include: {
            transactions: {
              take: 50,
              orderBy: { date: 'desc' },
            },
          },
        },
      },
    });

    if (!connection) {
      throw new NotFoundException('Conexão não encontrada');
    }

    return connection;
  }

  async refreshConnectionToken(connectionId: string, userId: string) {
    const connection = await this.prisma.openFinanceConnection.findFirst({
      where: { id: connectionId, userId, isActive: true },
      include: { institution: true },
    });

    if (!connection) {
      throw new NotFoundException('Conexão não encontrada');
    }

    try {
      const tokens = await this.institutionService.refreshAccessToken(
        connection.institution.code,
        connection.refreshToken!,
      );

      await this.prisma.openFinanceConnection.update({
        where: { id: connectionId },
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
        },
      });

      this.logger.log(`Token refreshed for connection ${connectionId}`);

      return { message: 'Token atualizado com sucesso' };
    } catch (error) {
      this.logger.error(`Failed to refresh token: ${error.message}`);
      
      await this.prisma.openFinanceConnection.update({
        where: { id: connectionId },
        data: {
          syncStatus: 'error',
          errorMessage: 'Falha ao renovar token. Reconecte sua conta.',
        },
      });

      throw error;
    }
  }

  async getAggregatedBalance(userId: string) {
    const connections = await this.prisma.openFinanceConnection.findMany({
      where: { userId, isActive: true },
      include: {
        institution: true,
        accounts: true,
      },
    });

    const byInstitution = connections.map(conn => ({
      institution: conn.institution.name,
      accounts: conn.accounts.length,
      balance: conn.accounts.reduce((sum, acc) => 
        sum + (acc.balance ? Number(acc.balance) : 0), 0
      ),
    }));

    const totalBalance = byInstitution.reduce((sum, inst) => sum + inst.balance, 0);
    const totalAccounts = byInstitution.reduce((sum, inst) => sum + inst.accounts, 0);

    return {
      totalBalance,
      totalAccounts,
      totalInstitutions: connections.length,
      byInstitution,
      currency: 'BRL',
    };
  }

  async getAggregatedTransactions(userId: string, options?: {
    startDate?: Date;
    endDate?: Date;
    category?: string;
    limit?: number;
  }) {
    const connections = await this.prisma.openFinanceConnection.findMany({
      where: { userId, isActive: true },
      select: { accounts: { select: { id: true } } },
    });

    const accountIds = connections.flatMap(c => c.accounts.map(a => a.id));

    const where: any = { accountId: { in: accountIds } };

    if (options?.startDate || options?.endDate) {
      where.date = {};
      if (options?.startDate) where.date.gte = options.startDate;
      if (options?.endDate) where.date.lte = options.endDate;
    }

    if (options?.category) {
      where.category = options.category;
    }

    const transactions = await this.prisma.openFinanceTransaction.findMany({
      where,
      orderBy: { date: 'desc' },
      take: options?.limit || 100,
      include: {
        account: {
          include: {
            connection: {
              include: { institution: true },
            },
          },
        },
      },
    });

    return transactions.map(tx => ({
      id: tx.id,
      amount: Number(tx.amount),
      description: tx.description,
      category: tx.category,
      date: tx.date,
      type: tx.type,
      institution: tx.account.connection.institution.name,
      accountName: tx.account.name,
    }));
  }

  async getCategoryBreakdown(userId: string, startDate?: Date, endDate?: Date) {
    const transactions = await this.getAggregatedTransactions(userId, {
      startDate,
      endDate,
      limit: 1000,
    });

    const breakdown: Record<string, { total: number; count: number }> = {};

    for (const tx of transactions) {
      const category = tx.category || 'other';
      if (!breakdown[category]) {
        breakdown[category] = { total: 0, count: 0 };
      }
      breakdown[category].total += Math.abs(tx.amount);
      breakdown[category].count += 1;
    }

    return Object.entries(breakdown)
      .map(([category, data]) => ({
        category,
        total: data.total,
        count: data.count,
        percentage: 0, // Will be calculated below
      }))
      .sort((a, b) => b.total - a.total)
      .map((item, _, arr) => ({
        ...item,
        percentage: (item.total / arr.reduce((s, i) => s + i.total, 0)) * 100,
      }));
  }
}
