import React, { useState, useEffect } from 'react';
import { X, User, TrendingUp, Users, Calendar, Phone, Mail, CreditCard } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { formatCurrency, formatDate, formatCPF, formatPhone } from '../../../utils/formatters';

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
  total_invested?: number;
  network_invested?: number;
  referrals_count?: number;
  network_earnings?: number;
}

interface UserDetailsModalProps {
  user: User;
  onClose: () => void;
}

interface Investment {
  id: string;
  amount: number;
  status: string;
  purchase_date: string;
  product: {
    name: string;
  };
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  payment_method?: string;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ user, onClose }) => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [referrals, setReferrals] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'investments' | 'transactions' | 'referrals'>('overview');

  useEffect(() => {
    fetchUserDetails();
  }, [user.id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);

      // Buscar investimentos
      const { data: investmentsData } = await supabase
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
        .limit(10);

      // Buscar transações
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Buscar indicados
      const { data: referralsData } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          created_at,
          is_active,
          balance,
          commission_balance
        `)
        .eq('referred_by', user.id)
        .order('created_at', { ascending: false });

      // Processar investimentos com tipagem correta
      const processedInvestments = (investmentsData || []).map((inv: any) => ({
        id: inv.id,
        amount: inv.amount,
        status: inv.status,
        purchase_date: inv.purchase_date,
        product: {
          name: Array.isArray(inv.product) ? inv.product[0]?.name : inv.product?.name || 'Produto'
        }
      }));

      // Processar referrals com tipagem correta
      const processedReferrals = (referralsData || []).map((ref: any) => ({
        ...ref,
        phone: ref.phone || '',
        cpf: ref.cpf || '',
        referral_code: ref.referral_code || '',
        referred_by: ref.referred_by || null
      }));

      setInvestments(processedInvestments);
      setTransactions(transactionsData || []);
      setReferrals(processedReferrals);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: User },
    { id: 'investments', label: 'Investimentos', icon: TrendingUp },
    { id: 'transactions', label: 'Transações', icon: CreditCard },
    { id: 'referrals', label: 'Indicados', icon: Users }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-surface-light rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-light">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              user.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              <User size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user.name}</h2>
              <p className="text-gray-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-surface-light">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center space-x-2 px-6 py-3 transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Carregando detalhes...</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Informações Pessoais */}
                  <div className="bg-background/50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Informações Pessoais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <Mail className="text-gray-400" size={16} />
                        <div>
                          <p className="text-gray-400 text-sm">Email</p>
                          <p className="text-white">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="text-gray-400" size={16} />
                        <div>
                          <p className="text-gray-400 text-sm">Telefone</p>
                          <p className="text-white">{formatPhone(user.phone)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CreditCard className="text-gray-400" size={16} />
                        <div>
                          <p className="text-gray-400 text-sm">CPF</p>
                          <p className="text-white">{formatCPF(user.cpf)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Calendar className="text-gray-400" size={16} />
                        <div>
                          <p className="text-gray-400 text-sm">Cadastro</p>
                          <p className="text-white">{formatDate(user.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Saldos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-background/50 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">Saldo Principal</h4>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(user.balance)}</p>
                    </div>
                    <div className="bg-background/50 rounded-lg p-4">
                      <h4 className="text-white font-medium mb-2">Saldo de Comissão</h4>
                      <p className="text-2xl font-bold text-yellow-400">{formatCurrency(user.commission_balance)}</p>
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div className="bg-background/50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Estatísticas</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{formatCurrency(user.total_invested || 0)}</p>
                        <p className="text-gray-400 text-sm">Total Investido</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-400">{formatCurrency(user.network_invested || 0)}</p>
                        <p className="text-gray-400 text-sm">Rede Investiu</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">{user.referrals_count}</p>
                        <p className="text-gray-400 text-sm">Indicados</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-400">{formatCurrency(user.network_earnings || 0)}</p>
                        <p className="text-gray-400 text-sm">Ganhos da Rede</p>
                      </div>
                    </div>
                  </div>

                  {/* Configurações */}
                  <div className="bg-background/50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Configurações</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Status da Conta:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {user.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Limite de Saque:</span>
                        <span className="text-white">{formatCurrency(user.withdrawal_limit || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Taxa de Rendimento:</span>
                        <span className="text-white">{user.custom_yield_rate || 5}% ao dia</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Código de Indicação:</span>
                        <span className="text-primary font-mono">{user.referral_code}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'investments' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Investimentos Recentes</h3>
                  {investments.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">Nenhum investimento encontrado</p>
                  ) : (
                    <div className="space-y-3">
                      {investments.map((investment) => (
                        <div key={investment.id} className="bg-background/50 rounded-lg p-4 flex justify-between items-center">
                          <div>
                            <h4 className="text-white font-medium">{(investment.product as any)?.name || 'Produto'}</h4>
                            <p className="text-gray-400 text-sm">{formatDate(investment.purchase_date)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-primary font-bold">{formatCurrency(investment.amount)}</p>
                            <p className={`text-sm ${
                              investment.status === 'active' ? 'text-green-400' : 'text-gray-400'
                            }`}>
                              {investment.status === 'active' ? 'Ativo' : 'Finalizado'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'transactions' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Transações Recentes</h3>
                  {transactions.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">Nenhuma transação encontrada</p>
                  ) : (
                    <div className="space-y-3">
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className="bg-background/50 rounded-lg p-4 flex justify-between items-center">
                          <div>
                            <h4 className="text-white font-medium capitalize">{transaction.type}</h4>
                            <p className="text-gray-400 text-sm">{formatDate(transaction.created_at)}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${
                              ['deposit', 'commission'].includes(transaction.type) ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {['deposit', 'commission'].includes(transaction.type) ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </p>
                            <p className="text-gray-400 text-sm uppercase">{transaction.payment_method || transaction.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'referrals' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Usuários Indicados</h3>
                  {referrals.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">Nenhum usuário indicado</p>
                  ) : (
                    <div className="space-y-3">
                      {referrals.map((referral) => (
                        <div key={referral.id} className="bg-background/50 rounded-lg p-4 flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              referral.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              <User size={16} />
                            </div>
                            <div>
                              <h4 className="text-white font-medium">{referral.name}</h4>
                              <p className="text-gray-400 text-sm">{referral.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-medium">
                              {formatCurrency(referral.balance + referral.commission_balance)}
                            </p>
                            <p className="text-gray-400 text-sm">{formatDate(referral.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
