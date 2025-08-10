import { supabase } from './supabase';
import { NotificationService } from './notification.service';

export class AdminService {
  // Users
  static async listUsers() {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async updateUser(id: string, patch: Record<string, any>) {
    const { data, error } = await supabase.from('users').update(patch).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  static async adjustUserBalance(id: string, delta: number) {
    const { data: user, error: uerr } = await supabase.from('users').select('balance').eq('id', id).single();
    if (uerr) throw uerr;
    const newBalance = (user?.balance || 0) + delta;
    const { data, error } = await supabase.from('users').update({ balance: newBalance }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  // Products
  static async listProducts() {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async createProduct(payload: Record<string, any>) {
    const { data, error } = await supabase.from('products').insert(payload).select().single();
    if (error) throw error;
    return data;
  }

  static async updateProduct(id: string, patch: Record<string, any>) {
    const { data, error } = await supabase.from('products').update(patch).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  static async deleteProduct(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  // Investments
  static async listInvestments() {
    let res = await supabase
      .from('user_investments')
      .select('*, users(name, email), products(name, price)')
      .order('created_at', { ascending: false });
    if (res.error && String(res.error.message || '').includes('created_at')) {
      res = await supabase
        .from('user_investments')
        .select('*, users(name, email), products(name, price)')
        .order('id', { ascending: false });
    }
    if (res.error) throw res.error;
    return res.data || [];
  }

  static async createInvestmentForUser(userId: string, productId: string, amount: number) {
    const { data, error } = await supabase
      .from('user_investments')
      .insert({ user_id: userId, product_id: productId, amount })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Transactions (deposits/withdrawals)
  static async listTransactions(params?: { type?: 'deposit' | 'withdrawal'; status?: string }) {
    let query = supabase
      .from('transactions')
      .select('id,user_id,type,amount,payment_method,status,proof_file_url,wallet_address,created_at,fee,data')
      .order('created_at', { ascending: false });

    if (params?.type) query = query.eq('type', params.type);
    if (params?.status) query = query.eq('status', params.status);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async approveDeposit(txId: string) {
    // fetch tx
    const { data: tx, error: txErr } = await supabase.from('transactions').select('*').eq('id', txId).single();
    if (txErr) throw txErr;
    if (!tx) throw new Error('Transação não encontrada');

    // credit user balance
    const { data: userRow, error: uErr } = await supabase.from('users').select('balance').eq('id', tx.user_id).single();
    if (uErr) throw uErr;
    const newBalance = (userRow?.balance || 0) + Number(tx.amount || 0);
    const { error: upErr } = await supabase.from('users').update({ balance: newBalance }).eq('id', tx.user_id);
    if (upErr) throw upErr;

    // update transaction status
    const { data, error } = await supabase.from('transactions').update({ status: 'approved' }).eq('id', txId).select().single();
    if (error) throw error;
    return data;
  }

  static async approveWithdrawal(txId: string) {
    // fetch tx
    const { data: tx, error: txErr } = await supabase.from('transactions').select('*').eq('id', txId).single();
    if (txErr) throw txErr;
    if (!tx) throw new Error('Transação não encontrada');

    const amount = Number(tx.amount || 0);
    const fee = amount * 0.05; // 5%
    // IMPORTANTE: não debitar novamente aqui. O débito já ocorreu na solicitação de saque (createWithdrawal)

    // update transaction status and fee field if exists
    const patch: Record<string, any> = { status: 'approved' };
    if ('fee' in (tx || {})) patch.fee = fee;
    const { data, error } = await supabase.from('transactions').update(patch).eq('id', txId).select().single();
    if (error) throw error;

    // Notificação para o usuário
    try {
      const netAmount = amount - fee;
      await NotificationService.createNotification(
        tx.user_id,
        'withdraw_approved',
        'Saque aprovado',
        `Seu saque de ${amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} foi aprovado. Taxa: ${fee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}. Valor a receber: ${netAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`,
        { amount, fee, netAmount, txId }
      );
    } catch (e) {
      console.warn('Falha ao criar notificação de saque aprovado:', e);
    }
    return data;
  }

  static async rejectTransaction(txId: string, reason?: string) {
    // Buscar a transação para saber o tipo e valores
    const { data: tx, error: txErr } = await supabase.from('transactions').select('*').eq('id', txId).single();
    if (txErr) throw txErr;
    if (!tx) throw new Error('Transação não encontrada');

    // Se for saque, reembolsar apenas o valor solicitado (a taxa não foi debitada do saldo)
    if (tx.type === 'withdrawal') {
      const amount = Number(tx.amount || 0);
      // credita de volta o valor solicitado
      const { data: userRow, error: uErr } = await supabase.from('users').select('balance').eq('id', tx.user_id).single();
      if (uErr) throw uErr;
      const newBalance = (userRow?.balance || 0) + amount;
      const { error: upErr } = await supabase.from('users').update({ balance: newBalance }).eq('id', tx.user_id);
      if (upErr) throw upErr;
    }

    let upd = await supabase
      .from('transactions')
      .update({ status: 'rejected', rejection_reason: reason || null })
      .eq('id', txId)
      .select()
      .single();
    if (upd.error && String(upd.error.message || '').includes('rejection_reason')) {
      // Retry sem o campo rejection_reason
      upd = await supabase
        .from('transactions')
        .update({ status: 'rejected' })
        .eq('id', txId)
        .select()
        .single();
    }
    if (upd.error) throw upd.error;
    const data = upd.data;

    // Notificação para o usuário
    try {
      const amount = Number(tx.amount || 0);
      await NotificationService.createNotification(
        tx.user_id,
        'withdraw_rejected',
        'Saque rejeitado',
        `Seu saque de ${amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} foi rejeitado. Motivo: ${reason || 'não especificado'}. O valor foi estornado para sua conta.`,
        { amount, reason, txId }
      );
    } catch (e) {
      console.warn('Falha ao criar notificação de saque rejeitado:', e);
    }
    return data;
  }

  // Helpers
  static async getUsersMap(ids: string[]) {
    const unique = Array.from(new Set(ids.filter(Boolean)));
    if (unique.length === 0) return {} as Record<string, any>;
    const { data, error } = await supabase
      .from('users')
      .select('id,email,role,cpf,phone,balance')
      .in('id', unique);
    if (error) throw error;
    const map: Record<string, any> = {};
    (data || []).forEach((u: any) => { map[u.id] = u; });
    return map;
  }
}
