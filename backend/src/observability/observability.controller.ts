import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { MetricsService } from './services/metrics.service';
import { AlertingService } from './services/alerting.service';
import { HealthService } from './services/health.service';

@ApiTags('Observability')
@Controller()
export class ObservabilityController {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly alertingService: AlertingService,
    private readonly healthService: HealthService,
  ) {}

  // ==================== HEALTH ====================

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'System health status' })
  async getHealth() {
    return this.healthService.getHealth();
  }

  @Get('health/live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async getLiveness() {
    return this.healthService.getLiveness();
  }

  @Get('health/ready')
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  async getReadiness() {
    return this.healthService.getReadiness();
  }

  // ==================== METRICS ====================

  @Get('metrics')
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  @ApiResponse({ status: 200, description: 'Prometheus format metrics' })
  async getPrometheusMetrics() {
    return this.metricsService.getPrometheusMetrics();
  }

  @Get('metrics/transactions')
  @ApiOperation({ summary: 'Transaction metrics' })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month'] })
  @ApiResponse({ status: 200, description: 'Transaction metrics' })
  async getTransactionMetrics(@Query('period') period?: 'day' | 'week' | 'month') {
    return this.metricsService.getTransactionMetrics(period);
  }

  @Get('metrics/pix')
  @ApiOperation({ summary: 'PIX metrics' })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month'] })
  @ApiResponse({ status: 200, description: 'PIX metrics' })
  async getPixMetrics(@Query('period') period?: 'day' | 'week' | 'month') {
    return this.metricsService.getPixMetrics(period);
  }

  @Get('metrics/users')
  @ApiOperation({ summary: 'User metrics' })
  @ApiResponse({ status: 200, description: 'User metrics' })
  async getUserMetrics() {
    return this.metricsService.getUserMetrics();
  }

  @Get('metrics/fraud')
  @ApiOperation({ summary: 'Fraud metrics' })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month'] })
  @ApiResponse({ status: 200, description: 'Fraud metrics' })
  async getFraudMetrics(@Query('period') period?: 'day' | 'week' | 'month') {
    return this.metricsService.getFraudMetrics(period);
  }

  // ==================== ALERTS ====================

  @Get('alerts')
  @ApiOperation({ summary: 'Get system alerts' })
  @ApiQuery({ name: 'severity', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'unacknowledgedOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'System alerts' })
  async getAlerts(
    @Query('severity') severity?: string,
    @Query('type') type?: string,
    @Query('unacknowledgedOnly') unacknowledgedOnly?: boolean,
    @Query('limit') limit?: number,
  ) {
    return this.alertingService.getAlerts({
      severity: severity as any,
      type,
      unacknowledgedOnly,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post('alerts/:alertId/acknowledge')
  @ApiOperation({ summary: 'Acknowledge an alert' })
  @ApiResponse({ status: 200, description: 'Alert acknowledged' })
  async acknowledgeAlert(
    @Param('alertId') alertId: string,
    @Body() body: { acknowledgedBy: string },
  ) {
    return this.alertingService.acknowledgeAlert(alertId, body.acknowledgedBy);
  }
}
