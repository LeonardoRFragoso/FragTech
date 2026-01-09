import { Injectable, Logger } from '@nestjs/common';

export interface PaymentRequest {
  paymentId: string;
  amount: number;
  method: string;
  userId: string;
  cardToken?: string;
  pixKey?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  processingTime: number;
}

@Injectable()
export class PaymentGatewayMockService {
  private readonly logger = new Logger(PaymentGatewayMockService.name);
  private readonly FAILURE_RATE = 0.05; // 5% failure rate for testing

  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    const startTime = Date.now();

    // Simulate processing delay
    await this.simulateDelay(500, 2000);

    // Simulate random failures
    if (Math.random() < this.FAILURE_RATE) {
      return {
        success: false,
        error: this.getRandomError(),
        processingTime: Date.now() - startTime,
      };
    }

    const transactionId = this.generateTransactionId(request.method);

    this.logger.log(`Payment processed: ${transactionId} - R$ ${request.amount}`);

    return {
      success: true,
      transactionId,
      processingTime: Date.now() - startTime,
    };
  }

  async refundPayment(transactionId: string): Promise<PaymentResult> {
    const startTime = Date.now();

    await this.simulateDelay(300, 1000);

    this.logger.log(`Refund processed for transaction: ${transactionId}`);

    return {
      success: true,
      transactionId: `REF_${transactionId}`,
      processingTime: Date.now() - startTime,
    };
  }

  async validateCard(cardToken: string): Promise<{ valid: boolean; lastFour: string; brand: string }> {
    await this.simulateDelay(200, 500);

    return {
      valid: true,
      lastFour: cardToken.slice(-4) || '4242',
      brand: 'Visa',
    };
  }

  async generatePixQRCode(amount: number, description: string): Promise<{
    qrCode: string;
    qrCodeBase64: string;
    expiresAt: Date;
  }> {
    await this.simulateDelay(100, 300);

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    return {
      qrCode: `00020126580014br.gov.bcb.pix0136${this.generateUUID()}5204000053039865802BR5925FRAGTECH PAGAMENTOS LTDA6009SAO PAULO62070503***6304`,
      qrCodeBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      expiresAt,
    };
  }

  async generateBoleto(amount: number, dueDate: Date): Promise<{
    barcode: string;
    digitableLine: string;
    pdfUrl: string;
    dueDate: Date;
  }> {
    await this.simulateDelay(200, 500);

    const barcode = `23793.38128 60000.000003 00000.000400 1 ${this.generateRandomNumber(14)}`;

    return {
      barcode,
      digitableLine: barcode.replace(/\./g, '').replace(/ /g, ''),
      pdfUrl: `https://mock-boleto.fragtech.com/${this.generateUUID()}.pdf`,
      dueDate,
    };
  }

  private async simulateDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  private generateTransactionId(method: string): string {
    const prefix = {
      CREDIT_CARD: 'CC',
      DEBIT_CARD: 'DC',
      PIX: 'PX',
      BOLETO: 'BL',
    }[method] || 'TX';

    return `${prefix}_${Date.now()}_${this.generateRandomNumber(6)}`;
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private generateRandomNumber(length: number): string {
    return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
  }

  private getRandomError(): string {
    const errors = [
      'Cartão recusado pelo emissor',
      'Saldo insuficiente',
      'Transação não autorizada',
      'Cartão expirado',
      'Erro de comunicação com a bandeira',
      'Limite excedido',
    ];
    return errors[Math.floor(Math.random() * errors.length)];
  }
}
