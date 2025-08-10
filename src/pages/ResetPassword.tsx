import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { validatePassword } from '../utils/validators';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error' | 'guard'; message?: string}>({ type: 'idle' });
  const [email, setEmail] = useState<string | null>(null);
  const [isRecovery, setIsRecovery] = useState(false);
  const [usedOnce, setUsedOnce] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const hashParams = useMemo(() => {
    const hash = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;
    const params = new URLSearchParams(hash);
    return params;
  }, [location.hash]);

  useEffect(() => {
    let mounted = true;
    // Detect if we arrived via recovery link (type=recovery in hash)
    const type = hashParams.get('type');
    if (type === 'recovery') {
      setIsRecovery(true);
    }

    const init = async () => {
      // Try to get current session/user set by Supabase from the URL hash
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted && session?.user) {
        setEmail(session.user.email ?? null);
      }
      if (mounted && !session && type !== 'recovery') {
        // Not in recovery and no session → guard UI
        setStatus({ type: 'guard', message: 'Abra este endereço a partir do link recebido por email.' });
      }
    };
    init();

    // Listen to auth state changes to detect PASSWORD_RECOVERY automatically
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
      if (session?.user) {
        setEmail(session.user.email ?? null);
      }
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [hashParams]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: 'idle' });

    // Guard: ensure this page was opened from a valid recovery link
    if (!isRecovery) {
      setStatus({ type: 'guard', message: 'Este link não é válido para redefinição. Use o link enviado por email.' });
      return;
    }

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
      setUsedOnce(true);
      setStatus({ type: 'success', message: 'Senha atualizada com sucesso. Redirecionando para o login...' });
      // Invalida a sessão de recuperação e evita reuso
      await supabase.auth.signOut();
      setTimeout(() => {
        navigate('/login');
      }, 1200);
    } catch (err: any) {
      const msg = err?.message || 'Não foi possível atualizar a senha.';
      setStatus({ type: 'error', message: msg });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-surface-light rounded-xl p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-2">Definir nova senha</h1>
        <p className="text-gray-400 mb-1">Insira e confirme sua nova senha para concluir a redefinição.</p>
        {email && (
          <p className="text-gray-500 text-sm mb-6">Conta: <span className="text-gray-300">{email}</span></p>
        )}

        {status.type === 'guard' && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 text-yellow-300 text-sm mb-4">{status.message}</div>
        )}
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
            disabled={status.type === 'loading' || usedOnce}
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
