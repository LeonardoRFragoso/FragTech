import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

export interface LogContext {
  userId?: string;
  transactionId?: string;
  requestId?: string;
  action?: string;
  module?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface StructuredLog {
  timestamp: string;
  level: string;
  message: string;
  context: LogContext;
  environment: string;
  service: string;
  version: string;
}

@Injectable()
export class LoggingService implements NestLoggerService {
  private readonly serviceName = 'FragTech';
  private readonly version = process.env.APP_VERSION || '1.0.0';
  private readonly environment = process.env.NODE_ENV || 'development';

  log(message: string, context?: LogContext) {
    this.writeLog('INFO', message, context);
  }

  error(message: string, trace?: string, context?: LogContext) {
    this.writeLog('ERROR', message, { ...context, metadata: { ...context?.metadata, trace } });
  }

  warn(message: string, context?: LogContext) {
    this.writeLog('WARN', message, context);
  }

  debug(message: string, context?: LogContext) {
    if (this.environment === 'development') {
      this.writeLog('DEBUG', message, context);
    }
  }

  verbose(message: string, context?: LogContext) {
    if (this.environment === 'development') {
      this.writeLog('VERBOSE', message, context);
    }
  }

  // Financial transaction logging
  logTransaction(
    action: 'PIX_SENT' | 'PIX_RECEIVED' | 'TRANSFER' | 'PAYMENT' | 'REFUND',
    userId: string,
    transactionId: string,
    amount: number,
    status: string,
    metadata?: Record<string, any>,
  ) {
    this.writeLog('INFO', `Transaction: ${action}`, {
      userId,
      transactionId,
      action,
      metadata: { amount, status, ...metadata },
      module: 'transactions',
    });
  }

  // Security event logging
  logSecurityEvent(
    eventType: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    description: string,
    userId?: string,
    metadata?: Record<string, any>,
  ) {
    const level = severity === 'CRITICAL' || severity === 'HIGH' ? 'ERROR' : 'WARN';
    this.writeLog(level, `Security: ${eventType} - ${description}`, {
      userId,
      action: eventType,
      module: 'security',
      metadata: { severity, ...metadata },
    });
  }

  // API request logging
  logRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userId?: string,
    requestId?: string,
  ) {
    const level = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';
    this.writeLog(level, `${method} ${path} ${statusCode}`, {
      userId,
      requestId,
      duration,
      action: 'HTTP_REQUEST',
      module: 'api',
      metadata: { method, path, statusCode },
    });
  }

  // Fraud alert logging
  logFraudAlert(
    userId: string,
    score: number,
    triggeredRules: string[],
    action: 'BLOCKED' | 'FLAGGED' | 'ALLOWED',
  ) {
    const level = action === 'BLOCKED' ? 'ERROR' : action === 'FLAGGED' ? 'WARN' : 'INFO';
    this.writeLog(level, `Fraud Alert: ${action}`, {
      userId,
      action: 'FRAUD_CHECK',
      module: 'fraud',
      metadata: { score, triggeredRules, action },
    });
  }

  private writeLog(level: string, message: string, context?: LogContext) {
    const structuredLog: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context || {},
      environment: this.environment,
      service: this.serviceName,
      version: this.version,
    };

    // In production, send to log aggregator (e.g., Datadog, CloudWatch)
    // For now, output as JSON for easy parsing
    if (this.environment === 'production') {
      console.log(JSON.stringify(structuredLog));
    } else {
      const coloredLevel = this.colorLevel(level);
      console.log(`[${structuredLog.timestamp}] ${coloredLevel} ${message}`, 
        context ? JSON.stringify(context, null, 2) : '');
    }
  }

  private colorLevel(level: string): string {
    const colors: Record<string, string> = {
      ERROR: '\x1b[31mERROR\x1b[0m',
      WARN: '\x1b[33mWARN\x1b[0m',
      INFO: '\x1b[32mINFO\x1b[0m',
      DEBUG: '\x1b[36mDEBUG\x1b[0m',
      VERBOSE: '\x1b[35mVERBOSE\x1b[0m',
    };
    return colors[level] || level;
  }
}
