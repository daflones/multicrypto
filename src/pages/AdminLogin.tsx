import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    
    try {
      await login({ email, password });
      // Após a tentativa de login, o onAuthStateChange atualizará o store.
      // Verificamos o estado diretamente do store.
      const state = useAuthStore.getState();
      if (state.isAuthenticated && state.user?.role !== 'admin') {
        setError('Você não tem permissão para acessar esta área.');
        await state.logout(); // Força o logout se o usuário não for admin
      } else if (state.isAuthenticated && state.user?.role === 'admin') {
        navigate('/admin');
      } else if (!state.isAuthenticated) {
        setError('Email ou senha inválidos.');
      }
    } catch (error: any) {
      setError(error.message || 'Ocorreu um erro durante o login.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-background overflow-hidden">
      {/* Background gradient + visual details (admin login) */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background"></div>
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl"></div>
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-secondary/20 blur-3xl"></div>
        <div className="absolute bottom-[-4rem] left-1/3 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(212,175,55,0.08),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(124,58,237,0.08),transparent_35%)]"></div>
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>
      <div className="w-full max-w-md p-8 space-y-6 bg-surface rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-white">Acesso Restrito</h1>
        <p className="text-center text-gray-400">Faça login para acessar o painel de administração.</p>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-300">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="seu@email.com"
              className="w-full px-3 py-2 mt-1 text-white placeholder-gray-400 bg-black/30 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-300">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Sua senha"
              className="w-full px-3 py-2 mt-1 text-white placeholder-gray-400 bg-black/30 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full py-2 font-semibold text-white bg-primary rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark">
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
