import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Search, 
  Filter,
  AlertTriangle,
  CreditCard,
  Wallet
} from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import WithdrawApprovalModal from '../modals/WithdrawApprovalModal';
import Pagination from '../../ui/Pagination';

interface WithdrawTransaction {
  id: string;
  type: 'withdraw';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  payment_method: string;
  balance_type: 'main' | 'commission';
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    cpf?: string;
    balance: number;
    commission_balance: number;
  };
  data?: {
    pix_key?: string;
    pix_key_type?: 'cpf' | 'email' | 'phone' | 'random';
    wallet_address?: string;
    network?: 'TRC20' | 'BEP20' | 'ERC20';
    crypto_type?: string;
    bank_name?: string;
    account_number?: string;
    agency?: string;
    account_holder?: string;
  };
}

const WithdrawalsSection: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedWithdraw, setSelectedWithdraw] = useState<WithdrawTransaction | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
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
        .eq('type', 'withdraw')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        console.error('Error fetching withdrawals:', error);
        return;
      }

      // Processar dados com tipagem correta
      const processedWithdrawals = (data || []).map((tx: any) => ({
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
          email: Array.isArray(tx.user) ? tx.user[0]?.email : tx.user?.email || '',
          phone: Array.isArray(tx.user) ? tx.user[0]?.phone : tx.user?.phone || '',
          cpf: Array.isArray(tx.user) ? tx.user[0]?.cpf : tx.user?.cpf || '',
          balance: Array.isArray(tx.user) ? tx.user[0]?.balance : tx.user?.balance || 0,
          commission_balance: Array.isArray(tx.user) ? tx.user[0]?.commission_balance : tx.user?.commission_balance || 0
        }
      }));

      setWithdrawals(processedWithdrawals);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesSearch = withdrawal.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         withdrawal.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         withdrawal.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || withdrawal.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Paginação
  const totalItems = filteredWithdrawals.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedWithdrawals = filteredWithdrawals.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewWithdraw = (withdrawal: WithdrawTransaction) => {
    setSelectedWithdraw(withdrawal);
    setShowApprovalModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-400" size={16} />;
      case 'approved':
        return <CheckCircle className="text-green-400" size={16} />;
      case 'rejected':
        return <XCircle className="text-red-400" size={16} />;
      default:
        return <Clock className="text-gray-400" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'approved':
        return 'text-green-400 bg-green-500/20';
      case 'rejected':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'pix':
        return <CreditCard className="text-green-400" size={16} />;
      case 'crypto':
        return <Wallet className="text-orange-400" size={16} />;
      default:
        return <CreditCard className="text-gray-400" size={16} />;
    }
  };

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
  const approvedCount = withdrawals.filter(w => w.status === 'approved').length;
  const rejectedCount = withdrawals.filter(w => w.status === 'rejected').length;
  const totalAmount = withdrawals.reduce((sum, w) => sum + w.amount, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Aprovação de Saques</h1>
          <p className="text-gray-400">Gerencie solicitações de saque dos usuários</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-surface-light rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
            </div>
            <Clock className="text-yellow-400" size={24} />
          </div>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Aprovados</p>
              <p className="text-2xl font-bold text-green-400">{approvedCount}</p>
            </div>
            <CheckCircle className="text-green-400" size={24} />
          </div>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Rejeitados</p>
              <p className="text-2xl font-bold text-red-400">{rejectedCount}</p>
            </div>
            <XCircle className="text-red-400" size={24} />
          </div>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Solicitado</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalAmount)}</p>
            </div>
            <DollarSign className="text-primary" size={24} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por usuário, email ou ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-surface-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter);
              setCurrentPage(1);
            }}
            className="bg-surface border border-surface-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovados</option>
            <option value="rejected">Rejeitados</option>
          </select>
        </div>
      </div>

      {/* Withdrawals List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando saques...</p>
        </div>
      ) : (
        <>
          <div className="bg-surface border border-surface-light rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background/50 border-b border-surface-light">
                  <tr>
                    <th className="text-left p-4 text-gray-400 font-medium">Usuário</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Valor</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Método</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Tipo Saldo</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Data</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedWithdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="border-b border-surface-light hover:bg-background/30">
                      <td className="p-4">
                        <div>
                          <p className="text-white font-medium">{withdrawal.user.name}</p>
                          <p className="text-gray-400 text-sm">{withdrawal.user.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-white font-bold">{formatCurrency(withdrawal.amount)}</p>
                        <p className="text-gray-400 text-sm">
                          Líquido: {formatCurrency(withdrawal.amount * 0.95)}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          {getPaymentMethodIcon(withdrawal.payment_method)}
                          <span className="text-white">
                            {withdrawal.payment_method === 'pix' ? 'PIX' : 
                             withdrawal.payment_method === 'crypto' ? 'Crypto' : 
                             withdrawal.payment_method?.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          withdrawal.balance_type === 'main' 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {withdrawal.balance_type === 'main' ? 'Principal' : 'Comissão'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(withdrawal.status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
                            {withdrawal.status === 'pending' ? 'Pendente' :
                             withdrawal.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-white text-sm">{formatDate(withdrawal.created_at)}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewWithdraw(withdrawal)}
                            className="p-2 text-gray-400 hover:text-primary transition-colors"
                            title="Ver detalhes e aprovar/rejeitar"
                          >
                            <Eye size={16} />
                          </button>
                          {withdrawal.status === 'pending' && (
                            <div className="flex items-center space-x-1">
                              <AlertTriangle className="text-yellow-400" size={14} />
                              <span className="text-yellow-400 text-xs">Pendente</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                maxVisiblePages={10}
              />
            </div>
          )}
        </>
      )}

      {/* Modal de Aprovação */}
      {showApprovalModal && selectedWithdraw && (
        <WithdrawApprovalModal
          transaction={selectedWithdraw}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedWithdraw(null);
          }}
          onUpdate={fetchWithdrawals}
        />
      )}
    </div>
  );
};

export default WithdrawalsSection;
