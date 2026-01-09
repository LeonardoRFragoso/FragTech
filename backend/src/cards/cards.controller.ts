import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CardsService } from './cards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('cards')
@Controller('cards')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all user cards' })
  async findAll(@Req() req: any) {
    return this.cardsService.findAll(req.user.id);
  }

  @Post('virtual')
  @ApiOperation({ summary: 'Create a virtual card' })
  async createVirtual(@Req() req: any) {
    return this.cardsService.createVirtualCard(req.user.id);
  }

  @Post('physical')
  @ApiOperation({ summary: 'Request a physical card' })
  async requestPhysical(@Req() req: any) {
    return this.cardsService.requestPhysicalCard(req.user.id);
  }

  @Patch(':id/block')
  @ApiOperation({ summary: 'Toggle card block status' })
  async toggleBlock(@Req() req: any, @Param('id') id: string) {
    return this.cardsService.toggleBlock(req.user.id, id);
  }

  @Patch(':id/limit')
  @ApiOperation({ summary: 'Update card limit' })
  async updateLimit(
    @Req() req: any,
    @Param('id') id: string,
    @Body('limitAmount') limitAmount: number,
  ) {
    return this.cardsService.updateLimit(req.user.id, id, limitAmount);
  }

  @Patch(':id/international')
  @ApiOperation({ summary: 'Toggle international transactions' })
  async toggleInternational(@Req() req: any, @Param('id') id: string) {
    return this.cardsService.toggleInternational(req.user.id, id);
  }
}
