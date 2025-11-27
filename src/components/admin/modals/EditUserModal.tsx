import React, { useState } from 'react';
import { X, DollarSign, Percent, Lock, Save, AlertTriangle } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { formatCurrency } from '../../../utils/formatters';

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  cpf: string;
  balance: number;
  commission_balance: number;
  is_active: boolean;
  created_at: string;
  referral_code: string;
  referred_by: string | null;
  withdrawal_limit?: number;
  custom_yield_rate?: number;
  network_invested?: number;
}

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onUpdate: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    balance: user.balance,
    commission_balance: user.commission_balance,
    withdrawal_limit: user.withdrawal_limit || 0,
    custom_yield_rate: user.custom_yield_rate || 5, // 5% padrão
    is_active: user.is_active
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      const { error } = await supabase
        .from('users')
        .update({
          balance: formData.balance,
          commission_balance: formData.commission_balance,
          withdrawal_limit: formData.withdrawal_limit,
          custom_yield_rate: formData.custom_yield_rate,
          is_active: formData.is_active
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating user:', error);
        alert('Erro ao atualizar usuário');
        return;
      }

      alert('Usuário atualizado com sucesso!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Erro ao atualizar usuário');
    } finally {
      setLoading(false);
    }
  };

  const calculateWithdrawalLimit = () => {
    const networkInvested = user.network_invested || 0;
    return networkInvested * 0.1; // 10% do que a rede investiu
  };

  const suggestedLimit = calculateWithdrawalLimit();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-surface-light rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-light">
          <div>
            <h2 className="text-xl font-bold text-white">Editar Usuário</h2>
            <p className="text-gray-400">{user.name} - {user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Status do Usuário */}
          <div className="bg-background/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <Lock size={20} />
              <span>Status da Conta</span>
            </h3>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-primary bg-surface border-surface-light rounded focus:ring-primary"
              />
              <label htmlFor="is_active" className="text-white">
                Conta ativa (usuário pode fazer login e transações)
              </label>
            </div>
          </div>

          {/* Saldos */}
          <div className="bg-background/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <DollarSign size={20} />
              <span>Gerenciar Saldos</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Saldo Principal
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-surface border border-surface-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Atual: {formatCurrency(user.balance)}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Saldo de Comissão
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.commission_balance}
                  onChange={(e) => setFormData({ ...formData, commission_balance: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-surface border border-surface-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Atual: {formatCurrency(user.commission_balance)}
                </p>
              </div>
            </div>
          </div>

          {/* Limite de Saque */}
          <div className="bg-background/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <AlertTriangle size={20} />
              <span>Limite de Saque</span>
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Limite de Saque (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.withdrawal_limit}
                  onChange={(e) => setFormData({ ...formData, withdrawal_limit: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-surface border border-surface-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>
              
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <p className="text-yellow-400 text-sm font-medium mb-1">
                  Limite Sugerido: {formatCurrency(suggestedLimit)}
                </p>
                <p className="text-yellow-300/80 text-xs">
                  Baseado em 10% do que a rede investiu ({formatCurrency(user.network_invested || 0)})
                </p>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, withdrawal_limit: suggestedLimit })}
                  className="mt-2 text-xs text-yellow-400 hover:text-yellow-300 underline"
                >
                  Aplicar limite sugerido
                </button>
              </div>
              
              <div className="text-xs text-gray-500">
                <p>• Limite atual: {formatCurrency(user.withdrawal_limit || 0)}</p>
                <p>• Rede investiu: {formatCurrency(user.network_invested || 0)}</p>
                <p>• O usuário só pode sacar até o limite definido</p>
              </div>
            </div>
          </div>

          {/* Taxa de Rendimento Personalizada */}
          <div className="bg-background/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <Percent size={20} />
              <span>Taxa de Rendimento</span>
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Taxa Diária (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="20"
                value={formData.custom_yield_rate}
                onChange={(e) => setFormData({ ...formData, custom_yield_rate: parseFloat(e.target.value) || 5 })}
                className="w-full bg-surface border border-surface-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
              />
              <div className="mt-2 text-xs text-gray-500">
                <p>• Taxa padrão: 5% ao dia</p>
                <p>• Taxa atual: {user.custom_yield_rate || 5}% ao dia</p>
                <p>• Esta taxa será aplicada aos rendimentos diários do usuário</p>
              </div>
            </div>
          </div>

          {/* Resumo das Alterações */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <h4 className="text-primary font-medium mb-2">Resumo das Alterações</h4>
            <div className="space-y-1 text-sm">
              {formData.balance !== user.balance && (
                <p className="text-gray-300">
                  Saldo Principal: {formatCurrency(user.balance)} → {formatCurrency(formData.balance)}
                </p>
              )}
              {formData.commission_balance !== user.commission_balance && (
                <p className="text-gray-300">
                  Saldo Comissão: {formatCurrency(user.commission_balance)} → {formatCurrency(formData.commission_balance)}
                </p>
              )}
              {formData.withdrawal_limit !== (user.withdrawal_limit || 0) && (
                <p className="text-gray-300">
                  Limite Saque: {formatCurrency(user.withdrawal_limit || 0)} → {formatCurrency(formData.withdrawal_limit)}
                </p>
              )}
              {formData.custom_yield_rate !== (user.custom_yield_rate || 5) && (
                <p className="text-gray-300">
                  Taxa Rendimento: {user.custom_yield_rate || 5}% → {formData.custom_yield_rate}%
                </p>
              )}
              {formData.is_active !== user.is_active && (
                <p className="text-gray-300">
                  Status: {user.is_active ? 'Ativo' : 'Inativo'} → {formData.is_active ? 'Ativo' : 'Inativo'}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-surface-light">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
