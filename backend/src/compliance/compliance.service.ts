import { Injectable, Logger } from '@nestjs/common';
import { LgpdService } from './services/lgpd.service';
import { AuditService } from './services/audit.service';
import { DataRetentionService } from './services/data-retention.service';
import { ImmutableLogService } from './services/immutable-log.service';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    private readonly lgpdService: LgpdService,
    private readonly auditService: AuditService,
    private readonly dataRetentionService: DataRetentionService,
    private readonly immutableLogService: ImmutableLogService,
  ) {}

  // ==================== LGPD ====================

  async grantConsent(userId: string, consentType: string, ipAddress?: string, userAgent?: string) {
    const consent = await this.lgpdService.grantConsent(userId, consentType, ipAddress, userAgent);
    await this.auditService.log('CONSENT_GRANTED', 'lgpd_consent', consent.id, userId, null, { consentType });
    return consent;
  }

  async revokeConsent(userId: string, consentType: string) {
    const consent = await this.lgpdService.revokeConsent(userId, consentType);
    await this.auditService.log('CONSENT_REVOKED', 'lgpd_consent', consent.id, userId, { consentType }, null);
    return consent;
  }

  async getUserConsents(userId: string) {
    return this.lgpdService.getUserConsents(userId);
  }

  async hasConsent(userId: string, consentType: string) {
    return this.lgpdService.hasConsent(userId, consentType);
  }

  async requestDataDeletion(userId: string, requestType: string, reason?: string) {
    const request = await this.lgpdService.requestDataDeletion(userId, requestType, reason);
    await this.auditService.log('DATA_DELETION_REQUESTED', 'data_deletion_request', request.id, userId);
    return request;
  }

  async processDataDeletionRequest(requestId: string) {
    return this.lgpdService.processDataDeletionRequest(requestId);
  }

  async exportUserData(userId: string) {
    await this.auditService.log('DATA_EXPORT_REQUESTED', 'user', userId, userId);
    return this.lgpdService.exportUserData(userId);
  }

  async getRequiredConsents() {
    return this.lgpdService.getRequiredConsents();
  }

  // ==================== AUDIT ====================

  async logAction(action: string, entity: string, entityId?: string, userId?: string, oldData?: any, newData?: any, ipAddress?: string, userAgent?: string) {
    return this.auditService.log(action, entity, entityId, userId, oldData, newData, ipAddress, userAgent);
  }

  async getAuditLogs(options?: any) {
    return this.auditService.getAuditLogs(options);
  }

  async getUserActivityLog(userId: string, limit?: number) {
    return this.auditService.getUserActivityLog(userId, limit);
  }

  async getEntityHistory(entity: string, entityId: string) {
    return this.auditService.getEntityHistory(entity, entityId);
  }

  async logSecurityEvent(eventType: string, severity: string, description: string, userId?: string, ipAddress?: string, userAgent?: string, deviceId?: string, metadata?: any) {
    return this.auditService.logSecurityEvent(eventType, severity, description, userId, ipAddress, userAgent, deviceId, metadata);
  }

  async getSecurityEvents(limit?: number) {
    return this.auditService.getSecurityEvents(limit);
  }

  async getAuditStats(days?: number) {
    return this.auditService.getAuditStats(days);
  }

  // ==================== DATA RETENTION ====================

  async getRetentionPolicies() {
    return this.dataRetentionService.getPolicies();
  }

  async updateRetentionPolicy(entityType: string, retentionDays: number) {
    return this.dataRetentionService.updatePolicy(entityType, retentionDays);
  }

  async executeRetentionPolicies() {
    return this.dataRetentionService.executeRetentionPolicies();
  }

  async getRetentionStats() {
    return this.dataRetentionService.getRetentionStats();
  }

  async seedRetentionPolicies() {
    return this.dataRetentionService.seedDefaultPolicies();
  }

  // ==================== IMMUTABLE LOGS ====================

  async logFinancialEvent(userId: string, eventType: string, eventData: any, amount?: number, balanceBefore?: number, balanceAfter?: number) {
    return this.immutableLogService.logFinancialEvent(userId, eventType, eventData, amount, balanceBefore, balanceAfter);
  }

  async verifyChainIntegrity(userId: string) {
    return this.immutableLogService.verifyChainIntegrity(userId);
  }

  async getUserFinancialHistory(userId: string, options?: any) {
    return this.immutableLogService.getUserFinancialHistory(userId, options);
  }

  async exportAuditTrail(userId: string, startDate: Date, endDate: Date) {
    return this.immutableLogService.exportAuditTrail(userId, startDate, endDate);
  }

  // ==================== DASHBOARD ====================

  async getComplianceDashboard(userId: string) {
    const [consents, deletionRequests, activityLog, financialHistory] = await Promise.all([
      this.lgpdService.getUserConsents(userId),
      this.lgpdService.getUserDeletionRequests(userId),
      this.auditService.getUserActivityLog(userId, 10),
      this.immutableLogService.getUserFinancialHistory(userId, { limit: 10 }),
    ]);

    return {
      consents: {
        total: consents.length,
        granted: consents.filter((c: any) => c.isGranted).length,
        list: consents,
      },
      deletionRequests: {
        total: deletionRequests.length,
        pending: deletionRequests.filter((r: any) => r.status === 'pending').length,
        list: deletionRequests,
      },
      recentActivity: activityLog,
      financialHistory: financialHistory,
    };
  }
}
