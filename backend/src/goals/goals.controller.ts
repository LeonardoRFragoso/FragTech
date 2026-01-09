import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('goals')
@Controller('goals')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all user goals' })
  async findAll(@Req() req: any) {
    return this.goalsService.findAll(req.user.id);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active goals' })
  async findActive(@Req() req: any) {
    return this.goalsService.findActive(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new goal' })
  async create(@Req() req: any, @Body() dto: CreateGoalDto) {
    return this.goalsService.create(req.user.id, dto);
  }

  @Patch(':id/progress')
  @ApiOperation({ summary: 'Add progress to a goal' })
  async addProgress(
    @Req() req: any,
    @Param('id') id: string,
    @Body('amount') amount: number,
  ) {
    return this.goalsService.addProgress(req.user.id, id, amount);
  }

  @Patch(':id/abandon')
  @ApiOperation({ summary: 'Abandon a goal' })
  async abandon(@Req() req: any, @Param('id') id: string) {
    return this.goalsService.abandon(req.user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a goal' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.goalsService.delete(req.user.id, id);
  }
}
