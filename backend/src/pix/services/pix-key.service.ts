import { Injectable, BadRequestException, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PixValidationService } from './pix-validation.service';
import { PspMockService } from '../providers/psp-mock.service';
import { CreatePixKeyDto, PixKeyType } from '../dto/create-pix-key.dto';

@Injectable()
export class PixKeyService {
  private readonly logger = new Logger(PixKeyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly validationService: PixValidationService,
    private readonly pspService: PspMockService,
  ) {}

  async createKey(userId: string, dto: CreatePixKeyDto) {
    // Get user account
    const account = await this.prisma.account.findUnique({
      where: { userId },
    });

    if (!account) {
      throw new BadRequestException('Conta não encontrada. Complete o cadastro primeiro.');
    }

    // Generate random key if type is RANDOM
    let keyValue: string;
    if (dto.type === PixKeyType.RANDOM) {
      keyValue = this.validationService.generateRandomKey();
    } else {
      if (!dto.key) {
        throw new BadRequestException('Chave PIX é obrigatória para este tipo');
      }

      // Validate and format the key
      const validation = this.validationService.validatePixKey(dto.type, dto.key);
      if (!validation.isValid) {
        throw new BadRequestException(validation.error);
      }
      keyValue = validation.formattedKey;
    }

    // Check if key already exists
    const existingKey = await this.prisma.pixKey.findUnique({
      where: { key: keyValue },
    });

    if (existingKey) {
      throw new ConflictException('Esta chave PIX já está cadastrada');
    }

    // Check user's key limit (max 5 keys per user)
    const userKeysCount = await this.prisma.pixKey.count({
      where: { userId, isActive: true },
    });

    if (userKeysCount >= 5) {
      throw new BadRequestException('Limite máximo de 5 chaves PIX atingido');
    }

    // If setting as primary, unset other primary keys
    if (dto.isPrimary) {
      await this.prisma.pixKey.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    // Create the key
    const pixKey = await this.prisma.pixKey.create({
      data: {
        userId,
        accountId: account.id,
        type: dto.type as any,
        key: keyValue,
        isPrimary: dto.isPrimary || userKeysCount === 0, // First key is always primary
      },
    });

    this.logger.log(`PIX key created: ${dto.type} for user ${userId}`);

    return {
      id: pixKey.id,
      type: pixKey.type,
      key: pixKey.key,
      maskedKey: this.validationService.maskPixKey(dto.type, keyValue),
      isPrimary: pixKey.isPrimary,
      createdAt: pixKey.createdAt,
    };
  }

  async getUserKeys(userId: string) {
    const keys = await this.prisma.pixKey.findMany({
      where: { userId, isActive: true },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });

    return keys.map((key) => ({
      id: key.id,
      type: key.type,
      key: key.key,
      maskedKey: this.validationService.maskPixKey(key.type as PixKeyType, key.key),
      isPrimary: key.isPrimary,
      createdAt: key.createdAt,
    }));
  }

  async getKeyById(keyId: string, userId: string) {
    const key = await this.prisma.pixKey.findFirst({
      where: { id: keyId, userId, isActive: true },
    });

    if (!key) {
      throw new NotFoundException('Chave PIX não encontrada');
    }

    return key;
  }

  async getPrimaryKey(userId: string) {
    const key = await this.prisma.pixKey.findFirst({
      where: { userId, isPrimary: true, isActive: true },
    });

    return key;
  }

  async setPrimaryKey(keyId: string, userId: string) {
    const key = await this.getKeyById(keyId, userId);

    // Unset other primary keys
    await this.prisma.pixKey.updateMany({
      where: { userId, isPrimary: true },
      data: { isPrimary: false },
    });

    // Set this key as primary
    await this.prisma.pixKey.update({
      where: { id: keyId },
      data: { isPrimary: true },
    });

    this.logger.log(`Primary PIX key changed to ${keyId} for user ${userId}`);

    return { message: 'Chave definida como principal' };
  }

  async deleteKey(keyId: string, userId: string) {
    const key = await this.getKeyById(keyId, userId);

    // Check for pending transactions
    const pendingTransactions = await this.prisma.pixTransaction.count({
      where: {
        OR: [{ senderKeyId: keyId }, { receiverKeyId: keyId }],
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    });

    if (pendingTransactions > 0) {
      throw new BadRequestException(
        'Não é possível excluir uma chave com transações pendentes',
      );
    }

    // Soft delete
    await this.prisma.pixKey.update({
      where: { id: keyId },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
      },
    });

    // If was primary, set another key as primary
    if (key.isPrimary) {
      const anotherKey = await this.prisma.pixKey.findFirst({
        where: { userId, isActive: true },
        orderBy: { createdAt: 'asc' },
      });

      if (anotherKey) {
        await this.prisma.pixKey.update({
          where: { id: anotherKey.id },
          data: { isPrimary: true },
        });
      }
    }

    this.logger.log(`PIX key ${keyId} deactivated for user ${userId}`);

    return { message: 'Chave PIX excluída com sucesso' };
  }

  async lookupExternalKey(key: string) {
    // First check if it's an internal key
    const internalKey = await this.prisma.pixKey.findUnique({
      where: { key, isActive: true },
      include: {
        user: {
          select: {
            fullName: true,
            cpf: true,
          },
        },
      },
    });

    if (internalKey) {
      return {
        found: true,
        isInternal: true,
        key: internalKey.key,
        keyType: internalKey.type,
        ownerName: this.maskName(internalKey.user.fullName),
        bankName: 'FragTech',
        bankCode: '999', // Mock ISPB
      };
    }

    // Lookup in PSP (external)
    const pspResult = await this.pspService.lookupKey(key);

    if (pspResult.found) {
      return {
        ...pspResult,
        found: true,
        isInternal: false,
      };
    }

    return { found: false };
  }

  private maskName(name: string): string {
    const parts = name.split(' ');
    if (parts.length === 1) {
      return `${parts[0][0]}***`;
    }
    return `${parts[0]} ${parts[parts.length - 1][0]}***`;
  }
}
