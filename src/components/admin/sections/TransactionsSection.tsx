import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp, 
  Users, 
  Search
} from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import Pagination from '../../ui/Pagination';

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
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25); // 25 transações por página

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
          user:users(id, name, email, phone, cpf, balance, commission_balance)
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

  // Paginação
  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-white">Transações</h1>
        <p className="text-gray-400 text-sm">Monitore todas as transações</p>
      </div>

      {/* Stats Cards - Grid responsivo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface border border-surface-light rounded-xl p-3 lg:p-4">
          <p className="text-gray-400 text-xs lg:text-sm">Volume Total</p>
          <p className="text-lg lg:text-2xl font-bold text-primary truncate">{formatCurrency(totalVolume)}</p>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-xl p-3 lg:p-4">
          <p className="text-gray-400 text-xs lg:text-sm">Pendentes</p>
          <p className="text-xl lg:text-2xl font-bold text-yellow-400">{pendingTransactions.length}</p>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-xl p-3 lg:p-4">
          <p className="text-gray-400 text-xs lg:text-sm">Aprovadas</p>
          <p className="text-xl lg:text-2xl font-bold text-green-400">{approvedTransactions.length}</p>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-xl p-3 lg:p-4">
          <p className="text-gray-400 text-xs lg:text-sm">Total</p>
          <p className="text-xl lg:text-2xl font-bold text-white">{transactions.length}</p>
        </div>
      </div>

      {/* Filters - Responsivo */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-surface-light rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary text-sm"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as typeof typeFilter);
              setCurrentPage(1);
            }}
            className="bg-surface border border-surface-light rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-primary text-sm flex-1 sm:flex-none"
          >
            <option value="all">Tipo</option>
            <option value="deposit">Depósitos</option>
            <option value="withdraw">Saques</option>
            <option value="investment">Invest.</option>
            <option value="commission">Comissões</option>
            <option value="yield">Rendimentos</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter);
              setCurrentPage(1);
            }}
            className="bg-surface border border-surface-light rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-primary text-sm flex-1 sm:flex-none"
          >
            <option value="all">Status</option>
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovados</option>
            <option value="completed">Concluídos</option>
            <option value="rejected">Rejeitados</option>
          </select>
        </div>
      </div>

      {/* Transactions Cards */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando...</p>
        </div>
      ) : paginatedTransactions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          Nenhuma transação encontrada
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedTransactions.map((transaction) => (
            <div 
              key={transaction.id} 
              className="bg-surface border border-surface-light rounded-xl p-4"
            >
              {/* Header do Card */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === 'deposit' ? 'bg-green-500/20' :
                    transaction.type === 'withdraw' ? 'bg-red-500/20' :
                    transaction.type === 'commission' ? 'bg-yellow-500/20' :
                    'bg-blue-500/20'
                  }`}>
                    {getTypeIcon(transaction.type)}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{transaction.user.name || transaction.user.email.split('@')[0]}</p>
                    <p className="text-gray-500 text-xs">{getTypeText(transaction.type)}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                  {getStatusText(transaction.status)}
                </span>
              </div>

              {/* Valor */}
              <div className="flex items-center justify-between py-2 border-t border-surface-light">
                <span className="text-gray-400 text-sm">Valor</span>
                <span className={`font-bold text-lg ${getAmountColor(transaction.type)}`}>
                  {getAmountPrefix(transaction.type)}{formatCurrency(transaction.amount)}
                </span>
              </div>

              {/* Info adicional */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                <span>{formatDate(transaction.created_at)}</span>
                <span className="uppercase">{transaction.payment_method || '-'}</span>
              </div>
            </div>
          ))}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="pt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                maxVisiblePages={5}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionsSection;
