import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface MockInstitution {
  code: string;
  name: string;
  logoUrl: string;
  supportedScopes: string[];
}

export interface MockAccount {
  id: string;
  type: string;
  name: string;
  balance: number;
  currency: string;
}

export interface MockTransaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: Date;
  type: string;
}

/**
 * Mock Open Finance Institution Service
 * 
 * Simulates integration with Open Finance participant institutions.
 * In production, this would connect to real bank APIs via Open Finance Brasil.
 */
@Injectable()
export class InstitutionMockService {
  private readonly logger = new Logger(InstitutionMockService.name);

  private readonly institutions: MockInstitution[] = [
    {
      code: 'ITAU',
      name: 'Itaú Unibanco',
      logoUrl: 'https://example.com/itau-logo.png',
      supportedScopes: ['accounts', 'transactions', 'credit_cards'],
    },
    {
      code: 'BRADESCO',
      name: 'Bradesco',
      logoUrl: 'https://example.com/bradesco-logo.png',
      supportedScopes: ['accounts', 'transactions', 'credit_cards', 'investments'],
    },
    {
      code: 'NUBANK',
      name: 'Nubank',
      logoUrl: 'https://example.com/nubank-logo.png',
      supportedScopes: ['accounts', 'transactions', 'credit_cards'],
    },
    {
      code: 'INTER',
      name: 'Banco Inter',
      logoUrl: 'https://example.com/inter-logo.png',
      supportedScopes: ['accounts', 'transactions', 'investments'],
    },
    {
      code: 'BB',
      name: 'Banco do Brasil',
      logoUrl: 'https://example.com/bb-logo.png',
      supportedScopes: ['accounts', 'transactions', 'credit_cards', 'investments', 'loans'],
    },
  ];

  getAvailableInstitutions(): MockInstitution[] {
    return this.institutions;
  }

  getInstitutionByCode(code: string): MockInstitution | undefined {
    return this.institutions.find(i => i.code === code);
  }

  /**
   * Simulate OAuth authorization URL generation
   */
  async generateAuthorizationUrl(
    institutionCode: string,
    scopes: string[],
    redirectUri: string,
    state: string,
  ): Promise<string> {
    this.logger.log(`Generating auth URL for ${institutionCode} with scopes: ${scopes.join(', ')}`);
    
    // In production, this would return the real OAuth URL
    const baseUrl = `https://mock-openfinance.fragtech.com/auth/${institutionCode}`;
    const params = new URLSearchParams({
      scopes: scopes.join(','),
      redirect_uri: redirectUri,
      state,
      response_type: 'code',
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Simulate token exchange
   */
  async exchangeAuthorizationCode(
    institutionCode: string,
    authorizationCode: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    this.logger.log(`Exchanging authorization code for ${institutionCode}`);

    // Simulate network latency
    await this.simulateLatency(500, 1000);

    return {
      accessToken: `mock_access_${uuidv4()}`,
      refreshToken: `mock_refresh_${uuidv4()}`,
      expiresIn: 3600, // 1 hour
    };
  }

  /**
   * Simulate token refresh
   */
  async refreshAccessToken(
    institutionCode: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    this.logger.log(`Refreshing token for ${institutionCode}`);

    await this.simulateLatency(300, 600);

    return {
      accessToken: `mock_access_${uuidv4()}`,
      refreshToken: `mock_refresh_${uuidv4()}`,
      expiresIn: 3600,
    };
  }

  /**
   * Simulate fetching accounts from institution
   */
  async fetchAccounts(
    institutionCode: string,
    accessToken: string,
  ): Promise<MockAccount[]> {
    this.logger.log(`Fetching accounts from ${institutionCode}`);

    await this.simulateLatency(500, 1500);

    // Generate mock accounts based on institution
    const accounts: MockAccount[] = [
      {
        id: `${institutionCode}_CC_${uuidv4().slice(0, 8)}`,
        type: 'CHECKING',
        name: 'Conta Corrente',
        balance: this.randomBalance(1000, 50000),
        currency: 'BRL',
      },
      {
        id: `${institutionCode}_SAV_${uuidv4().slice(0, 8)}`,
        type: 'SAVINGS',
        name: 'Poupança',
        balance: this.randomBalance(500, 20000),
        currency: 'BRL',
      },
    ];

    // Some institutions might have investment accounts
    if (['BRADESCO', 'BB', 'INTER'].includes(institutionCode)) {
      accounts.push({
        id: `${institutionCode}_INV_${uuidv4().slice(0, 8)}`,
        type: 'INVESTMENT',
        name: 'Investimentos',
        balance: this.randomBalance(5000, 100000),
        currency: 'BRL',
      });
    }

    return accounts;
  }

  /**
   * Simulate fetching transactions from institution
   */
  async fetchTransactions(
    institutionCode: string,
    accessToken: string,
    accountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<MockTransaction[]> {
    this.logger.log(`Fetching transactions from ${institutionCode} for account ${accountId}`);

    await this.simulateLatency(1000, 3000);

    // Generate mock transactions
    const transactions: MockTransaction[] = [];
    const categories = ['food', 'transport', 'shopping', 'entertainment', 'bills', 'salary', 'transfer'];
    const descriptions = {
      food: ['Restaurante', 'iFood', 'Supermercado', 'Padaria', 'Lanchonete'],
      transport: ['Uber', '99', 'Posto de Gasolina', 'Estacionamento', 'Bilhete Único'],
      shopping: ['Amazon', 'Mercado Livre', 'Magazine Luiza', 'Lojas Americanas'],
      entertainment: ['Netflix', 'Spotify', 'Cinema', 'Steam', 'PlayStation'],
      bills: ['Conta de Luz', 'Internet', 'Celular', 'Água', 'Gás'],
      salary: ['Salário', 'Freelance', 'Bônus'],
      transfer: ['PIX Recebido', 'TED Recebido', 'Transferência'],
    };

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const numTransactions = Math.min(daysDiff * 3, 100); // ~3 transactions per day

    for (let i = 0; i < numTransactions; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const isIncome = ['salary', 'transfer'].includes(category) && Math.random() > 0.3;
      const descList = descriptions[category as keyof typeof descriptions];
      
      transactions.push({
        id: `${institutionCode}_TX_${uuidv4().slice(0, 12)}`,
        amount: isIncome ? this.randomBalance(100, 5000) : -this.randomBalance(10, 500),
        description: descList[Math.floor(Math.random() * descList.length)],
        category,
        date: new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())),
        type: isIncome ? 'CREDIT' : 'DEBIT',
      });
    }

    // Sort by date descending
    return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Simulate revoking consent at institution
   */
  async revokeConsent(institutionCode: string, consentId: string): Promise<boolean> {
    this.logger.log(`Revoking consent ${consentId} at ${institutionCode}`);

    await this.simulateLatency(300, 800);

    // Simulate occasional failures
    return Math.random() > 0.05;
  }

  private randomBalance(min: number, max: number): number {
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
  }

  private simulateLatency(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}
