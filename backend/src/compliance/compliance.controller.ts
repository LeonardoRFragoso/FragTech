import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ComplianceService } from './compliance.service';

@ApiTags('Compliance & LGPD')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  // ==================== LGPD CONSENTS ====================

  @Get('consents')
  @ApiOperation({ summary: 'Get user consents' })
  @ApiResponse({ status: 200, description: 'List of consents' })
  async getUserConsents(@Request() req: any) {
    return this.complianceService.getUserConsents(req.user.sub);
  }

  @Get('consents/required')
  @ApiOperation({ summary: 'Get required consent types' })
  @ApiResponse({ status: 200, description: 'Required consent types' })
  async getRequiredConsents() {
    return this.complianceService.getRequiredConsents();
  }

  @Post('consents/:consentType/grant')
  @ApiOperation({ summary: 'Grant consent' })
  @ApiResponse({ status: 201, description: 'Consent granted' })
  async grantConsent(
    @Request() req: any,
    @Param('consentType') consentType: string,
  ) {
    return this.complianceService.grantConsent(
      req.user.sub,
      consentType,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('consents/:consentType/revoke')
  @ApiOperation({ summary: 'Revoke consent' })
  @ApiResponse({ status: 200, description: 'Consent revoked' })
  async revokeConsent(
    @Request() req: any,
    @Param('consentType') consentType: string,
  ) {
    return this.complianceService.revokeConsent(req.user.sub, consentType);
  }

  // ==================== DATA RIGHTS ====================

  @Post('data/export')
  @ApiOperation({ summary: 'Export user data (LGPD right to access)' })
  @ApiResponse({ status: 200, description: 'User data export' })
  async exportData(@Request() req: any) {
    return this.complianceService.exportUserData(req.user.sub);
  }

  @Post('data/deletion-request')
  @ApiOperation({ summary: 'Request data deletion (LGPD right to erasure)' })
  @ApiResponse({ status: 201, description: 'Deletion request created' })
  async requestDataDeletion(
    @Request() req: any,
    @Body() body: { requestType: string; reason?: string },
  ) {
    return this.complianceService.requestDataDeletion(
      req.user.sub,
      body.requestType,
      body.reason,
    );
  }

  // ==================== AUDIT LOG ====================

  @Get('activity')
  @ApiOperation({ summary: 'Get user activity log' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'User activity log' })
  async getActivityLog(@Request() req: any, @Query('limit') limit?: number) {
    return this.complianceService.getUserActivityLog(req.user.sub, limit ? Number(limit) : undefined);
  }

  @Get('financial-history')
  @ApiOperation({ summary: 'Get immutable financial history' })
  @ApiQuery({ name: 'eventType', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Financial history' })
  async getFinancialHistory(
    @Request() req: any,
    @Query('eventType') eventType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ) {
    return this.complianceService.getUserFinancialHistory(req.user.sub, {
      eventType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('chain-integrity')
  @ApiOperation({ summary: 'Verify financial log chain integrity' })
  @ApiResponse({ status: 200, description: 'Chain integrity status' })
  async verifyChainIntegrity(@Request() req: any) {
    return this.complianceService.verifyChainIntegrity(req.user.sub);
  }

  // ==================== DASHBOARD ====================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get compliance dashboard' })
  @ApiResponse({ status: 200, description: 'Compliance dashboard data' })
  async getDashboard(@Request() req: any) {
    return this.complianceService.getComplianceDashboard(req.user.sub);
  }

  // ==================== ADMIN ENDPOINTS ====================

  @Get('admin/audit-logs')
  @ApiOperation({ summary: 'Get audit logs (admin)' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'entity', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Audit logs' })
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('entity') entity?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ) {
    return this.complianceService.getAuditLogs({
      userId,
      entity,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('admin/audit-stats')
  @ApiOperation({ summary: 'Get audit statistics (admin)' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Audit statistics' })
  async getAuditStats(@Query('days') days?: number) {
    return this.complianceService.getAuditStats(days ? Number(days) : undefined);
  }

  @Get('admin/security-events')
  @ApiOperation({ summary: 'Get security events (admin)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Security events' })
  async getSecurityEvents(@Query('limit') limit?: number) {
    return this.complianceService.getSecurityEvents(limit ? Number(limit) : undefined);
  }

  @Get('admin/retention-policies')
  @ApiOperation({ summary: 'Get data retention policies (admin)' })
  @ApiResponse({ status: 200, description: 'Retention policies' })
  async getRetentionPolicies() {
    return this.complianceService.getRetentionPolicies();
  }

  @Patch('admin/retention-policies/:entityType')
  @ApiOperation({ summary: 'Update retention policy (admin)' })
  @ApiResponse({ status: 200, description: 'Policy updated' })
  async updateRetentionPolicy(
    @Param('entityType') entityType: string,
    @Body() body: { retentionDays: number },
  ) {
    return this.complianceService.updateRetentionPolicy(entityType, body.retentionDays);
  }

  @Post('admin/retention/execute')
  @ApiOperation({ summary: 'Execute retention policies (admin)' })
  @ApiResponse({ status: 200, description: 'Execution results' })
  async executeRetentionPolicies() {
    return this.complianceService.executeRetentionPolicies();
  }

  @Get('admin/retention/stats')
  @ApiOperation({ summary: 'Get retention statistics (admin)' })
  @ApiResponse({ status: 200, description: 'Retention statistics' })
  async getRetentionStats() {
    return this.complianceService.getRetentionStats();
  }

  @Post('admin/seed-policies')
  @ApiOperation({ summary: 'Seed default retention policies (admin)' })
  @ApiResponse({ status: 201, description: 'Policies seeded' })
  async seedPolicies() {
    await this.complianceService.seedRetentionPolicies();
    return { message: 'Default retention policies seeded' };
  }
}
