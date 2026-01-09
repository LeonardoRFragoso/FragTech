import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user transactions' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'category', required: false })
  async findAll(
    @Req() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('category') category?: string,
  ) {
    return this.transactionsService.findAll(req.user.id, { page, limit, category });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get monthly transaction statistics' })
  async getStats(@Req() req: any) {
    return this.transactionsService.getMonthlyStats(req.user.id);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get spending breakdown by category' })
  async getCategoryBreakdown(@Req() req: any) {
    return this.transactionsService.getCategoryBreakdown(req.user.id);
  }
}
