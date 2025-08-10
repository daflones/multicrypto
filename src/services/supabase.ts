import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface User {
  id: string;
  cpf: string;
  email: string;
  phone: string;
  password_hash: string;
  referral_code: string;
  referred_by?: string;
  balance: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  daily_yield: number;
  duration_days: number;
  max_purchases: number;
  min_investment: number;
  max_investment: number;
  image_path?: string;
  is_active: boolean;
  product_type: 'basic' | 'premium';
  created_at: string;
}

export interface UserInvestment {
  id: string;
  user_id: string;
  product_id: string;
  purchase_date: string;
  start_date?: string; // TIMESTAMPTZ ISO string
  amount: number;
  status: string;
  total_earned: number;
  end_date?: string;
  product?: Product;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'commission' | 'yield' | 'investment';
  amount: number;
  payment_method: 'pix' | 'trc20' | 'bep20' | 'balance' | 'system';
  status: 'pending' | 'approved' | 'rejected';
  proof_file_url?: string;
  wallet_address?: string;
  created_at: string;
  data?: Record<string, any>;
}

export interface Commission {
  id: string;
  beneficiary_id: string;
  source_user_id: string;
  investment_id: string;
  level: 1 | 2 | 3;
  percentage: number;
  amount: number;
  created_at: string;
}

// Storage bucket names
export const STORAGE_BUCKETS = {
  PROOF_FILES: 'proof-files',
  PRODUCT_IMAGES: 'product-images',
} as const;
