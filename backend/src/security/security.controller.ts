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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SecurityService } from './security.service';

@ApiTags('Security')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  // ==================== MFA ====================

  @Post('mfa/setup')
  @ApiOperation({ summary: 'Setup MFA for user' })
  @ApiResponse({ status: 201, description: 'MFA setup initiated' })
  async setupMfa(@Request() req: any, @Body() body: { method?: string }) {
    return this.securityService.setupMfa(req.user.sub, body.method);
  }

  @Post('mfa/verify')
  @ApiOperation({ summary: 'Verify and enable MFA' })
  @ApiResponse({ status: 200, description: 'MFA enabled' })
  async verifyAndEnableMfa(@Request() req: any, @Body() body: { code: string }) {
    return this.securityService.verifyAndEnableMfa(req.user.sub, body.code);
  }

  @Get('mfa/status')
  @ApiOperation({ summary: 'Get MFA status' })
  @ApiResponse({ status: 200, description: 'MFA status' })
  async getMfaStatus(@Request() req: any) {
    return this.securityService.getMfaStatus(req.user.sub);
  }

  @Delete('mfa')
  @ApiOperation({ summary: 'Disable MFA' })
  @ApiResponse({ status: 200, description: 'MFA disabled' })
  async disableMfa(@Request() req: any, @Body() body: { code: string }) {
    return this.securityService.disableMfa(req.user.sub, body.code);
  }

  @Post('mfa/backup-codes')
  @ApiOperation({ summary: 'Regenerate backup codes' })
  @ApiResponse({ status: 200, description: 'New backup codes' })
  async regenerateBackupCodes(@Request() req: any, @Body() body: { code: string }) {
    return this.securityService.regenerateBackupCodes(req.user.sub, body.code);
  }

  // ==================== DASHBOARD ====================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get security dashboard' })
  @ApiResponse({ status: 200, description: 'Security dashboard data' })
  async getDashboard(@Request() req: any) {
    return this.securityService.getSecurityDashboard(req.user.sub);
  }

  // ==================== ADMIN ENDPOINTS ====================

  @Get('admin/rate-limits')
  @ApiOperation({ summary: 'Get rate limit stats (admin)' })
  @ApiResponse({ status: 200, description: 'Rate limit statistics' })
  async getRateLimitStats(@Query('endpoint') endpoint?: string) {
    return this.securityService.getRateLimitStats(endpoint);
  }

  @Get('admin/blocked-keys')
  @ApiOperation({ summary: 'Get blocked keys (admin)' })
  @ApiResponse({ status: 200, description: 'Blocked keys' })
  async getBlockedKeys() {
    return this.securityService.getBlockedKeys();
  }

  @Post('admin/unblock/:key')
  @ApiOperation({ summary: 'Unblock a key (admin)' })
  @ApiResponse({ status: 200, description: 'Key unblocked' })
  async unblockKey(@Param('key') key: string) {
    await this.securityService.unblockKey(key);
    return { message: 'Key unblocked' };
  }

  @Post('admin/reset-rate-limit')
  @ApiOperation({ summary: 'Reset rate limit for key (admin)' })
  @ApiResponse({ status: 200, description: 'Rate limit reset' })
  async resetRateLimit(@Body() body: { key: string; endpoint?: string }) {
    await this.securityService.resetRateLimit(body.key, body.endpoint);
    return { message: 'Rate limit reset' };
  }
}
