import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LoginForm from '../components/auth/LoginForm';
import About from './About';
import LanguageSelector from '../components/common/LanguageSelector';
import { ArrowLeft, Info, CheckCircle } from 'lucide-react';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const [showAbout, setShowAbout] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Verifica se há uma mensagem de sucesso no estado da navegação
    if (location.state?.success) {
      setSuccessMessage(location.state.success);
      // Limpa o estado da navegação para não mostrar a mensagem novamente ao atualizar
      window.history.replaceState({}, '');
      
      // Remove a mensagem após 5 segundos
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  if (showAbout) {
    return (
      <div className="relative min-h-screen bg-background overflow-hidden">
        {/* Background gradient + visual details (standalone about view) */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background"></div>
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl"></div>
          <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-secondary/20 blur-3xl"></div>
          <div className="absolute bottom-[-4rem] left-1/4 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(212,175,55,0.08),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(124,58,237,0.08),transparent_35%)]"></div>
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>
        {/* Header com botão voltar */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-surface-light">
          <div className="flex items-center justify-between px-4 py-4">
            <button
              onClick={() => setShowAbout(false)}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-surface-light/50"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">{t('common.back')} ao Login</span>
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg">
                <img src="/images/logo.png" alt="Multi Crypto" className="w-full h-full object-cover" />
              </div>
              <span className="text-white font-bold text-xl">Multi Crypto</span>
            </div>
          </div>
        </div>
        
        {/* Conteúdo da página About */}
        <div className="pt-16">
          <About onBack={() => setShowAbout(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated gradient orbs */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-400/30 to-purple-600/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-r from-yellow-400/30 to-pink-600/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400/20 to-cyan-600/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-yellow-400/60 rounded-full animate-bounce delay-300"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-blue-400/60 rounded-full animate-bounce delay-700"></div>
        <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-purple-400/60 rounded-full animate-bounce delay-1000"></div>
      </div>

      {/* Language Selector - Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <LanguageSelector />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        {/* Modern Card Container */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Logo Section */}
          <div className="text-center mb-8">
            {/* Logo with better sizing for horizontal format */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <img 
                  src="/images/logo.png" 
                  alt="Multi Crypto" 
                  className="h-16 w-auto object-contain filter drop-shadow-lg"
                />
                {/* Glow effect behind logo */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-purple-600/20 blur-xl -z-10 scale-110"></div>
              </div>
            </div>
            
            {/* Welcome Text */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                {t('auth.login.title')}
              </h1>
              <p className="text-gray-300 text-sm">
                {t('auth.login.subtitle')}
              </p>
            </div>
            
            {/* Success Message */}
            {successMessage && (
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center space-x-2 backdrop-blur-sm">
                <CheckCircle className="text-emerald-400" size={18} />
                <p className="text-emerald-300 text-sm">{successMessage}</p>
              </div>
            )}
          </div>

          {/* Login Form */}
          <LoginForm />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-4">
          <button
            onClick={() => setShowAbout(true)}
            className="inline-flex items-center justify-center space-x-2 text-white/70 hover:text-white transition-all duration-300 px-4 py-2 rounded-xl hover:bg-white/5 backdrop-blur-sm group"
          >
            <Info size={16} className="group-hover:rotate-12 transition-transform duration-300" />
            <span className="font-medium">{t('common.about', 'Quem somos?')}</span>
          </button>
          
          <div className="text-xs text-white/40">
            <p>&copy; 2024 Multi Crypto. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
