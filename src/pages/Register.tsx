import React from 'react';
import { useTranslation } from 'react-i18next';
import RegisterForm from '../components/auth/RegisterForm';
import LanguageSelector from '../components/common/LanguageSelector';

const Register: React.FC = () => {
  const { t } = useTranslation();
  
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
      <div className="relative z-10 w-full max-w-lg mx-auto px-6 py-8">
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
                  className="h-14 w-auto object-contain filter drop-shadow-lg"
                />
                {/* Glow effect behind logo */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-purple-600/20 blur-xl -z-10 scale-110"></div>
              </div>
            </div>
            
            {/* Welcome Text */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                {t('auth.register.title')}
              </h1>
              <p className="text-gray-300 text-sm">
                {t('auth.register.subtitle')}
              </p>
            </div>
          </div>

          {/* Register Form */}
          <RegisterForm />
        </div>
      </div>
    </div>
  );
};

export default Register;
