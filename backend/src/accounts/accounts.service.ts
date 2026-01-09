import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async getAccount(userId: string) {
    const account = await this.prisma.account.findUnique({
      where: { userId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async getBalance(userId: string) {
    const account = await this.getAccount(userId);
    return {
      balance: account.balance,
      currency: account.currency,
      accountNumber: account.accountNumber,
      agencyNumber: account.agencyNumber,
    };
  }

  async deposit(userId: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const account = await this.prisma.account.update({
      where: { userId },
      data: {
        balance: { increment: amount },
      },
    });

    await this.prisma.transaction.create({
      data: {
        userId,
        type: 'DEPOSIT',
        amount: new Decimal(amount),
        description: 'Deposit',
        category: 'income',
        status: 'COMPLETED',
      },
    });

    return account;
  }

  async withdraw(userId: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const account = await this.getAccount(userId);

    if (Number(account.balance) < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const updatedAccount = await this.prisma.account.update({
      where: { userId },
      data: {
        balance: { decrement: amount },
      },
    });

    await this.prisma.transaction.create({
      data: {
        userId,
        type: 'WITHDRAWAL',
        amount: new Decimal(-amount),
        description: 'Withdrawal',
        category: 'transfer',
        status: 'COMPLETED',
      },
    });

    return updatedAccount;
  }

  async transfer(fromUserId: string, toAccountNumber: string, amount: number, description?: string) {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const fromAccount = await this.getAccount(fromUserId);

    if (Number(fromAccount.balance) < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const toAccount = await this.prisma.account.findUnique({
      where: { accountNumber: toAccountNumber },
      include: { user: true },
    });

    if (!toAccount) {
      throw new NotFoundException('Destination account not found');
    }

    if (fromAccount.id === toAccount.id) {
      throw new BadRequestException('Cannot transfer to the same account');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { userId: fromUserId },
        data: { balance: { decrement: amount } },
      });

      await tx.account.update({
        where: { id: toAccount.id },
        data: { balance: { increment: amount } },
      });

      const outTransaction = await tx.transaction.create({
        data: {
          userId: fromUserId,
          type: 'PIX_OUT',
          amount: new Decimal(-amount),
          description: description || `Transfer to ${toAccount.user.fullName}`,
          category: 'transfer',
          recipient: toAccount.user.fullName,
          status: 'COMPLETED',
        },
      });

      await tx.transaction.create({
        data: {
          userId: toAccount.userId,
          type: 'PIX_IN',
          amount: new Decimal(amount),
          description: `Transfer received`,
          category: 'income',
          status: 'COMPLETED',
        },
      });

      return outTransaction;
    });

    return result;
  }
}
