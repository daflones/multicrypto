import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  UserPlus,
  Search,
  Filter,
  Eye,
  Settings
} from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import UserDetailsModal from '../modals/UserDetailsModal';
import EditUserModal from '../modals/EditUserModal';
import ActivateUserModal from '../modals/ActivateUserModal';
import CreateUserModal from '../modals/CreateUserModal';
import Pagination from '../../ui/Pagination';

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  cpf: string;
  balance: number;
  commission_balance: number;
  is_active: boolean;
  created_at: string;
  referral_code: string;
  referred_by: string | null;
  withdrawal_limit?: number;
  custom_yield_rate?: number;
  // Dados calculados
  total_invested?: number;
  referrals_count?: number;
  network_invested?: number;
  network_earnings?: number;
  active_investments_count?: number;
  has_balance?: boolean;
  has_deposits?: boolean;
}

const UsersSection: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // 20 usuários por página

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Buscar usuários com dados básicos
      const { data: usersData, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          name,
          phone,
          cpf,
          balance,
          commission_balance,
          is_active,
          created_at,
          referral_code,
          referred_by,
          withdrawal_limit,
          custom_yield_rate
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      // Calcular dados adicionais para cada usuário
      const usersWithStats = await Promise.all(
        usersData.map(async (user) => {
          // Total investido e investimentos ativos
          const { data: investments } = await supabase
            .from('user_investments')
            .select('amount, status')
            .eq('user_id', user.id);
          
          const totalInvested = investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0;
          const activeInvestmentsCount = investments?.filter(inv => inv.status === 'active').length || 0;

          // Verificar se já fez alguma recarga (transação de depósito aprovada)
          const { data: deposits } = await supabase
            .from('transactions')
            .select('id')
            .eq('user_id', user.id)
            .eq('type', 'deposit')
            .eq('status', 'approved')
            .limit(1);
          
          const hasDeposits = deposits && deposits.length > 0;

          // Contar indicados diretos
          const { count: referralsCount } = await supabase
            .from('users')
            .select('id', { count: 'exact' })
            .eq('referred_by', user.id);

          // Calcular investimentos da rede (indicados)
          const { data: networkUsers } = await supabase
            .from('users')
            .select('id')
            .eq('referred_by', user.id);

          let networkInvested = 0;
          if (networkUsers && networkUsers.length > 0) {
            const networkIds = networkUsers.map(u => u.id);
            const { data: networkInvestments } = await supabase
              .from('user_investments')
              .select('amount')
              .in('user_id', networkIds);
            
            networkInvested = networkInvestments?.reduce((sum, inv) => sum + inv.amount, 0) || 0;
          }

          // Calcular ganhos da rede (comissões recebidas)
          const { data: commissions } = await supabase
            .from('commissions')
            .select('amount')
            .eq('beneficiary_id', user.id);
          
          const networkEarnings = commissions?.reduce((sum, comm) => sum + comm.amount, 0) || 0;

          const hasBalance = (user.balance + user.commission_balance) > 0;

          return {
            ...user,
            total_invested: totalInvested,
            network_invested: networkInvested,
            referrals_count: referralsCount || 0,
            network_earnings: networkEarnings,
            active_investments_count: activeInvestmentsCount,
            has_balance: hasBalance,
            has_deposits: hasDeposits || false, // Se já fez alguma recarga
            is_active: activeInvestmentsCount > 0 // Usuário ativo = tem investimentos ativos
          };
        })
      );

      setUsers(usersWithStats);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (user.cpf || '').includes(searchTerm);
    
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && user.is_active) ||
                         (filterActive === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesFilter;
  });

  // Paginação
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddProducts = (user: User) => {
    setSelectedUser(user);
    setShowActivateModal(true);
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gerenciamento de Usuários</h1>
          <p className="text-gray-400">Gerencie usuários, redes e limites de saque</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <UserPlus size={20} />
            <span>Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-surface border border-surface-light rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total de Usuários</p>
              <p className="text-2xl font-bold text-white">{users.length}</p>
            </div>
            <Users className="text-primary" size={24} />
          </div>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Investidores Ativos</p>
              <p className="text-2xl font-bold text-green-400">
                {users.filter(u => u.active_investments_count && u.active_investments_count > 0).length}
              </p>
            </div>
            <TrendingUp className="text-green-400" size={24} />
          </div>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Investido</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(users.reduce((sum, u) => sum + (u.total_invested || 0), 0))}
              </p>
            </div>
            <TrendingUp className="text-primary" size={24} />
          </div>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Líderes</p>
              <p className="text-2xl font-bold text-purple-400">
                {users.filter(u => u.commission_balance > 0).length}
              </p>
            </div>
            <Users className="text-purple-400" size={24} />
          </div>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Depositantes</p>
              <p className="text-2xl font-bold text-yellow-400">
                {users.filter(u => u.has_deposits).length}
              </p>
            </div>
            <DollarSign className="text-yellow-400" size={24} />
          </div>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Saldo Total</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(users.reduce((sum, u) => sum + u.balance + u.commission_balance, 0))}
              </p>
            </div>
            <DollarSign className="text-white" size={24} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome, email ou CPF..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset para primeira página ao buscar
            }}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-surface-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filterActive}
            onChange={(e) => {
              setFilterActive(e.target.value as typeof filterActive);
              setCurrentPage(1); // Reset para primeira página ao filtrar
            }}
            className="bg-surface border border-surface-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando usuários...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedUsers.map((user) => (
            <div
              key={user.id}
              className="bg-surface border border-surface-light rounded-lg p-4 hover:border-primary/30 transition-colors"
            >
              {/* User Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    user.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    <Users size={20} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <h3 className="font-semibold text-white">{user.name}</h3>
                      
                      {/* Tags de tipo de usuário - mostrar todas que se aplicam */}
                      <div className="flex items-center space-x-1 flex-wrap">
                        {user.active_investments_count && user.active_investments_count > 0 && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                            Investidor
                          </span>
                        )}
                        
                        {user.commission_balance > 0 && (
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-medium rounded-full">
                            Líder
                          </span>
                        )}
                        
                        {user.has_deposits && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full">
                            Depositante
                          </span>
                        )}
                        
                        {/* Se não tem nenhuma das tags acima, mostrar "Novo" */}
                        {(!user.active_investments_count || user.active_investments_count === 0) && 
                         user.commission_balance === 0 && 
                         !user.has_deposits && (
                          <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs font-medium rounded-full">
                            Novo
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleViewDetails(user)}
                    className="p-2 text-gray-400 hover:text-primary transition-colors"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleEditUser(user)}
                    className="p-2 text-gray-400 hover:text-primary transition-colors"
                  >
                    <Settings size={16} />
                  </button>
                  <button
                    onClick={() => handleAddProducts(user)}
                    className="p-2 text-primary hover:text-primary/80 transition-colors"
                    title="Adicionar produtos ao usuário"
                  >
                    <UserPlus size={16} />
                  </button>
                </div>
              </div>

              {/* User Stats */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Saldo Principal:</span>
                  <span className="text-white font-medium">{formatCurrency(user.balance)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Saldo Comissão:</span>
                  <span className="text-yellow-400 font-medium">{formatCurrency(user.commission_balance)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Total Investido:</span>
                  <span className="text-primary font-medium">{formatCurrency(user.total_invested || 0)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Indicados:</span>
                  <span className="text-white font-medium">{user.referrals_count}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Rede Investiu:</span>
                  <span className="text-green-400 font-medium">{formatCurrency(user.network_invested || 0)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Ganhos da Rede:</span>
                  <span className="text-green-400 font-medium">{formatCurrency(user.network_earnings || 0)}</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-4 pt-3 border-t border-surface-light">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.is_active 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {user.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                  
                  <span className="text-xs text-gray-500">
                    {formatDate(user.created_at)}
                  </span>
                </div>
              </div>
            </div>
            ))}
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

      {/* Modals */}
      {showDetailsModal && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onUpdate={fetchUsers}
        />
      )}

      {showActivateModal && selectedUser && (
        <ActivateUserModal
          user={selectedUser}
          onClose={() => {
            setShowActivateModal(false);
            setSelectedUser(null);
          }}
          onUpdate={fetchUsers}
        />
      )}

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onUpdate={fetchUsers}
        />
      )}
    </div>
  );
};

export default UsersSection;
