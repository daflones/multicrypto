import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, User, CreditCard, Wallet, Clock } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { formatCurrency, formatDate, formatCPF, formatPhone } from '../../../utils/formatters';

interface WithdrawTransaction {
  id: string;
  type: 'withdraw';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  payment_method: string;
  balance_type: 'main' | 'commission';
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    cpf?: string;
    balance: number;
    commission_balance: number;
  };
  data?: {
    pix_key?: string;
    pix_key_type?: 'cpf' | 'email' | 'phone' | 'random';
    wallet_address?: string;
    network?: 'TRC20' | 'BEP20' | 'ERC20';
    crypto_type?: string;
    bank_name?: string;
    account_number?: string;
    agency?: string;
    account_holder?: string;
  };
}

interface WithdrawApprovalModalProps {
  transaction: WithdrawTransaction;
  onClose: () => void;
  onUpdate: () => void;
}

const WithdrawApprovalModal: React.FC<WithdrawApprovalModalProps> = ({ 
  transaction, 
  onClose, 
  onUpdate 
}) => {
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleApprove = async () => {
    if (!confirm(`Tem certeza que deseja APROVAR este saque de ${formatCurrency(transaction.amount)} para ${transaction.user.name}?`)) {
      return;
    }

    try {
      setLoading(true);

      // 1. Aprovar no banco de dados (muda status para 'processing')
      const { error: dbError } = await supabase.rpc('approve_withdrawal', {
        transaction_id: transaction.id
      });

      if (dbError) {
        console.error('Error approving withdrawal in database:', dbError);
        alert('Erro ao aprovar saque no banco: ' + dbError.message);
        return;
      }

      // 2. Processar saque via DBXpay
      try {
        const dbxResponse = await processWithdrawalViaDBXpay(transaction);
        
        if (dbxResponse.success) {
          // Atualizar transação com dados do DBXpay
          await supabase
            .from('transactions')
            .update({
              status: 'completed',
              data: {
                ...transaction.data,
                dbx_transaction_id: dbxResponse.transactionId,
                dbx_status: dbxResponse.status,
                completed_at: new Date().toISOString()
              }
            })
            .eq('id', transaction.id);

          alert('Saque aprovado e processado com sucesso via PIX!');
        } else {
          // Se falhar no DBXpay, marcar como failed
          await supabase
            .from('transactions')
            .update({
              status: 'failed',
              data: {
                ...transaction.data,
                dbx_error: dbxResponse.error,
                failed_at: new Date().toISOString()
              }
            })
            .eq('id', transaction.id);

          alert('Saque aprovado mas falhou no processamento PIX: ' + dbxResponse.error);
        }
      } catch (dbxError: any) {
        console.error('DBXpay processing error:', dbxError);
        
        // Marcar como failed se houver erro na integração
        await supabase
          .from('transactions')
          .update({
            status: 'failed',
            data: {
              ...transaction.data,
              integration_error: dbxError.message,
              failed_at: new Date().toISOString()
            }
          })
          .eq('id', transaction.id);

        alert('Saque aprovado mas falhou na integração PIX: ' + dbxError.message);
      }

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      alert('Erro ao aprovar saque');
    } finally {
      setLoading(false);
    }
  };

  const processWithdrawalViaDBXpay = async (transaction: WithdrawTransaction) => {
    const apiKey = process.env.REACT_APP_DBXPAY_API_KEY;
    const baseURL = 'https://api.dbxpay.com';
    
    if (!apiKey) {
      throw new Error('DBXpay API key não configurada');
    }

    const fee = transaction.amount * 0.05;
    const netAmount = transaction.amount - fee;

    // Validar se os dados PIX estão disponíveis
    if (!transaction.data?.pix_key || !transaction.data?.pix_key_type) {
      throw new Error('Dados PIX não encontrados na transação');
    }

    // Payload conforme documentação oficial do DBXpay
    const payload = {
      amount: netAmount,
      pix_key: transaction.data.pix_key,
      pix_key_type: transaction.data.pix_key_type,
      external_reference: `CY_${transaction.id}`
    };

    console.log('Enviando saque para DBXpay:', payload);

    const response = await fetch(`${baseURL}/api/v1/withdrawals/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    console.log('Resposta DBXpay:', data);

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.message || data.detail || 'Erro na API DBXpay'
      };
    }

    return {
      success: true,
      transactionId: data.data.id,
      status: data.data.status || 'pending',
      message: data.message || 'Saque processado via DBXpay',
      fee: data.data.fee,
      netAmount: data.data.net_amount
    };
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Por favor, informe o motivo da rejeição');
      return;
    }

    if (!confirm(`Tem certeza que deseja REJEITAR este saque? O valor será devolvido para a conta do usuário.`)) {
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.rpc('reject_withdrawal', {
        transaction_id: transaction.id,
        rejection_reason: rejectionReason.trim()
      });

      if (error) {
        console.error('Error rejecting withdrawal:', error);
        alert('Erro ao rejeitar saque: ' + error.message);
        return;
      }

      alert('Saque rejeitado com sucesso! O valor foi devolvido para a conta do usuário.');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      alert('Erro ao rejeitar saque');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodIcon = () => {
    if (transaction.payment_method === 'pix') return <CreditCard className="text-green-400" size={20} />;
    if (transaction.payment_method === 'crypto') return <Wallet className="text-orange-400" size={20} />;
    return <CreditCard className="text-gray-400" size={20} />;
  };

  const getPaymentMethodLabel = () => {
    if (transaction.payment_method === 'pix') return 'PIX';
    if (transaction.payment_method === 'crypto') return 'Criptomoeda';
    return transaction.payment_method?.toUpperCase() || 'Não informado';
  };

  const getPixKeyTypeLabel = (type: string) => {
    const types = {
      cpf: 'CPF',
      email: 'E-mail',
      phone: 'Telefone',
      random: 'Chave Aleatória'
    };
    return types[type as keyof typeof types] || type;
  };

  const fee = transaction.amount * 0.05; // 5% de taxa
  const netAmount = transaction.amount - fee;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-surface-light rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-light">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <AlertTriangle size={24} className="text-yellow-400" />
              <span>Aprovar Saque</span>
            </h2>
            <p className="text-gray-400">ID: {transaction.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Alert */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Clock className="text-yellow-400" size={16} />
              <span className="text-yellow-400 font-medium">Saque Pendente de Aprovação</span>
            </div>
            <p className="text-yellow-300/80 text-sm mt-1">
              Este saque está aguardando sua aprovação. Verifique todos os dados antes de aprovar.
            </p>
          </div>

          {/* Informações do Usuário */}
          <div className="bg-background/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <User size={20} />
              <span>Dados do Usuário</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Nome</p>
                <p className="text-white font-medium">{transaction.user.name}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Email</p>
                <p className="text-white">{transaction.user.email}</p>
              </div>
              {transaction.user.phone && (
                <div>
                  <p className="text-gray-400 text-sm">Telefone</p>
                  <p className="text-white">{formatPhone(transaction.user.phone)}</p>
                </div>
              )}
              {transaction.user.cpf && (
                <div>
                  <p className="text-gray-400 text-sm">CPF</p>
                  <p className="text-white">{formatCPF(transaction.user.cpf)}</p>
                </div>
              )}
              <div>
                <p className="text-gray-400 text-sm">Saldo Principal</p>
                <p className="text-white">{formatCurrency(transaction.user.balance)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Saldo Comissão</p>
                <p className="text-yellow-400">{formatCurrency(transaction.user.commission_balance)}</p>
              </div>
            </div>
          </div>

          {/* Detalhes do Saque */}
          <div className="bg-background/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              {getPaymentMethodIcon()}
              <span>Detalhes do Saque</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Valor Solicitado</p>
                <p className="text-white font-bold text-lg">{formatCurrency(transaction.amount)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Taxa (5%)</p>
                <p className="text-red-400 font-medium">{formatCurrency(fee)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Valor Líquido</p>
                <p className="text-green-400 font-bold text-lg">{formatCurrency(netAmount)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Tipo de Saldo</p>
                <p className="text-white">
                  {transaction.balance_type === 'main' ? 'Saldo Principal' : 'Saldo de Comissão'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Método de Pagamento</p>
                <p className="text-white">{getPaymentMethodLabel()}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Data da Solicitação</p>
                <p className="text-white">{formatDate(transaction.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Detalhes do Método de Pagamento */}
          <div className="bg-background/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Dados para Transferência
            </h3>
            
            {transaction.payment_method === 'pix' && transaction.data?.pix_key && (
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Tipo da Chave PIX</p>
                  <p className="text-white font-medium">
                    {getPixKeyTypeLabel(transaction.data.pix_key_type || '')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Chave PIX</p>
                  <p className="text-white font-mono bg-surface border border-surface-light rounded px-3 py-2">
                    {transaction.data.pix_key}
                  </p>
                </div>
              </div>
            )}

            {transaction.payment_method === 'crypto' && transaction.data?.wallet_address && (
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Rede</p>
                  <p className="text-white font-medium">
                    {transaction.data.network || 'Não informado'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Tipo de Criptomoeda</p>
                  <p className="text-white font-medium">
                    {transaction.data.crypto_type || 'USDT'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Endereço da Carteira</p>
                  <p className="text-white font-mono bg-surface border border-surface-light rounded px-3 py-2 break-all">
                    {transaction.data.wallet_address}
                  </p>
                </div>
              </div>
            )}

            {transaction.payment_method === 'bank' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Banco</p>
                    <p className="text-white">{transaction.data?.bank_name || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Titular da Conta</p>
                    <p className="text-white">{transaction.data?.account_holder || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Agência</p>
                    <p className="text-white">{transaction.data?.agency || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Conta</p>
                    <p className="text-white">{transaction.data?.account_number || 'Não informado'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Formulário de Rejeição */}
          {showRejectForm && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <h4 className="text-red-400 font-medium mb-3">Motivo da Rejeição</h4>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Informe o motivo da rejeição do saque..."
                className="w-full bg-surface border border-surface-light rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-red-400 h-24 resize-none"
                required
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-surface-light">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            
            {!showRejectForm ? (
              <>
                <button
                  onClick={() => setShowRejectForm(true)}
                  className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  <XCircle size={16} />
                  <span>Rejeitar</span>
                </button>
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  <span>{loading ? 'Aprovando...' : 'Aprovar Saque'}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleReject}
                  disabled={loading || !rejectionReason.trim()}
                  className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <XCircle size={16} />
                  )}
                  <span>{loading ? 'Rejeitando...' : 'Confirmar Rejeição'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawApprovalModal;
