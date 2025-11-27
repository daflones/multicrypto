import { supabase } from './supabase';

export class CommissionService {
  static async calculateCommissions(userId: string, investmentAmount: number, _investmentId?: string) {
    try {
      // Usar a função existente do Supabase para calcular e distribuir comissões
      const { data, error } = await supabase.rpc('calculate_and_distribute_commissions', {
        buyer_user_id: userId,
        investment_amount: investmentAmount
      });

      if (error) {
        console.error('Error calling calculate_and_distribute_commissions:', error);
        throw error;
      }

      return data;
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
      // ✅ OTIMIZAÇÃO: Usar função RPC otimizada
      const { data: statsData, error } = await supabase.rpc('get_team_stats_optimized', {
        root_user_id: userId
      });

      if (error) {
        console.error('Error calling get_team_stats_optimized:', error);
        // Fallback para método antigo se RPC falhar
        return this.getTeamStatsFallback(userId);
      }

      if (!statsData || statsData.length === 0) {
        return {
          level1Count: 0,
          level2Count: 0,
          level3Count: 0,
          level4Count: 0,
          level5Count: 0,
          level6Count: 0,
          level7Count: 0,
          totalTeamSize: 0,
          totalTeamInvested: 0
        };
      }

      const stats = statsData[0];
      return {
        level1Count: stats.level1_count || 0,
        level2Count: stats.level2_count || 0,
        level3Count: stats.level3_count || 0,
        level4Count: stats.level4_count || 0,
        level5Count: stats.level5_count || 0,
        level6Count: stats.level6_count || 0,
        level7Count: stats.level7_count || 0,
        totalTeamSize: stats.total_team_size || 0,
        totalTeamInvested: stats.total_team_invested || 0
      };
    } catch (error) {
      console.error('Get team stats error:', error);
      // Fallback para método antigo
      return this.getTeamStatsFallback(userId);
    }
  }

  // Método fallback caso a RPC falhe
  private static async getTeamStatsFallback(userId: string) {
    try {
      const stats = {
        level1Count: 0,
        level2Count: 0,
        level3Count: 0,
        level4Count: 0,
        level5Count: 0,
        level6Count: 0,
        level7Count: 0,
        totalTeamSize: 0,
        totalTeamInvested: 0
      };

      // Get level 1 (direct referrals) - limitado para performance
      const { data: level1Users, error: level1Error } = await supabase
        .from('users')
        .select('id')
        .eq('referred_by', userId)
        .limit(100); // ✅ Limitar resultados

      if (level1Error) {
        throw new Error('Erro ao buscar estatísticas da equipe');
      }

      if (!level1Users || level1Users.length === 0) {
        return stats;
      }

      stats.level1Count = level1Users.length;
      let currentLevelIds = level1Users.map(u => u.id);

      // Iterate through levels 2-7 (limitado para performance)
      for (let level = 2; level <= 7 && currentLevelIds.length > 0; level++) {
        const { data: nextLevelUsers, error } = await supabase
          .from('users')
          .select('id')
          .in('referred_by', currentLevelIds)
          .limit(200); // ✅ Limitar por nível

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
      console.error('Get team stats fallback error:', error);
      throw error;
    }
  }
}
