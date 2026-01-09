import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentGatewayMockService } from '../providers/payment-gateway-mock.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentGateway: PaymentGatewayMockService,
  ) {}

  async createPayment(
    userId: string,
    amount: number,
    paymentMethod: string,
    subscriptionId?: string,
    description?: string,
  ) {
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        subscriptionId,
        amount: new Decimal(amount),
        paymentMethod: paymentMethod as any,
        description,
        status: 'PENDING',
      },
    });

    // Process payment through gateway
    const result = await this.paymentGateway.processPayment({
      paymentId: payment.id,
      amount,
      method: paymentMethod,
      userId,
    });

    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: result.success ? 'COMPLETED' : 'FAILED',
        externalId: result.transactionId,
        paidAt: result.success ? new Date() : null,
        failureReason: result.error,
      },
    });

    this.logger.log(`Payment ${payment.id} processed: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    return updatedPayment;
  }

  async getUserPayments(userId: string, limit: number = 20) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { subscription: { include: { plan: true } } },
    });
  }

  async getPaymentById(paymentId: string) {
    return this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { subscription: { include: { plan: true } } },
    });
  }

  async refundPayment(paymentId: string, reason?: string) {
    const payment = await this.getPaymentById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'COMPLETED') {
      throw new Error('Can only refund completed payments');
    }

    const result = await this.paymentGateway.refundPayment(payment.externalId!);

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
        metadata: { refundReason: reason },
      },
    });

    this.logger.log(`Payment ${paymentId} refunded`);
    return updated;
  }

  async createInvoice(userId: string, subscriptionId: string, amount: number) {
    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 7);

    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    return this.prisma.invoice.create({
      data: {
        userId,
        amount: new Decimal(amount),
        dueDate,
        periodStart: now,
        periodEnd,
        items: [
          { description: 'Assinatura FragTech', amount, quantity: 1 },
        ],
      },
    });
  }

  async getUserInvoices(userId: string) {
    return this.prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRevenueStats(days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        paidAt: { gte: since },
      },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const transactionCount = payments.length;

    const byMethod = payments.reduce((acc, p) => {
      acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + Number(p.amount);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRevenue,
      transactionCount,
      averageTransaction: transactionCount > 0 ? totalRevenue / transactionCount : 0,
      byMethod,
      period: `${days} days`,
    };
  }

  async calculateMRR() {
    const activeSubscriptions = await this.prisma.subscription.findMany({
      where: { status: { in: ['ACTIVE', 'TRIAL'] } },
      include: { plan: true },
    });

    let mrr = 0;
    for (const sub of activeSubscriptions) {
      const isYearly = (sub.metadata as any)?.isYearly;
      const price = isYearly
        ? Number(sub.plan.priceYearly) / 12
        : Number(sub.plan.priceMonthly);
      mrr += price;
    }

    return {
      mrr,
      activeSubscriptions: activeSubscriptions.length,
      arr: mrr * 12,
    };
  }
}
