import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { InsightsService } from '../insights/insights.service';

@Injectable()
export class AIService {
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private transactionsService: TransactionsService,
    private insightsService: InsightsService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async chat(userId: string, message: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { account: true },
    });

    const stats = await this.transactionsService.getMonthlyStats(userId);
    const categories = await this.transactionsService.getCategoryBreakdown(userId);

    await this.prisma.chatMessage.create({
      data: {
        userId,
        role: 'user',
        content: message,
      },
    });

    const systemPrompt = this.buildSystemPrompt(user, stats, categories);

    const recentMessages = await this.prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...recentMessages.reverse().map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    try {
      if (!this.openai) {
        return this.getMockResponse(message, stats, categories);
      }

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content || 'I apologize, I could not generate a response.';

      await this.prisma.chatMessage.create({
        data: {
          userId,
          role: 'assistant',
          content: response,
        },
      });

      return response;
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.getMockResponse(message, stats, categories);
    }
  }

  async analyzeSpending(userId: string) {
    const stats = await this.transactionsService.getMonthlyStats(userId);
    const categories = await this.transactionsService.getCategoryBreakdown(userId);

    const topCategories = categories.slice(0, 3);
    const potentialSavings = topCategories.reduce((sum, cat) => {
      const savingPercentage = cat.category === 'food' ? 0.3 : 0.2;
      return sum + cat.total * savingPercentage;
    }, 0);

    const insights = [];

    if (potentialSavings > 100) {
      insights.push({
        type: 'TIP' as const,
        title: `Save R$ ${potentialSavings.toFixed(0)}/month`,
        message: `By optimizing spending in ${topCategories.map((c) => c.category).join(', ')}, you could save significantly.`,
        estimatedImpact: potentialSavings,
      });
    }

    if (stats.expenses > stats.income * 0.8) {
      insights.push({
        type: 'WARNING' as const,
        title: 'High spending alert',
        message: 'Your expenses are over 80% of your income this month. Consider reducing non-essential spending.',
      });
    }

    if (stats.net > 0 && stats.net > stats.income * 0.2) {
      insights.push({
        type: 'ACHIEVEMENT' as const,
        title: 'Great savings!',
        message: `You've saved ${((stats.net / stats.income) * 100).toFixed(0)}% of your income this month. Keep it up!`,
      });
    }

    for (const insight of insights) {
      await this.insightsService.createInsight(userId, insight);
    }

    return {
      stats,
      categories,
      insights,
      potentialSavings,
    };
  }

  async generateWeeklySummary(userId: string) {
    const stats = await this.transactionsService.getMonthlyStats(userId);

    return {
      period: 'This week',
      income: stats.income,
      expenses: stats.expenses,
      net: stats.net,
      topCategory: Object.entries(stats.byCategory).sort(([, a], [, b]) => (b as number) - (a as number))[0],
      insight: stats.net > 0
        ? `Great week! You saved R$ ${stats.net.toFixed(2)}.`
        : `You overspent by R$ ${Math.abs(stats.net).toFixed(2)} this week.`,
    };
  }

  private buildSystemPrompt(user: any, stats: any, categories: any[]): string {
    return `You are FragTech AI Copilot, a sophisticated financial assistant for a Brazilian fintech platform.
    
User Profile:
- Name: ${user?.fullName || 'User'}
- Balance: R$ ${Number(user?.account?.balance || 0).toFixed(2)}
- Financial Profile: ${user?.financialProfile || 'MODERATE'}
- Monthly Income: R$ ${Number(user?.monthlyIncome || 0).toFixed(2)}

This Month's Statistics:
- Income: R$ ${stats.income.toFixed(2)}
- Expenses: R$ ${stats.expenses.toFixed(2)}
- Net: R$ ${stats.net.toFixed(2)}

Top Spending Categories:
${categories.slice(0, 5).map((c) => `- ${c.category}: R$ ${c.total.toFixed(2)} (${c.count} transactions)`).join('\n')}

Guidelines:
1. Be helpful, concise, and actionable
2. Provide specific financial advice based on user data
3. Use Brazilian Real (R$) for all amounts
4. Be encouraging but realistic
5. Suggest ways to save money when appropriate
6. Never share sensitive account details
7. Respond in a professional yet friendly tone
8. If asked about investments, provide educational guidance only`;
  }

  private getMockResponse(message: string, stats: any, categories: any[]): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('save') || lowerMessage.includes('economy')) {
      const topCategory = categories[0];
      return `Based on your spending patterns, you could save around R$ ${(topCategory?.total * 0.2 || 100).toFixed(0)}/month by optimizing your ${topCategory?.category || 'food'} expenses. Would you like me to create a savings goal for you?`;
    }

    if (lowerMessage.includes('spending') || lowerMessage.includes('expense')) {
      return `This month you've spent R$ ${stats.expenses.toFixed(2)} across ${stats.transactionCount} transactions. Your top spending category is ${categories[0]?.category || 'general expenses'}. Would you like a detailed breakdown?`;
    }

    if (lowerMessage.includes('invest') || lowerMessage.includes('investimento')) {
      return `Based on your current savings rate and financial profile, I'd recommend starting with low-risk investments. You have approximately R$ ${(stats.net > 0 ? stats.net : 0).toFixed(2)} available this month. Would you like to explore investment options?`;
    }

    if (lowerMessage.includes('balance') || lowerMessage.includes('saldo')) {
      return `Your current balance reflects your recent transactions. This month you've had a net ${stats.net >= 0 ? 'positive' : 'negative'} flow of R$ ${Math.abs(stats.net).toFixed(2)}. Is there anything specific you'd like to analyze?`;
    }

    return `I've analyzed your financial data. This month you earned R$ ${stats.income.toFixed(2)} and spent R$ ${stats.expenses.toFixed(2)}, resulting in a ${stats.net >= 0 ? 'surplus' : 'deficit'} of R$ ${Math.abs(stats.net).toFixed(2)}. How can I help you optimize your finances?`;
  }
}
