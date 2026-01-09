import { Injectable, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly authTagLength = 16;

  private getEncryptionKey(): string {
    return process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
  }

  async encrypt(plainText: string): Promise<string> {
    try {
      const key = (await scryptAsync(this.getEncryptionKey(), 'salt', this.keyLength)) as Buffer;
      const iv = randomBytes(this.ivLength);
      
      const cipher = createCipheriv(this.algorithm, key, iv);
      
      let encrypted = cipher.update(plainText, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Combine iv + authTag + encrypted data
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      this.logger.error(`Encryption failed: ${error.message}`);
      throw new Error('Encryption failed');
    }
  }

  async decrypt(encryptedText: string): Promise<string> {
    try {
      const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
      
      if (!ivHex || !authTagHex || !encrypted) {
        throw new Error('Invalid encrypted format');
      }
      
      const key = (await scryptAsync(this.getEncryptionKey(), 'salt', this.keyLength)) as Buffer;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      const decipher = createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.logger.error(`Decryption failed: ${error.message}`);
      throw new Error('Decryption failed');
    }
  }

  hashSensitiveData(data: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  maskCpf(cpf: string): string {
    if (!cpf || cpf.length !== 11) return '***';
    return `***.***.${cpf.slice(6, 9)}-**`;
  }

  maskEmail(email: string): string {
    if (!email) return '***';
    const [local, domain] = email.split('@');
    if (!local || !domain) return '***';
    return `${local.slice(0, 2)}***@${domain}`;
  }

  maskPhone(phone: string): string {
    if (!phone) return '***';
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 8) return '***';
    return `(**) *****-${clean.slice(-4)}`;
  }

  maskCardNumber(cardNumber: string): string {
    if (!cardNumber) return '***';
    const clean = cardNumber.replace(/\D/g, '');
    if (clean.length < 12) return '***';
    return `**** **** **** ${clean.slice(-4)}`;
  }

  maskAccountNumber(accountNumber: string): string {
    if (!accountNumber) return '***';
    if (accountNumber.length < 4) return '***';
    return `****${accountNumber.slice(-4)}`;
  }

  generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  generateApiKey(): string {
    const prefix = 'ft_';
    const key = randomBytes(24).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
    return `${prefix}${key}`;
  }

  async encryptSensitiveField(data: any, fields: string[]): Promise<any> {
    const result = { ...data };
    
    for (const field of fields) {
      if (result[field]) {
        result[field] = await this.encrypt(result[field]);
      }
    }
    
    return result;
  }

  async decryptSensitiveField(data: any, fields: string[]): Promise<any> {
    const result = { ...data };
    
    for (const field of fields) {
      if (result[field]) {
        try {
          result[field] = await this.decrypt(result[field]);
        } catch {
          // Field might not be encrypted
        }
      }
    }
    
    return result;
  }
}
