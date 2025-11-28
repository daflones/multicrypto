import React, { useEffect, useState } from 'react';
import { X, TrendingUp, AlertCircle, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Product } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { NotificationService } from '../../services/notification.service';
import { useNavigate } from 'react-router-dom';
import { INVESTMENT_LIMITS, calculateDailyYield, calculateTotalYield, calculateTotalROI, calculateDaysToMaxReturn } from '../../constants/investment';
import { useToastContext } from '../../contexts/ToastContext';
import { useCurrency } from '../../hooks/useCurrency';

interface InvestmentModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const clampValue = (value: number, min: number, max: number) => {
  if (Number.isNaN(value)) return min;
  if (max <= min) return min;
  return Math.min(Math.max(value, min), max);
};

const InvestmentModal: React.FC<InvestmentModalProps> = ({ 
  product, 
  isOpen, 
  onClose 
}) => {
  const { t } = useTranslation();
  const { formatAmount } = useCurrency();
  const [isInvesting, setIsInvesting] = useState(false);
  const [investAmount, setInvestAmount] = useState(0);
  const { user } = useAuthStore();
  const { createInvestment } = useUserStore();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToastContext();

  useEffect(() => {
    if (!product || !isOpen) return;
    const min = product.min_investment || product.price || 0;
    const rawMax = product.max_investment || product.price || min;
    const max = rawMax >= min ? rawMax : min;
    const defaultValue = clampValue(product.price || min, min, max);
    setInvestAmount(defaultValue);
  }, [product, isOpen]);

  if (!isOpen || !product || !user) return null;

  const handleInvest = async () => {
    try {
      setIsInvesting(true);
      
      // Verificar se o valor está abaixo do mínimo do produto
      if (investAmount < sliderMin || investAmount === 0) {
        showError(
          'Valor Inválido',
          `O valor mínimo para este produto é ${formatAmount(sliderMin)}`
        );
        return;
      }
      
      // Check if user has sufficient total balance (main + commission)
      const totalBalance = (user.balance || 0) + (user.commission_balance || 0);
      if (totalBalance < investAmount) {
        // Notificação de rejeição por saldo insuficiente
        try {
          await NotificationService.createNotification(
            user.id,
            'investment_rejected',
            'Investimento não realizado',
            'Desculpe, seu investimento não foi realizado por: saldo insuficiente.' ,
            { product_id: product.id, product_name: product.name }
          );
        } catch {}
        
        showError(
          'Saldo Insuficiente',
          `Disponível: ${formatAmount(totalBalance)}, Necessário: ${formatAmount(investAmount)}`
        );
        return;
      }

      // Create investment (service now handles balance deduction automatically)
      await createInvestment(user.id, product.id, investAmount);
      
      // Refresh user balance from database (both main and commission balances)
      const { refreshBalance } = useAuthStore.getState();
      await refreshBalance();
      
      // Notificação de sucesso
      try {
        await NotificationService.createNotification(
          user.id,
          'investment_approved',
          'Parabéns! Investimento realizado',
          `Parabéns, seu produto ${product.name} foi adquirido com sucesso.`,
          { product_id: product.id, product_name: product.name, amount: investAmount }
        );
      } catch (error) {
        console.error('Erro ao criar notificação:', error);
      }

      showSuccess(
        'Investimento Realizado!',
        `Investimento de ${formatAmount(investAmount)} em ${product.name} realizado com sucesso!`
      );
      
      onClose();
      navigate('/my-investments');
    } catch (error) {
      console.error('Investment error:', error);
      const reason = error instanceof Error ? error.message : 'Erro ao realizar investimento';
      // Notificação de rejeição com motivo
      try {
        await NotificationService.createNotification(
          user.id,
          'investment_rejected',
          'Investimento não realizado',
          `Desculpe, seu investimento não foi realizado por: ${reason}`,
          { product_id: product.id, product_name: product.name }
        );
      } catch {}
      
      showError(
        'Erro no Investimento',
        reason
      );
    } finally {
      setIsInvesting(false);
    }
  };

  // Limites do produto específico - usar o price como mínimo
  const productMin = product.price || INVESTMENT_LIMITS.MIN;
  const productMax = product.max_investment || INVESTMENT_LIMITS.MAX;
  const sliderMin = productMin;
  const sliderMax = productMax;
  
  // Cálculos de rendimento (5% ao dia, máximo 300% em 60 dias)
  const dailyReturn = calculateDailyYield(investAmount);
  const totalReturn = calculateTotalYield(investAmount);
  const totalROI = calculateTotalROI(investAmount);
  const daysToComplete = calculateDaysToMaxReturn(investAmount);
  
  // Usar saldo total (principal + comissão)
  const totalBalance = (user.balance || 0) + (user.commission_balance || 0);
  const balanceAfterInvestment = totalBalance - investAmount;
  const hasInsufficientBalance = balanceAfterInvestment < 0;
  const isBelowMinimum = investAmount < sliderMin || investAmount === 0;

  // ✅ Calcular como os saldos serão debitados (mesma lógica do backend)
  const calculateBalanceBreakdown = (amount: number) => {
    const mainBalance = user.balance || 0;
    const commissionBalance = user.commission_balance || 0;
    
    let remainingAmount = amount;
    let newCommissionBalance = commissionBalance;
    let newMainBalance = mainBalance;

    // 1. Primeiro, usar saldo de comissão
    if (remainingAmount > 0 && commissionBalance > 0) {
      const commissionUsed = Math.min(remainingAmount, commissionBalance);
      newCommissionBalance = commissionBalance - commissionUsed;
      remainingAmount -= commissionUsed;
    }

    // 2. Depois, usar saldo principal para o restante
    if (remainingAmount > 0) {
      newMainBalance = mainBalance - remainingAmount;
    }

    return {
      newMainBalance,
      newCommissionBalance,
      commissionUsed: commissionBalance - newCommissionBalance,
      mainUsed: mainBalance - newMainBalance
    };
  };

  const balanceBreakdown = calculateBalanceBreakdown(investAmount);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-light">
          <h2 className="text-xl font-bold text-white">{t('investment.confirmInvestment')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Product Info */}
          <div className="flex items-center space-x-4">
            <img 
              src={product.image_path || '/images/crypto-placeholder.jpg'} 
              alt={product.name}
              className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
              onError={(e) => {
                e.currentTarget.src = '/images/crypto-placeholder.jpg';
              }}
            />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">{product.name}</h3>
              <p className="text-sm text-gray-400">{product.description}</p>
            </div>
          </div>

          {/* Investment Details */}
          <div className="bg-background/50 rounded-lg p-4 space-y-4">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400">{t('investment.investmentValue')}:</span>
                <span className="text-white font-semibold text-2xl">
                  {formatAmount(investAmount)}
                </span>
              </div>
              
              {/* Input de valor digitável */}
              <div className="mb-4">
                <input
                  type="number"
                  min={sliderMin}
                  max={sliderMax}
                  step={INVESTMENT_LIMITS.STEP}
                  value={investAmount || ''}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    
                    // Permitir campo vazio
                    if (inputValue === '') {
                      setInvestAmount(0);
                      return;
                    }
                    
                    const value = Number(inputValue);
                    
                    // Permitir qualquer valor durante a digitação, mas limitar no máximo
                    if (value <= sliderMax) {
                      setInvestAmount(value);
                    }
                  }}
                  onBlur={(e) => {
                    // Ao sair do campo, garantir que o valor seja pelo menos o mínimo
                    const value = Number(e.target.value);
                    if (value < sliderMin) {
                      setInvestAmount(sliderMin);
                    }
                  }}
                  className="w-full bg-surface border border-surface-light rounded-lg px-4 py-3 text-white text-center text-xl font-semibold focus:outline-none focus:border-primary"
                  placeholder={`${t('investment.minimumAmount')}: ${formatAmount(sliderMin)}`}
                />
              </div>

              <div className="space-y-2">
                <input
                  type="range"
                  min={sliderMin}
                  max={sliderMax}
                  step={INVESTMENT_LIMITS.STEP}
                  value={investAmount}
                  onChange={(e) => setInvestAmount(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{t('investment.minimumAmount')}: {formatAmount(sliderMin)}</span>
                  <span>{t('investment.maxAmount')}: {formatAmount(sliderMax)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">{t('investment.dailyYield')}:</span>
                <span className="text-success font-semibold flex items-center space-x-1">
                  <TrendingUp size={16} />
                  <span>{formatAmount(dailyReturn)}</span>
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">{t('investment.totalReturn')}:</span>
                <span className="text-success font-semibold">
                  {formatAmount(totalReturn)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">{t('investment.daysToComplete')}:</span>
                <span className="text-amber-400 font-semibold">
                  {daysToComplete} {t('investment.days')}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">{t('investment.totalROI')}:</span>
                <span className="text-success font-semibold">
                  {totalROI.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Balance Check */}
          <div className="bg-background/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">{t('dashboard.totalBalance')}:</span>
              <span className="text-white font-semibold">
                {formatAmount(totalBalance)}
              </span>
            </div>
            <div className="text-xs text-gray-500 mb-3 space-y-1">
              <div className="flex justify-between">
                <span>• {t('withdraw.mainBalance')}:</span>
                <span>{formatAmount(user.balance || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>• {t('withdraw.commissionBalance')}:</span>
                <span>{formatAmount(user.commission_balance || 0)}</span>
              </div>
            </div>
            <div className="border-t border-gray-600 pt-3 mt-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">{t('dashboard.availableBalance')}:</span>
                <span className={`font-semibold ${
                  hasInsufficientBalance ? 'text-error' : 'text-success'
                }`}>
                  {formatAmount(balanceAfterInvestment)}
                </span>
              </div>
              
              {/* Saldos restantes simples */}
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>{t('withdraw.mainBalance')}:</span>
                  <span className="text-gray-300">
                    {formatAmount(Math.max(0, balanceBreakdown.newMainBalance))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t('withdraw.commissionBalance')}:</span>
                  <span className="text-gray-300">
                    {formatAmount(Math.max(0, balanceBreakdown.newCommissionBalance))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {isBelowMinimum && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-yellow-500 font-medium text-sm">{t('investment.minimumAmount')}</p>
                <p className="text-yellow-500/80 text-sm mt-1">
                  {t('investment.minimumInvestment')}: {formatAmount(sliderMin)}
                </p>
              </div>
            </div>
          )}
          
          {hasInsufficientBalance && !isBelowMinimum && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="text-error flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-error font-medium text-sm">{t('investment.insufficientBalance')}</p>
                <p className="text-error/80 text-sm mt-1">
                  {t('investment.needMore', { amount: formatAmount(investAmount - totalBalance) })}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleInvest}
              disabled={isInvesting || hasInsufficientBalance || isBelowMinimum}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isInvesting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <DollarSign size={20} />
                  <span>{t('investment.confirmInvestment')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentModal;
