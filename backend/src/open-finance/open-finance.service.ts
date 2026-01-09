import { Injectable, Logger } from '@nestjs/common';
import { ConsentService } from './services/consent.service';
import { ConnectionService } from './services/connection.service';
import { SyncService } from './services/sync.service';
import { InstitutionMockService } from './providers/institution-mock.service';

@Injectable()
export class OpenFinanceService {
  private readonly logger = new Logger(OpenFinanceService.name);

  constructor(
    private readonly consentService: ConsentService,
    private readonly connectionService: ConnectionService,
    private readonly syncService: SyncService,
    private readonly institutionService: InstitutionMockService,
  ) {}

  // ==================== INSTITUTIONS ====================

  getAvailableInstitutions() {
    return this.institutionService.getAvailableInstitutions();
  }

  // ==================== CONSENTS ====================

  async initiateConsent(userId: string, institutionCode: string, scopes: string[]) {
    return this.consentService.initiateConsent(userId, institutionCode, scopes);
  }

  async authorizeConsent(state: string, authorizationCode: string) {
    return this.consentService.authorizeConsent(state, authorizationCode);
  }

  async revokeConsent(consentId: string, userId: string) {
    return this.consentService.revokeConsent(consentId, userId);
  }

  async getUserConsents(userId: string) {
    return this.consentService.getUserConsents(userId);
  }

  // ==================== CONNECTIONS ====================

  async getUserConnections(userId: string) {
    return this.connectionService.getUserConnections(userId);
  }

  async getConnectionById(connectionId: string, userId: string) {
    return this.connectionService.getConnectionById(connectionId, userId);
  }

  async refreshConnectionToken(connectionId: string, userId: string) {
    return this.connectionService.refreshConnectionToken(connectionId, userId);
  }

  // ==================== SYNC ====================

  async syncConnection(connectionId: string) {
    return this.syncService.syncConnection(connectionId);
  }

  async getSyncHistory(connectionId: string, limit?: number) {
    return this.syncService.getSyncHistory(connectionId, limit);
  }

  // ==================== AGGREGATED DATA ====================

  async getAggregatedBalance(userId: string) {
    return this.connectionService.getAggregatedBalance(userId);
  }

  async getAggregatedTransactions(userId: string, options?: {
    startDate?: Date;
    endDate?: Date;
    category?: string;
    limit?: number;
  }) {
    return this.connectionService.getAggregatedTransactions(userId, options);
  }

  async getCategoryBreakdown(userId: string, startDate?: Date, endDate?: Date) {
    return this.connectionService.getCategoryBreakdown(userId, startDate, endDate);
  }

  // ==================== DASHBOARD ====================

  async getOpenFinanceDashboard(userId: string) {
    const [connections, balance, consents] = await Promise.all([
      this.connectionService.getUserConnections(userId),
      this.connectionService.getAggregatedBalance(userId),
      this.consentService.getUserConsents(userId),
    ]);

    const activeConsents = consents.filter(c => c.status === 'AUTHORIZED');

    return {
      summary: {
        totalBalance: balance.totalBalance,
        totalAccounts: balance.totalAccounts,
        connectedInstitutions: balance.totalInstitutions,
        activeConsents: activeConsents.length,
      },
      balanceByInstitution: balance.byInstitution,
      connections: connections.slice(0, 5),
      recentActivity: await this.connectionService.getAggregatedTransactions(userId, { limit: 10 }),
    };
  }
}
