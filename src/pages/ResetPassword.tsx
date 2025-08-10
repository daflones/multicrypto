import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { validatePassword } from '../utils/validators';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message?: string}>({ type: 'idle' });
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: 'idle' });

    if (!validatePassword(password)) {
      setStatus({ type: 'error', message: 'Senha deve ter pelo menos 6 caracteres' });
      return;
    }
    if (password !== confirm) {
      setStatus({ type: 'error', message: 'As senhas não coincidem' });
      return;
    }

    try {
      setStatus({ type: 'loading' });
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStatus({ type: 'success', message: 'Senha atualizada com sucesso. Você já pode entrar.' });
    } catch (err: any) {
      const msg = err?.message || 'Não foi possível atualizar a senha.';
      setStatus({ type: 'error', message: msg });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-surface-light rounded-xl p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-2">Definir nova senha</h1>
        <p className="text-gray-400 mb-6">Insira e confirme sua nova senha para concluir a redefinição.</p>

        {status.type === 'error' && (
          <div className="bg-error/10 border border-error/20 rounded-lg p-3 text-error text-sm mb-4">{status.message}</div>
        )}
        {status.type === 'success' && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm mb-4">{status.message}</div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Nova senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-surface-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Confirmar senha</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-surface-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Repita a senha"
            />
          </div>

          <button
            type="submit"
            disabled={status.type === 'loading'}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {status.type === 'loading' ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>

        <button
          onClick={() => navigate('/login')}
          className="w-full mt-4 py-3 rounded-lg border border-surface-light text-gray-300 hover:bg-background"
        >
          Voltar para login
        </button>
      </div>
    </div>
  );
};

export default ResetPassword;
