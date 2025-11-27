import { supabase } from './supabase';

export interface WithdrawalData {
  amount: number;
  paymentMethod: 'pix' | 'crypto';
  pixKey?: string;
  pixKeyType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  walletAddress?: string;
}

export class TransactionService {
  // Verificar se o usuário tem pelo menos um produto ativo
  static async userHasActiveProducts(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_investments')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1);

      if (error) {
        console.error('Error checking user products:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking user products:', error);
      return false;
    }
  }

  // Criar solicitação de saque com taxa de 5%
  static async createWithdrawal(userId: string, data: WithdrawalData) {
    try {
      // Verificar se é segunda-feira (0 = domingo, 1 = segunda, ..., 6 = sábado)
      const today = new Date();
      const isMonday = today.getDay() === 1;
      
      if (!isMonday) {
        throw new Error('Saques são permitidos apenas às segundas-feiras.');
      }

      // Verificar se o usuário tem produtos ativos
      const hasProducts = await this.userHasActiveProducts(userId);
      if (!hasProducts) {
        throw new Error('Você precisa ter pelo menos um investimento ativo para solicitar um saque.');
      }

      // Buscar dados do usuário incluindo limite de saque e status
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('balance, commission_balance, withdrawal_limit, is_active')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar se o usuário está ativo
      if (!user.is_active) {
        throw new Error('Sua conta está inativa. Entre em contato com o suporte.');
      }

      // Verificar limite de saque
      const withdrawalLimit = user.withdrawal_limit;
      
      if (withdrawalLimit && withdrawalLimit > 0) {
        // Se há limite personalizado definido, usar ele
        if (data.amount > withdrawalLimit) {
          throw new Error(`Limite de saque excedido. Seu limite atual é de R$ ${withdrawalLimit.toFixed(2)}. Para aumentar seu limite, entre em contato com o suporte.`);
        }
      } else {
        // Se não há limite personalizado, usar regra padrão do site
        // Regra padrão: pode sacar até 80% do saldo disponível
        const defaultLimit = user.balance * 0.8; // 80% do saldo como limite padrão
        
        if (data.amount > defaultLimit) {
          throw new Error(`Limite de saque padrão excedido. Você pode sacar até R$ ${defaultLimit.toFixed(2)} (80% do seu saldo). Para sacar mais, entre em contato com o suporte.`);
        }
        
        console.log(`Usando regra padrão de saque - limite: R$ ${defaultLimit.toFixed(2)}`);
      }

      // Calcular taxa de 5% (apenas informativa para o usuário)
      const fee = data.amount * 0.05;
      const netAmount = data.amount - fee; // quanto o usuário receberá

      // Verificar se tem saldo suficiente (apenas o valor solicitado)
      if (user.balance < data.amount) {
        throw new Error(`Saldo insuficiente. Valor solicitado: R$ ${data.amount.toFixed(2)}, Taxa (5%): R$ ${fee.toFixed(2)}, Saldo disponível: R$ ${Number(user.balance).toFixed(2)}`);
      }

      // Criar transação de saque
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'withdrawal',
          amount: data.amount,
          fee: fee,
          payment_method: data.paymentMethod,
          status: 'pending',
          wallet_address: data.paymentMethod === 'pix' 
            ? data.pixKey 
            : data.walletAddress,
          data: {
            originalAmount: data.amount,
            fee: fee,
            netAmount: netAmount,
            totalDeducted: data.amount,
            // Dados PIX específicos
            ...(data.paymentMethod === 'pix' && {
              pix_key: data.pixKey,
              pix_key_type: data.pixKeyType
            }),
            // Dados Crypto específicos
            ...(data.paymentMethod === 'crypto' && {
              wallet_address: data.walletAddress
            })
          }
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Transaction error:', transactionError);
        throw new Error('Erro ao criar solicitação de saque');
      }

      // Deduzir APENAS o valor solicitado do saldo do usuário (a taxa NÃO é debitada)
      const newBalance = user.balance - data.amount;
      const { error: balanceError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', userId);

      if (balanceError) {
        console.error('Balance error:', balanceError);
        throw new Error('Erro ao atualizar saldo');
      }

      return {
        transaction,
        fee,
        totalDeducted: data.amount,
        netAmount,
        newBalance
      };
    } catch (error) {
      console.error('Withdrawal error:', error);
      throw error;
    }
  }

  // Aprovar saque (admin)
  static async approveWithdrawal(transactionId: string) {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          status: 'approved',
          processed_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (error) {
        throw new Error('Erro ao aprovar saque');
      }

      return true;
    } catch (error) {
      console.error('Approve withdrawal error:', error);
      throw error;
    }
  }

  // Rejeitar saque (admin) - devolver o dinheiro
  static async rejectWithdrawal(transactionId: string, reason?: string) {
    try {
      // Buscar transação
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .select('user_id, amount, fee, data')
        .eq('id', transactionId)
        .single();

      if (transactionError || !transaction) {
        throw new Error('Transação não encontrada');
      }

      // Valor a devolver é somente o valor solicitado, pois a taxa não foi debitada
      const totalToReturn = transaction.amount;

      // Buscar usuário
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', transaction.user_id)
        .single();

      if (userError || !user) {
        throw new Error('Usuário não encontrado');
      }

      // Devolver o dinheiro (apenas o valor solicitado)
      const newBalance = user.balance + totalToReturn;
      const { error: balanceError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', transaction.user_id);

      if (balanceError) {
        throw new Error('Erro ao devolver saldo');
      }

      // Atualizar status da transação
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ 
          status: 'rejected',
          processed_at: new Date().toISOString(),
          data: {
            ...transaction.data,
            rejectionReason: reason,
            refundedAmount: totalToReturn
          }
        })
        .eq('id', transactionId);

      if (updateError) {
        throw new Error('Erro ao atualizar transação');
      }

      return true;
    } catch (error) {
      console.error('Reject withdrawal error:', error);
      throw error;
    }
  }
}
