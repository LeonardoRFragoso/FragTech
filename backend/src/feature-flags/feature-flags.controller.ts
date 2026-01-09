import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeatureFlagsService } from './feature-flags.service';

@ApiTags('Feature Flags')
@Controller('features')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('my')
  @ApiOperation({ summary: 'Get features available for current user' })
  async getMyFeatures(@Request() req: any) {
    return this.featureFlagsService.getUserFeatures(req.user.sub, req.user.plan || 'FREE');
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('check/:key')
  @ApiOperation({ summary: 'Check if a specific feature is enabled' })
  async checkFeature(@Request() req: any, @Param('key') key: string) {
    const check = await this.featureFlagsService.checkFeature(req.user.sub, key, req.user.plan || 'FREE');
    return {
      feature: key,
      ...check,
      paywallMessage: !check.enabled ? this.featureFlagsService.getPaywallMessage(key) : null,
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('admin/all')
  @ApiOperation({ summary: 'Get all feature flags (admin)' })
  async getAllFeatures() {
    return this.featureFlagsService.getAllFeatures();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('admin/update/:key')
  @ApiOperation({ summary: 'Update feature flag (admin)' })
  async updateFeature(
    @Param('key') key: string,
    @Body() body: { isEnabled?: boolean; percentage?: number },
  ) {
    return this.featureFlagsService.updateFeature(key, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('admin/override')
  @ApiOperation({ summary: 'Set user feature override (admin)' })
  async setOverride(@Body() body: { userId: string; featureKey: string; enabled: boolean; expiresAt?: string }) {
    return this.featureFlagsService.setUserOverride(
      body.userId,
      body.featureKey,
      body.enabled,
      body.expiresAt ? new Date(body.expiresAt) : undefined,
    );
  }
}
