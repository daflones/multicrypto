import React, { useState } from 'react';
import { X } from 'lucide-react';
import { validatePassword, sanitizeInput } from '../../utils/validators';
import { AuthService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cur = sanitizeInput(currentPassword);
    const next = sanitizeInput(newPassword);
    const conf = sanitizeInput(confirmPassword);

    if (!validatePassword(next)) {
      setError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (next !== conf) {
      setError('Senhas não coincidem');
      return;
    }

    try {
      setLoading(true);
      if (!user?.id) throw new Error('Usuário não autenticado');
      await AuthService.updateUserPassword(user.id, cur, next);
      setSuccess('Senha atualizada com sucesso');
      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      setError(err?.message || 'Erro ao atualizar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md bg-surface rounded-lg shadow-lg">
        <div className="flex items-center justify-between p-4 border-b border-surface-light">
          <h3 className="text-white font-semibold">Alterar Senha</h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-light rounded-md">
            <X className="text-gray-300" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Senha Atual</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-background border border-surface-light rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Nova Senha</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-background border border-surface-light rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Confirmar Nova Senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-background border border-surface-light rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
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

export default ChangePasswordModal;
