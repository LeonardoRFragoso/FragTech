import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InsightsService } from './insights.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('insights')
@Controller('insights')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all insights' })
  async findAll(@Req() req: any) {
    return this.insightsService.findAll(req.user.id);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get unread insights' })
  async findUnread(@Req() req: any) {
    return this.insightsService.findUnread(req.user.id);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get unread insights count' })
  async getUnreadCount(@Req() req: any) {
    const count = await this.insightsService.getUnreadCount(req.user.id);
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark insight as read' })
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.insightsService.markAsRead(req.user.id, id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all insights as read' })
  async markAllAsRead(@Req() req: any) {
    return this.insightsService.markAllAsRead(req.user.id);
  }

  @Patch(':id/dismiss')
  @ApiOperation({ summary: 'Dismiss an insight' })
  async dismiss(@Req() req: any, @Param('id') id: string) {
    return this.insightsService.dismiss(req.user.id, id);
  }
}
