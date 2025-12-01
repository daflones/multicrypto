import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search,
  CreditCard,
  Wallet
} from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import WithdrawApprovalModal from '../modals/WithdrawApprovalModal';
import Pagination from '../../ui/Pagination';

interface WithdrawTransaction {
  id: string;
  type: 'withdrawal';
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';
  payment_method: string;
  balance_type: 'main' | 'commission' | 'yield';
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
    // PIX
    pix_key?: string;
    pix_key_type?: 'cpf' | 'email' | 'phone' | 'random';
    // Crypto
    wallet_address?: string;
    network?: 'TRC20' | 'BEP20' | 'ERC20';
    crypto_type?: string;
    // Valores calculados
    fee?: number;
    netAmount?: number;
    totalDeducted?: number;
    originalAmount?: number;
    // Banco (se aplicável)
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'failed'>('pending');
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
        .eq('type', 'withdrawal')
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
      case 'completed':
        return 'text-green-400 bg-green-500/20';
      case 'rejected':
        return 'text-red-400 bg-red-500/20';
      case 'failed':
        return 'text-orange-400 bg-orange-500/20';
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
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-white">Saques</h1>
        <p className="text-gray-400 text-sm">Gerencie solicitações de saque</p>
      </div>

      {/* Stats Cards - Grid 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-surface-light rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Pendentes</p>
              <p className="text-xl font-bold text-yellow-400">{pendingCount}</p>
            </div>
            <Clock className="text-yellow-400" size={20} />
          </div>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Aprovados</p>
              <p className="text-xl font-bold text-green-400">{approvedCount}</p>
            </div>
            <CheckCircle className="text-green-400" size={20} />
          </div>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Rejeitados</p>
              <p className="text-xl font-bold text-red-400">{rejectedCount}</p>
            </div>
            <XCircle className="text-red-400" size={20} />
          </div>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Total</p>
              <p className="text-lg font-bold text-white truncate">{formatCurrency(totalAmount)}</p>
            </div>
            <DollarSign className="text-primary" size={20} />
          </div>
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
        
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as typeof statusFilter);
            setCurrentPage(1);
          }}
          className="bg-surface border border-surface-light rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary text-sm"
        >
          <option value="pending">Pendentes</option>
          <option value="all">Todos</option>
          <option value="approved">Aprovados</option>
          <option value="rejected">Rejeitados</option>
          <option value="failed">Falhou</option>
        </select>
      </div>

      {/* Withdrawals Cards */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando...</p>
        </div>
      ) : paginatedWithdrawals.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          Nenhum saque encontrado
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedWithdrawals.map((withdrawal) => (
            <div 
              key={withdrawal.id} 
              className={`bg-surface border rounded-xl p-4 ${
                withdrawal.status === 'pending' ? 'border-yellow-500/30' : 'border-surface-light'
              }`}
              onClick={() => handleViewWithdraw(withdrawal)}
            >
              {/* Header do Card */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    withdrawal.status === 'pending' ? 'bg-yellow-500/20' :
                    withdrawal.status === 'approved' ? 'bg-green-500/20' :
                    'bg-red-500/20'
                  }`}>
                    {getStatusIcon(withdrawal.status)}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{withdrawal.user.name || withdrawal.user.email.split('@')[0]}</p>
                    <p className="text-gray-500 text-xs">{withdrawal.user.email}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
                  {withdrawal.status === 'pending' ? 'Pendente' :
                   withdrawal.status === 'approved' ? 'Aprovado' :
                   withdrawal.status === 'failed' ? 'Falhou' :
                   withdrawal.status === 'completed' ? 'Concluído' : 'Rejeitado'}
                </span>
              </div>

              {/* Valor */}
              <div className="flex items-center justify-between py-2 border-t border-surface-light">
                <div>
                  <span className="text-gray-400 text-sm">Valor</span>
                  <p className="text-xs text-gray-500">
                    Líquido: {formatCurrency(withdrawal.data?.netAmount || withdrawal.amount * 0.95)}
                    {withdrawal.data?.fee && ` (Taxa: ${formatCurrency(withdrawal.data.fee)})`}
                  </p>
                </div>
                <span className="font-bold text-xl text-red-400">
                  -{formatCurrency(withdrawal.amount)}
                </span>
              </div>

              {/* Dados de Pagamento */}
              {withdrawal.data?.pix_key && (
                <div className="py-2 border-t border-surface-light">
                  <p className="text-xs text-gray-400">
                    Chave PIX ({withdrawal.data.pix_key_type?.toUpperCase()}): 
                    <span className="text-white ml-1 font-mono">{withdrawal.data.pix_key}</span>
                  </p>
                </div>
              )}
              {withdrawal.data?.wallet_address && (
                <div className="py-2 border-t border-surface-light">
                  <p className="text-xs text-gray-400">
                    Carteira ({withdrawal.data.network}): 
                    <span className="text-white ml-1 font-mono text-xs break-all">{withdrawal.data.wallet_address}</span>
                  </p>
                </div>
              )}

              {/* Info adicional */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-surface-light">
                <div className="flex items-center space-x-2">
                  {getPaymentMethodIcon(withdrawal.payment_method)}
                  <span className="text-gray-400">
                    {withdrawal.payment_method === 'pix' ? 'PIX' : 'Crypto'}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  withdrawal.balance_type === 'main' 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {withdrawal.balance_type === 'main' ? 'Principal' : 'Comissão'}
                </span>
                <span className="text-gray-500">{formatDate(withdrawal.created_at)}</span>
              </div>

              {/* Botão de ação para pendentes e failed */}
              {(withdrawal.status === 'pending' || withdrawal.status === 'failed') && (
                <div className="mt-3 pt-3 border-t border-surface-light">
                  <button className="w-full py-2 bg-primary/20 text-primary rounded-lg text-sm font-medium">
                    {withdrawal.status === 'failed' ? 'Reprocessar Saque' : 'Revisar Saque'}
                  </button>
                </div>
              )}
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
