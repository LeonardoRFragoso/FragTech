import { Injectable, Logger } from '@nestjs/common';

export interface Alert {
  id: string;
  type: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  title: string;
  message: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

@Injectable()
export class AlertingService {
  private readonly logger = new Logger(AlertingService.name);
  private alerts: Alert[] = [];
  private webhooks: string[] = [];

  async createAlert(
    type: string,
    severity: Alert['severity'],
    title: string,
    message: string,
    metadata?: Record<string, any>,
  ): Promise<Alert> {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      type,
      severity,
      title,
      message,
      metadata,
      createdAt: new Date(),
      acknowledged: false,
    };

    this.alerts.push(alert);

    // Keep only last 1000 alerts in memory
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    this.logger.warn(`Alert [${severity}]: ${title} - ${message}`);

    // Send to webhooks
    await this.notifyWebhooks(alert);

    // Send critical alerts immediately
    if (severity === 'CRITICAL') {
      await this.sendCriticalNotification(alert);
    }

    return alert;
  }

  // Pre-defined alert types
  async alertHighFraudScore(userId: string, score: number) {
    return this.createAlert(
      'FRAUD_HIGH_SCORE',
      score >= 80 ? 'CRITICAL' : 'WARNING',
      'Alto Score de Fraude Detectado',
      `Usuário ${userId} com score de fraude ${score}`,
      { userId, score },
    );
  }

  async alertTransactionFailed(transactionId: string, reason: string) {
    return this.createAlert(
      'TRANSACTION_FAILED',
      'ERROR',
      'Transação Falhou',
      `Transação ${transactionId} falhou: ${reason}`,
      { transactionId, reason },
    );
  }

  async alertRateLimitExceeded(key: string, endpoint: string) {
    return this.createAlert(
      'RATE_LIMIT_EXCEEDED',
      'WARNING',
      'Rate Limit Excedido',
      `Rate limit excedido para ${key} em ${endpoint}`,
      { key, endpoint },
    );
  }

  async alertSystemHealth(component: string, status: string, details: string) {
    return this.createAlert(
      'SYSTEM_HEALTH',
      status === 'unhealthy' ? 'CRITICAL' : 'WARNING',
      'Alerta de Saúde do Sistema',
      `${component}: ${details}`,
      { component, status, details },
    );
  }

  async alertSecurityBreach(description: string, userId?: string) {
    return this.createAlert(
      'SECURITY_BREACH',
      'CRITICAL',
      'Possível Violação de Segurança',
      description,
      { userId },
    );
  }

  getAlerts(options?: {
    severity?: Alert['severity'];
    type?: string;
    unacknowledgedOnly?: boolean;
    limit?: number;
  }): Alert[] {
    let filtered = [...this.alerts];

    if (options?.severity) {
      filtered = filtered.filter(a => a.severity === options.severity);
    }
    if (options?.type) {
      filtered = filtered.filter(a => a.type === options.type);
    }
    if (options?.unacknowledgedOnly) {
      filtered = filtered.filter(a => !a.acknowledged);
    }

    return filtered.slice(-(options?.limit || 100)).reverse();
  }

  acknowledgeAlert(alertId: string, acknowledgedBy: string): Alert | null {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date();
      alert.acknowledgedBy = acknowledgedBy;
    }
    return alert || null;
  }

  registerWebhook(url: string) {
    if (!this.webhooks.includes(url)) {
      this.webhooks.push(url);
    }
  }

  removeWebhook(url: string) {
    this.webhooks = this.webhooks.filter(w => w !== url);
  }

  private async notifyWebhooks(alert: Alert) {
    for (const webhook of this.webhooks) {
      try {
        // In production, use proper HTTP client
        this.logger.debug(`Would send alert to webhook: ${webhook}`);
      } catch (error) {
        this.logger.error(`Failed to notify webhook ${webhook}: ${error}`);
      }
    }
  }

  private async sendCriticalNotification(alert: Alert) {
    // In production, integrate with:
    // - Slack/Discord webhooks
    // - PagerDuty
    // - Email alerts
    // - SMS via Twilio
    this.logger.error(`CRITICAL ALERT: ${alert.title} - ${alert.message}`);
  }
}
