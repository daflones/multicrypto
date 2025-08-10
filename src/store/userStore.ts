import { create } from 'zustand';
import { InvestmentService } from '../services/investment.service';
import { CommissionService } from '../services/commission.service';
import { UserInvestment, Product, Commission, Transaction } from '../services/supabase';

interface InvestmentStats {
  totalInvested: number;
  totalEarned: number;
  dailyYield: number;
  activeInvestments: number;
}

interface CommissionStats {
  totalCommissions: number;
  level1Total: number;
  level2Total: number;
  level3Total: number;
  thisMonthTotal: number;
  commissionsCount: number;
}

interface TeamStats {
  level1Count: number;
  level2Count: number;
  level3Count: number;
  totalTeamSize: number;
}

interface UserState {
  // Data
  products: Product[];
  investments: UserInvestment[];
  commissions: Commission[];
  transactions: Transaction[];
  
  // Stats
  investmentStats: InvestmentStats | null;
  commissionStats: CommissionStats | null;
  teamStats: TeamStats | null;
  
  // Loading states
  isLoadingProducts: boolean;
  isLoadingInvestments: boolean;
  isLoadingCommissions: boolean;
  isLoadingStats: boolean;
  
  // Actions
  fetchProducts: () => Promise<void>;
  fetchUserInvestments: (userId: string) => Promise<void>;
  fetchUserCommissions: (userId: string) => Promise<void>;
  fetchInvestmentStats: (userId: string) => Promise<void>;
  fetchCommissionStats: (userId: string) => Promise<void>;
  fetchTeamStats: (userId: string) => Promise<void>;
  createInvestment: (userId: string, productId: string, amount: number) => Promise<void>;
  clearUserData: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  // Initial state
  products: [],
  investments: [],
  commissions: [],
  transactions: [],
  investmentStats: null,
  commissionStats: null,
  teamStats: null,
  isLoadingProducts: false,
  isLoadingInvestments: false,
  isLoadingCommissions: false,
  isLoadingStats: false,

  fetchProducts: async () => {
    try {
      set({ isLoadingProducts: true });
      const products = await InvestmentService.getProducts();
      set({ products, isLoadingProducts: false });
    } catch (error) {
      console.error('Error fetching products:', error);
      set({ isLoadingProducts: false });
    }
  },

  fetchUserInvestments: async (userId: string) => {
    try {
      set({ isLoadingInvestments: true });
      const investments = await InvestmentService.getUserInvestments(userId);
      set({ investments, isLoadingInvestments: false });
    } catch (error) {
      console.error('Error fetching investments:', error);
      set({ isLoadingInvestments: false });
    }
  },

  fetchUserCommissions: async (userId: string) => {
    try {
      set({ isLoadingCommissions: true });
      const commissions = await CommissionService.getUserCommissions(userId);
      set({ commissions, isLoadingCommissions: false });
    } catch (error) {
      console.error('Error fetching commissions:', error);
      set({ isLoadingCommissions: false });
    }
  },

  fetchInvestmentStats: async (userId: string) => {
    try {
      set({ isLoadingStats: true });
      const investmentStats = await InvestmentService.getInvestmentStats(userId);
      set({ investmentStats, isLoadingStats: false });
    } catch (error) {
      console.error('Error fetching investment stats:', error);
      set({ isLoadingStats: false });
    }
  },

  fetchCommissionStats: async (userId: string) => {
    try {
      const commissionStats = await CommissionService.getCommissionStats(userId);
      set({ commissionStats });
    } catch (error) {
      console.error('Error fetching commission stats:', error);
    }
  },

  fetchTeamStats: async (userId: string) => {
    try {
      const teamStats = await CommissionService.getTeamStats(userId);
      set({ teamStats });
    } catch (error) {
      console.error('Error fetching team stats:', error);
    }
  },

  createInvestment: async (userId: string, productId: string, amount: number) => {
    try {
      const investment = await InvestmentService.createInvestment(userId, productId, amount);
      
      // Refresh investments and stats
      const { fetchUserInvestments, fetchInvestmentStats } = get();
      await fetchUserInvestments(userId);
      await fetchInvestmentStats(userId);
      
      return investment;
    } catch (error) {
      console.error('Error creating investment:', error);
      throw error;
    }
  },

  clearUserData: () => {
    set({
      products: [],
      investments: [],
      commissions: [],
      transactions: [],
      investmentStats: null,
      commissionStats: null,
      teamStats: null,
      isLoadingProducts: false,
      isLoadingInvestments: false,
      isLoadingCommissions: false,
      isLoadingStats: false,
    });
  }
}));
