import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, LogIn, Send } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { loginSchema, LoginFormData, validateEmail } from '../../utils/validators';
import { supabase } from '../../services/supabase';

const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<{ type: 'idle' | 'success' | 'error' | 'loading'; message?: string }>({ type: 'idle' });
  
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof LoginFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (error) {
      clearError();
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStatus({ type: 'idle' });
    const email = forgotEmail.trim();
    if (!validateEmail(email)) {
      setForgotStatus({ type: 'error', message: 'Informe um email válido' });
      return;
    }
    try {
      setForgotStatus({ type: 'loading' });
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://multicrypto.com.br';
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset-password`
      });
      if (error) throw error;
      setForgotStatus({ type: 'success', message: 'Enviamos um link para seu email. Verifique sua caixa de entrada e spam.' });
    } catch (err: any) {
      const msg = err?.message || 'Não foi possível enviar o email. Tente novamente.';
      setForgotStatus({ type: 'error', message: msg });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Limpa erros anteriores
      setErrors({});
      clearError();
      
      // Valida o formulário
      const validatedData = loginSchema.parse(formData);
      
      // Tenta fazer login
      await login(validatedData);
      
      // Se chegou até aqui, o login foi bem-sucedido
      // Redireciona para a página de destino ou para a página inicial
      navigate(from, { replace: true });
    } catch (error: any) {
      if (error.errors) {
        // Erros de validação do Zod
        const newErrors: Partial<LoginFormData> = {};
        error.errors.forEach((err: any) => {
          newErrors[err.path[0] as keyof LoginFormData] = err.message;
        });
        setErrors(newErrors);
      } else if (error.message) {
        // Erros do servidor já são tratados pelo authStore
        console.error('Erro no login:', error);
      } else {
        // Erro inesperado
        console.error('Erro inesperado no login:', error);
      }
    }
  };

  return (
    <div className="w-full">
      {/* Mensagem de boas-vindas */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo de volta!</h2>
        <p className="text-gray-400">Entre na sua conta para continuar</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Global Error */}
        {error && (
          <div className="bg-error/10 border border-error/20 rounded-lg p-4">
            <p className="text-error text-sm">{error}</p>
          </div>
        )}

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-3 bg-surface border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                errors.email ? 'border-error' : 'border-surface-light'
              }`}
              placeholder="seu@email.com"
              disabled={isLoading}
            />
          </div>
          {errors.email && (
            <p className="text-error text-sm mt-1">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
            Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full pl-10 pr-12 py-3 bg-surface border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                errors.password ? 'border-error' : 'border-surface-light'
              }`}
              placeholder="Sua senha"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-error text-sm mt-1">{errors.password}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <LogIn size={20} />
              <span>Entrar</span>
            </>
          )}
        </button>
      </form>

      {/* Register Link */}
      <div className="text-center mt-8">
        <p className="text-gray-400">
          Não tem uma conta?{' '}
          <Link to="/register" className="text-primary hover:text-primary/80 transition-colors font-medium">
            Cadastre-se
          </Link>
        </p>
        <button
          type="button"
          onClick={() => { setForgotOpen(true); setForgotStatus({ type: 'idle' }); }}
          className="mt-4 text-sm text-gray-400 hover:text-white underline underline-offset-4"
        >
          Esqueceu a senha?
        </button>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-surface border border-surface-light rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Redefinir senha</h3>
              <button
                onClick={() => setForgotOpen(false)}
                className="text-gray-400 hover:text-white"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-4">Digite o email cadastrado. Enviaremos um link para redefinição de senha.</p>

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-surface-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="seu@email.com"
                  autoFocus
                />
              </div>

              {forgotStatus.type === 'error' && (
                <div className="bg-error/10 border border-error/20 rounded-lg p-3 text-error text-sm">{forgotStatus.message}</div>
              )}
              {forgotStatus.type === 'success' && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm">{forgotStatus.message}</div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setForgotOpen(false)}
                  className="flex-1 py-3 rounded-lg border border-surface-light text-gray-300 hover:bg-background"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={forgotStatus.type === 'loading'}
                  className="flex-1 bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {forgotStatus.type === 'loading' ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Enviar link</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginForm;
