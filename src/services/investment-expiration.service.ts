import { supabase } from './supabase';
import { todayInSaoPauloYMD, diffDaysYMD, nowInSaoPauloISO, diffDaysISOInSP } from '../utils/date';
import { NotificationService } from './notification.service';

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

      // Devolver APENAS o principal. Rendimentos já foram pagos diariamente.
      const principalToReturn = investment.amount;

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

      // Atualizar saldo do usuário com o principal
      const newBalance = user.balance + principalToReturn;
      const { error: balanceError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', investment.user_id);

      if (balanceError) {
        console.error('Error updating user balance:', balanceError);
        return;
      }

      // Marcar investimento como completo (não sobrescrever total_earned)
      const { error: investmentError } = await supabase
        .from('user_investments')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', investment.id);

      if (investmentError) {
        console.error('Error updating investment status:', investmentError);
        return;
      }

      // Criar transação de retorno do principal
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: investment.user_id,
          type: 'yield',
          amount: principalToReturn,
          payment_method: 'balance',
          status: 'approved',
          data: {
            investment_id: investment.id,
            product_name: investment.products?.name,
            kind: 'principal_return',
            original_amount: investment.amount
          }
        });

      if (transactionError) {
        console.error('Error creating return transaction:', transactionError);
      }

      // Criar notificação para o usuário sobre a conclusão do investimento
      try {
        const productName = investment.products?.name || 'seu investimento';
        const amountBRL = (principalToReturn ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const title = '🎉 Parabéns! Investimento finalizado';
        const message = `Seu investimento ${productName} foi finalizado! Você recebeu ${amountBRL} de volta no seu saldo. 💸🚀 Agora você pode usar esse valor para novas transações!`;
        await NotificationService.createNotification(
          investment.user_id,
          'investment_completed',
          title,
          message,
          {
            investment_id: investment.id,
            product_name: investment.products?.name,
            kind: 'investment_completed',
            returned_principal: principalToReturn
          }
        );
      } catch (notifyErr) {
        console.error('Error creating completion notification:', notifyErr);
      }

      console.log(`Investment ${investment.id} completed successfully. Returned principal ${principalToReturn} to user ${investment.user_id}`);
      
      return {
        investmentId: investment.id,
        userId: investment.user_id,
        originalAmount: investment.amount,
        totalReturn: principalToReturn
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
