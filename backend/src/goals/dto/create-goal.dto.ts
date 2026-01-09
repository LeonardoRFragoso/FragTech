import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGoalDto {
  @ApiProperty({ example: 'Emergency Fund' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(1)
  targetAmount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deadline?: string;

  @ApiProperty({ enum: ['SAVINGS', 'INVESTMENT', 'DEBT_PAYMENT', 'EMERGENCY', 'TRAVEL', 'OTHER'] })
  @IsEnum(['SAVINGS', 'INVESTMENT', 'DEBT_PAYMENT', 'EMERGENCY', 'TRAVEL', 'OTHER'])
  category: 'SAVINGS' | 'INVESTMENT' | 'DEBT_PAYMENT' | 'EMERGENCY' | 'TRAVEL' | 'OTHER';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  color?: string;
}
