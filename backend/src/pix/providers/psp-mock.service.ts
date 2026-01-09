import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface PspTransferRequest {
  senderKey: string;
  receiverKey: string;
  amount: number;
  description?: string;
  e2eId?: string;
}

export interface PspTransferResponse {
  success: boolean;
  transactionId: string;
  e2eId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  processedAt?: Date;
  failureReason?: string;
}

export interface PspKeyLookupResponse {
  found: boolean;
  key?: string;
  keyType?: string;
  ownerName?: string;
  ownerDocument?: string;
  bankName?: string;
  bankCode?: string;
}

export interface PspQrCodeResponse {
  payload: string;
  txId: string;
  expiresAt: Date;
}

/**
 * Mock PSP (Payment Service Provider) Service
 * 
 * This service simulates integration with a real PSP/bank partner.
 * In production, this would be replaced with actual API calls to:
 * - Banco Central DICT (Diretório de Identificadores de Contas Transacionais)
 * - Partner bank's PIX API
 * - Or a PIX aggregator service
 */
@Injectable()
export class PspMockService {
  private readonly logger = new Logger(PspMockService.name);

  // Simulated external keys database (in production, this would be DICT lookup)
  private readonly mockExternalKeys = new Map<string, {
    ownerName: string;
    ownerDocument: string;
    bankName: string;
    bankCode: string;
  }>([
    ['12345678901', { ownerName: 'João Silva', ownerDocument: '***456***', bankName: 'Banco Mock', bankCode: '001' }],
    ['teste@email.com', { ownerName: 'Maria Santos', ownerDocument: '***789***', bankName: 'Nubank', bankCode: '260' }],
    ['+5511999998888', { ownerName: 'Pedro Oliveira', ownerDocument: '***123***', bankName: 'Itaú', bankCode: '341' }],
  ]);

  /**
   * Simulate PIX transfer execution via PSP
   */
  async executeTransfer(request: PspTransferRequest): Promise<PspTransferResponse> {
    this.logger.log(`[MOCK PSP] Executing transfer: ${JSON.stringify(request)}`);

    // Simulate network latency
    await this.simulateLatency(500, 2000);

    // Simulate occasional failures (5% failure rate in sandbox)
    const shouldFail = Math.random() < 0.05;
    
    if (shouldFail) {
      const failureReasons = [
        'Chave PIX não encontrada no DICT',
        'Conta destino bloqueada',
        'Limite excedido na instituição destino',
        'Timeout na comunicação com o BACEN',
        'Transação rejeitada pela instituição recebedora',
      ];
      
      return {
        success: false,
        transactionId: uuidv4(),
        e2eId: request.e2eId || this.generateE2eId(),
        status: 'FAILED',
        failureReason: failureReasons[Math.floor(Math.random() * failureReasons.length)],
      };
    }

    // Successful transfer
    return {
      success: true,
      transactionId: uuidv4(),
      e2eId: request.e2eId || this.generateE2eId(),
      status: 'COMPLETED',
      processedAt: new Date(),
    };
  }

  /**
   * Lookup PIX key in DICT (mock)
   */
  async lookupKey(key: string): Promise<PspKeyLookupResponse> {
    this.logger.log(`[MOCK PSP] Looking up key: ${key}`);

    await this.simulateLatency(200, 500);

    const externalData = this.mockExternalKeys.get(key);
    
    if (externalData) {
      return {
        found: true,
        key,
        keyType: this.detectKeyType(key),
        ...externalData,
      };
    }

    // Key not found in mock database - could be internal or truly not found
    return {
      found: false,
    };
  }

