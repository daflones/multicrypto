import React, { useState } from 'react';
import { X, DollarSign, Lock, Save, AlertTriangle, Trash2 } from 'lucide-react';
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
    is_active: user.is_active
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      console.log('Updating user with data:', {
        balance: formData.balance,
        commission_balance: formData.commission_balance,
        withdrawal_limit: formData.withdrawal_limit,
        is_active: formData.is_active
      });

      const updateData = {
        balance: formData.balance,
        commission_balance: formData.commission_balance,
        withdrawal_limit: formData.withdrawal_limit || null, // Enviar null se for 0
        is_active: formData.is_active
      };

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating user:', error);
        alert('Erro ao atualizar usuário: ' + error.message);
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

  const handleDeleteUser = async () => {
    if (!confirm(`Tem certeza que deseja DELETAR o usuário ${user.name}? Esta ação NÃO pode ser desfeita e irá remover todos os dados relacionados (investimentos, transações, etc).`)) {
      return;
    }

    if (!confirm('CONFIRMAÇÃO FINAL: Você tem ABSOLUTA CERTEZA? Digite OK para confirmar.')) {
      return;
    }

    try {
      setLoading(true);

      // Deletar usuário (cascade irá deletar investimentos, transações, etc)
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (error) {
        console.error('Error deleting user:', error);
        alert('Erro ao deletar usuário: ' + error.message);
        return;
      }

      alert('Usuário deletado com sucesso!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Erro ao deletar usuário');
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
                  value={formData.withdrawal_limit || 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setFormData({ 
                      ...formData, 
                      withdrawal_limit: isNaN(value) ? 0 : value 
                    });
                  }}
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
              {formData.is_active !== user.is_active && (
                <p className="text-gray-300">
                  Status: {user.is_active ? 'Ativo' : 'Inativo'} → {formData.is_active ? 'Ativo' : 'Inativo'}
                </p>
              )}
            </div>
          </div>

          {/* Zona de Perigo */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <h4 className="text-red-400 font-medium mb-2 flex items-center space-x-2">
              <AlertTriangle size={16} />
              <span>Zona de Perigo</span>
            </h4>
            <p className="text-sm text-gray-400 mb-3">
              Deletar este usuário irá remover permanentemente todos os seus dados, incluindo investimentos, transações e histórico. Esta ação não pode ser desfeita.
            </p>
            <button
              type="button"
              onClick={handleDeleteUser}
              disabled={loading}
              className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} />
              <span>Deletar Usuário</span>
            </button>
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
