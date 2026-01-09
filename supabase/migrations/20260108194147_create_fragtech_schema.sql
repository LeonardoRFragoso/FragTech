/*
  # FragTech Financial Platform Schema

  ## Overview
  Complete database schema for FragTech B2C fintech platform with AI-powered financial management.

  ## Tables Created
  
  ### 1. user_profiles
  Extended user profile data complementing auth.users
  - `id` (uuid, references auth.users)
  - `full_name` (text)
  - `phone` (text)
  - `balance` (numeric, default 0)
  - `credit_score` (integer, default 0)
  - `onboarding_completed` (boolean, default false)
  - `financial_profile` (text) - risk profile: conservative, moderate, aggressive
  - `monthly_income` (numeric)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. transactions
  Financial transactions (PIX, payments, transfers, etc)
  - `id` (uuid, primary key)
  - `user_id` (uuid, references user_profiles)
  - `type` (text) - pix_in, pix_out, payment, transfer, card_purchase
  - `amount` (numeric)
  - `description` (text)
  - `category` (text) - food, transport, bills, shopping, etc
  - `recipient` (text)
  - `status` (text) - completed, pending, failed
  - `created_at` (timestamptz)

  ### 3. ai_insights
  AI-generated financial insights and recommendations
  - `id` (uuid, primary key)
  - `user_id` (uuid, references user_profiles)
  - `type` (text) - warning, tip, opportunity, achievement
  - `title` (text)
  - `message` (text)
  - `action_label` (text)
  - `action_data` (jsonb)
  - `is_read` (boolean, default false)
  - `created_at` (timestamptz)

  ### 4. financial_goals
  User-defined or AI-suggested financial goals
  - `id` (uuid, primary key)
  - `user_id` (uuid, references user_profiles)
  - `title` (text)
  - `target_amount` (numeric)
  - `current_amount` (numeric, default 0)
  - `deadline` (date)
  - `category` (text) - savings, investment, debt_payment
  - `status` (text) - active, completed, abandoned
  - `created_at` (timestamptz)

  ### 5. cards
  Virtual and physical cards
  - `id` (uuid, primary key)
  - `user_id` (uuid, references user_profiles)
  - `type` (text) - virtual, physical
  - `last_four` (text)
  - `brand` (text) - Mastercard
  - `status` (text) - active, blocked, cancelled
  - `limit_amount` (numeric)
  - `is_international_enabled` (boolean, default false)
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Policies enforce authentication and ownership
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  balance numeric DEFAULT 0,
  credit_score integer DEFAULT 0,
  onboarding_completed boolean DEFAULT false,
  financial_profile text DEFAULT 'moderate',
  monthly_income numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  amount numeric NOT NULL,
  description text NOT NULL,
  category text DEFAULT 'other',
  recipient text,
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create ai_insights table
CREATE TABLE IF NOT EXISTS ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  action_label text,
  action_data jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insights"
  ON ai_insights FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
  ON ai_insights FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create financial_goals table
CREATE TABLE IF NOT EXISTS financial_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  target_amount numeric NOT NULL,
  current_amount numeric DEFAULT 0,
  deadline date,
  category text DEFAULT 'savings',
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
  ON financial_goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON financial_goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON financial_goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON financial_goals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create cards table
CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  last_four text NOT NULL,
  brand text DEFAULT 'Mastercard',
  status text DEFAULT 'active',
  limit_amount numeric DEFAULT 5000,
  is_international_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cards"
  ON cards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cards"
  ON cards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards"
  ON cards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_goals_user_id ON financial_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);