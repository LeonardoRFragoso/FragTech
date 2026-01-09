import { IsEnum, IsString, IsOptional, Matches, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PixKeyType {
  CPF = 'CPF',
  CNPJ = 'CNPJ',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  RANDOM = 'RANDOM',
}

export class CreatePixKeyDto {
  @ApiProperty({ enum: PixKeyType, description: 'Type of PIX key' })
  @IsEnum(PixKeyType)
  type: PixKeyType;

  @ApiProperty({ description: 'PIX key value (not required for RANDOM type)', required: false })
  @ValidateIf((o) => o.type !== PixKeyType.RANDOM)
  @IsString()
  @IsOptional()
  key?: string;

  @ApiProperty({ description: 'Set as primary key', required: false, default: false })
  @IsOptional()
  isPrimary?: boolean;
}

export class ValidatePixKeyDto {
  @ApiProperty({ enum: PixKeyType })
  @IsEnum(PixKeyType)
  type: PixKeyType;

  @ApiProperty()
  @IsString()
  key: string;
}
