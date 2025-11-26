import React, { useState, useEffect } from 'react';
import { AlertCircle, DollarSign } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { PAYMENT_METHODS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

interface DepositFormProps {
  onSuccess?: () => void;
}

const DepositForm: React.FC<DepositFormProps> = ({ onSuccess }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'pix' as 'pix' | 'trc20' | 'bep20'
  });
  const [error, setError] = useState('');
  const [usdRate, setUsdRate] = useState<number | null>(null);

  const { user } = useAuthStore();

  const walletAddresses = {
    PIX: import.meta.env.VITE_PIX_KEY || '',
    BEP20: import.meta.env.VITE_BEP20_KEY || '',
    TRC20: import.meta.env.VITE_TRC20_KEY || '',
  };

  // Carregar script do DBXPay Widget
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://dbxbankpay.com/widget.js';
    script.async = true;
    document.head.appendChild(script);

    // Função global para callback de sucesso
    (window as any).onDBXPaySuccess = (dados: any) => {
      console.log('✅ Pagamento confirmado via widget:', dados);
      
      // Mostrar mensagem de sucesso
      alert(`Recarga de ${formatCurrency(parseFloat(formData.amount))} efetuada com sucesso! 🎉`);
      
      // Chamar callback de sucesso
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    };

    return () => {
      document.head.removeChild(script);
      delete (window as any).onDBXPaySuccess;
    };
  }, [formData.amount, onSuccess]);

  useEffect(() => {
    const fetchUsdRate = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/BRL');
        const data = await response.json();
        setUsdRate(data.rates.USD);
      } catch (error) {
        console.error('Erro ao buscar taxa USD:', error);
        setUsdRate(0.2); // Fallback
      }
    };
    fetchUsdRate();
  }, []);

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^\d,]/g, '').replace(',', '.');
    setFormData(prev => ({ ...prev, amount: numericValue }));
    setError('');
  };

  const handlePaymentMethodChange = (method: 'pix' | 'trc20' | 'bep20') => {
    setFormData(prev => ({ ...prev, paymentMethod: method, amount: '' }));
    setError('');
  };

  const handleContinue = () => {
    const amount = parseFloat(formData.amount.replace(',', '.')) || 0;
    const currencySymbol = 'R$';
    
    // Validação de valor mínimo
    if (amount < 10) {
      setError(`Valor mínimo de ${currencySymbol} ${(10).toFixed(2)}`);
      return;
    }
    setError('');
    
    setStep(2);
  };

  const amount = parseFloat(formData.amount.replace(',', '.')) || 0;
  const isPix = formData.paymentMethod === 'pix';
  const isCrypto = !isPix;
  const currencySymbol = 'R$';
  const amountInUsd = isCrypto && usdRate ? amount * usdRate : undefined;

  return (
    <div className="w-full max-w-md mx-auto bg-background p-8 rounded-xl shadow-lg">
      {/* Step 1: Amount and Payment Method */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">Fazer Depósito</h2>
            <p className="text-gray-400">Escolha o valor e método de pagamento</p>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">Método de Pagamento</label>
            <div className="grid grid-cols-1 gap-3">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => handlePaymentMethodChange(method.id as 'pix' | 'trc20' | 'bep20')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.paymentMethod === method.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-surface-light hover:border-primary/50 text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <method.icon size={24} />
                    <div className="text-left">
                      <div className="font-medium">{method.name}</div>
                      <div className="text-sm opacity-75">{method.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Valor ({currencySymbol})
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={formData.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0,00"
                className="w-full pl-10 pr-4 py-3 bg-surface border border-surface-light rounded-lg text-white placeholder-gray-400 focus:border-primary focus:outline-none"
              />
            </div>
            {amountInUsd && (
              <p className="text-xs text-gray-400">≈ ${amountInUsd.toFixed(2)} USD</p>
            )}
          </div>

          {error && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-3">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={!formData.amount || parseFloat(formData.amount.replace(',', '.')) <= 0}
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuar
          </button>
        </div>
      )}

      {/* Step 2: Payment Details */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">Realizar Pagamento</h2>
            <p className="text-gray-400">Efetue o pagamento para prosseguir</p>
          </div>

          {isPix ? (
            // PIX via Widget DBXPay
            <div className="bg-surface rounded-lg p-6 space-y-4">
              <div className="text-center">
                <p className="text-gray-400 text-sm">Valor a pagar:</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(amount)}</p>
              </div>

              {/* Widget DBXPay */}
              <div className="text-center">
                <button 
                  className="dbxpay-button w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium text-lg hover:opacity-90 transition-opacity"
                  data-api-key={import.meta.env.VITE_DBXPAY_API_KEY}
                  data-amount={amount.toFixed(2)}
                  data-description={`Recarga CryptoYield - ${formatCurrency(amount)}`}
                  data-customer-email={user?.email || ''}
                  data-customer-name={user?.email || ''}
                  data-on-success="onDBXPaySuccess"
                  data-webhook-url={`${import.meta.env.VITE_APP_URL}/api/webhook/dbxpay`}
                >
                  💳 Pagar {formatCurrency(amount)} com PIX
                </button>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <h4 className="text-primary font-semibold mb-2">Como funciona:</h4>
                <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                  <li>Clique no botão acima</li>
                  <li>Escaneie o QR Code ou cole o código PIX</li>
                  <li>Confirme o pagamento no seu banco</li>
                  <li>Aguarde a confirmação automática</li>
                </ol>
                <p className="text-xs text-gray-400 mt-2">
                  ⚡ O saldo será creditado automaticamente após a confirmação.
                </p>
              </div>
            </div>
          ) : (
            // Crypto (mantém o sistema atual)
            <div className="bg-surface rounded-lg p-6 space-y-4">
              <div className="text-center">
                <p className="text-gray-400 text-sm">Valor a pagar:</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(amount)}</p>
                {amountInUsd && <p className="text-gray-400 text-sm">≈ ${amountInUsd.toFixed(2)} USD</p>}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center bg-yellow-500/10 text-yellow-400 text-xs p-2 rounded-lg">
                  <AlertCircle size={16} className="mr-2 shrink-0"/>
                  <span>Envie exatamente o valor mostrado para o endereço abaixo.</span>
                </div>
                <div className="bg-gray-800 p-3 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Endereço da carteira:</p>
                  <span className="text-white text-sm font-mono break-all">
                    {walletAddresses[formData.paymentMethod.toUpperCase() as keyof typeof walletAddresses]}
                  </span>
                </div>
                <div className="flex items-center bg-yellow-500/10 text-yellow-400 text-xs p-2 rounded-lg">
                  <AlertCircle size={16} className="mr-2 shrink-0"/>
                  <span>Aguarde as confirmações da rede antes de prosseguir.</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <button onClick={() => setStep(1)} className="py-3 px-6 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors">
              ← Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepositForm;
