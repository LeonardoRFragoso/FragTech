import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InstitutionMockService } from '../providers/institution-mock.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ConsentService {
  private readonly logger = new Logger(ConsentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly institutionService: InstitutionMockService,
  ) {}

  async initiateConsent(userId: string, institutionCode: string, scopes: string[]) {
    // Verify institution exists
    const institution = await this.prisma.openFinanceInstitution.findUnique({
      where: { code: institutionCode },
    });

    if (!institution) {
      // Create institution if not exists (for mock purposes)
      const mockInstitution = this.institutionService.getInstitutionByCode(institutionCode);
      if (!mockInstitution) {
        throw new BadRequestException('Instituição não encontrada');
      }

      await this.prisma.openFinanceInstitution.create({
        data: {
          code: mockInstitution.code,
          name: mockInstitution.name,
          logoUrl: mockInstitution.logoUrl,
          apiBaseUrl: `https://api.${mockInstitution.code.toLowerCase()}.mock.com`,
          supportedScopes: mockInstitution.supportedScopes,
        },
      });
    }

    const inst = await this.prisma.openFinanceInstitution.findUnique({
      where: { code: institutionCode },
    });

    // Check for existing active consent
    const existingConsent = await this.prisma.openFinanceConsent.findFirst({
      where: {
        userId,
        institutionId: inst!.id,
        status: { in: ['PENDING', 'AUTHORIZED'] },
      },
    });

    if (existingConsent) {
      if (existingConsent.status === 'AUTHORIZED') {
        throw new BadRequestException('Já existe um consentimento ativo para esta instituição');
      }
      // Cancel pending consent
      await this.prisma.openFinanceConsent.update({
        where: { id: existingConsent.id },
        data: { status: 'REJECTED' },
      });
    }

    // Create new consent
    const state = uuidv4();
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year

    const consent = await this.prisma.openFinanceConsent.create({
      data: {
        userId,
        institutionId: inst!.id,
        scopes,
        expiresAt,
        consentId: state, // Using state as temporary consent ID
      },
    });

    // Generate authorization URL
    const authUrl = await this.institutionService.generateAuthorizationUrl(
      institutionCode,
      scopes,
      `${process.env.FRONTEND_URL}/open-finance/callback`,
      state,
    );

    this.logger.log(`Consent initiated for user ${userId} at ${institutionCode}`);

    return {
      consentId: consent.id,
      authorizationUrl: authUrl,
      expiresAt,
      scopes,
    };
  }

  async authorizeConsent(state: string, authorizationCode: string) {
    const consent = await this.prisma.openFinanceConsent.findUnique({
      where: { consentId: state },
      include: { institution: true },
    });

    if (!consent) {
      throw new NotFoundException('Consentimento não encontrado');
    }

    if (consent.status !== 'PENDING') {
      throw new BadRequestException('Consentimento já processado');
    }

    try {
      // Exchange authorization code for tokens
      const tokens = await this.institutionService.exchangeAuthorizationCode(
        consent.institution.code,
        authorizationCode,
      );

      // Update consent status
      await this.prisma.openFinanceConsent.update({
        where: { id: consent.id },
        data: {
          status: 'AUTHORIZED',
          authorizedAt: new Date(),
        },
      });

      // Create connection
      const connection = await this.prisma.openFinanceConnection.create({
        data: {
          userId: consent.userId,
          consentId: consent.id,
          institutionId: consent.institutionId,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
          syncStatus: 'pending',
        },
      });

      this.logger.log(`Consent authorized: ${consent.id}`);

      return {
        success: true,
        connectionId: connection.id,
        message: 'Conta conectada com sucesso',
      };
    } catch (error) {
      await this.prisma.openFinanceConsent.update({
        where: { id: consent.id },
        data: { status: 'REJECTED' },
      });

      throw new BadRequestException('Falha ao autorizar consentimento');
    }
  }

  async revokeConsent(consentId: string, userId: string) {
    const consent = await this.prisma.openFinanceConsent.findFirst({
      where: { id: consentId, userId, status: 'AUTHORIZED' },
      include: { institution: true, connection: true },
    });

    if (!consent) {
      throw new NotFoundException('Consentimento não encontrado');
    }

    // Revoke at institution
    await this.institutionService.revokeConsent(consent.institution.code, consent.consentId!);

    // Update consent
    await this.prisma.openFinanceConsent.update({
      where: { id: consentId },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
      },
    });

    // Deactivate connection
    if (consent.connection) {
      await this.prisma.openFinanceConnection.update({
        where: { id: consent.connection.id },
        data: { isActive: false },
      });
    }

    this.logger.log(`Consent revoked: ${consentId}`);

    return { message: 'Consentimento revogado com sucesso' };
  }

  async getUserConsents(userId: string) {
    const consents = await this.prisma.openFinanceConsent.findMany({
      where: { userId },
      include: {
        institution: true,
        connection: {
          include: {
            accounts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return consents.map(consent => ({
      id: consent.id,
      institution: {
        code: consent.institution.code,
        name: consent.institution.name,
        logoUrl: consent.institution.logoUrl,
      },
      status: consent.status,
      scopes: consent.scopes,
      authorizedAt: consent.authorizedAt,
      expiresAt: consent.expiresAt,
      connection: consent.connection ? {
        id: consent.connection.id,
        lastSyncAt: consent.connection.lastSyncAt,
        syncStatus: consent.connection.syncStatus,
        accountsCount: consent.connection.accounts.length,
      } : null,
    }));
  }

  async getConsentById(consentId: string, userId: string) {
    const consent = await this.prisma.openFinanceConsent.findFirst({
      where: { id: consentId, userId },
      include: {
        institution: true,
        connection: {
          include: {
            accounts: {
              include: {
                transactions: {
                  take: 10,
                  orderBy: { date: 'desc' },
                },
              },
            },
          },
        },
      },
    });

    if (!consent) {
      throw new NotFoundException('Consentimento não encontrado');
    }

    return consent;
  }
}
