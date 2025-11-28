import React, { useState, useEffect } from 'react';
import { Wallet, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { APP_CONFIG } from '../../utils/constants';
import { withdrawSchema, WithdrawFormData, validateWalletAddress } from '../../utils/validators';
import { TransactionService } from '../../services/transaction.service';
import { useCurrency } from '../../hooks/useCurrency';

interface WithdrawFormProps {
  onSuccess?: () => void;
}

const WithdrawForm: React.FC<WithdrawFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const { formatAmount, isBrazilian: isBrazilianUser } = useCurrency();
  
  const [formData, setFormData] = useState<WithdrawFormData>({
    amount: 0,
    paymentMethod: isBrazilianUser ? 'pix' : 'crypto', // Força crypto para não-brasileiros
    balanceType: 'main',
    pixKey: '',
    pixKeyType: 'cpf',
    walletAddress: ''
  });
  const [errors, setErrors] = useState<Partial<WithdrawFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasActiveProducts, setHasActiveProducts] = useState(false);
  const [checkingProducts, setCheckingProducts] = useState(true);

  const { user, refreshBalance } = useAuthStore();
  
  // Atualizar método de pagamento quando idioma mudar
  useEffect(() => {
    if (!isBrazilianUser && formData.paymentMethod === 'pix') {
      setFormData(prev => ({ ...prev, paymentMethod: 'crypto' }));
    }
  }, [isBrazilianUser]);

  // Verificar se usuário tem produtos ativos
  useEffect(() => {
    const checkUserProducts = async () => {
      if (!user?.id) return;
      
      setCheckingProducts(true);
      try {
        const hasProducts = await TransactionService.userHasActiveProducts(user.id);
        setHasActiveProducts(hasProducts);
      } catch (error) {
        console.error('Error checking products:', error);
        setHasActiveProducts(false);
      } finally {
        setCheckingProducts(false);
      }
    };

    checkUserProducts();
  }, [user?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'amount') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name as keyof WithdrawFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const validatedData = withdrawSchema.parse(formData);

      if (validatedData.paymentMethod === 'crypto') {
        const walletValidation = validateWalletAddress(validatedData.walletAddress || '');
        if (!walletValidation.isValid) {
          setErrors({ walletAddress: walletValidation.error });
          return;
        }
      }

      const result = await TransactionService.createWithdrawal(user.id, {
        amount: validatedData.amount,
        paymentMethod: validatedData.paymentMethod,
        pixKey: validatedData.pixKey,
        pixKeyType: validatedData.pixKeyType,
        walletAddress: validatedData.walletAddress
      });

      const netToReceive = typeof (result as any).netAmount === 'number'
        ? (result as any).netAmount
        : (validatedData.amount - result.fee);
      alert(`Solicitação de saque enviada!\n\nValor: ${formatAmount(validatedData.amount)}\nTaxa (5%): ${formatAmount(result.fee)}\nTotal a receber: ${formatAmount(netToReceive)}`);
      
      await refreshBalance();
      onSuccess?.();
      
      setFormData({
        amount: 0,
        paymentMethod: 'pix',
        balanceType: 'main',
        pixKey: '',
        pixKeyType: 'cpf',
        walletAddress: ''
      });
    } catch (error: any) {
      if (error.errors) {
        const newErrors: Partial<WithdrawFormData> = {};
        error.errors.forEach((err: any) => {
          newErrors[err.path[0] as keyof WithdrawFormData] = err.message;
        });
        setErrors(newErrors);
      } else {
        alert(error.message || 'Erro ao processar saque');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="mx-auto mb-4 text-red-400" size={48} />
        <p className="text-gray-400">{t('withdraw.error')}</p>
      </div>
    );
  }

  if (checkingProducts) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-400">{t('common.loading')}</p>
      </div>
    );
  }

  // Calcular saldo disponível baseado no tipo selecionado
  const mainBalance = user.balance || 0;
  const commissionBalance = user.commission_balance || 0;
  const availableBalance = formData.balanceType === 'main' ? mainBalance : commissionBalance;
  
  // Verificar se é segunda-feira (0 = domingo, 1 = segunda, ..., 6 = sábado)
  const today = new Date();
  const isMonday = today.getDay() === 1;
  
  const canWithdraw = availableBalance >= APP_CONFIG.MIN_WITHDRAWAL && hasActiveProducts && isMonday;
  
  // Taxa de conversão USD (exemplo: 1 USD = 5.20 BRL)
  const USD_TO_BRL = 5.20;
  
  // Cálculos para diferentes métodos de pagamento
  const isCrypto = formData.paymentMethod === 'crypto';
  
  let fee: number;
  let totalDeducted: number;
  let amountInUSD: number = 0;
  let netAmountInUSD: number = 0;
  
  if (isCrypto) {
    // Para criptomoeda: converter para USD primeiro, depois aplicar taxa
    amountInUSD = formData.amount / USD_TO_BRL;
    fee = formData.amount * 0.05; // Taxa em BRL
    totalDeducted = formData.amount - fee; // Total a receber (valor bruto - taxa)
    netAmountInUSD = totalDeducted / USD_TO_BRL; // Valor líquido em USD
  } else {
    // Para PIX: cálculo normal em BRL
    fee = formData.amount * 0.05;
    totalDeducted = formData.amount - fee; // Total a receber (valor bruto - taxa)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">{t('withdraw.title')}</h2>
        <p className="text-gray-400">{t('withdraw.subtitle')}</p>
      </div>

      <div className="bg-surface rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">{t('withdraw.availableBalance')}:</span>
          <span className="text-xl font-bold text-primary">
            {formatAmount(availableBalance)}
          </span>
        </div>
      </div>

      {!hasActiveProducts && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="text-red-400" size={20} />
            <div>
              <p className="text-red-400 font-medium">{t('investment.title')}</p>
              <p className="text-red-300 text-sm">
                {t('investment.makeFirstInvestment')}
              </p>
            </div>
          </div>
        </div>
      )}

      {hasActiveProducts && availableBalance < APP_CONFIG.MIN_WITHDRAWAL && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="text-red-400" size={20} />
            <div>
              <p className="text-red-400 font-medium">{t('investment.insufficientBalance')}</p>
              <p className="text-red-300 text-sm">
                {t('withdraw.minAmount')}
              </p>
            </div>
          </div>
        </div>
      )}

      {hasActiveProducts && availableBalance >= APP_CONFIG.MIN_WITHDRAWAL && !isMonday && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="text-yellow-400" size={20} />
            <div>
              <p className="text-yellow-400 font-medium">{t('withdraw.mondayOnly')}</p>
              <p className="text-yellow-300 text-sm">
                {t('withdraw.mondayOnly')}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seleção do tipo de saldo */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('withdraw.balanceType')}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, balanceType: 'main' }))}
              className={`p-4 rounded-lg border-2 transition-colors ${
                formData.balanceType === 'main'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-600 bg-surface text-gray-300 hover:border-gray-500'
              }`}
              disabled={isSubmitting}
            >
              <div className="text-center">
                <p className="font-medium">{t('withdraw.mainBalance')}</p>
                <p className="text-sm opacity-80">{formatAmount(mainBalance)}</p>
                <p className="text-xs opacity-60 mt-1">{t('dashboard.depositPlusTotalEarned')}</p>
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, balanceType: 'commission' }))}
              className={`p-4 rounded-lg border-2 transition-colors ${
                formData.balanceType === 'commission'
                  ? 'border-green-500 bg-green-500/10 text-green-400'
                  : 'border-gray-600 bg-surface text-gray-300 hover:border-gray-500'
              }`}
              disabled={isSubmitting}
            >
              <div className="text-center">
                <p className="font-medium">{t('withdraw.commissionBalance')}</p>
                <p className="text-sm opacity-80">{formatAmount(commissionBalance)}</p>
                <p className="text-xs opacity-60 mt-1">{t('dashboard.referralCommissions')}</p>
              </div>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('withdraw.withdrawAmount')}
            <span className="text-sm text-gray-400 ml-2">
              {user?.withdrawal_limit && user.withdrawal_limit > 0 ? 
                `(Limite: ${formatAmount(user.withdrawal_limit)})` : 
                `(Disponível: ${formatAmount(availableBalance)})`
              }
            </span>
          </label>
          <div className="relative">
            <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="number"
              name="amount"
              value={formData.amount || ''}
              onChange={handleChange}
              min={APP_CONFIG.MIN_WITHDRAWAL}
              max={user?.withdrawal_limit && user.withdrawal_limit > 0 ? 
                Math.min(availableBalance, user.withdrawal_limit) : 
                availableBalance
              }
              step="0.01"
              placeholder="0,00"
              className="w-full pl-10 pr-4 py-3 bg-surface border border-surface-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
              disabled={isSubmitting || !canWithdraw}
            />
          </div>
          {errors.amount && (
            <p className="text-red-400 text-sm mt-1">{errors.amount}</p>
          )}
        </div>

        {formData.amount > 0 && (
          <div className="bg-surface rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">{t('withdraw.title')}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">{t('withdraw.withdrawAmount')}:</span>
                <span className="text-white">{formatAmount(formData.amount)}</span>
              </div>
              {isCrypto && (
                <div className="flex justify-between">
                  <span className="text-gray-400">{t('withdraw.equivalentUSD')}:</span>
                  <span className="text-amber-400">${amountInUSD.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">{t('withdraw.withdrawFee').split(':')[0]}:</span>
                <span className="text-yellow-400">{formatAmount(fee)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-600 pt-2">
                <span className="text-gray-300 font-medium">{t('withdraw.totalToReceive')}:</span>
                <span className="text-success font-bold">{formatAmount(totalDeducted)}</span>
              </div>
              {isCrypto && (
                <div className="flex justify-between">
                  <span className="text-gray-300 font-medium">{t('withdraw.youWillReceive')} (USD):</span>
                  <span className="text-success font-bold">${netAmountInUSD.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('withdraw.paymentMethod')}
          </label>
          {isBrazilianUser ? (
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-surface border border-surface-light rounded-lg text-white focus:outline-none focus:border-primary"
              disabled={isSubmitting || !canWithdraw}
            >
              <option value="pix">{t('withdraw.pix')}</option>
              <option value="crypto">{t('withdraw.crypto')}</option>
            </select>
          ) : (
            <div className="w-full px-4 py-3 bg-surface border border-surface-light rounded-lg text-white">
              {t('withdraw.crypto')} (TRC20 / BEP20)
            </div>
          )}
        </div>

        {formData.paymentMethod === 'pix' && isBrazilianUser && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('withdraw.pixKeyType')}
              </label>
              <select
                name="pixKeyType"
                value={formData.pixKeyType}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-surface border border-surface-light rounded-lg text-white focus:outline-none focus:border-primary"
                disabled={isSubmitting || !canWithdraw}
              >
                <option value="cpf">{t('withdraw.cpf')}</option>
                <option value="cnpj">CNPJ</option>
                <option value="email">{t('withdraw.email')}</option>
                <option value="phone">{t('withdraw.phone')}</option>
                <option value="random">{t('withdraw.random')}</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('withdraw.pixKey')}
              </label>
              <input
                type="text"
                name="pixKey"
                value={formData.pixKey}
                onChange={handleChange}
                placeholder={t('withdraw.enterPixKey')}
                className="w-full px-4 py-3 bg-surface border border-surface-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                disabled={isSubmitting || !canWithdraw}
              />
              {errors.pixKey && (
                <p className="text-red-400 text-sm mt-1">{errors.pixKey}</p>
              )}
            </div>
          </div>
        )}

        {formData.paymentMethod === 'crypto' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('withdraw.walletAddress')}
            </label>
            <input
              type="text"
              name="walletAddress"
              value={formData.walletAddress}
              onChange={handleChange}
              placeholder={t('withdraw.walletPlaceholder')}
              className="w-full px-4 py-3 bg-surface border border-surface-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
              disabled={isSubmitting || !canWithdraw}
            />
            {errors.walletAddress && (
              <p className="text-red-400 text-sm mt-1">{errors.walletAddress}</p>
            )}
          </div>
        )}

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
          <h4 className="text-amber-400 font-medium mb-2">{t('withdraw.importantInfo')}:</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            {user?.withdrawal_limit && user.withdrawal_limit > 0 ? (
              <li>• <strong>{t('withdraw.yourLimit')}: {formatAmount(user.withdrawal_limit)}</strong></li>
            ) : (
              <li>• {t('withdraw.withdrawFee')}</li>
            )}
            <li>• {t('withdraw.minAmount')}</li>
            {!user?.withdrawal_limit || user.withdrawal_limit === 0 ? (
              <li>• {t('withdraw.maxAmount')}</li>
            ) : null}
            <li>• {t('withdraw.mondayOnly')}</li>
            <li>• {t('withdraw.processingTime')}</li>
            <li>• {t('withdraw.activeInvestmentRequired')}</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !canWithdraw || formData.amount < APP_CONFIG.MIN_WITHDRAWAL || formData.amount > availableBalance}
          className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>{t('withdraw.processing')}</span>
            </>
          ) : (
            <>
              <Wallet size={20} />
              <span>{t('withdraw.submit')}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default WithdrawForm;
