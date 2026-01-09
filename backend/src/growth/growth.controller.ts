import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GrowthService } from './growth.service';

@ApiTags('Growth')
@Controller('growth')
export class GrowthController {
  constructor(private readonly growthService: GrowthService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('referral/create')
  @ApiOperation({ summary: 'Create referral code for user' })
  async createReferralCode(@Request() req: any) {
    const code = await this.growthService.createReferralCode(req.user.sub);
    const shareLinks = this.growthService.generateShareLinks(code);
    return { code, shareLinks };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('referral/my')
  @ApiOperation({ summary: 'Get my referral stats' })
  async getMyReferralStats(@Request() req: any) {
    const stats = await this.growthService.getReferralStats(req.user.sub);
    const shareLinks = stats.code ? this.growthService.generateShareLinks(stats.code) : null;
    return { ...stats, shareLinks };
  }

  @Post('referral/apply')
  @ApiOperation({ summary: 'Apply referral code during signup' })
  async applyReferralCode(@Body() body: { userId: string; code: string }) {
    return this.growthService.applyReferralCode(body.userId, body.code);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('admin/top-referrers')
  @ApiOperation({ summary: 'Get top referrers (admin)' })
  async getTopReferrers(@Query('limit') limit?: string) {
    return this.growthService.getTopReferrers(limit ? parseInt(limit) : 10);
  }
}
