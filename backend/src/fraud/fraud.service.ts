import { Injectable, Logger } from '@nestjs/common';
import { FraudEngineService, TransactionContext, FraudCheckResult } from './services/fraud-engine.service';
import { RiskProfileService } from './services/risk-profile.service';
import { DeviceService } from './services/device.service';
import { AlertService } from './services/alert.service';

@Injectable()
export class FraudService {
  private readonly logger = new Logger(FraudService.name);

  constructor(
    private readonly fraudEngine: FraudEngineService,
    private readonly riskProfile: RiskProfileService,
    private readonly deviceService: DeviceService,
    private readonly alertService: AlertService,
  ) {}

  async analyzeTransaction(context: TransactionContext): Promise<FraudCheckResult> {
    const result = await this.fraudEngine.analyzeTransaction(context);

    // Create alert if score is significant
    if (result.score >= 40) {
      await this.alertService.createAlert(
        context.userId,
        null,
        context.type,
        result.score,
        result.triggeredRules,
        { amount: context.amount, flags: result.flags },
      );

      // Increment flag count
      await this.riskProfile.incrementFlagCount(context.userId);
    }

    // Update risk profile
    if (result.allowed) {
      await this.fraudEngine.updateRiskProfile(context.userId, context.amount);
      
      // Increment device trust on successful transaction
      if (context.deviceFingerprint) {
        await this.deviceService.incrementDeviceTrust(context.userId, context.deviceFingerprint);
      }
    }

    return result;
  }

  // ==================== RISK PROFILE ====================

  async getUserRiskScore(userId: string) {
    return this.riskProfile.getUserRiskScore(userId);
  }

  async getUserRiskProfile(userId: string) {
    return this.riskProfile.getOrCreateProfile(userId);
  }

  async blockUser(userId: string, reason: string) {
    return this.riskProfile.blockUser(userId, reason);
  }

  async unblockUser(userId: string) {
    return this.riskProfile.unblockUser(userId);
  }

  // ==================== DEVICES ====================

  async registerDevice(userId: string, fingerprint: string, metadata: any) {
    return this.deviceService.registerDevice(userId, fingerprint, metadata);
  }

  async getUserDevices(userId: string) {
    return this.deviceService.getUserDevices(userId);
  }

  async deactivateDevice(deviceId: string, userId: string) {
    return this.deviceService.deactivateDevice(deviceId, userId);
  }

  async setDeviceTrust(deviceId: string, trustLevel: any) {
    return this.deviceService.setDeviceTrust(deviceId, trustLevel);
  }

  // ==================== ALERTS ====================

  async getUserAlerts(userId: string, options?: any) {
    return this.alertService.getUserAlerts(userId, options);
  }

  async getAlertById(alertId: string) {
    return this.alertService.getAlertById(alertId);
  }

  async updateAlertStatus(alertId: string, status: any, reviewedBy: string, resolution?: string) {
    return this.alertService.updateAlertStatus(alertId, status, reviewedBy, resolution);
  }

  async getPendingAlerts(limit?: number) {
    return this.alertService.getPendingAlerts(limit);
  }

  async getCriticalAlerts() {
    return this.alertService.getCriticalAlerts();
  }

  async getAlertStats(days?: number) {
    return this.alertService.getAlertStats(days);
  }

  // ==================== ADMIN ====================

  async getHighRiskUsers(threshold?: number) {
    return this.riskProfile.getHighRiskUsers(threshold);
  }

  async getBlockedUsers() {
    return this.riskProfile.getBlockedUsers();
  }

  async seedDefaultRules() {
    return this.fraudEngine.seedDefaultRules();
  }

  // ==================== DASHBOARD ====================

  async getFraudDashboard(userId: string) {
    const [riskProfile, alerts, devices] = await Promise.all([
      this.riskProfile.getOrCreateProfile(userId),
      this.alertService.getUserAlerts(userId, { limit: 5 }),
      this.deviceService.getUserDevices(userId),
    ]);

    return {
      riskScore: Number(riskProfile.riskScore),
      isBlocked: riskProfile.isBlocked,
      flagCount: riskProfile.flagCount,
      lastFlagAt: riskProfile.lastFlagAt,
      recentAlerts: alerts,
      devices: {
        total: devices.length,
        trusted: devices.filter((d: any) => ['HIGH', 'TRUSTED'].includes(d.trustLevel)).length,
        list: devices.slice(0, 5),
      },
    };
  }
}
