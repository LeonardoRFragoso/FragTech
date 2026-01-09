import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { EventTrackingService } from './services/event-tracking.service';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly eventTracking: EventTrackingService,
  ) {}

  @Post('track')
  @ApiOperation({ summary: 'Track an analytics event' })
  async trackEvent(@Body() body: {
    eventName: string;
    eventCategory: string;
    userId?: string;
    sessionId?: string;
    properties?: Record<string, any>;
  }) {
    return this.eventTracking.track(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('admin/dashboard')
  @ApiOperation({ summary: 'Get executive dashboard' })
  async getExecutiveDashboard() {
    return this.analyticsService.getExecutiveDashboard();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('admin/funnels')
  @ApiOperation({ summary: 'Get growth funnels' })
  async getFunnels() {
    return this.analyticsService.getGrowthFunnels();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('admin/retention')
  @ApiOperation({ summary: 'Get retention cohorts' })
  async getRetention(@Query('weeks') weeks?: string) {
    return this.analyticsService.getRetentionData(weeks ? parseInt(weeks) : 8);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('admin/metrics')
  @ApiOperation({ summary: 'Get metrics trend' })
  async getMetricsTrend(@Query('days') days?: string) {
    return this.analyticsService.getMetricsTrend(days ? parseInt(days) : 30);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('admin/conversions')
  @ApiOperation({ summary: 'Get conversion metrics' })
  async getConversions() {
    return this.analyticsService.getConversionMetrics();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('admin/ai-segments')
  @ApiOperation({ summary: 'Get AI usage segments' })
  async getAISegments() {
    return this.analyticsService.getAIUsageSegments();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('admin/top-users')
  @ApiOperation({ summary: 'Get top users' })
  async getTopUsers(@Query('limit') limit?: string) {
    return this.analyticsService.getTopUsers(limit ? parseInt(limit) : 10);
  }
}
