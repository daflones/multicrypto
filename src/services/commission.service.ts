import { supabase, Commission } from './supabase';
import { COMMISSION_RATES } from '../utils/constants';

export class CommissionService {
  static async calculateCommissions(userId: string, investmentAmount: number, investmentId: string) {
    try {
      const commissions: Commission[] = [];

      // Get user's referrer chain
      const referrerChain = await this.getReferrerChain(userId);

      // Notificações serão tratadas por trigger/RPC no backend

      // Calculate commissions for each level
      for (let level = 1; level <= 3; level++) {
        const referrerId = referrerChain[level - 1];
        if (!referrerId) continue;

        let commissionRate = 0;
        switch (level) {
          case 1:
            commissionRate = COMMISSION_RATES.LEVEL_1;
            break;
          case 2:
            commissionRate = COMMISSION_RATES.LEVEL_2;
            break;
          case 3:
            commissionRate = COMMISSION_RATES.LEVEL_3;
            break;
        }

        const commissionAmount = investmentAmount * commissionRate;

        // Create commission record
        const { data: commission, error: commissionError } = await supabase
          .from('commissions')
          .insert({
            beneficiary_id: referrerId,
            source_user_id: userId,
            investment_id: investmentId,
            level: level as 1 | 2 | 3,
            percentage: commissionRate,
            amount: commissionAmount
          })
          .select()
          .single();

        if (commissionError) {
          console.error(`Error creating level ${level} commission:`, commissionError);
          continue;
        }

        // Update beneficiary balance
        const { data: beneficiary, error: beneficiaryError } = await supabase
          .from('users')
          .select('balance')
          .eq('id', referrerId)
          .single();

        if (beneficiaryError || !beneficiary) {
          console.error(`Error getting beneficiary ${referrerId}:`, beneficiaryError);
          continue;
        }

        const newBalance = beneficiary.balance + commissionAmount;
        const { error: updateError } = await supabase
          .from('users')
          .update({ balance: newBalance })
          .eq('id', referrerId);

        if (updateError) {
          console.error(`Error updating balance for ${referrerId}:`, updateError);
          continue;
        }

        // Create commission transaction
        commissions.push(commission);

        // Notificações de comissão: delegar ao backend/trigger para evitar duplicidade e problemas de RLS
      }

      return commissions;
    } catch (error) {
      console.error('Calculate commissions error:', error);
      throw error;
    }
  }

  static async getReferrerChain(userId: string): Promise<string[]> {
    try {
      const chain: string[] = [];
      let currentUserId = userId;

      // Get up to 3 levels of referrers
      for (let level = 0; level < 3; level++) {
        const { data: user, error } = await supabase
          .from('users')
          .select('referred_by')
          .eq('id', currentUserId)
          .single();

        if (error || !user || !user.referred_by) {
          break;
        }

        chain.push(user.referred_by);
        currentUserId = user.referred_by;
      }

      return chain;
    } catch (error) {
      console.error('Get referrer chain error:', error);
      return [];
    }
  }

  static async getUserCommissions(userId: string) {
    try {
      const { data: commissions, error } = await supabase
        .from('commissions')
        .select(`
          *,
          source_user:users!commissions_source_user_id_fkey(email, referral_code)
        `)
        .eq('beneficiary_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error('Erro ao buscar comissões');
      }

      return commissions || [];
    } catch (error) {
      console.error('Get user commissions error:', error);
      throw error;
    }
  }

  static async getCommissionStats(userId: string) {
    try {
      const { data: commissions, error } = await supabase
        .from('commissions')
        .select('amount, level, created_at')
        .eq('beneficiary_id', userId);

      if (error) {
        throw new Error('Erro ao buscar estatísticas de comissões');
      }

      const stats = {
        totalCommissions: 0,
        level1Total: 0,
        level2Total: 0,
        level3Total: 0,
        thisMonthTotal: 0,
        commissionsCount: commissions?.length || 0
      };

      if (commissions) {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        commissions.forEach(commission => {
          stats.totalCommissions += commission.amount;
          
          // Count by level
          switch (commission.level) {
            case 1:
              stats.level1Total += commission.amount;
              break;
            case 2:
              stats.level2Total += commission.amount;
              break;
            case 3:
              stats.level3Total += commission.amount;
              break;
          }

          // Count this month's commissions
          const commissionDate = new Date(commission.created_at);
          if (commissionDate.getMonth() === currentMonth && 
              commissionDate.getFullYear() === currentYear) {
            stats.thisMonthTotal += commission.amount;
          }
        });
      }

      return stats;
    } catch (error) {
      console.error('Get commission stats error:', error);
      throw error;
    }
  }

  static async getTeamStats(userId: string) {
    try {
      // Get direct referrals count
      const { count: level1Count, error: level1Error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('referred_by', userId);

      if (level1Error) {
        throw new Error('Erro ao buscar estatísticas da equipe');
      }

      // Get level 1 user IDs
      const { data: level1Users, error: level1UsersError } = await supabase
        .from('users')
        .select('id')
        .eq('referred_by', userId);

      if (level1UsersError) {
        throw new Error('Erro ao buscar usuários nível 1');
      }

      let level2Count = 0;
      let level3Count = 0;

      if (level1Users && level1Users.length > 0) {
        const level1Ids = level1Users.map(user => user.id);

        // Get level 2 count
        const { count: level2CountResult, error: level2Error } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .in('referred_by', level1Ids);

        if (!level2Error) {
          level2Count = level2CountResult || 0;
        }

        // Get level 2 user IDs for level 3 count
        const { data: level2Users, error: level2UsersError } = await supabase
          .from('users')
          .select('id')
          .in('referred_by', level1Ids);

        if (!level2UsersError && level2Users && level2Users.length > 0) {
          const level2Ids = level2Users.map(user => user.id);

          // Get level 3 count
          const { count: level3CountResult, error: level3Error } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .in('referred_by', level2Ids);

          if (!level3Error) {
            level3Count = level3CountResult || 0;
          }
        }
      }

      return {
        level1Count: level1Count || 0,
        level2Count,
        level3Count,
        totalTeamSize: (level1Count || 0) + level2Count + level3Count
      };
    } catch (error) {
      console.error('Get team stats error:', error);
      throw error;
    }
  }
}
