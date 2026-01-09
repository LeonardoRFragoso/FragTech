import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PixService } from './pix.service';
import { CreatePixKeyDto } from './dto/create-pix-key.dto';
import { SendPixDto, PixQrCodeDto, ReadQrCodeDto } from './dto/send-pix.dto';

@ApiTags('PIX')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pix')
export class PixController {
  constructor(private readonly pixService: PixService) {}

  // ==================== PIX KEYS ====================

  @Post('keys')
  @ApiOperation({ summary: 'Register a new PIX key' })
  @ApiResponse({ status: 201, description: 'PIX key created successfully' })
  async createKey(@Request() req: any, @Body() dto: CreatePixKeyDto) {
    return this.pixService.createKey(req.user.sub, dto);
  }

  @Get('keys')
  @ApiOperation({ summary: 'Get user PIX keys' })
  @ApiResponse({ status: 200, description: 'List of PIX keys' })
  async getUserKeys(@Request() req: any) {
    return this.pixService.getUserKeys(req.user.sub);
  }

  @Delete('keys/:keyId')
  @ApiOperation({ summary: 'Delete a PIX key' })
  @ApiResponse({ status: 200, description: 'PIX key deleted successfully' })
  async deleteKey(@Request() req: any, @Param('keyId') keyId: string) {
    return this.pixService.deleteKey(keyId, req.user.sub);
  }

  @Patch('keys/:keyId/primary')
  @ApiOperation({ summary: 'Set a PIX key as primary' })
  @ApiResponse({ status: 200, description: 'PIX key set as primary' })
  async setPrimaryKey(@Request() req: any, @Param('keyId') keyId: string) {
    return this.pixService.setPrimaryKey(keyId, req.user.sub);
  }

  @Get('keys/lookup/:key')
  @ApiOperation({ summary: 'Lookup a PIX key (DICT simulation)' })
  @ApiResponse({ status: 200, description: 'Key lookup result' })
  async lookupKey(@Param('key') key: string) {
    return this.pixService.lookupKey(key);
  }

  // ==================== PIX TRANSFERS ====================

  @Post('transfer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a PIX transfer' })
  @ApiResponse({ status: 200, description: 'PIX transfer initiated' })
  async sendPix(@Request() req: any, @Body() dto: SendPixDto) {
    return this.pixService.sendPix(req.user.sub, dto);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get PIX transaction history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'PIX transaction history' })
  async getTransactionHistory(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.pixService.getTransactionHistory(req.user.sub, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('transactions/:transactionId')
  @ApiOperation({ summary: 'Get PIX transaction details' })
  @ApiResponse({ status: 200, description: 'PIX transaction details' })
  async getTransactionById(
    @Request() req: any,
    @Param('transactionId') transactionId: string,
  ) {
    return this.pixService.getTransactionById(transactionId, req.user.sub);
  }

  @Delete('transactions/:transactionId/schedule')
  @ApiOperation({ summary: 'Cancel a scheduled PIX transfer' })
  @ApiResponse({ status: 200, description: 'Scheduled PIX cancelled' })
  async cancelScheduledTransaction(
    @Request() req: any,
    @Param('transactionId') transactionId: string,
  ) {
    return this.pixService.cancelScheduledTransaction(transactionId, req.user.sub);
  }

  // ==================== QR CODE ====================

  @Post('qrcode/generate')
  @ApiOperation({ summary: 'Generate a PIX QR Code' })
  @ApiResponse({ status: 201, description: 'QR Code generated' })
  async generateQrCode(@Request() req: any, @Body() dto: PixQrCodeDto) {
    return this.pixService.generateQrCode(req.user.sub, dto);
  }

  @Post('qrcode/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Read and parse a PIX QR Code' })
  @ApiResponse({ status: 200, description: 'QR Code parsed' })
  async readQrCode(@Body() dto: ReadQrCodeDto) {
    return this.pixService.readQrCode(dto.payload);
  }

  // ==================== LIMITS ====================

  @Get('limits')
  @ApiOperation({ summary: 'Get user PIX limits' })
  @ApiResponse({ status: 200, description: 'PIX limits' })
  async getLimits(@Request() req: any) {
    return this.pixService.getLimits(req.user.sub);
  }

  @Patch('limits')
  @ApiOperation({ summary: 'Update user PIX limits' })
  @ApiResponse({ status: 200, description: 'PIX limits updated' })
  async updateLimits(
    @Request() req: any,
    @Body() updates: {
      dailyLimit?: number;
      nightlyLimit?: number;
      perTransactionLimit?: number;
      monthlyLimit?: number;
    },
  ) {
    return this.pixService.updateLimits(req.user.sub, updates);
  }

  // ==================== DASHBOARD ====================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get PIX dashboard data' })
  @ApiResponse({ status: 200, description: 'PIX dashboard data' })
  async getDashboard(@Request() req: any) {
    return this.pixService.getPixDashboard(req.user.sub);
  }

  // ==================== WEBHOOKS (Internal/PSP) ====================

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive PIX webhook from PSP (internal use)' })
  async processWebhook(@Body() payload: any) {
    return this.pixService.processWebhook(payload);
  }
}
