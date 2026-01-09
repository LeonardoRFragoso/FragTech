import { Injectable, Logger } from '@nestjs/common';
import { MfaService } from './services/mfa.service';
import { RateLimitService } from './services/rate-limit.service';
import { EncryptionService } from './services/encryption.service';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(
    private readonly mfaService: MfaService,
    private readonly rateLimitService: RateLimitService,
    private readonly encryptionService: EncryptionService,
  ) {}

  // ==================== MFA ====================

  async setupMfa(userId: string, method?: string) {
    return this.mfaService.setupMfa(userId, method);
  }

  async verifyAndEnableMfa(userId: string, code: string) {
    return this.mfaService.verifyAndEnableMfa(userId, code);
  }

  async verifyMfaCode(userId: string, code: string) {
    return this.mfaService.verifyMfaCode(userId, code);
  }

  async disableMfa(userId: string, code: string) {
    return this.mfaService.disableMfa(userId, code);
  }

  async getMfaStatus(userId: string) {
    return this.mfaService.getMfaStatus(userId);
  }

  async regenerateBackupCodes(userId: string, code: string) {
    return this.mfaService.regenerateBackupCodes(userId, code);
  }

  // ==================== RATE LIMITING ====================

  async checkRateLimit(key: string, endpoint: string) {
    return this.rateLimitService.checkRateLimit(key, endpoint);
  }

  async resetRateLimit(key: string, endpoint?: string) {
    return this.rateLimitService.resetRateLimit(key, endpoint);
  }

  async getBlockedKeys() {
    return this.rateLimitService.getBlockedKeys();
  }

  async unblockKey(key: string) {
    return this.rateLimitService.unblockKey(key);
  }

  async getRateLimitStats(endpoint?: string) {
    return this.rateLimitService.getRateLimitStats(endpoint);
  }

  // ==================== ENCRYPTION ====================

  async encrypt(data: string) {
    return this.encryptionService.encrypt(data);
  }

  async decrypt(data: string) {
    return this.encryptionService.decrypt(data);
  }

  maskSensitiveData(data: any, type: 'cpf' | 'email' | 'phone' | 'card' | 'account') {
    switch (type) {
      case 'cpf':
        return this.encryptionService.maskCpf(data);
      case 'email':
        return this.encryptionService.maskEmail(data);
      case 'phone':
        return this.encryptionService.maskPhone(data);
      case 'card':
        return this.encryptionService.maskCardNumber(data);
      case 'account':
        return this.encryptionService.maskAccountNumber(data);
      default:
        return '***';
    }
  }

  generateSecureToken(length?: number) {
    return this.encryptionService.generateSecureToken(length);
  }

  generateApiKey() {
    return this.encryptionService.generateApiKey();
  }

  // ==================== DASHBOARD ====================

  async getSecurityDashboard(userId: string) {
    const [mfaStatus, rateLimitStats] = await Promise.all([
      this.mfaService.getMfaStatus(userId),
      this.rateLimitService.getRateLimitStats(),
    ]);

    return {
      mfa: mfaStatus,
      rateLimit: rateLimitStats,
      recommendations: this.getSecurityRecommendations(mfaStatus),
    };
  }

  private getSecurityRecommendations(mfaStatus: any): string[] {
    const recommendations: string[] = [];

    if (!mfaStatus.isEnabled) {
      recommendations.push('Ative a autenticação em dois fatores (MFA) para maior segurança');
    }

    if (mfaStatus.unusedBackupCodes !== undefined && mfaStatus.unusedBackupCodes < 3) {
      recommendations.push('Gere novos códigos de backup - você tem poucos restantes');
    }

    return recommendations;
  }
}
