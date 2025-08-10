import { supabase } from './supabase';
import { todayInSaoPauloYMD, diffDaysYMD, nowInSaoPauloISO, diffDaysISOInSP } from '../utils/date';

export class InvestmentExpirationService {
  // Processar investimentos expirados
  static async processExpiredInvestments() {
    try {
      console.log('Processing expired investments...');

      // Buscar investimentos ativos que expiraram
      // Se end_date for TIMESTAMPTZ, comparar com nowInSaoPauloISO();
      // Mantemos fallback para DATE/YMD caso a coluna ainda esteja nesse formato.
      const nowISO = nowInSaoPauloISO();
      const todayYMD = todayInSaoPauloYMD();

      const { data: expiredInvestments, error } = await supabase
        .from('user_investments')
        .select(`
          *,
          users!inner(id, balance),
          products!inner(name, daily_yield, duration_days)
        `)
        .eq('status', 'active')
        .or(`end_date.lt.${nowISO},end_date.lt.${todayYMD}`);

      if (error) {
        console.error('Error fetching expired investments:', error);
        return;
      }

      if (!expiredInvestments || expiredInvestments.length === 0) {
        console.log('No expired investments found');
        return;
      }

      console.log(`Found ${expiredInvestments.length} expired investments`);

      // Processar cada investimento expirado
      for (const investment of expiredInvestments) {
        await this.completeInvestment(investment);
      }

      return expiredInvestments.length;
    } catch (error) {
      console.error('Error processing expired investments:', error);
      throw error;
    }
  }

  // Completar um investimento específico
  static async completeInvestment(investment: any) {
    try {
      console.log(`Completing investment ${investment.id} for user ${investment.user_id}`);

      // Calcular total a devolver (capital + rendimentos)
      const totalYield = investment.products.daily_yield * investment.products.duration_days;
      const totalReturn = investment.amount + totalYield;

      // Buscar saldo atual do usuário
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', investment.user_id)
        .single();

      if (userError || !user) {
        console.error('Error fetching user:', userError);
        return;
      }

      // Atualizar saldo do usuário
      const newBalance = user.balance + totalReturn;
      const { error: balanceError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', investment.user_id);

      if (balanceError) {
        console.error('Error updating user balance:', balanceError);
        return;
      }

      // Marcar investimento como completo
      const { error: investmentError } = await supabase
        .from('user_investments')
        .update({ 
          status: 'completed',
          total_earned: totalYield,
          completed_at: new Date().toISOString()
        })
        .eq('id', investment.id);

      if (investmentError) {
        console.error('Error updating investment status:', investmentError);
        return;
      }

      // Criar transação de retorno
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: investment.user_id,
          type: 'yield',
          amount: totalReturn,
          payment_method: 'balance',
          status: 'approved',
          data: {
            investment_id: investment.id,
            product_name: investment.products.name,
            original_amount: investment.amount,
            yield_amount: totalYield,
            total_return: totalReturn,
            duration_days: investment.products.duration_days
          }
        });

      if (transactionError) {
        console.error('Error creating return transaction:', transactionError);
      }

      console.log(`Investment ${investment.id} completed successfully. Returned ${totalReturn} to user ${investment.user_id}`);
      
      return {
        investmentId: investment.id,
        userId: investment.user_id,
        originalAmount: investment.amount,
        yieldAmount: totalYield,
        totalReturn: totalReturn
      };
    } catch (error) {
      console.error('Error completing investment:', error);
      throw error;
    }
  }

  // Verificar se usuário pode comprar mais de um produto específico
  static async canUserBuyProduct(userId: string, productId: string): Promise<boolean> {
    try {
      // Contar investimentos ativos do usuário para este produto
      const { data: activeInvestments, error: activeError } = await supabase
        .from('user_investments')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .eq('status', 'active');

      if (activeError) {
        console.error('Error checking active investments:', activeError);
        return false;
      }

      // Buscar limite máximo do produto
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('max_purchases')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        console.error('Error fetching product:', productError);
        return false;
      }

      const activeCount = activeInvestments?.length || 0;
      return activeCount < product.max_purchases;
    } catch (error) {
      console.error('Error checking if user can buy product:', error);
      return false;
    }
  }

  // Obter contagem de investimentos ativos por produto
  static async getActiveInvestmentCount(userId: string, productId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('user_investments')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .eq('status', 'active');

      if (error) {
        console.error('Error getting active investment count:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error getting active investment count:', error);
      return 0;
    }
  }

  // Calcular rendimentos acumulados até agora
  static calculateCurrentYield(investment: any): number {
    // Diferença em dias baseada no calendário de São Paulo
    const startVal: string = investment.start_date;
    let daysPassed = 0;
    if (startVal && /T/.test(startVal)) {
      // TIMESTAMPTZ
      daysPassed = diffDaysISOInSP(startVal, nowInSaoPauloISO());
    } else {
      // DATE (YYYY-MM-DD)
      daysPassed = diffDaysYMD(startVal, todayInSaoPauloYMD());
    }
    
    // Não pode passar da duração total
    const effectiveDays = Math.min(daysPassed, investment.products?.duration_days || 0);
    
    return effectiveDays * (investment.products?.daily_yield || 0);
  }
}
