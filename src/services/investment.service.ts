import { supabase } from './supabase';
import { PRODUCTS } from '../utils/constants';
import { todayInSaoPauloYMD, nowInSaoPauloISO, addDaysPreserveTimeISO } from '../utils/date';

export class InvestmentService {
  static async getProducts() {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) {
        throw new Error('Erro ao buscar produtos');
      }

      return products || [];
    } catch (error) {
      console.error('Get products error:', error);
      throw error;
    }
  }

  static async getUserInvestments(userId: string) {
    try {
      const { data: investments, error } = await supabase
        .from('user_investments')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', userId)
        .order('purchase_date', { ascending: false });

      if (error) {
        throw new Error('Erro ao buscar investimentos');
      }

      return investments || [];
    } catch (error) {
      console.error('Get user investments error:', error);
      throw error;
    }
  }

  static async getUserInvestmentCount(userId: string, productId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('user_investments')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .eq('status', 'active'); // Apenas investimentos ativos

      if (error) {
        console.error('Error getting investment count:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error getting investment count:', error);
      return 0;
    }
  }

  static async createInvestment(userId: string, productId: string, amount: number) {
    try {
      console.log('Creating investment:', { userId, productId, amount });

      // Validate input
      if (!userId || !productId || !amount || amount <= 0) {
        throw new Error('Dados de investimento inválidos');
      }

      // Get product details
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError) {
        console.error('Product error:', productError);
        throw new Error('Erro ao buscar produto: ' + productError.message);
      }

      if (!product) {
        throw new Error('Produto não encontrado');
      }

      // Validate amount against product limits
      if (amount < product.min_investment) {
        throw new Error(`Valor mínimo para este produto: R$ ${product.min_investment}`);
      }

      if (amount > product.max_investment) {
        throw new Error(`Valor máximo para este produto: R$ ${product.max_investment}`);
      }

      // Check if user has reached max purchases for this product
      const currentCount = await this.getUserInvestmentCount(userId, productId);
      if (currentCount >= product.max_purchases) {
        throw new Error('Limite de compras atingido para este produto');
      }

      // Get user balance
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('User error:', userError);
        throw new Error('Erro ao buscar usuário: ' + userError.message);
      }

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      if (user.balance < amount) {
        throw new Error(`Saldo insuficiente. Disponível: R$ ${user.balance.toFixed(2)}, Necessário: R$ ${amount.toFixed(2)}`);
      }

      // Datas baseadas no horário de São Paulo
      // purchase_date (YYYY-MM-DD) e timestamps (TIMESTAMPTZ) preservando hora
      const purchaseYMD = todayInSaoPauloYMD();
      const startISO = nowInSaoPauloISO();
      const endISO = addDaysPreserveTimeISO(startISO, product.duration_days);
      
      const { data: investment, error: investmentError } = await supabase
        .from('user_investments')
        .insert({
          user_id: userId,
          product_id: productId,
          amount: amount,
          status: 'active',
          total_earned: 0,
          // Datas
          purchase_date: purchaseYMD, // coluna DATE (opcional)
          start_date: startISO,       // TIMESTAMPTZ, hora exata da compra em SP
          end_date: endISO            // TIMESTAMPTZ, exatamente +duration dias no mesmo horário
        })
        .select()
        .single();

      if (investmentError) {
        console.error('Investment error:', investmentError);
        throw new Error('Erro ao criar investimento: ' + investmentError.message);
      }

      // Update user balance
      const newBalance = user.balance - amount;
      const { error: balanceError } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', userId);

      if (balanceError) {
        console.error('Balance error:', balanceError);
        throw new Error('Erro ao atualizar saldo: ' + balanceError.message);
      }

      // Não criar registro na tabela transactions para compras de investimentos
      // Comissões e notificações serão tratadas exclusivamente no backend (trigger/RPC/func).

      console.log('Investment created successfully:', investment);
      return investment;
    } catch (error) {
      console.error('Create investment error:', error);
      throw error;
    }
  }

  static async calculateDailyYields() {
    try {
      // Pagar rendimento apenas para investimentos ativos, dentro da janela [start_date, end_date)
      const { data: investments, error } = await supabase
        .from('user_investments')
        .select(`
          *,
          product:products(*),
          user:users(balance)
        `)
        .eq('status', 'active');

      if (error) {
        throw new Error('Erro ao buscar investimentos ativos');
      }

      if (!investments || investments.length === 0) {
        return { processed: 0 };
      }

      let processed = 0;

      for (const investment of investments) {
        // Respeitar janela: só paga se já começou e ainda não terminou
        const now = new Date();
        const nowISO = now.toISOString();
        if (investment.start_date && nowISO < investment.start_date) {
          continue;
        }
        if (investment.end_date && nowISO >= investment.end_date) {
          continue;
        }

        const dailyYield = investment.product?.daily_yield ?? 0;
        if (!dailyYield || dailyYield <= 0) continue;

        // Idempotência: verificar se já houve pagamento hoje
        // Janela de hoje em YYYY-MM-DD (UTC). Para maior precisão por fuso, preferir Edge Function com TZ.
        const todayYMD = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const tomorrow = new Date(Date.UTC(
          Number(todayYMD.slice(0, 4)),
          Number(todayYMD.slice(5, 7)) - 1,
          Number(todayYMD.slice(8, 10)) + 1
        ));
        const tomorrowYMD = `${tomorrow.getUTCFullYear()}-${String(tomorrow.getUTCMonth() + 1).padStart(2, '0')}-${String(tomorrow.getUTCDate()).padStart(2, '0')}`;

        const { data: existing, error: existingErr } = await supabase
          .from('transactions')
          .select('id')
          .eq('user_id', investment.user_id)
          .eq('type', 'yield')
          .contains('data', { investment_id: investment.id, kind: 'daily_yield' })
          .gte('created_at', `${todayYMD} 00:00:00`)
          .lt('created_at', `${tomorrowYMD} 00:00:00`)
          .limit(1);

        if (existingErr) {
          console.warn('Erro ao checar pagamentos do dia, ignorando investimento:', existingErr);
          continue;
        }
        if (existing && existing.length > 0) {
          // já pago hoje
          continue;
        }

        const newTotalEarned = (investment.total_earned || 0) + dailyYield;

        // Atualiza ganhos no investimento
        await supabase
          .from('user_investments')
          .update({ total_earned: newTotalEarned })
          .eq('id', investment.id);

        // Credita saldo do usuário
        const newBalance = (investment.user?.balance || 0) + dailyYield;
        await supabase
          .from('users')
          .update({ balance: newBalance })
          .eq('id', investment.user_id);

        // Registra transação de rendimento diário (idempotência via contains + janela)
        await supabase
          .from('transactions')
          .insert({
            user_id: investment.user_id,
            type: 'yield',
            amount: dailyYield,
            payment_method: 'system',
            status: 'approved',
            data: { investment_id: investment.id, kind: 'daily_yield' }
          });

        processed++;
      }

      return { processed };
    } catch (error) {
      console.error('Calculate daily yields error:', error);
      throw error;
    }
  }

  static async getInvestmentStats(userId: string) {
    try {
      // Active investments for live stats
      const { data: activeInvestments, error: activeErr } = await supabase
        .from('user_investments')
        .select(`
          amount,
          product:products(daily_yield)
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      if (activeErr) {
        throw new Error('Erro ao buscar estatísticas');
      }

      // All investments (any status) to compute lifetime total earned
      const { data: allInvestments, error: allErr } = await supabase
        .from('user_investments')
        .select('total_earned')
        .eq('user_id', userId);

      if (allErr) {
        throw new Error('Erro ao buscar estatísticas');
      }

      const stats = {
        totalInvested: 0,
        totalEarned: 0, // lifetime
        dailyYield: 0,
        activeInvestments: activeInvestments?.length || 0
      };

      if (activeInvestments) {
        stats.totalInvested = activeInvestments.reduce((sum, inv: any) => sum + (inv.amount || 0), 0);
        stats.dailyYield = activeInvestments.reduce((sum, inv: any) => {
          const product = (inv as any).product as any;
          const daily = Array.isArray(product)
            ? (product[0]?.daily_yield ?? 0)
            : (product?.daily_yield ?? 0);
          return sum + (daily || 0);
        }, 0);
      }

      if (allInvestments) {
        stats.totalEarned = allInvestments.reduce((sum, inv: any) => sum + (inv.total_earned || 0), 0);
      }

      return stats;
    } catch (error) {
      console.error('Get investment stats error:', error);
      throw error;
    }
  }

  static async seedProducts() {
    try {
      // Check if products already exist
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      if (count && count > 0) {
        return { message: 'Products already seeded' };
      }

      // Insert products from constants
      const productsToInsert = PRODUCTS.map(product => ({
        name: product.name,
        description: product.description,
        price: product.price,
        daily_yield: product.dailyYield,
        max_purchases: product.maxPurchases,
        image_path: product.image,
        is_active: true,
        product_type: product.type
      }));

      const { data, error } = await supabase
        .from('products')
        .insert(productsToInsert)
        .select();

      if (error) {
        throw new Error('Erro ao inserir produtos: ' + error.message);
      }

      return { message: 'Products seeded successfully', count: data?.length || 0 };
    } catch (error) {
      console.error('Seed products error:', error);
      throw error;
    }
  }
}
