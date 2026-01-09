import { IsEnum, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OnboardingDto {
  @ApiProperty({ enum: ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'] })
  @IsEnum(['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'])
  financialProfile: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  monthlyIncome: number;

  @ApiProperty({ example: 'balanced' })
  @IsString()
  aiPreference: string;
}
