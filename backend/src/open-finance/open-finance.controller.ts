import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OpenFinanceService } from './open-finance.service';

@ApiTags('Open Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('open-finance')
export class OpenFinanceController {
  constructor(private readonly openFinanceService: OpenFinanceService) {}

  // ==================== INSTITUTIONS ====================

  @Get('institutions')
  @ApiOperation({ summary: 'Get available Open Finance institutions' })
  @ApiResponse({ status: 200, description: 'List of available institutions' })
  getAvailableInstitutions() {
    return this.openFinanceService.getAvailableInstitutions();
  }

  // ==================== CONSENTS ====================

  @Post('consent')
  @ApiOperation({ summary: 'Initiate consent flow with an institution' })
  @ApiResponse({ status: 201, description: 'Consent flow initiated' })
  async initiateConsent(
    @Request() req: any,
    @Body() body: { institutionCode: string; scopes: string[] },
  ) {
    return this.openFinanceService.initiateConsent(
      req.user.sub,
      body.institutionCode,
      body.scopes,
    );
  }

  @Post('consent/callback')
  @ApiOperation({ summary: 'Handle OAuth callback from institution' })
  @ApiResponse({ status: 200, description: 'Consent authorized' })
  async authorizeConsent(
    @Body() body: { state: string; code: string },
  ) {
    return this.openFinanceService.authorizeConsent(body.state, body.code);
  }

  @Delete('consent/:consentId')
  @ApiOperation({ summary: 'Revoke consent' })
  @ApiResponse({ status: 200, description: 'Consent revoked' })
  async revokeConsent(
    @Request() req: any,
    @Param('consentId') consentId: string,
  ) {
    return this.openFinanceService.revokeConsent(consentId, req.user.sub);
  }

  @Get('consents')
  @ApiOperation({ summary: 'Get user consents' })
  @ApiResponse({ status: 200, description: 'List of user consents' })
  async getUserConsents(@Request() req: any) {
    return this.openFinanceService.getUserConsents(req.user.sub);
  }

  // ==================== CONNECTIONS ====================

  @Get('connections')
  @ApiOperation({ summary: 'Get user connections' })
  @ApiResponse({ status: 200, description: 'List of connections' })
  async getUserConnections(@Request() req: any) {
    return this.openFinanceService.getUserConnections(req.user.sub);
  }

  @Get('connections/:connectionId')
  @ApiOperation({ summary: 'Get connection details' })
  @ApiResponse({ status: 200, description: 'Connection details' })
  async getConnectionById(
    @Request() req: any,
    @Param('connectionId') connectionId: string,
  ) {
    return this.openFinanceService.getConnectionById(connectionId, req.user.sub);
  }

  @Post('connections/:connectionId/refresh')
  @ApiOperation({ summary: 'Refresh connection token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  async refreshConnectionToken(
    @Request() req: any,
    @Param('connectionId') connectionId: string,
  ) {
    return this.openFinanceService.refreshConnectionToken(connectionId, req.user.sub);
  }

  // ==================== SYNC ====================

  @Post('connections/:connectionId/sync')
  @ApiOperation({ summary: 'Sync connection data' })
  @ApiResponse({ status: 200, description: 'Sync started' })
  async syncConnection(@Param('connectionId') connectionId: string) {
    return this.openFinanceService.syncConnection(connectionId);
  }

  @Get('connections/:connectionId/sync-history')
  @ApiOperation({ summary: 'Get sync history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Sync history' })
  async getSyncHistory(
    @Param('connectionId') connectionId: string,
    @Query('limit') limit?: number,
  ) {
    return this.openFinanceService.getSyncHistory(connectionId, limit ? Number(limit) : undefined);
  }

  // ==================== AGGREGATED DATA ====================

  @Get('balance')
  @ApiOperation({ summary: 'Get aggregated balance across all connections' })
  @ApiResponse({ status: 200, description: 'Aggregated balance' })
  async getAggregatedBalance(@Request() req: any) {
    return this.openFinanceService.getAggregatedBalance(req.user.sub);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get aggregated transactions' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Aggregated transactions' })
  async getAggregatedTransactions(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('category') category?: string,
    @Query('limit') limit?: number,
  ) {
    return this.openFinanceService.getAggregatedTransactions(req.user.sub, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      category,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get spending by category' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Category breakdown' })
  async getCategoryBreakdown(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.openFinanceService.getCategoryBreakdown(
      req.user.sub,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  // ==================== DASHBOARD ====================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get Open Finance dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  async getDashboard(@Request() req: any) {
    return this.openFinanceService.getOpenFinanceDashboard(req.user.sub);
  }
}
