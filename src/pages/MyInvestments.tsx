import React, { useEffect } from 'react';
import { TrendingUp, BarChart3, Calendar } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { useAuthStore } from '../store/authStore';
import InvestmentList from '../components/investment/InvestmentList';
import { formatCurrency } from '../utils/formatters';

const MyInvestments: React.FC = () => {
  const { user } = useAuthStore();
  const { 
    investments, 
    investmentStats,
    isLoadingInvestments,
    fetchUserInvestments,
    fetchInvestmentStats
  } = useUserStore();

  useEffect(() => {
    if (user) {
      fetchUserInvestments(user.id);
      fetchInvestmentStats(user.id);
    }
  }, [user]);

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Meus Investimentos</h1>
        <p className="text-gray-400">Acompanhe seus rendimentos</p>
      </div>

      {/* Stats Cards */}
      {investmentStats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-primary" size={16} />
              </div>
              <span className="text-gray-400 text-sm">Total Investido</span>
            </div>
            <p className="text-xl font-bold text-white">
              {formatCurrency(investmentStats.totalInvested)}
            </p>
          </div>

          <div className="bg-surface rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-success/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="text-success" size={16} />
              </div>
              <span className="text-gray-400 text-sm">Total Ganho</span>
            </div>
            <p className="text-xl font-bold text-success">
              {formatCurrency(investmentStats.totalEarned)}
            </p>
          </div>

          <div className="bg-surface rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center">
                <Calendar className="text-secondary" size={16} />
              </div>
              <span className="text-gray-400 text-sm">Rendimento/Dia</span>
            </div>
            <p className="text-xl font-bold text-secondary">
              {formatCurrency(investmentStats.dailyYield)}
            </p>
          </div>

          <div className="bg-surface rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-warning/20 rounded-lg flex items-center justify-center">
                <span className="text-warning font-bold text-sm">#</span>
              </div>
              <span className="text-gray-400 text-sm">Investimentos</span>
            </div>
            <p className="text-xl font-bold text-warning">
              {investmentStats.activeInvestments}
            </p>
          </div>
        </div>
      )}

      {/* Placeholder for future stat if needed */}

      {/* Investments List */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Histórico de Investimentos</h2>
        <InvestmentList 
          investments={investments} 
          isLoading={isLoadingInvestments} 
        />
      </div>

      {/* Performance Info */}
      {investments.length > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <h3 className="text-primary font-semibold mb-2">📈 Performance</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p>• Rendimentos são creditados automaticamente todos os dias</p>
            <p>• Você pode reinvestir seus rendimentos a qualquer momento</p>
            <p>• Acompanhe o crescimento do seu patrimônio em tempo real</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyInvestments;
