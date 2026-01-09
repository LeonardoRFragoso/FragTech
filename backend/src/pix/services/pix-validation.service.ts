import { Injectable, BadRequestException } from '@nestjs/common';
import { PixKeyType } from '../dto/create-pix-key.dto';

@Injectable()
export class PixValidationService {
  validateCpf(cpf: string): boolean {
    const cleanCpf = cpf.replace(/\D/g, '');
    
    if (cleanCpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cleanCpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf[i]) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf[i]) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf[10])) return false;

    return true;
  }

  validateCnpj(cnpj: string): boolean {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    
    if (cleanCnpj.length !== 14) return false;
    if (/^(\d)\1+$/.test(cleanCnpj)) return false;

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCnpj[i]) * weights1[i];
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (digit1 !== parseInt(cleanCnpj[12])) return false;

    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCnpj[i]) * weights2[i];
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    if (digit2 !== parseInt(cleanCnpj[13])) return false;

    return true;
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePhone(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '');
    // Brazilian phone: +55 + DDD (2 digits) + number (8-9 digits)
    return cleanPhone.length >= 10 && cleanPhone.length <= 13;
  }

  formatPhone(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('55')) {
      return `+55${cleanPhone}`;
    }
    return `+${cleanPhone}`;
  }

  formatCpf(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }

  formatCnpj(cnpj: string): string {
    return cnpj.replace(/\D/g, '');
  }

  validatePixKey(type: PixKeyType, key: string): { isValid: boolean; formattedKey: string; error?: string } {
    switch (type) {
      case PixKeyType.CPF:
        if (!this.validateCpf(key)) {
          return { isValid: false, formattedKey: key, error: 'CPF inválido' };
        }
        return { isValid: true, formattedKey: this.formatCpf(key) };

      case PixKeyType.CNPJ:
        if (!this.validateCnpj(key)) {
          return { isValid: false, formattedKey: key, error: 'CNPJ inválido' };
        }
        return { isValid: true, formattedKey: this.formatCnpj(key) };

      case PixKeyType.EMAIL:
        if (!this.validateEmail(key)) {
          return { isValid: false, formattedKey: key, error: 'Email inválido' };
        }
        return { isValid: true, formattedKey: key.toLowerCase() };

      case PixKeyType.PHONE:
        if (!this.validatePhone(key)) {
          return { isValid: false, formattedKey: key, error: 'Telefone inválido' };
        }
        return { isValid: true, formattedKey: this.formatPhone(key) };

      case PixKeyType.RANDOM:
        return { isValid: true, formattedKey: key };

      default:
        return { isValid: false, formattedKey: key, error: 'Tipo de chave inválido' };
    }
  }

  generateRandomKey(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    return `${result.slice(0, 8)}-${result.slice(8, 12)}-${result.slice(12, 16)}-${result.slice(16, 20)}-${result.slice(20, 32)}`;
  }

  validateTransactionAmount(amount: number, limits: {
    perTransaction: number;
    daily: number;
    nightly: number;
    usedToday: number;
  }, isNightTime: boolean): { isValid: boolean; error?: string } {
    if (amount <= 0) {
      return { isValid: false, error: 'Valor deve ser maior que zero' };
    }

    if (amount > limits.perTransaction) {
      return { isValid: false, error: `Valor excede o limite por transação de R$ ${limits.perTransaction.toFixed(2)}` };
    }

    const currentLimit = isNightTime ? limits.nightly : limits.daily;
    const remainingLimit = currentLimit - limits.usedToday;

    if (amount > remainingLimit) {
      return { 
        isValid: false, 
        error: `Valor excede o limite ${isNightTime ? 'noturno' : 'diário'} disponível de R$ ${remainingLimit.toFixed(2)}` 
      };
    }

    return { isValid: true };
  }

  isNightTime(): boolean {
    const now = new Date();
    const hour = now.getHours();
    // Night time: 20:00 to 06:00
    return hour >= 20 || hour < 6;
  }

  maskPixKey(type: PixKeyType, key: string): string {
    switch (type) {
      case PixKeyType.CPF:
        return `***.***.${key.slice(-5, -2)}-**`;
      case PixKeyType.CNPJ:
        return `**.***.***/${key.slice(-6, -2)}-**`;
      case PixKeyType.EMAIL:
        const [local, domain] = key.split('@');
        return `${local.slice(0, 2)}***@${domain}`;
      case PixKeyType.PHONE:
        return `+55 ** *****-${key.slice(-4)}`;
      case PixKeyType.RANDOM:
        return `${key.slice(0, 8)}...${key.slice(-4)}`;
      default:
        return '***';
    }
  }
}
