import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp, 
  Users, 
  Filter, 
  Search, 
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { formatCurrency, formatDate } from '../../../utils/formatters';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'investment' | 'commission' | 'yield';
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  payment_method?: string;
  balance_type?: 'main' | 'commission';
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  data?: any;
}

const TransactionsSection: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'deposit' | 'withdraw' | 'investment' | 'commission' | 'yield'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          type,
          amount,
          status,
          payment_method,
          balance_type,
          created_at,
          data,
          user:users(id, name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error fetching transactions:', error);
        return;
      }

      // Processar dados com tipagem correta
      const processedTransactions = (data || []).map((tx: any) => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        status: tx.status,
        payment_method: tx.payment_method,
        balance_type: tx.balance_type,
        created_at: tx.created_at,
        data: tx.data,
        user: {
          id: Array.isArray(tx.user) ? tx.user[0]?.id : tx.user?.id || '',
          name: Array.isArray(tx.user) ? tx.user[0]?.name : tx.user?.name || '',
          email: Array.isArray(tx.user) ? tx.user[0]?.email : tx.user?.email || ''
        }
      }));

      setTransactions(processedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalVolume = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const pendingTransactions = transactions.filter(tx => tx.status === 'pending');
  const approvedTransactions = transactions.filter(tx => tx.status === 'approved' || tx.status === 'completed');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="text-green-400" size={16} />;
      case 'withdraw':
        return <ArrowUpRight className="text-red-400" size={16} />;
      case 'investment':
        return <TrendingUp className="text-amber-400" size={16} />;
      case 'commission':
        return <Users className="text-yellow-400" size={16} />;
      case 'yield':
        return <TrendingUp className="text-blue-400" size={16} />;
      default:
        return <CreditCard className="text-gray-400" size={16} />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Depósito';
      case 'withdraw':
        return 'Saque';
      case 'investment':
        return 'Investimento';
      case 'commission':
        return 'Comissão';
      case 'yield':
        return 'Rendimento';
      default:
        return type;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <CheckCircle className="text-green-400" size={16} />;
      case 'rejected':
        return <XCircle className="text-red-400" size={16} />;
      case 'pending':
        return <Clock className="text-yellow-400" size={16} />;
      default:
        return <Clock className="text-gray-400" size={16} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprovado';
      case 'completed':
        return 'Concluído';
      case 'rejected':
        return 'Rejeitado';
      case 'pending':
        return 'Pendente';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return 'bg-green-500/20 text-green-400';
      case 'rejected':
        return 'bg-red-500/20 text-red-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'commission':
      case 'yield':
        return 'text-green-400';
      case 'withdraw':
      case 'investment':
        return 'text-red-400';
      default:
        return 'text-white';
    }
  };

  const getAmountPrefix = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'commission':
      case 'yield':
        return '+';
      case 'withdraw':
      case 'investment':
        return '-';
      default:
        return '';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Transações</h1>
          <p className="text-gray-400">Monitore todas as transações do sistema</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-surface-light rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Volume Total</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalVolume)}</p>
            </div>
            <CreditCard className="text-primary" size={24} />
          </div>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-400">{pendingTransactions.length}</p>
            </div>
            <Clock className="text-yellow-400" size={24} />
          </div>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Aprovadas</p>
              <p className="text-2xl font-bold text-green-400">{approvedTransactions.length}</p>
            </div>
            <CheckCircle className="text-green-400" size={24} />
          </div>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total</p>
              <p className="text-2xl font-bold text-white">{transactions.length}</p>
            </div>
            <CreditCard className="text-white" size={24} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por usuário ou ID da transação..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-surface-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="bg-surface border border-surface-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
          >
            <option value="all">Todos os Tipos</option>
            <option value="deposit">Depósitos</option>
            <option value="withdraw">Saques</option>
            <option value="investment">Investimentos</option>
            <option value="commission">Comissões</option>
            <option value="yield">Rendimentos</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="bg-surface border border-surface-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovados</option>
            <option value="completed">Concluídos</option>
            <option value="rejected">Rejeitados</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando transações...</p>
        </div>
      ) : (
        <div className="bg-surface border border-surface-light rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background/50 border-b border-surface-light">
                <tr>
                  <th className="text-left p-4 text-gray-400 font-medium">ID</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Usuário</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Tipo</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Valor</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Método</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Data</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400">
                      Nenhuma transação encontrada
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-surface-light hover:bg-background/30">
                      <td className="p-4">
                        <p className="text-white font-mono text-sm">{transaction.id.slice(0, 8)}...</p>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-white font-medium">{transaction.user.name}</p>
                          <p className="text-gray-400 text-sm">{transaction.user.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(transaction.type)}
                          <span className="text-white">{getTypeText(transaction.type)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className={`font-bold text-lg ${getAmountColor(transaction.type)}`}>
                          {getAmountPrefix(transaction.type)}{formatCurrency(transaction.amount)}
                        </p>
                        {transaction.balance_type && (
                          <p className="text-xs text-gray-500">
                            {transaction.balance_type === 'commission' ? 'Comissão' : 'Principal'}
                          </p>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(transaction.status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                            {getStatusText(transaction.status)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-white uppercase text-sm">
                          {transaction.payment_method || '-'}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="text-white">{formatDate(transaction.created_at)}</p>
                      </td>
                      <td className="p-4">
                        <button className="p-2 text-gray-400 hover:text-primary transition-colors">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsSection;
