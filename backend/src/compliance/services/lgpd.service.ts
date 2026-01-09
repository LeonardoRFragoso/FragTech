import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LgpdService {
  private readonly logger = new Logger(LgpdService.name);

  private readonly CONSENT_VERSION = '1.0.0';

  constructor(private readonly prisma: PrismaService) {}

  async grantConsent(
    userId: string,
    consentType: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const consent = await this.prisma.lgpdConsent.upsert({
      where: {
        userId_consentType: { userId, consentType: consentType as any },
      },
      create: {
        userId,
        consentType: consentType as any,
        isGranted: true,
        version: this.CONSENT_VERSION,
        ipAddress,
        userAgent,
        grantedAt: new Date(),
      },
      update: {
        isGranted: true,
        version: this.CONSENT_VERSION,
        ipAddress,
        userAgent,
        grantedAt: new Date(),
        revokedAt: null,
      },
    });

    this.logger.log(`LGPD consent granted: ${consentType} for user ${userId}`);
    return consent;
  }

  async revokeConsent(userId: string, consentType: string) {
    const consent = await this.prisma.lgpdConsent.update({
      where: {
        userId_consentType: { userId, consentType: consentType as any },
      },
      data: {
        isGranted: false,
        revokedAt: new Date(),
      },
    });

    this.logger.log(`LGPD consent revoked: ${consentType} for user ${userId}`);
    return consent;
  }

  async getUserConsents(userId: string) {
    return this.prisma.lgpdConsent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async hasConsent(userId: string, consentType: string): Promise<boolean> {
    const consent = await this.prisma.lgpdConsent.findUnique({
      where: {
        userId_consentType: { userId, consentType: consentType as any },
      },
    });
    return consent?.isGranted ?? false;
  }

  async requestDataDeletion(userId: string, requestType: string, reason?: string) {
    const request = await this.prisma.dataDeletionRequest.create({
      data: {
        userId,
        requestType,
        reason,
        status: 'pending',
      },
    });

    this.logger.log(`Data deletion requested: ${requestType} for user ${userId}`);
    return request;
  }

  async processDataDeletionRequest(requestId: string) {
    const request = await this.prisma.dataDeletionRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.status !== 'pending') {
      throw new Error('Invalid or already processed request');
    }

    await this.prisma.dataDeletionRequest.update({
      where: { id: requestId },
      data: {
        status: 'processing',
        processedAt: new Date(),
      },
    });

    try {
      const deletedData: Record<string, number> = {};
      const userId = request.userId;

      switch (request.requestType) {
        case 'FULL_DELETION':
          // Delete all user data (cascade will handle related records)
          deletedData.user = 1;
          await this.prisma.user.delete({ where: { id: userId } });
          break;

        case 'ANONYMIZATION':
          // Anonymize user data instead of deleting
          await this.prisma.user.update({
            where: { id: userId },
            data: {
              email: `deleted_${userId}@anonymized.local`,
              fullName: 'Usuário Anônimo',
              cpf: null,
              phone: null,
              avatarUrl: null,
            },
          });
          deletedData.anonymized = 1;
          break;

        case 'MARKETING_DATA':
          // Revoke marketing consent and delete related data
          await this.revokeConsent(userId, 'MARKETING');
          deletedData.marketingConsent = 1;
          break;

        case 'ANALYTICS_DATA':
          // Revoke analytics consent
          await this.revokeConsent(userId, 'ANALYTICS');
          deletedData.analyticsConsent = 1;
          break;
      }

      await this.prisma.dataDeletionRequest.update({
        where: { id: requestId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          deletedData,
        },
      });

      this.logger.log(`Data deletion completed: ${requestId}`);
      return { success: true, deletedData };
    } catch (error) {
      await this.prisma.dataDeletionRequest.update({
        where: { id: requestId },
        data: {
          status: 'failed',
          errorMessage: error.message,
        },
      });

      throw error;
    }
  }

  async getUserDeletionRequests(userId: string) {
    return this.prisma.dataDeletionRequest.findMany({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async exportUserData(userId: string) {
    const [user, account, transactions, consents] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          plan: true,
          financialProfile: true,
          createdAt: true,
        },
      }),
      this.prisma.account.findUnique({
        where: { userId },
        select: {
          accountNumber: true,
          agencyNumber: true,
          currency: true,
          createdAt: true,
        },
      }),
      this.prisma.transaction.findMany({
        where: { userId },
        select: {
          type: true,
          amount: true,
          description: true,
          category: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      }),
      this.prisma.lgpdConsent.findMany({
        where: { userId },
        select: {
          consentType: true,
          isGranted: true,
          grantedAt: true,
          revokedAt: true,
        },
      }),
    ]);

    return {
      exportedAt: new Date(),
      user,
      account,
      transactions,
      consents,
    };
  }

  async getRequiredConsents() {
    return [
      { type: 'DATA_PROCESSING', required: true, description: 'Processamento de dados pessoais' },
      { type: 'MARKETING', required: false, description: 'Comunicações de marketing' },
      { type: 'THIRD_PARTY_SHARING', required: false, description: 'Compartilhamento com terceiros' },
      { type: 'ANALYTICS', required: false, description: 'Análise de uso da plataforma' },
      { type: 'AI_PERSONALIZATION', required: false, description: 'Personalização por IA' },
    ];
  }
}
