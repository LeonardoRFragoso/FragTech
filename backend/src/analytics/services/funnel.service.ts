import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EVENTS } from './event-tracking.service';

export interface FunnelStep {
  name: string;
  eventName: string;
  count: number;
  conversionRate: number;
  dropoffRate: number;
}

@Injectable()
export class FunnelService {
  constructor(private readonly prisma: PrismaService) {}

  async getAcquisitionFunnel(days: number = 30): Promise<FunnelStep[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const steps = [
      { name: 'Visitou Landing', eventName: 'page_view' },
      { name: 'Iniciou Cadastro', eventName: EVENTS.SIGNUP_STARTED },
      { name: 'Completou Cadastro', eventName: EVENTS.SIGNUP_COMPLETED },
      { name: 'Primeiro Login', eventName: EVENTS.FIRST_LOGIN },
      { name: 'Completou Onboarding', eventName: EVENTS.ONBOARDING_COMPLETED },
    ];

    const counts = await Promise.all(
      steps.map(step =>
        this.prisma.analyticsEvent.groupBy({
          by: ['userId'],
          where: { eventName: step.eventName, createdAt: { gte: since } },
        }).then(r => r.length)
      )
    );

    return steps.map((step, i) => ({
      name: step.name,
      eventName: step.eventName,
      count: counts[i],
      conversionRate: i === 0 ? 100 : counts[i - 1] > 0 ? (counts[i] / counts[i - 1]) * 100 : 0,
      dropoffRate: i === 0 ? 0 : counts[i - 1] > 0 ? ((counts[i - 1] - counts[i]) / counts[i - 1]) * 100 : 0,
    }));
  }

  async getActivationFunnel(days: number = 30): Promise<FunnelStep[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const steps = [
      { name: 'Cadastro Completo', eventName: EVENTS.SIGNUP_COMPLETED },
      { name: 'Primeira Transação', eventName: EVENTS.FIRST_TRANSACTION },
      { name: 'Primeira Interação IA', eventName: EVENTS.FIRST_AI_INTERACTION },
      { name: 'Meta Criada', eventName: EVENTS.GOAL_CREATED },
    ];

    const counts = await Promise.all(
      steps.map(step =>
        this.prisma.analyticsEvent.groupBy({
          by: ['userId'],
          where: { eventName: step.eventName, createdAt: { gte: since } },
        }).then(r => r.length)
      )
    );

    return steps.map((step, i) => ({
      name: step.name,
      eventName: step.eventName,
      count: counts[i],
      conversionRate: i === 0 ? 100 : counts[0] > 0 ? (counts[i] / counts[0]) * 100 : 0,
      dropoffRate: i === 0 ? 0 : counts[i - 1] > 0 ? ((counts[i - 1] - counts[i]) / counts[i - 1]) * 100 : 0,
    }));
  }

  async getMonetizationFunnel(days: number = 30): Promise<FunnelStep[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const steps = [
      { name: 'Usuários Ativos', eventName: EVENTS.LOGIN },
      { name: 'Viu Pricing', eventName: EVENTS.PRICING_PAGE_VIEW },
      { name: 'Selecionou Plano', eventName: EVENTS.PLAN_SELECTED },
      { name: 'Iniciou Checkout', eventName: EVENTS.CHECKOUT_STARTED },
      { name: 'Pagamento Completo', eventName: EVENTS.PAYMENT_COMPLETED },
    ];

    const counts = await Promise.all(
      steps.map(step =>
        this.prisma.analyticsEvent.groupBy({
          by: ['userId'],
          where: { eventName: step.eventName, createdAt: { gte: since } },
        }).then(r => r.length)
      )
    );

    return steps.map((step, i) => ({
      name: step.name,
      eventName: step.eventName,
      count: counts[i],
      conversionRate: i === 0 ? 100 : counts[0] > 0 ? (counts[i] / counts[0]) * 100 : 0,
      dropoffRate: i === 0 ? 0 : counts[i - 1] > 0 ? ((counts[i - 1] - counts[i]) / counts[i - 1]) * 100 : 0,
    }));
  }

  async getConversionRate(fromEvent: string, toEvent: string, days: number = 30): Promise<number> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [fromCount, toCount] = await Promise.all([
      this.prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: { eventName: fromEvent, createdAt: { gte: since } },
      }).then(r => r.length),
      this.prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: { eventName: toEvent, createdAt: { gte: since } },
      }).then(r => r.length),
    ]);

    return fromCount > 0 ? (toCount / fromCount) * 100 : 0;
  }
}
