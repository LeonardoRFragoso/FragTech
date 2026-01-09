import { Injectable, Logger } from '@nestjs/common';
import { PlanService } from './services/plan.service';
import { SubscriptionService } from './services/subscription.service';
import { PaymentService } from './services/payment.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly planService: PlanService,
    private readonly subscriptionService: SubscriptionService,
    private readonly paymentService: PaymentService,
  ) {}

  // ==================== PLANS ====================

  async getPlans() {
    return this.planService.getPublicPlans();
  }

  async getPlanByCode(code: string) {
    return this.planService.getPlanByCode(code);
  }

  async comparePlans(currentCode: string, targetCode: string) {
    return this.planService.comparePlans(currentCode, targetCode);
  }

  // ==================== SUBSCRIPTIONS ====================

  async getUserSubscription(userId: string) {
    return this.subscriptionService.getUserSubscription(userId);
  }

  async subscribe(userId: string, planCode: string, isYearly: boolean = false) {
    const subscription = await this.subscriptionService.createSubscription(userId, planCode, isYearly);
    
    // If not free plan and not trial, create payment
    const plan = await this.planService.getPlanByCode(planCode);
    if (plan && Number(plan.priceMonthly) > 0 && plan.trialDays === 0) {
      const amount = isYearly ? Number(plan.priceYearly) : Number(plan.priceMonthly);
      await this.paymentService.createPayment(userId, amount, 'CREDIT_CARD', subscription.id);
    }

    return subscription;
  }

  async upgradePlan(userId: string, newPlanCode: string, paymentMethod: string = 'CREDIT_CARD') {
    const subscription = await this.subscriptionService.upgradePlan(userId, newPlanCode);
    
    // Calculate prorated amount and charge
    const plan = await this.planService.getPlanByCode(newPlanCode);
    if (plan && Number(plan.priceMonthly) > 0) {
      await this.paymentService.createPayment(
        userId,
        Number(plan.priceMonthly),
        paymentMethod,
        subscription.id,
        `Upgrade para ${plan.name}`,
      );
    }

    return subscription;
  }

  async downgradePlan(userId: string, newPlanCode: string) {
    return this.subscriptionService.downgradePlan(userId, newPlanCode);
  }

  async cancelSubscription(userId: string, reason?: string) {
    return this.subscriptionService.cancelSubscription(userId, reason);
  }

  async reactivateSubscription(userId: string) {
    return this.subscriptionService.reactivateSubscription(userId);
  }

  // ==================== PAYMENTS ====================

  async getUserPayments(userId: string) {
    return this.paymentService.getUserPayments(userId);
  }

  async getUserInvoices(userId: string) {
    return this.paymentService.getUserInvoices(userId);
  }

  async processPayment(userId: string, amount: number, method: string, subscriptionId?: string) {
    return this.paymentService.createPayment(userId, amount, method, subscriptionId);
  }

  // ==================== BILLING DASHBOARD ====================

  async getBillingDashboard(userId: string) {
    const [subscription, payments, invoices] = await Promise.all([
      this.subscriptionService.getUserSubscription(userId),
      this.paymentService.getUserPayments(userId, 5),
      this.paymentService.getUserInvoices(userId),
    ]);

    const plans = await this.planService.getPublicPlans();
    const currentPlan = subscription?.plan;

    return {
      subscription: subscription ? {
        status: subscription.status,
        plan: currentPlan ? {
          code: currentPlan.code,
          name: currentPlan.name,
        } : null,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialEndsAt: subscription.trialEndsAt,
        cancelledAt: subscription.cancelledAt,
      } : null,
      recentPayments: payments.map((p: any) => ({
        id: p.id,
        amount: Number(p.amount),
        status: p.status,
        paidAt: p.paidAt,
        paymentMethod: p.paymentMethod,
      })),
      pendingInvoices: invoices.filter((i: any) => i.status === 'PENDING'),
      availablePlans: plans,
    };
  }

  // ==================== ADMIN STATS ====================

  async getRevenueStats(days?: number) {
    return this.paymentService.getRevenueStats(days);
  }

  async getMRR() {
    return this.paymentService.calculateMRR();
  }

  async getSubscriptionStats() {
    return this.subscriptionService.getSubscriptionStats();
  }
}
