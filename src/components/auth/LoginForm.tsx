import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Mail, Lock, LogIn, Send } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { loginSchema, LoginFormData, validateEmail } from '../../utils/validators';
import { supabase } from '../../services/supabase';

const LoginForm: React.FC = () => {
  const { t } = useTranslation();
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
      const siteUrl = (import.meta as any)?.env?.VITE_PUBLIC_SITE_URL
        || (typeof window !== 'undefined' ? window.location.origin : 'https://multicrypto.com.br');
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/reset-password`
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
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Global Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 backdrop-blur-sm">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-white/80">
            {t('auth.login.email')}
          </label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 group-focus-within:text-white/60 transition-colors" size={20} />
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full pl-12 pr-4 py-4 bg-white/5 border backdrop-blur-sm rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all duration-300 ${
                errors.email ? 'border-red-400/50 focus:ring-red-400/20' : 'border-white/10 hover:border-white/20'
              }`}
              placeholder={t('auth.login.emailPlaceholder')}
              disabled={isLoading}
            />
          </div>
          {errors.email && (
            <p className="text-red-300 text-sm flex items-center space-x-1">
              <span>⚠️</span>
              <span>{errors.email}</span>
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-white/80">
            {t('auth.login.password')}
          </label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 group-focus-within:text-white/60 transition-colors" size={20} />
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full pl-12 pr-14 py-4 bg-white/5 border backdrop-blur-sm rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all duration-300 ${
                errors.password ? 'border-red-400/50 focus:ring-red-400/20' : 'border-white/10 hover:border-white/20'
              }`}
              placeholder={t('auth.login.passwordPlaceholder')}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors p-1 rounded-lg hover:bg-white/5"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-300 text-sm flex items-center space-x-1">
              <span>⚠️</span>
              <span>{errors.password}</span>
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 hover:from-yellow-300 hover:via-yellow-400 hover:to-amber-400 text-gray-900 py-4 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <LogIn size={20} />
              <span>{t('auth.login.loginButton')}</span>
            </>
          )}
        </button>
      </form>

      {/* Register Link */}
      <div className="text-center mt-6 space-y-3">
        <p className="text-white/60">
          {t('auth.login.noAccount')}{' '}
          <Link 
            to="/register" 
            className="text-yellow-400 hover:text-yellow-300 transition-colors font-medium underline underline-offset-2 decoration-yellow-400/50 hover:decoration-yellow-300"
          >
            {t('auth.login.signUp')}
          </Link>
        </p>
        <button
          type="button"
          onClick={() => { setForgotOpen(true); setForgotStatus({ type: 'idle' }); }}
          className="text-sm text-white/50 hover:text-white/70 transition-colors underline underline-offset-2 decoration-white/30 hover:decoration-white/50"
        >
          {t('auth.login.forgotPassword')}
        </button>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">{t('auth.forgotPassword.title')}</h3>
              <button
                onClick={() => setForgotOpen(false)}
                className="text-white/60 hover:text-white/80 transition-colors p-1 rounded-lg hover:bg-white/10"
                aria-label="Fechar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-white/70 mb-6">{t('auth.forgotPassword.subtitle')}</p>

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white/60 transition-colors" size={20} />
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/40 transition-all duration-300"
                  placeholder={t('auth.login.emailPlaceholder')}
                  autoFocus
                />
              </div>

              {forgotStatus.type === 'error' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-300 text-sm backdrop-blur-sm">
                  {forgotStatus.message}
                </div>
              )}
              {forgotStatus.type === 'success' && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-emerald-300 text-sm backdrop-blur-sm">
                  {forgotStatus.message}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setForgotOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-white/20 text-white/70 hover:bg-white/5 hover:text-white/90 transition-all duration-300"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={forgotStatus.type === 'loading'}
                  className="flex-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 hover:from-yellow-300 hover:via-yellow-400 hover:to-amber-400 text-gray-900 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                >
                  {forgotStatus.type === 'loading' ? (
                    <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      <span>{t('auth.forgotPassword.sendLink')}</span>
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
