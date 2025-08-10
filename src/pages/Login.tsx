import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import About from './About';
import { ArrowLeft, Info, CheckCircle } from 'lucide-react';

const Login: React.FC = () => {
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
              <span className="font-medium">Voltar ao Login</span>
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
    <div className="relative min-h-screen bg-background flex flex-col justify-between overflow-hidden">
      {/* Background gradient + visual details (login) */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background"></div>
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl"></div>
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-secondary/20 blur-3xl"></div>
        <div className="absolute bottom-[-4rem] left-1/4 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(212,175,55,0.08),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(124,58,237,0.08),transparent_35%)]"></div>
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>
      {/* Conteúdo principal centralizado */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Logo e título */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-6 shadow-lg">
              <img src="/images/logo.png" alt="Multi Crypto" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Multi Crypto</h1>
            <p className="text-gray-400 text-lg">Sua plataforma de investimentos</p>
            
            {/* Mensagem de sucesso após cadastro */}
            {successMessage && (
              <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg flex items-center justify-center space-x-2">
                <CheckCircle className="text-success" size={20} />
                <p className="text-success text-sm">{successMessage}</p>
              </div>
            )}
          </div>

          {/* Login Form */}
          <LoginForm />
        </div>
      </div>

      {/* Footer fixo */}
      <div className="p-6 text-center border-t border-surface-light/20">
        <button
          onClick={() => setShowAbout(true)}
          className="inline-flex items-center justify-center space-x-2 text-primary hover:text-primary/80 transition-colors mb-4 px-4 py-2 rounded-lg hover:bg-surface/50"
        >
          <Info size={18} />
          <span className="font-medium">Quem somos?</span>
        </button>
        
        <div className="text-xs text-gray-500">
          <p>&copy; 2024 Multi Crypto. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
