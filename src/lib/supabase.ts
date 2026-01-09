import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserProfile = {
  id: string;
  full_name: string;
  phone: string | null;
  balance: number;
  credit_score: number;
  onboarding_completed: boolean;
  financial_profile: 'conservative' | 'moderate' | 'aggressive';
  monthly_income: number;
  created_at: string;
  updated_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  type: 'pix_in' | 'pix_out' | 'payment' | 'transfer' | 'card_purchase';
  amount: number;
  description: string;
  category: string;
  recipient: string | null;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
};

export type AIInsight = {
  id: string;
  user_id: string;
  type: 'warning' | 'tip' | 'opportunity' | 'achievement';
  title: string;
  message: string;
  action_label: string | null;
  action_data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
};

export type FinancialGoal = {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  category: 'savings' | 'investment' | 'debt_payment';
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
};

export type Card = {
  id: string;
  user_id: string;
  type: 'virtual' | 'physical';
  last_four: string;
  brand: string;
  status: 'active' | 'blocked' | 'cancelled';
  limit_amount: number;
  is_international_enabled: boolean;
  created_at: string;
};
