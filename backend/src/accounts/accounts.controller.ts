import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { TransferDto } from './dto/transfer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('accounts')
@Controller('accounts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get account balance' })
  async getBalance(@Req() req: any) {
    return this.accountsService.getBalance(req.user.id);
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer money via PIX' })
  async transfer(@Req() req: any, @Body() dto: TransferDto) {
    return this.accountsService.transfer(
      req.user.id,
      dto.toAccountNumber,
      dto.amount,
      dto.description,
    );
  }
}
