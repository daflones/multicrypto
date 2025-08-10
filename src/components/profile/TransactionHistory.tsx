import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, ShoppingCart, Users, Calendar, Filter } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'investment' | 'commission';
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  payment_method?: string;
  created_at: string;
  product?: {
    name: string;
  };
  description?: string;
}

const TransactionHistory: React.FC = () => {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdraw' | 'investment' | 'commission'>('all');

  useEffect(() => {
    if (user?.id) {
      fetchTransactions();
    }
  }, [user?.id, filter]);

  const fetchTransactions = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Buscar transações regulares
      let transactionsQuery = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter !== 'all') {
        transactionsQuery = transactionsQuery.eq('type', filter);
      }

      const { data: transactionsData, error: transactionsError } = await transactionsQuery;

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
        return;
      }

      // Buscar investimentos
      const { data: investmentsData, error: investmentsError } = await supabase
        .from('user_investments')
        .select(`
          id,
          amount,
          status,
          purchase_date,
          product:products(name)
        `)
        .eq('user_id', user.id)
        .order('purchase_date', { ascending: false })
        .limit(20);

      if (investmentsError) {
        console.error('Error fetching investments:', investmentsError);
      }

      // Buscar comissões
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('commissions')
        .select('*')
        .eq('beneficiary_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (commissionsError) {
        console.error('Error fetching commissions:', commissionsError);
      }

      // Combinar e formatar todas as transações
      const allTransactions: Transaction[] = [];

      // Adicionar transações regulares
      if (transactionsData) {
        allTransactions.push(...transactionsData.map(t => ({
          id: t.id,
          type: t.type as Transaction['type'],
          amount: t.amount,
          status: t.status as Transaction['status'],
          payment_method: t.payment_method,
          created_at: t.created_at,
          description: getTransactionDescription(t.type, t.payment_method, t.status)
        })));
      }

      // Adicionar investimentos (se não filtrado ou filtro = investment)
      if (investmentsData && (filter === 'all' || filter === 'investment')) {
        allTransactions.push(
          ...investmentsData.map(inv => {
            const productName = Array.isArray(inv.product)
              ? inv.product[0]?.name
              : inv.product?.name;
            return {
              id: inv.id,
              type: 'investment' as const,
              amount: inv.amount,
              status: inv.status as Transaction['status'],
              created_at: inv.purchase_date,
              product: { name: productName },
              description: `Investimento em ${productName || 'Produto'}`
            };
          })
        );
      }

      // Adicionar comissões (se não filtrado ou filtro = commission)
      if (commissionsData && (filter === 'all' || filter === 'commission')) {
        allTransactions.push(...commissionsData.map(comm => ({
          id: comm.id,
          type: 'commission' as const,
          amount: comm.amount,
          status: 'completed' as const,
          created_at: comm.created_at,
          description: `Comissão nível ${comm.level}`
        })));
      }

      // Ordenar por data
      allTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionDescription = (type: string, paymentMethod?: string, status?: string) => {
    switch (type) {
      case 'deposit':
        return `Recarga via ${paymentMethod?.toUpperCase() || 'PIX'}`;
      case 'withdraw':
        return `Saque via ${paymentMethod?.toUpperCase() || 'PIX'}`;
      default:
        return type;
    }
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="text-green-400" size={20} />;
      case 'withdraw':
        return <ArrowUpRight className="text-red-400" size={20} />;
      case 'investment':
        return <ShoppingCart className="text-amber-400" size={20} />;
      case 'commission':
        return <Users className="text-yellow-400" size={20} />;
      default:
        return <Calendar className="text-gray-400" size={20} />;
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'rejected':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = (status: Transaction['status']) => {
    switch (status) {
      case 'approved':
        return 'Aprovado';
      case 'completed':
        return 'Concluído';
      case 'pending':
        return 'Pendente';
      case 'rejected':
        return 'Rejeitado';
      default:
        return status;
    }
  };

  const getAmountColor = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
      case 'commission':
        return 'text-green-400';
      case 'withdraw':
      case 'investment':
        return 'text-red-400';
      default:
        return 'text-white';
    }
  };

  const getAmountPrefix = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
      case 'commission':
        return '+';
      case 'withdraw':
      case 'investment':
        return '-';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Histórico de Transações</h3>
        
        {/* Filter */}
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="bg-surface border border-surface-light rounded px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todas</option>
            <option value="deposit">Recargas</option>
            <option value="withdraw">Saques</option>
            <option value="investment">Investimentos</option>
            <option value="commission">Comissões</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-gray-400">Carregando transações...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <Calendar size={48} className="text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400">Nenhuma transação encontrada</p>
          </div>
        ) : (
          transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="bg-surface border border-surface-light rounded-lg p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getTransactionIcon(transaction.type)}
                  <div>
                    <h4 className="text-white font-medium">
                      {transaction.description}
                    </h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <span>{formatDate(transaction.created_at)}</span>
                      <span>•</span>
                      <span className={getStatusColor(transaction.status)}>
                        {getStatusText(transaction.status)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`font-semibold ${getAmountColor(transaction.type)}`}>
                    {getAmountPrefix(transaction.type)}{formatCurrency(transaction.amount)}
                  </p>
                  {transaction.payment_method && (
                    <p className="text-xs text-gray-400 uppercase">
                      {transaction.payment_method}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More */}
      {transactions.length >= 50 && (
        <div className="text-center">
          <button
            onClick={fetchTransactions}
            className="text-primary hover:text-primary/80 text-sm"
          >
            Carregar mais transações
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
