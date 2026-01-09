import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BillingService } from './billing.service';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  @Get('plans')
  @ApiOperation({ summary: 'Get all available plans' })
  @ApiResponse({ status: 200, description: 'List of plans' })
  async getPlans() {
    return this.billingService.getPlans();
  }

  @Get('plans/:code')
  @ApiOperation({ summary: 'Get plan by code' })
  @ApiResponse({ status: 200, description: 'Plan details' })
  async getPlanByCode(@Param('code') code: string) {
    return this.billingService.getPlanByCode(code);
  }

  // ==================== AUTHENTICATED ENDPOINTS ====================

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('subscription')
  @ApiOperation({ summary: 'Get user subscription' })
  @ApiResponse({ status: 200, description: 'User subscription' })
  async getSubscription(@Request() req: any) {
    return this.billingService.getUserSubscription(req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('dashboard')
  @ApiOperation({ summary: 'Get billing dashboard' })
  @ApiResponse({ status: 200, description: 'Billing dashboard data' })
  async getBillingDashboard(@Request() req: any) {
    return this.billingService.getBillingDashboard(req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to a plan' })
  @ApiResponse({ status: 201, description: 'Subscription created' })
  async subscribe(
    @Request() req: any,
    @Body() body: { planCode: string; isYearly?: boolean },
  ) {
    return this.billingService.subscribe(req.user.sub, body.planCode, body.isYearly);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('upgrade')
  @ApiOperation({ summary: 'Upgrade to a higher plan' })
  @ApiResponse({ status: 200, description: 'Plan upgraded' })
  async upgradePlan(
    @Request() req: any,
    @Body() body: { planCode: string; paymentMethod?: string },
  ) {
    return this.billingService.upgradePlan(req.user.sub, body.planCode, body.paymentMethod);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('downgrade')
  @ApiOperation({ summary: 'Downgrade to a lower plan' })
  @ApiResponse({ status: 200, description: 'Downgrade scheduled' })
  async downgradePlan(
    @Request() req: any,
    @Body() body: { planCode: string },
  ) {
    return this.billingService.downgradePlan(req.user.sub, body.planCode);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('cancel')
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled' })
  async cancelSubscription(
    @Request() req: any,
    @Body() body: { reason?: string },
  ) {
    return this.billingService.cancelSubscription(req.user.sub, body.reason);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('reactivate')
  @ApiOperation({ summary: 'Reactivate cancelled subscription' })
  @ApiResponse({ status: 200, description: 'Subscription reactivated' })
  async reactivateSubscription(@Request() req: any) {
    return this.billingService.reactivateSubscription(req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('compare/:currentCode/:targetCode')
  @ApiOperation({ summary: 'Compare two plans' })
  @ApiResponse({ status: 200, description: 'Plan comparison' })
  async comparePlans(
    @Param('currentCode') currentCode: string,
    @Param('targetCode') targetCode: string,
  ) {
    return this.billingService.comparePlans(currentCode, targetCode);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('payments')
  @ApiOperation({ summary: 'Get user payment history' })
  @ApiResponse({ status: 200, description: 'Payment history' })
  async getPayments(@Request() req: any) {
    return this.billingService.getUserPayments(req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('invoices')
  @ApiOperation({ summary: 'Get user invoices' })
  @ApiResponse({ status: 200, description: 'User invoices' })
  async getInvoices(@Request() req: any) {
    return this.billingService.getUserInvoices(req.user.sub);
  }

  // ==================== ADMIN ENDPOINTS ====================

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('admin/stats')
  @ApiOperation({ summary: 'Get billing statistics (admin)' })
  @ApiResponse({ status: 200, description: 'Billing statistics' })
  async getBillingStats() {
    const [revenue, mrr, subscriptions] = await Promise.all([
      this.billingService.getRevenueStats(),
      this.billingService.getMRR(),
      this.billingService.getSubscriptionStats(),
    ]);

    return { revenue, mrr, subscriptions };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('admin/mrr')
  @ApiOperation({ summary: 'Get MRR details (admin)' })
  @ApiResponse({ status: 200, description: 'MRR details' })
  async getMRR() {
    return this.billingService.getMRR();
  }
}
