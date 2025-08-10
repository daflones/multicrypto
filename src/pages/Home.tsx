import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Users, Wallet, DollarSign, Plus, Eye } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { formatCurrency } from '../utils/formatters';

const Home: React.FC = () => {
  const { user } = useAuthStore();
  const { 
    investmentStats, 
    commissionStats, 
    teamStats,
    fetchInvestmentStats,
    fetchCommissionStats,
    fetchTeamStats
  } = useUserStore();

  useEffect(() => {
    if (user) {
      fetchInvestmentStats(user.id);
      fetchCommissionStats(user.id);
      fetchTeamStats(user.id);
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">
          Olá, {user.email.split('@')[0]}! 👋
        </h1>
        <p className="text-gray-400">
          Bem-vindo à sua dashboard de investimentos
        </p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/80 text-sm">Saldo Total</p>
            <p className="text-3xl font-bold">{formatCurrency(user.balance)}</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Wallet size={24} />
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Link
            to="/deposit"
            className="flex-1 bg-white/20 hover:bg-white/30 rounded-lg py-2 px-4 text-center text-sm font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <Plus size={16} />
            <span>Depositar</span>
          </Link>
          <Link
            to="/withdraw"
            className="flex-1 bg-white/20 hover:bg-white/30 rounded-lg py-2 px-4 text-center text-sm font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <Wallet size={16} />
            <span>Sacar</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Investment Stats */}
        <div className="bg-surface rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-success" size={20} />
            </div>
            <div>
              <p className="text-white font-semibold">Investimentos</p>
              <p className="text-gray-400 text-sm">
                {investmentStats?.activeInvestments || 0} ativos
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Investido:</span>
              <span className="text-white">
                {formatCurrency(investmentStats?.totalInvested || 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Rendimento:</span>
              <span className="text-success">
                {formatCurrency(investmentStats?.totalEarned || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Team Stats */}
        <div className="bg-surface rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <Users className="text-primary" size={20} />
            </div>
            <div>
              <p className="text-white font-semibold">Equipe</p>
              <p className="text-gray-400 text-sm">
                {teamStats?.totalTeamSize || 0} membros
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Comissões:</span>
              <span className="text-success">
                {formatCurrency(commissionStats?.totalCommissions || 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Este mês:</span>
              <span className="text-success">
                {formatCurrency(commissionStats?.thisMonthTotal || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Yield */}
      {investmentStats && investmentStats.dailyYield > 0 && (
        <div className="bg-success/10 border border-success/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-success font-semibold">Rendimento Diário</p>
              <p className="text-gray-400 text-sm">Próximo pagamento em breve</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-success">
                {formatCurrency(investmentStats.dailyYield)}
              </p>
              <p className="text-success/80 text-sm">por dia</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Ações Rápidas</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <Link
            to="/invest"
            className="bg-surface hover:bg-surface-light rounded-lg p-4 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-primary" size={20} />
              </div>
              <div>
                <p className="text-white font-medium">Investir</p>
                <p className="text-gray-400 text-sm">Ver produtos</p>
              </div>
            </div>
          </Link>

          <Link
            to="/my-investments"
            className="bg-surface hover:bg-surface-light rounded-lg p-4 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                <Eye className="text-secondary" size={20} />
              </div>
              <div>
                <p className="text-white font-medium">Meus Investimentos</p>
                <p className="text-gray-400 text-sm">Acompanhar</p>
              </div>
            </div>
          </Link>

          <Link
            to="/team"
            className="bg-surface hover:bg-surface-light rounded-lg p-4 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-warning/20 rounded-lg flex items-center justify-center">
                <Users className="text-warning" size={20} />
              </div>
              <div>
                <p className="text-white font-medium">Minha Equipe</p>
                <p className="text-gray-400 text-sm">Convidar amigos</p>
              </div>
            </div>
          </Link>

          <Link
            to="/profile"
            className="bg-surface hover:bg-surface-light rounded-lg p-4 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                <DollarSign className="text-gray-300" size={20} />
              </div>
              <div>
                <p className="text-white font-medium">Perfil</p>
                <p className="text-gray-400 text-sm">Configurações</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Getting Started */}
      {(!investmentStats || investmentStats.activeInvestments === 0) && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <h3 className="text-primary font-semibold mb-2">Comece a Investir!</h3>
          <p className="text-gray-300 text-sm mb-4">
            Faça seu primeiro investimento e comece a ganhar rendimentos diários.
          </p>
          <Link
            to="/invest"
            className="inline-block bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Ver Produtos de Investimento
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;
