import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get executive dashboard' })
  async getExecutiveDashboard() {
    return this.adminService.getExecutiveDashboard();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get user metrics' })
  async getUserMetrics() {
    return this.adminService.getUserMetrics();
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue metrics' })
  async getRevenueMetrics() {
    return this.adminService.getRevenueMetrics();
  }

  @Get('growth')
  @ApiOperation({ summary: 'Get growth metrics' })
  async getGrowthMetrics() {
    return this.adminService.getGrowthMetrics();
  }

  @Get('ai-usage')
  @ApiOperation({ summary: 'Get AI usage metrics' })
  async getAIUsageMetrics() {
    return this.adminService.getAIUsageMetrics();
  }

  @Get('retention')
  @ApiOperation({ summary: 'Get retention cohorts' })
  async getRetentionCohorts(@Query('weeks') weeks?: string) {
    return this.adminService.getRetentionCohorts(weeks ? parseInt(weeks) : 8);
  }

  @Get('experiments')
  @ApiOperation({ summary: 'Get experiment results' })
  async getExperimentResults() {
    return this.adminService.getExperimentResults();
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get critical alerts' })
  async getAlerts() {
    return this.adminService.getCriticalAlerts();
  }
}
