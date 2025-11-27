import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  UserPlus, 
  Lock, 
  Unlock,
  Search,
  Filter,
  Eye,
  Settings
} from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import UserDetailsModal from '../modals/UserDetailsModal';
import EditUserModal from '../modals/EditUserModal';

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
  network_invested?: number;
  referrals_count?: number;
  network_earnings?: number;
}

const UsersSection: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

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
          // Total investido pelo usuário
          const { data: investments } = await supabase
            .from('user_investments')
            .select('amount')
            .eq('user_id', user.id);
          
          const totalInvested = investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0;

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

          return {
            ...user,
            total_invested: totalInvested,
            network_invested: networkInvested,
            referrals_count: referralsCount || 0,
            network_earnings: networkEarnings
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
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.cpf.includes(searchTerm);
    
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && user.is_active) ||
                         (filterActive === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesFilter;
  });

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user status:', error);
        return;
      }

      // Atualizar estado local
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: !currentStatus } : user
      ));
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
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
          <button className="flex items-center space-x-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors">
            <UserPlus size={20} />
            <span>Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <p className="text-gray-400 text-sm">Usuários Ativos</p>
              <p className="text-2xl font-bold text-green-400">
                {users.filter(u => u.is_active).length}
              </p>
            </div>
            <Unlock className="text-green-400" size={24} />
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
              <p className="text-gray-400 text-sm">Saldo Total</p>
              <p className="text-2xl font-bold text-yellow-400">
                {formatCurrency(users.reduce((sum, u) => sum + u.balance + u.commission_balance, 0))}
              </p>
            </div>
            <DollarSign className="text-yellow-400" size={24} />
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
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-surface-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as typeof filterActive)}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
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
                    <h3 className="font-semibold text-white">{user.name}</h3>
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
                    onClick={() => toggleUserStatus(user.id, user.is_active)}
                    className={`p-2 transition-colors ${
                      user.is_active 
                        ? 'text-green-400 hover:text-green-300' 
                        : 'text-red-400 hover:text-red-300'
                    }`}
                  >
                    {user.is_active ? <Unlock size={16} /> : <Lock size={16} />}
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
    </div>
  );
};

export default UsersSection;
