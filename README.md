# FragTech - AI-Powered Financial Intelligence Platform

A modern, disruptive B2C fintech platform that centralizes personal financial management with AI-driven insights and premium user experience.

## Overview

FragTech is a next-generation financial platform designed for individuals who want complete control over their finances with the power of artificial intelligence. The platform combines banking services, intelligent financial analysis, and a conversational AI copilot to transform how people manage money.

## Key Features

### Core Banking
- Digital account with real-time balance
- Virtual and physical cards
- PIX transfers and payments
- Bill payments and scheduling
- Intelligent transaction categorization

### AI Copilot
- Conversational financial assistant
- Personalized spending insights
- Proactive recommendations
- Goal tracking and suggestions
- Behavioral pattern analysis

### Financial Intelligence
- Automatic expense categorization
- Monthly income and spending tracking
- Savings goal progress
- Credit score monitoring
- Smart alerts and notifications

### User Experience
- Dark mode premium interface
- Glassmorphism design system
- Smooth animations with Framer Motion
- Mobile-first responsive design
- Minimal, technical aesthetic

## Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Auth**: Supabase (for demo) / Backend JWT

### Backend (NestJS)
- **Framework**: NestJS 10
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT + Passport.js
- **AI**: OpenAI GPT-4 Integration
- **Docs**: Swagger/OpenAPI
- **Security**: Helmet, Rate Limiting, bcrypt

## Project Structure

### Frontend (`/src`)
```
src/
├── components/
│   ├── ui/              # Reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── GlassCard.tsx
│   └── dashboard/       # Dashboard-specific components
│       ├── TransactionItem.tsx
│       └── AICopilot.tsx
├── contexts/
│   └── AuthContext.tsx  # Authentication state management
├── pages/
│   ├── Landing.tsx      # Landing page with features/pricing
│   ├── Login.tsx        # Authentication page
│   ├── SignUp.tsx       # Registration page
│   ├── Onboarding.tsx   # 3-step onboarding flow
│   └── Dashboard.tsx    # Main financial dashboard
├── lib/
│   ├── supabase.ts      # Supabase client and types
│   └── mockData.ts      # Mock financial data
└── App.tsx              # Main app router
```

### Backend (`/backend`)
```
backend/
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Demo data seeding
├── src/
│   ├── auth/            # JWT authentication
│   ├── users/           # User management
│   ├── accounts/        # Account operations
│   ├── transactions/    # Transaction handling
│   ├── cards/           # Card management
│   ├── goals/           # Financial goals
│   ├── insights/        # AI insights
│   ├── ai/              # OpenAI integration
│   ├── prisma/          # Database service
│   ├── app.module.ts    # Main module
│   └── main.ts          # Application entry
└── package.json
```

## Database Schema

### user_profiles
Extended user profile data
- Full name, phone, balance
- Credit score, financial profile
- Monthly income, onboarding status

### transactions
Financial transactions (PIX, payments, transfers)
- Type, amount, description
- Category, recipient, status
- Timestamp and user reference

### ai_insights
AI-generated insights and recommendations
- Type (warning, tip, opportunity, achievement)
- Title, message, action data
- Read status, timestamp

### financial_goals
User-defined or AI-suggested goals
- Title, target amount, current progress
- Deadline, category, status

### cards
Virtual and physical card management
- Type, brand, last four digits
- Status, limit, international settings

## Security Features

- Row Level Security (RLS) enabled on all tables
- Authenticated user policies
- Ownership-based access control
- Encrypted authentication with Supabase Auth
- Secure session management

## Design System

### Colors
- **Base**: Dark navy/charcoal backgrounds
- **Accent**: Cyan electric blue (#06B6D4)
- **Gradients**: Cyan to blue for primary actions
- **Status**: Green (positive), Red (negative), Gray (neutral)

### Typography
- **Headings**: Bold, sans-serif
- **Body**: Regular, readable
- **Numbers**: Monospace font for precision

### Components
- **GlassCard**: Frosted glass effect with backdrop blur
- **Button**: Gradient primary, ghost secondary, smooth animations
- **Input**: Dark with cyan focus ring
- **Animations**: Subtle entrance, hover effects, page transitions

## Getting Started

### Frontend

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run development server:
```bash
npm run dev
```

### Backend

1. Navigate to backend directory:
```bash
cd backend
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database and OpenAI credentials
```

3. Setup database:
```bash
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
```

4. Start the server:
```bash
npm run start:dev
```

5. Access API documentation:
```
http://localhost:3000/api/docs
```

### Demo Credentials
- Email: `demo@fragtech.io`
- Password: `Demo123!`

## User Journey

1. **Authentication**: User signs up or logs in
2. **Onboarding**: 3-step process to set financial profile, goals, and AI preferences
3. **Dashboard**: Access to balance, transactions, insights, and AI copilot
4. **AI Interaction**: Conversational interface for financial guidance
5. **Financial Management**: Track spending, set goals, manage cards

## Future Roadmap

- Open Finance integration
- Real transaction processing
- Advanced AI models for predictions
- Investment recommendations
- Credit offerings
- Marketplace for financial products
- Mobile native apps (iOS/Android)

## Target Audience

- Young adults (25-40 years)
- Digital-first users
- Professionals, freelancers, and self-employed
- Users seeking financial control and intelligence
- Tech-savvy individuals who value automation

## Competitive Advantages

1. **AI-First Approach**: Not just analytics, but actionable intelligence
2. **Premium UX**: Technical, minimal, and sophisticated design
3. **Proactive Assistance**: AI that guides, not just reports
4. **Seamless Integration**: All financial needs in one platform
5. **Modern Architecture**: Scalable, secure, and performant

## License

Proprietary - All rights reserved

## Contact

FragTech Team
Built with precision engineering and financial expertise
