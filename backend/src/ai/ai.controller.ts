import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AIService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Chat with AI Copilot' })
  async chat(@Req() req: any, @Body('message') message: string) {
    const response = await this.aiService.chat(req.user.id, message);
    return { response };
  }

  @Get('analyze')
  @ApiOperation({ summary: 'Analyze spending patterns' })
  async analyzeSpending(@Req() req: any) {
    return this.aiService.analyzeSpending(req.user.id);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get weekly summary' })
  async getWeeklySummary(@Req() req: any) {
    return this.aiService.generateWeeklySummary(req.user.id);
  }
}
