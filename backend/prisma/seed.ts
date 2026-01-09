import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('Demo123!', 12);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@fragtech.io' },
    update: {},
    create: {
      email: 'demo@fragtech.io',
      passwordHash,
      fullName: 'Demo User',
      plan: 'PRO',
      financialProfile: 'MODERATE',
      monthlyIncome: 5000,
      creditScore: 720,
      onboardingCompleted: true,
      aiPreference: 'balanced',
      account: {
        create: {
          balance: 3847.50,
          accountNumber: '123456789',
          agencyNumber: '0001',
        },
      },
    },
  });

  console.log('👤 Demo user created:', demoUser.email);

  await prisma.card.createMany({
    data: [
      {
        userId: demoUser.id,
        type: 'VIRTUAL',
        lastFour: '4532',
        brand: 'Mastercard',
        status: 'ACTIVE',
        limitAmount: 2000,
        expiresAt: new Date('2029-12-31'),
      },
      {
        userId: demoUser.id,
        type: 'PHYSICAL',
        lastFour: '8721',
        brand: 'Mastercard',
        status: 'ACTIVE',
        limitAmount: 5000,
        expiresAt: new Date('2029-12-31'),
      },
    ],
    skipDuplicates: true,
  });

  console.log('💳 Cards created');

  const transactions = [
    { type: 'PIX_IN', amount: 5000, description: 'Salary - Company XYZ', category: 'income', daysAgo: 5 },
    { type: 'CARD_PURCHASE', amount: -89.90, description: 'Restaurant - Italian Bistro', category: 'food', daysAgo: 1 },
    { type: 'PAYMENT', amount: -150.00, description: 'Internet Bill - ISP Provider', category: 'bills', daysAgo: 3 },
    { type: 'CARD_PURCHASE', amount: -45.50, description: 'Uber Ride', category: 'transport', daysAgo: 0 },
    { type: 'PIX_OUT', amount: -200.00, description: 'Transfer to João Silva', category: 'transfer', daysAgo: 2 },
    { type: 'CARD_PURCHASE', amount: -320.00, description: 'Supermarket - Weekly Shopping', category: 'shopping', daysAgo: 4 },
    { type: 'CARD_PURCHASE', amount: -59.90, description: 'Netflix Subscription', category: 'entertainment', daysAgo: 7 },
    { type: 'CARD_PURCHASE', amount: -120.00, description: 'Pharmacy - Health Products', category: 'health', daysAgo: 6 },
    { type: 'PIX_IN', amount: 250.00, description: 'Freelance Payment', category: 'income', daysAgo: 10 },
    { type: 'CARD_PURCHASE', amount: -85.00, description: 'Gas Station', category: 'transport', daysAgo: 8 },
  ];

  for (const tx of transactions) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - tx.daysAgo);

    await prisma.transaction.create({
      data: {
        userId: demoUser.id,
        type: tx.type as any,
        amount: tx.amount,
        description: tx.description,
        category: tx.category,
        status: 'COMPLETED',
        createdAt,
      },
    });
  }

  console.log('💸 Transactions created');

  await prisma.financialGoal.createMany({
    data: [
      {
        userId: demoUser.id,
        title: 'Emergency Fund',
        description: 'Save 6 months of expenses',
        targetAmount: 15000,
        currentAmount: 3500,
        category: 'EMERGENCY',
        status: 'ACTIVE',
        icon: '🛡️',
        color: '#22c55e',
      },
      {
        userId: demoUser.id,
        title: 'Vacation Trip',
        description: 'Trip to Europe',
        targetAmount: 8000,
        currentAmount: 1200,
        category: 'TRAVEL',
        status: 'ACTIVE',
        deadline: new Date('2025-06-01'),
        icon: '✈️',
        color: '#3b82f6',
      },
    ],
    skipDuplicates: true,
  });

  console.log('🎯 Goals created');

  await prisma.aIInsight.createMany({
    data: [
      {
        userId: demoUser.id,
        type: 'TIP',
        title: 'Save R$ 420/month',
        message: 'You can save R$ 420 per month by optimizing these 3 spending categories: food delivery, entertainment subscriptions, and impulse shopping.',
        actionLabel: 'View Details',
        estimatedImpact: 420,
      },
      {
        userId: demoUser.id,
        type: 'ACHIEVEMENT',
        title: 'Great progress!',
        message: 'You spent 15% less this month compared to last month. Keep it up!',
      },
      {
        userId: demoUser.id,
        type: 'OPPORTUNITY',
        title: 'Investment opportunity',
        message: 'Based on your profile, you have R$ 500 that could be invested. Start with low-risk options.',
        actionLabel: 'Explore',
      },
    ],
    skipDuplicates: true,
  });

  console.log('💡 Insights created');

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
