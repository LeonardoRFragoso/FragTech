import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FraudService } from './fraud.service';

@ApiTags('Fraud Detection')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('fraud')
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  // ==================== RISK PROFILE ====================

  @Get('risk-profile')
  @ApiOperation({ summary: 'Get user risk profile' })
  @ApiResponse({ status: 200, description: 'User risk profile' })
  async getRiskProfile(@Request() req: any) {
    return this.fraudService.getUserRiskProfile(req.user.sub);
  }

  @Get('risk-score')
  @ApiOperation({ summary: 'Get user risk score' })
  @ApiResponse({ status: 200, description: 'User risk score' })
  async getRiskScore(@Request() req: any) {
    const score = await this.fraudService.getUserRiskScore(req.user.sub);
    return { score };
  }

  // ==================== DEVICES ====================

  @Get('devices')
  @ApiOperation({ summary: 'Get user devices' })
  @ApiResponse({ status: 200, description: 'List of user devices' })
  async getDevices(@Request() req: any) {
    return this.fraudService.getUserDevices(req.user.sub);
  }

  @Post('devices/register')
  @ApiOperation({ summary: 'Register a new device' })
  @ApiResponse({ status: 201, description: 'Device registered' })
  async registerDevice(
    @Request() req: any,
    @Body() body: { fingerprint: string; metadata: any },
  ) {
    return this.fraudService.registerDevice(req.user.sub, body.fingerprint, body.metadata);
  }

  @Delete('devices/:deviceId')
  @ApiOperation({ summary: 'Deactivate a device' })
  @ApiResponse({ status: 200, description: 'Device deactivated' })
  async deactivateDevice(@Request() req: any, @Param('deviceId') deviceId: string) {
    return this.fraudService.deactivateDevice(deviceId, req.user.sub);
  }

  @Patch('devices/:deviceId/trust')
  @ApiOperation({ summary: 'Set device trust level' })
  @ApiResponse({ status: 200, description: 'Trust level updated' })
  async setDeviceTrust(
    @Param('deviceId') deviceId: string,
    @Body() body: { trustLevel: string },
  ) {
    return this.fraudService.setDeviceTrust(deviceId, body.trustLevel);
  }

  // ==================== ALERTS ====================

  @Get('alerts')
  @ApiOperation({ summary: 'Get user alerts' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'severity', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of alerts' })
  async getAlerts(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('limit') limit?: number,
  ) {
    return this.fraudService.getUserAlerts(req.user.sub, {
      status,
      severity,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('alerts/:alertId')
  @ApiOperation({ summary: 'Get alert details' })
  @ApiResponse({ status: 200, description: 'Alert details' })
  async getAlertById(@Param('alertId') alertId: string) {
    return this.fraudService.getAlertById(alertId);
  }

  // ==================== DASHBOARD ====================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get fraud dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  async getDashboard(@Request() req: any) {
    return this.fraudService.getFraudDashboard(req.user.sub);
  }

  // ==================== ADMIN ENDPOINTS ====================

  @Get('admin/alerts/pending')
  @ApiOperation({ summary: 'Get pending alerts (admin)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Pending alerts' })
  async getPendingAlerts(@Query('limit') limit?: number) {
    return this.fraudService.getPendingAlerts(limit ? Number(limit) : undefined);
  }

  @Get('admin/alerts/critical')
  @ApiOperation({ summary: 'Get critical alerts (admin)' })
  @ApiResponse({ status: 200, description: 'Critical alerts' })
  async getCriticalAlerts() {
    return this.fraudService.getCriticalAlerts();
  }

  @Get('admin/alerts/stats')
  @ApiOperation({ summary: 'Get alert statistics (admin)' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Alert statistics' })
  async getAlertStats(@Query('days') days?: number) {
    return this.fraudService.getAlertStats(days ? Number(days) : undefined);
  }

  @Patch('admin/alerts/:alertId')
  @ApiOperation({ summary: 'Update alert status (admin)' })
  @ApiResponse({ status: 200, description: 'Alert updated' })
  async updateAlertStatus(
    @Request() req: any,
    @Param('alertId') alertId: string,
    @Body() body: { status: string; resolution?: string },
  ) {
    return this.fraudService.updateAlertStatus(
      alertId,
      body.status,
      req.user.sub,
      body.resolution,
    );
  }

  @Get('admin/users/high-risk')
  @ApiOperation({ summary: 'Get high risk users (admin)' })
  @ApiQuery({ name: 'threshold', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'High risk users' })
  async getHighRiskUsers(@Query('threshold') threshold?: number) {
    return this.fraudService.getHighRiskUsers(threshold ? Number(threshold) : undefined);
  }

  @Get('admin/users/blocked')
  @ApiOperation({ summary: 'Get blocked users (admin)' })
  @ApiResponse({ status: 200, description: 'Blocked users' })
  async getBlockedUsers() {
    return this.fraudService.getBlockedUsers();
  }

  @Post('admin/users/:userId/block')
  @ApiOperation({ summary: 'Block a user (admin)' })
  @ApiResponse({ status: 200, description: 'User blocked' })
  async blockUser(@Param('userId') userId: string, @Body() body: { reason: string }) {
    return this.fraudService.blockUser(userId, body.reason);
  }

  @Post('admin/users/:userId/unblock')
  @ApiOperation({ summary: 'Unblock a user (admin)' })
  @ApiResponse({ status: 200, description: 'User unblocked' })
  async unblockUser(@Param('userId') userId: string) {
    return this.fraudService.unblockUser(userId);
  }

  @Post('admin/seed-rules')
  @ApiOperation({ summary: 'Seed default fraud rules (admin)' })
  @ApiResponse({ status: 201, description: 'Rules seeded' })
  async seedRules() {
    await this.fraudService.seedDefaultRules();
    return { message: 'Default fraud rules seeded' };
  }
}
