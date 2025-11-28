import React, { useState, useEffect } from 'react';
import { AlertCircle, Copy, CheckCircle, Clock, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { PAYMENT_METHODS } from '../../utils/constants';
import { dbxBankPayService, DBXPaymentResponse } from '../../services/dbxbankpay.service';
import { useCurrency } from '../../hooks/useCurrency';

interface DepositFormProps {
  onSuccess?: () => void;
}

const DepositForm: React.FC<DepositFormProps> = () => {
  const { t } = useTranslation();
  const { formatAmount, isBrazilian: isBrazilianUser, currency, convertToBRL } = useCurrency();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: isBrazilianUser ? 'pix' : 'trc20' as 'pix' | 'trc20' | 'bep20'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [payment, setPayment] = useState<DBXPaymentResponse | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'aguardando' | 'aprovado' | 'expirado' | 'cancelado'>('idle');
  const [copied, setCopied] = useState(false);
  const [usdRate, setUsdRate] = useState<number | null>(null);

  const { user } = useAuthStore();
  
  // Atualizar método de pagamento quando idioma mudar
  useEffect(() => {
    if (!isBrazilianUser && formData.paymentMethod === 'pix') {
      setFormData(prev => ({ ...prev, paymentMethod: 'trc20' }));
    }
  }, [isBrazilianUser]);

  const walletAddresses = {
    PIX: import.meta.env.VITE_PIX_KEY || '',
    BEP20: import.meta.env.VITE_BEP20_KEY || '',
    TRC20: import.meta.env.VITE_TRC20_KEY || '',
  };

  // Buscar taxa USD
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

  // O status será atualizado via webhook
  // Não fazemos polling, apenas aguardamos a notificação do webhook

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^\d,]/g, '').replace(',', '.');
    setFormData(prev => ({ ...prev, amount: numericValue }));
    setError('');
  };

  const handlePaymentMethodChange = (method: 'pix' | 'trc20' | 'bep20') => {
    setFormData(prev => ({ ...prev, paymentMethod: method, amount: '' }));
    setError('');
    setPayment(null);
    setPaymentStatus('idle');
  };

  const handleContinue = async () => {
    const amount = parseFloat(formData.amount.replace(',', '.')) || 0;
    
    // Validação de valor mínimo
    if (amount < 10) {
      setError(t('deposit.minimumAmount'));
      return;
    }
    
    setError('');
    setIsLoading(true);

    try {
      if (formData.paymentMethod === 'pix') {
        // Criar pagamento PIX via DBXBankPay
        const externalReference = dbxBankPayService.generateExternalReference(user?.id || 'anonymous');
        
        const paymentData = {
          amount: dbxBankPayService.formatAmountToCents(amount),
          description: `Recarga Multi Crypto - ${formatAmount(amount)}`,
          customer_email: user?.email || '',
          customer_name: user?.email || 'Usuário',
          customer_document: user?.cpf || '',
          customer_phone: user?.phone || '11999999999',
          external_reference: externalReference,
          webhook_url: import.meta.env.VITE_WEBHOOK_URL || 'https://multicrypto.com.br/api/webhooks/dbxbankpay'
        };

        const newPayment = await dbxBankPayService.createPayment(paymentData);
        setPayment(newPayment);
        setPaymentStatus(newPayment.status);
      }
      
      setStep(2);
    } catch (error: any) {
      console.error('Erro ao criar pagamento:', error);
      setError(error.message || 'Erro ao processar pagamento. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const amount = parseFloat(formData.amount.replace(',', '.')) || 0;
  const isPix = formData.paymentMethod === 'pix';
  const isCrypto = !isPix;
  
  // Para usuários não-brasileiros: converter valor digitado na moeda local para BRL, depois para USD
  // Para brasileiros: converter direto de BRL para USD
  const amountInBRL = isBrazilianUser ? amount : convertToBRL(amount);
  const amountInUsd = isCrypto && usdRate ? amountInBRL * usdRate : undefined;

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'aguardando':
        return <Clock className="text-yellow-400" size={24} />;
      case 'aprovado':
        return <CheckCircle className="text-green-400" size={24} />;
      case 'expirado':
      case 'cancelado':
        return <X className="text-red-400" size={24} />;
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'aguardando':
        return t('deposit.awaitingPayment');
      case 'aprovado':
        return t('deposit.paymentApproved');
      case 'expirado':
        return t('deposit.paymentExpired');
      case 'cancelado':
        return t('deposit.paymentCancelled');
      default:
        return '';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-background p-8 rounded-xl shadow-lg">
      {/* Step 1: Amount and Payment Method */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">{t('deposit.title')}</h2>
            <p className="text-gray-400">{t('deposit.subtitle')}</p>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">{t('deposit.selectMethod')}</label>
            <div className="grid grid-cols-1 gap-3">
              {PAYMENT_METHODS
                .filter(method => isBrazilianUser || method.id !== 'pix') // Filtrar PIX para não-brasileiros
                .map((method) => (
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
              {t('deposit.amount')} ({currency.code})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">
                {currency.symbol}
              </span>
              <input
                type="text"
                value={formData.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder={t('deposit.amountPlaceholder')}
                className="w-full pl-12 pr-4 py-3 bg-surface border border-surface-light rounded-lg text-white placeholder-gray-400 focus:border-primary focus:outline-none"
              />
            </div>
            {isCrypto && amountInUsd && amountInUsd > 0 && (
              <div className="bg-surface-light rounded-lg p-3 mt-2">
                <p className="text-sm text-gray-300">
                  {t('deposit.youWillSend')}: <span className="text-primary font-bold">${amountInUsd.toFixed(2)} USDT</span>
                </p>
                {!isBrazilianUser && (
                  <p className="text-xs text-gray-500 mt-1">
                    {currency.symbol} {amount.toFixed(2)} → R$ {amountInBRL.toFixed(2)} → ${amountInUsd.toFixed(2)} USDT
                  </p>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle size={16} className="text-error" />
                <p className="text-error text-sm">{error}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={!formData.amount || parseFloat(formData.amount.replace(',', '.')) <= 0 || isLoading}
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{t('withdraw.processing')}</span>
              </>
            ) : (
              <span>{t('common.next')}</span>
            )}
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

          {/* Status do Pagamento */}
          {paymentStatus !== 'idle' && (
            <div className={`rounded-lg p-4 border ${
              paymentStatus === 'aprovado' ? 'bg-green-500/10 border-green-500/20' :
              paymentStatus === 'aguardando' ? 'bg-yellow-500/10 border-yellow-500/20' :
              'bg-red-500/10 border-red-500/20'
            }`}>
              <div className="flex items-center space-x-3">
                {getStatusIcon()}
                <span className={`font-medium ${
                  paymentStatus === 'aprovado' ? 'text-green-400' :
                  paymentStatus === 'aguardando' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {getStatusMessage()}
                </span>
              </div>
            </div>
          )}

          {isPix && payment ? (
            // PIX via DBXBankPay
            <div className="bg-surface rounded-lg p-6 space-y-4">
              <div className="text-center">
                <p className="text-gray-400 text-sm">Valor a pagar:</p>
                <p className="text-2xl font-bold text-white">{formatAmount(amount)}</p>
              </div>

              {/* QR Code */}
              <div className="bg-white p-4 rounded-lg">
                <img 
                  src={payment.qr_code_base64}
                  alt="QR Code PIX"
                  className="w-full max-w-xs mx-auto"
                />
              </div>

              {/* PIX Code */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Código PIX (Copia e Cola):
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={payment.qr_code}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(payment.qr_code)}
                    className="px-3 py-2 bg-primary text-white rounded hover:bg-primary/80 transition-colors"
                  >
                    {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Instruções */}
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <h4 className="text-primary font-semibold mb-2">Como pagar:</h4>
                <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
                  <li>Abra o app do seu banco</li>
                  <li>Escaneie o QR Code ou cole o código PIX</li>
                  <li>Confirme o pagamento</li>
                  <li>Aguarde a confirmação automática</li>
                </ol>
                <p className="text-xs text-gray-400 mt-2">
                  ⚡ O saldo será creditado automaticamente em alguns segundos.
                </p>
              </div>

              {/* Info adicional */}
              <div className="text-center text-xs text-gray-400">
                ID da Transação: {payment.id}
              </div>
            </div>
          ) : isCrypto ? (
            // Crypto (mantém o sistema atual)
            <div className="bg-surface rounded-lg p-6 space-y-4">
              <div className="text-center">
                <p className="text-gray-400 text-sm">Valor a pagar:</p>
                <p className="text-2xl font-bold text-white">{formatAmount(amount)}</p>
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
          ) : null}

          <div className="flex justify-center">
            <button 
              onClick={() => {
                setStep(1);
                setPayment(null);
                setPaymentStatus('idle');
                setError('');
              }} 
              className="py-3 px-6 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              ← Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepositForm;
