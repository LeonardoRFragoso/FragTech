import { IsString, IsNumber, IsOptional, IsEnum, IsUUID, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum PixTransactionType {
  TRANSFER = 'TRANSFER',
  PAYMENT = 'PAYMENT',
  WITHDRAWAL = 'WITHDRAWAL',
  QR_CODE = 'QR_CODE',
  SCHEDULED = 'SCHEDULED',
}

export class SendPixDto {
  @ApiProperty({ description: 'Receiver PIX key (CPF, email, phone, or random key)' })
  @IsString()
  receiverKey: string;

  @ApiProperty({ description: 'Amount to transfer in BRL', minimum: 0.01, maximum: 100000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(100000)
  @Type(() => Number)
  amount: number;

  @ApiProperty({ description: 'Transaction description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: PixTransactionType, default: PixTransactionType.TRANSFER })
  @IsEnum(PixTransactionType)
  @IsOptional()
  type?: PixTransactionType;

  @ApiProperty({ description: 'Sender PIX key ID (uses primary if not provided)', required: false })
  @IsUUID()
  @IsOptional()
  senderKeyId?: string;

  @ApiProperty({ description: 'Schedule date for future transfer', required: false })
  @IsDateString()
  @IsOptional()
  scheduledFor?: string;
}

export class PixQrCodeDto {
  @ApiProperty({ description: 'Amount for QR Code (optional for dynamic QR)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @IsOptional()
  @Type(() => Number)
  amount?: number;

  @ApiProperty({ description: 'Description for the QR Code', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Transaction ID for tracking', required: false })
  @IsString()
  @IsOptional()
  txId?: string;
}

export class ReadQrCodeDto {
  @ApiProperty({ description: 'QR Code payload (EMV format)' })
  @IsString()
  payload: string;
}
