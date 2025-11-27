import React, { useState, useEffect } from 'react';
import { Wallet, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../utils/formatters';
import { APP_CONFIG } from '../../utils/constants';
import { withdrawSchema, WithdrawFormData, validateWalletAddress } from '../../utils/validators';
import { TransactionService } from '../../services/transaction.service';

interface WithdrawFormProps {
  onSuccess?: () => void;
}

const WithdrawForm: React.FC<WithdrawFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<WithdrawFormData>({
    amount: 0,
    paymentMethod: 'pix',
    balanceType: 'main',
    pixKey: '',
    walletAddress: ''
  });
  const [errors, setErrors] = useState<Partial<WithdrawFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasActiveProducts, setHasActiveProducts] = useState(false);
  const [checkingProducts, setCheckingProducts] = useState(true);

  const { user, refreshBalance } = useAuthStore();

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
        walletAddress: validatedData.walletAddress
      });

      alert(`Solicitação de saque enviada!\n\nValor: ${formatCurrency(validatedData.amount)}\nTaxa (5%): ${formatCurrency(result.fee)}\nTotal debitado: ${formatCurrency(result.totalDeducted)}`);
      
      await refreshBalance();
      onSuccess?.();
      
      setFormData({
        amount: 0,
        paymentMethod: 'pix',
        balanceType: 'main',
        pixKey: '',
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
        <p className="text-gray-400">Usuário não encontrado</p>
      </div>
    );
  }

  if (checkingProducts) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-400">Verificando investimentos...</p>
      </div>
    );
  }

  const availableBalance = user.balance || 0;
  const canWithdraw = availableBalance >= APP_CONFIG.MIN_WITHDRAWAL && hasActiveProducts;
  const fee = formData.amount * 0.05;
  const totalDeducted = formData.amount + fee;

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Solicitar Saque</h2>
        <p className="text-gray-400">Retire seus ganhos com segurança</p>
      </div>

      <div className="bg-surface rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Saldo disponível:</span>
          <span className="text-xl font-bold text-primary">
            {formatCurrency(availableBalance)}
          </span>
        </div>
      </div>

      {!hasActiveProducts && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="text-red-400" size={20} />
            <div>
              <p className="text-red-400 font-medium">Investimento necessário</p>
              <p className="text-red-300 text-sm">
                Você precisa ter pelo menos um investimento ativo para solicitar saques.
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
              <p className="text-red-400 font-medium">Saldo insuficiente</p>
              <p className="text-red-300 text-sm">
                Mínimo: {formatCurrency(APP_CONFIG.MIN_WITHDRAWAL)}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Valor do saque
          </label>
          <div className="relative">
            <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="number"
              name="amount"
              value={formData.amount || ''}
              onChange={handleChange}
              min={APP_CONFIG.MIN_WITHDRAWAL}
              max={Math.min(availableBalance, APP_CONFIG.MAX_WITHDRAWAL)}
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
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Valor solicitado:</span>
                <span className="text-white">{formatCurrency(formData.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Taxa (5%):</span>
                <span className="text-yellow-400">{formatCurrency(fee)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-600 pt-2">
                <span className="text-gray-300 font-medium">Total debitado:</span>
                <span className="text-white font-bold">{formatCurrency(totalDeducted)}</span>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Método de recebimento
          </label>
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-surface border border-surface-light rounded-lg text-white focus:outline-none focus:border-primary"
            disabled={isSubmitting || !canWithdraw}
          >
            <option value="pix">PIX</option>
            <option value="crypto">Criptomoeda</option>
          </select>
        </div>

        {formData.paymentMethod === 'pix' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Chave PIX
            </label>
            <input
              type="text"
              name="pixKey"
              value={formData.pixKey}
              onChange={handleChange}
              placeholder="Digite sua chave PIX"
              className="w-full px-4 py-3 bg-surface border border-surface-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
              disabled={isSubmitting || !canWithdraw}
            />
            {errors.pixKey && (
              <p className="text-red-400 text-sm mt-1">{errors.pixKey}</p>
            )}
          </div>
        )}

        {formData.paymentMethod === 'crypto' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Endereço da Carteira
            </label>
            <input
              type="text"
              name="walletAddress"
              value={formData.walletAddress}
              onChange={handleChange}
              placeholder="Digite o endereço da carteira"
              className="w-full px-4 py-3 bg-surface border border-surface-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
              disabled={isSubmitting || !canWithdraw}
            />
            {errors.walletAddress && (
              <p className="text-red-400 text-sm mt-1">{errors.walletAddress}</p>
            )}
          </div>
        )}

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
          <h4 className="text-amber-400 font-medium mb-2">Informações importantes:</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Taxa de saque: 5% sobre o valor solicitado</li>
            <li>• Mínimo: {formatCurrency(APP_CONFIG.MIN_WITHDRAWAL)}</li>
            <li>• Máximo: {formatCurrency(APP_CONFIG.MAX_WITHDRAWAL)}</li>
            <li>• Processamento: 1-3 dias úteis</li>
            <li>• Necessário ter investimento ativo</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !canWithdraw || formData.amount < APP_CONFIG.MIN_WITHDRAWAL || totalDeducted > availableBalance}
          className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Processando...</span>
            </>
          ) : (
            <>
              <Wallet size={20} />
              <span>Solicitar Saque</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default WithdrawForm;
