import React, { useState, useEffect } from 'react';
import { Upload, FileText, Image, AlertCircle, DollarSign, Wallet } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { PAYMENT_METHODS } from '../../utils/constants';
import { formatFileSize } from '../../utils/formatters';
import { validateFile } from '../../utils/validators';
import QRCodeGenerator from './QRCodeGenerator';

interface DepositFormProps {
  onSuccess?: () => void;
}

const DepositForm: React.FC<DepositFormProps> = ({ onSuccess }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'pix' as 'pix' | 'trc20' | 'bep20',
    proofFile: null as File | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [usdRate, setUsdRate] = useState<number | null>(null);

  const { user } = useAuthStore();

  const walletAddresses = {
    PIX: import.meta.env.VITE_PIX_KEY || '',
    BEP20: import.meta.env.VITE_BEP20_KEY || '',
    TRC20: import.meta.env.VITE_TRC20_KEY || '',
  };

  useEffect(() => {
    // Fetches the BRL to USD exchange rate
    const fetchRate = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/BRL');
        const data = await response.json();
        setUsdRate(data.rates.USD);
      } catch (e) {
        console.error('Failed to fetch exchange rate:', e);
        setError('Não foi possível obter a taxa de câmbio. Tente novamente mais tarde.');
      }
    };
    fetchRate();
  }, []);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d.,]/g, '');
    setFormData(prev => ({ ...prev, amount: value }));
    setError('');
  };

  const handlePaymentMethodChange = (method: 'pix' | 'trc20' | 'bep20') => {
    setFormData(prev => ({ ...prev, paymentMethod: method, amount: '' })); // Reset amount on change
    setError('');
  };

  const handleFileSelect = (file: File) => {
    const validation = validateFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Arquivo inválido');
      return;
    }
    setFormData(prev => ({ ...prev, proofFile: file }));
    setError('');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const uploadProofFile = async (file: File): Promise<string | undefined> => {
    if (!user?.id) {
      const errorMessage = 'ID do usuário não encontrado. Faça login novamente.';
      setError(errorMessage);
      console.error(errorMessage);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, '')}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('proof-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from('proof-files')
        .getPublicUrl(filePath);

      if (!publicUrlData) {
        throw new Error('Não foi possível obter a URL pública do arquivo.');
      }

      console.log('Upload bem-sucedido! URL:', publicUrlData.publicUrl);
      return publicUrlData.publicUrl;

    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro desconhecido durante o upload.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !formData.proofFile) return;

    try {
      setIsSubmitting(true);
      setError('');

      const amount = parseFloat(formData.amount.replace(',', '.'));
      const isCrypto = formData.paymentMethod !== 'pix';

      if (isNaN(amount)) {
        setError('Informe um valor válido.');
        setIsSubmitting(false);
        return;
      }

      // Mínimo em BRL para todos os métodos
      if (amount < 10) {
        setError('Valor mínimo de R$ 10,00');
        setIsSubmitting(false);
        return;
      }

      const proofFileUrl = await uploadProofFile(formData.proofFile);

      const { error: transactionError } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'deposit',
        amount: amount,
        payment_method: formData.paymentMethod,
        status: 'pending',
        proof_file_url: proofFileUrl,
        wallet_address: !isCrypto ? null : walletAddresses[formData.paymentMethod.toUpperCase() as keyof typeof walletAddresses],
      });

      if (transactionError) throw new Error('Erro ao registrar o depósito.');

      setStep(1);
      setFormData({ amount: '', paymentMethod: 'pix', proofFile: null });
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao processar seu depósito.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const amount = parseFloat(formData.amount.replace(',', '.')) || 0;
  const isPix = formData.paymentMethod === 'pix';
  const isCrypto = !isPix;
  const currencySymbol = 'R$';
  // When paying with crypto, user inputs BRL and we show the converted USD amount on step 2
  const amountInUsd = isCrypto && usdRate ? amount * usdRate : undefined;

  const handleContinue = () => {
    // PIX and Crypto: same minimum in BRL
    if (amount < 10) {
      setError(`Valor mínimo de ${currencySymbol} ${(10).toFixed(2)}`);
      return;
    }
    setError('');
    setStep(2);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-background p-8 rounded-xl shadow-lg">
      {/* Step 1: Amount and Payment Method */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">Solicitar Depósito</h2>
            <p className="text-gray-400">Insira o valor e escolha o método</p>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">{currencySymbol}</span>
            <input
              type="text"
              placeholder={isPix ? '10,00' : '0,00'}
              value={formData.amount}
              onChange={handleAmountChange}
              className="w-full bg-surface-light border border-surface-light rounded-lg p-3 pl-14 text-white text-lg focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
            />
          </div>

          <div>
            <p className="text-gray-300 font-medium mb-3">Método de Pagamento</p>
            <div className="grid grid-cols-3 gap-3">
              {PAYMENT_METHODS.map(method => (
                <button
                  key={method.id}
                  onClick={() => handlePaymentMethodChange(method.id as any)}
                  className={`p-3 rounded-lg text-center transition-all duration-200 ${ 
                    formData.paymentMethod === method.id 
                      ? 'bg-primary text-white shadow-lg scale-105' 
                      : 'bg-surface-light text-gray-300 hover:bg-surface-light/70'
                  }`}
                >
                  <span className="text-2xl mb-1">{method.icon}</span>
                  <p className="font-semibold text-sm">{method.name}</p>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-3">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={!formData.amount}
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <DollarSign size={20} />
            <span>Continuar</span>
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
            <QRCodeGenerator pixKey={walletAddresses.PIX} amount={amount} />
          ) : (
            <div className="bg-surface rounded-lg p-4 space-y-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{(amountInUsd ?? 0).toFixed(2)} USDT</p>
                <p className="text-gray-400 text-sm mt-1">
                  Envie o valor para o endereço abaixo na rede {PAYMENT_METHODS.find(m => m.id === formData.paymentMethod)?.name}
                </p>
              </div>
              <div className="flex items-center justify-between bg-surface-light p-3 rounded-lg">
                <span className="text-gray-400">Endereço:</span>
                <span className="text-white font-mono break-all text-sm">
                  {walletAddresses[formData.paymentMethod.toUpperCase() as keyof typeof walletAddresses]}
                </span>
              </div>
              <div className="flex items-center bg-yellow-500/10 text-yellow-400 text-xs p-2 rounded-lg">
                <AlertCircle size={16} className="mr-2 shrink-0"/>
                <span>Aguarde as confirmações da rede antes de prosseguir.</span>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors">Voltar</button>
            <button onClick={() => setStep(3)} className="flex-1 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:opacity-90 transition-opacity">Já Paguei, Continuar</button>
          </div>
        </div>
      )}

      {/* Step 3: Upload Proof */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">Enviar Comprovante</h2>
            <p className="text-gray-400">Faça upload do comprovante de pagamento</p>
          </div>

          <div
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-primary bg-primary/10' : 'border-surface-light hover:border-primary/50'}`}>
            <input type="file" accept="image/*,.pdf" onChange={handleFileInputChange} className="hidden" id="file-upload" />
            {formData.proofFile ? (
              <div className="space-y-3">
                <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mx-auto">
                  {formData.proofFile.type.startsWith('image/') ? <Image className="text-success" size={24} /> : <FileText className="text-success" size={24} />}
                </div>
                <div>
                  <p className="text-white font-medium">{formData.proofFile.name}</p>
                  <p className="text-gray-400 text-sm">{formatFileSize(formData.proofFile.size)}</p>
                </div>
                <button onClick={() => setFormData(prev => ({ ...prev, proofFile: null }))} className="text-error hover:text-error/80 text-sm">Remover arquivo</button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="text-gray-400 mx-auto" size={48} />
                <div>
                  <p className="text-white font-medium">Arraste o arquivo ou clique para selecionar</p>
                  <p className="text-gray-400 text-sm">PNG, JPG ou PDF até 5MB</p>
                </div>
                <label htmlFor="file-upload" className="inline-block bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors">Selecionar Arquivo</label>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-3">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors">Voltar</button>
            <button onClick={handleSubmit} disabled={!formData.proofFile || isSubmitting} className="flex-1 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2">
              {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Wallet size={20} /><span>Finalizar Depósito</span></>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepositForm;
