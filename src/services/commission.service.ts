import { supabase, Commission } from './supabase';
import { COMMISSION_RATES } from '../utils/constants';

export class CommissionService {
  static async calculateCommissions(userId: string, investmentAmount: number, investmentId: string) {
    try {
      const commissions: Commission[] = [];

      // Get user's referrer chain
      const referrerChain = await this.getReferrerChain(userId);

      // Notificações serão tratadas por trigger/RPC no backend

      // Calculate commissions for each level (up to 7 levels)
      for (let level = 1; level <= 7; level++) {
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
          case 4:
            commissionRate = COMMISSION_RATES.LEVEL_4;
            break;
          case 5:
            commissionRate = COMMISSION_RATES.LEVEL_5;
            break;
          case 6:
            commissionRate = COMMISSION_RATES.LEVEL_6;
            break;
          case 7:
            commissionRate = COMMISSION_RATES.LEVEL_7;
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
            level: level as 1 | 2 | 3 | 4 | 5 | 6 | 7,
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

      // Get up to 7 levels of referrers
      for (let level = 0; level < 7; level++) {
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
        level4Total: 0,
        level5Total: 0,
        level6Total: 0,
        level7Total: 0,
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
            case 4:
              stats.level4Total += commission.amount;
              break;
            case 5:
              stats.level5Total += commission.amount;
              break;
            case 6:
              stats.level6Total += commission.amount;
              break;
            case 7:
              stats.level7Total += commission.amount;
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
      const stats = {
        level1Count: 0,
        level2Count: 0,
        level3Count: 0,
        level4Count: 0,
        level5Count: 0,
        level6Count: 0,
        level7Count: 0,
        totalTeamSize: 0
      };

      // Get level 1 (direct referrals)
      const { data: level1Users, error: level1Error } = await supabase
        .from('users')
        .select('id')
        .eq('referred_by', userId);

      if (level1Error) {
        throw new Error('Erro ao buscar estatísticas da equipe');
      }

      if (!level1Users || level1Users.length === 0) {
        return stats;
      }

      stats.level1Count = level1Users.length;
      let currentLevelIds = level1Users.map(u => u.id);

      // Iterate through levels 2-7
      for (let level = 2; level <= 7; level++) {
        if (currentLevelIds.length === 0) break;

        const { data: nextLevelUsers, error } = await supabase
          .from('users')
          .select('id')
          .in('referred_by', currentLevelIds);

        if (error || !nextLevelUsers || nextLevelUsers.length === 0) {
          break;
        }

        const count = nextLevelUsers.length;
        switch (level) {
          case 2: stats.level2Count = count; break;
          case 3: stats.level3Count = count; break;
          case 4: stats.level4Count = count; break;
          case 5: stats.level5Count = count; break;
          case 6: stats.level6Count = count; break;
          case 7: stats.level7Count = count; break;
        }

        currentLevelIds = nextLevelUsers.map(u => u.id);
      }

      stats.totalTeamSize = stats.level1Count + stats.level2Count + stats.level3Count + 
                           stats.level4Count + stats.level5Count + stats.level6Count + stats.level7Count;

      return stats;
    } catch (error) {
      console.error('Get team stats error:', error);
      throw error;
    }
  }
}
