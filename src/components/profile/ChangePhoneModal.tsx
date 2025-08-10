import React, { useState } from 'react';
import { X } from 'lucide-react';
import { sanitizeInput, validatePhone } from '../../utils/validators';
import { AuthService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePhoneModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const clean = sanitizeInput(phone).replace(/\D/g, '');
    if (!validatePhone(clean)) {
      setError('Telefone inválido');
      return;
    }

    try {
      setLoading(true);
      if (!user?.id) throw new Error('Usuário não autenticado');
      await AuthService.updateUserPhone(user.id, clean);
      // Atualiza localmente o store
      useAuthStore.setState((state) => ({
        user: state.user ? { ...state.user, phone: clean } : state.user,
      }));
      setSuccess('Telefone atualizado com sucesso');
      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      setError(err?.message || 'Erro ao atualizar telefone');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md bg-surface rounded-lg shadow-lg">
        <div className="flex items-center justify-between p-4 border-b border-surface-light">
          <h3 className="text-white font-semibold">Alterar Telefone</h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-light rounded-md">
            <X className="text-gray-300" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Novo Telefone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 98888-7777"
              className="w-full bg-background border border-surface-light rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-gray-500 mt-1">Somente números (10 ou 11 dígitos)</p>
          </div>

          {error && <div className="text-sm text-red-400">{error}</div>}
          {success && <div className="text-sm text-green-400">{success}</div>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-surface-light hover:bg-surface text-white py-2 rounded-md"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary/80 disabled:opacity-60 text-white py-2 rounded-md"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePhoneModal;