  /**
   * Generate static QR Code
   */
  async generateStaticQrCode(
    receiverKey: string,
    amount?: number,
    description?: string,
  ): Promise<PspQrCodeResponse> {
    this.logger.log(`[MOCK PSP] Generating static QR Code for key: ${receiverKey}`);

    await this.simulateLatency(100, 300);

    const txId = this.generateTxId();
    const payload = this.generateEmvPayload(receiverKey, amount, description, txId);

    return {
      payload,
      txId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  }

  /**
   * Generate dynamic QR Code
   */
  async generateDynamicQrCode(
    receiverKey: string,
    amount: number,
    description?: string,
    expirationMinutes: number = 30,
  ): Promise<PspQrCodeResponse> {
    this.logger.log(`[MOCK PSP] Generating dynamic QR Code for key: ${receiverKey}, amount: ${amount}`);

    await this.simulateLatency(100, 300);

    const txId = this.generateTxId();
    const payload = this.generateEmvPayload(receiverKey, amount, description, txId);

    return {
      payload,
      txId,
      expiresAt: new Date(Date.now() + expirationMinutes * 60 * 1000),
    };
  }

  /**
   * Parse QR Code payload (mock implementation)
   */
  parseQrCodePayload(payload: string): {
    receiverKey?: string;
    amount?: number;
    description?: string;
    txId?: string;
  } {
    // In production, this would parse the EMV format
    // For mock, we'll return simulated data
    this.logger.log(`[MOCK PSP] Parsing QR Code payload`);

    return {
      receiverKey: '12345678901',
      amount: 100.00,
      description: 'Pagamento via QR Code',
      txId: this.generateTxId(),
    };
  }

  /**
   * Simulate webhook delivery from PSP
   */
  async simulateWebhook(
    transactionId: string,
    eventType: 'pix.received' | 'pix.sent' | 'pix.failed' | 'pix.refunded',
    data: any,
  ): Promise<void> {
    this.logger.log(`[MOCK PSP] Simulating webhook: ${eventType} for transaction ${transactionId}`);

    // In production, webhooks would come from the PSP
    // Here we're simulating them for testing
  }

  /**
   * Generate E2E ID (End-to-End Identifier)
   * Format: E + ISPB (8 digits) + DateTime (14 digits) + Sequential (11 chars)
   */
  private generateE2eId(): string {
    const ispb = '12345678'; // FragTech's mock ISPB
    const now = new Date();
    const dateTime = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    const sequential = uuidv4().replace(/-/g, '').slice(0, 11).toUpperCase();
    
    return `E${ispb}${dateTime}${sequential}`;
  }

  /**
   * Generate Transaction ID
   */
  private generateTxId(): string {
    return uuidv4().replace(/-/g, '').slice(0, 25);
  }

  /**
   * Generate EMV QR Code payload (simplified mock)
   */
  private generateEmvPayload(
    receiverKey: string,
    amount?: number,
    description?: string,
    txId?: string,
  ): string {
    // In production, this would follow the EMV-QRCPS-MPM specification
    // This is a simplified mock representation
    const parts = [
      '00020126', // Payload Format Indicator
      `26${receiverKey.length.toString().padStart(2, '0')}${receiverKey}`, // Merchant Account Info
    ];

    if (amount) {
      const amountStr = amount.toFixed(2);
      parts.push(`54${amountStr.length.toString().padStart(2, '0')}${amountStr}`);
    }

    if (description) {
      parts.push(`62${description.length.toString().padStart(2, '0')}${description}`);
    }

    if (txId) {
      parts.push(`05${txId.length.toString().padStart(2, '0')}${txId}`);
    }

    parts.push('6304'); // CRC placeholder

    return parts.join('');
  }

  /**
   * Detect key type from key value
   */
  private detectKeyType(key: string): string {
    if (/^\d{11}$/.test(key)) return 'CPF';
    if (/^\d{14}$/.test(key)) return 'CNPJ';
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) return 'EMAIL';
    if (/^\+?\d{10,13}$/.test(key.replace(/\D/g, ''))) return 'PHONE';
    return 'RANDOM';
  }

  /**
   * Simulate network latency
   */
  private simulateLatency(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}
