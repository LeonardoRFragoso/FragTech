import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createHmac, randomBytes } from 'crypto';

@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);

  constructor(private readonly prisma: PrismaService) {}

  async setupMfa(userId: string, method: string = 'totp') {
    const secret = this.generateSecret();
    const backupCodes = this.generateBackupCodes();

    await this.prisma.mfaConfig.upsert({
      where: { userId },
      create: {
        userId,
        method,
        secret,
        backupCodes: backupCodes.map(code => ({ code, used: false })),
        isEnabled: false,
      },
      update: {
        method,
        secret,
        backupCodes: backupCodes.map(code => ({ code, used: false })),
        isEnabled: false,
      },
    });

    // Generate QR code URL for authenticator apps
    const otpAuthUrl = this.generateOtpAuthUrl(userId, secret);

    this.logger.log(`MFA setup initiated for user ${userId}`);

    return {
      secret,
      otpAuthUrl,
      backupCodes,
      message: 'Escaneie o QR code com seu app autenticador e confirme com um código',
    };
  }

  async verifyAndEnableMfa(userId: string, code: string) {
    const config = await this.prisma.mfaConfig.findUnique({
      where: { userId },
    });

    if (!config || !config.secret) {
      throw new BadRequestException('MFA não configurado. Inicie a configuração primeiro.');
    }

    const isValid = this.verifyTotp(config.secret, code);

    if (!isValid) {
      throw new BadRequestException('Código inválido. Tente novamente.');
    }

    await this.prisma.mfaConfig.update({
      where: { userId },
      data: { isEnabled: true },
    });

    this.logger.log(`MFA enabled for user ${userId}`);

    return { message: 'MFA ativado com sucesso' };
  }

  async verifyMfaCode(userId: string, code: string): Promise<boolean> {
    const config = await this.prisma.mfaConfig.findUnique({
      where: { userId },
    });

    if (!config || !config.isEnabled) {
      return true; // MFA not enabled, allow through
    }

    // Check if it's a backup code
    const backupCodes = config.backupCodes as any[];
    const backupCodeIndex = backupCodes.findIndex(
      bc => bc.code === code && !bc.used
    );

    if (backupCodeIndex !== -1) {
      // Mark backup code as used
      backupCodes[backupCodeIndex].used = true;
      await this.prisma.mfaConfig.update({
        where: { userId },
        data: { backupCodes },
      });
      this.logger.log(`Backup code used for user ${userId}`);
      return true;
    }

    // Verify TOTP
    const isValid = this.verifyTotp(config.secret!, code);

    if (isValid) {
      await this.prisma.mfaConfig.update({
        where: { userId },
        data: { lastUsedAt: new Date() },
      });
    }

    return isValid;
  }

  async disableMfa(userId: string, code: string) {
    const isValid = await this.verifyMfaCode(userId, code);

    if (!isValid) {
      throw new BadRequestException('Código inválido');
    }

    await this.prisma.mfaConfig.update({
      where: { userId },
      data: {
        isEnabled: false,
        secret: null,
        backupCodes: [],
      },
    });

    this.logger.log(`MFA disabled for user ${userId}`);

    return { message: 'MFA desativado com sucesso' };
  }

  async getMfaStatus(userId: string) {
    const config = await this.prisma.mfaConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      return { isEnabled: false, method: null };
    }

    const backupCodes = config.backupCodes as any[] || [];
    const unusedBackupCodes = backupCodes.filter(bc => !bc.used).length;

    return {
      isEnabled: config.isEnabled,
      method: config.method,
      lastUsedAt: config.lastUsedAt,
      unusedBackupCodes,
    };
  }

  async regenerateBackupCodes(userId: string, code: string) {
    const isValid = await this.verifyMfaCode(userId, code);

    if (!isValid) {
      throw new BadRequestException('Código inválido');
    }

    const backupCodes = this.generateBackupCodes();

    await this.prisma.mfaConfig.update({
      where: { userId },
      data: {
        backupCodes: backupCodes.map(code => ({ code, used: false })),
      },
    });

    return { backupCodes };
  }

  private generateSecret(): string {
    return randomBytes(20).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  private generateOtpAuthUrl(userId: string, secret: string): string {
    const issuer = 'FragTech';
    return `otpauth://totp/${issuer}:${userId}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
  }

  private verifyTotp(secret: string, code: string): boolean {
    // Simple TOTP verification (in production, use a proper library like speakeasy)
    const timeStep = 30;
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Check current and adjacent time windows
    for (let i = -1; i <= 1; i++) {
      const time = Math.floor((currentTime + i * timeStep) / timeStep);
      const expectedCode = this.generateTotp(secret, time);
      if (expectedCode === code) {
        return true;
      }
    }
    
    return false;
  }

  private generateTotp(secret: string, time: number): string {
    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(BigInt(time));
    
    const hmac = createHmac('sha1', Buffer.from(secret, 'base64'));
    hmac.update(buffer);
    const hash = hmac.digest();
    
    const offset = hash[hash.length - 1] & 0x0f;
    const code = (
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff)
    ) % 1000000;
    
    return code.toString().padStart(6, '0');
  }
}
