import React from 'react';
import { TrendingUp, Calendar, DollarSign, Target, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { UserInvestment } from '../../services/supabase';
import { formatDateTimeSP } from '../../utils/formatters';
import { DAILY_YIELD_PERCENTAGE } from '../../constants/investment';
import { getProductImage } from '../../utils/imageUtils';
import { useCurrency } from '../../hooks/useCurrency';

interface InvestmentListProps {
  investments: UserInvestment[];
  isLoading: boolean;
}

const InvestmentList: React.FC<InvestmentListProps> = ({ investments, isLoading }) => {
  const { t } = useTranslation();
  const { formatAmount } = useCurrency();
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-surface rounded-lg p-4 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-surface-light rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-surface-light rounded w-3/4"></div>
                <div className="h-3 bg-surface-light rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (investments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="text-gray-400" size={24} />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{t('investment.noInvestments')}</h3>
        <p className="text-gray-400 mb-6">{t('investment.makeFirstInvestment')}</p>
        <button className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
          {t('investment.seeProducts')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {investments.map((investment) => (
        <div key={investment.id} className="bg-surface rounded-lg p-4 border border-surface-light">
          <div className="flex items-start space-x-4">
            {/* Product Image */}
            <img 
              src={investment.product?.image_path || getProductImage(investment.product?.name || 'default')} 
              alt={investment.product?.name}
              className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
              onError={(e) => {
                e.currentTarget.src = getProductImage(investment.product?.name || 'default');
              }}
            />

            {/* Investment Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-semibold truncate">
                  {investment.product?.name}
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  investment.status === 'active' 
                    ? 'bg-success/20 text-success' 
                    : 'bg-gray-600 text-gray-300'
                }`}>
                  {investment.status === 'active' ? t('investment.active') : t('investment.completed')}
                </span>
              </div>

              {/* Investment Stats */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="flex items-center space-x-2">
                  <DollarSign className="text-gray-400" size={16} />
                  <div>
                    <p className="text-xs text-gray-400">{t('dashboard.invested')}</p>
                    <p className="text-sm font-semibold text-white">
                      {formatAmount(investment.amount)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <TrendingUp className="text-success" size={16} />
                  <div>
                    <p className="text-xs text-gray-400">{t('dashboard.earnings')}</p>
                    <p className="text-sm font-semibold text-success">
                      {formatAmount(investment.amount * DAILY_YIELD_PERCENTAGE)}/{t('investment.days').slice(0, 3)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Target className="text-primary" size={16} />
                  <div>
                    <p className="text-xs text-gray-400">{t('investment.totalReturn')}</p>
                    <p className="text-sm font-semibold text-primary">
                      {formatAmount(investment.amount + (investment.amount * DAILY_YIELD_PERCENTAGE) * (investment.product?.duration_days || 60))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="flex flex-col space-y-2 mt-2">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Calendar size={14} />
                    <span>{t('investment.startedAt')}: {formatDateTimeSP(investment.start_date || investment.purchase_date)}</span>
                  </div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Clock size={14} />
                    <span>{investment.product?.duration_days || 0} {t('investment.days')}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Calendar size={14} />
                    <span>{t('investment.endsAt')}: {investment.end_date ? formatDateTimeSP(investment.end_date) : formatDateTimeSP(new Date().toISOString())}</span>
                  </div>
                </div>
              </div>


            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InvestmentList;
