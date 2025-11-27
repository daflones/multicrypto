import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Phone, CreditCard, Users, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { registerSchema, RegisterFormData } from '../../utils/validators';
import { useCountry } from '../../hooks/useCountry';

const RegisterForm: React.FC = () => {
  const { t } = useTranslation();
  const { countryInfo, formatDocument, formatPhone } = useCountry();
  
  const [formData, setFormData] = useState<RegisterFormData>({
    cpf: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});
  
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-preencher código de convite a partir da URL (?ref, ?code, ?referral)
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const codeFromUrl =
        params.get('ref') || params.get('code') || params.get('referral') || '';
      if (codeFromUrl && !formData.referralCode) {
        setFormData((prev) => ({
          ...prev,
          referralCode: codeFromUrl.toUpperCase().slice(0, 8),
        }));
      }
    } catch (e) {
      // ignore parsing errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    // Apply masks based on country
    if (name === 'cpf') {
      formattedValue = formatDocument(value);
    } else if (name === 'phone') {
      formattedValue = formatPhone(value);
    } else if (name === 'referralCode') {
      formattedValue = value.toUpperCase();
    }
    
    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    
    // Clear error when user starts typing
    if (errors[name as keyof RegisterFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Limpa erros anteriores
      setErrors({});
      clearError();
      
      // Adiciona código do país ao telefone se não tiver
      const phoneWithCountryCode = formData.phone.startsWith('+') 
        ? formData.phone 
        : formatPhone(formData.phone);
      
      // Prepara dados com telefone formatado
      const dataToSubmit = {
        ...formData,
        phone: phoneWithCountryCode
      };
      
      // Valida o formulário
      const validatedData = registerSchema.parse(dataToSubmit);
      
      // Tenta fazer o registro
      await register(validatedData);
      
      // Redireciona para o login com mensagem de sucesso
      navigate('/login', { 
        replace: true,
        state: { 
          success: t('auth.register.createAccount') + '!'
        } 
      });
    } catch (error: any) {
      if (error.errors) {
        // Erros de validação do Zod
        const newErrors: Partial<RegisterFormData> = {};
        error.errors.forEach((err: any) => {
          newErrors[err.path[0] as keyof RegisterFormData] = err.message;
        });
        setErrors(newErrors);
      } else if (error.message) {
        // Erros do servidor já são tratados pelo authStore
        console.error('Erro no registro:', error);
      } else {
        // Erro inesperado
        console.error('Erro inesperado no registro:', error);
      }
    }
  };

  return (
    <div className="w-full">
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
          {/* Global Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Document (CPF/SSN/etc based on country) */}
          <div className="space-y-2">
            <label htmlFor="cpf" className="block text-sm font-medium text-white/80">
              {countryInfo.documentType}
            </label>
            <div className="relative group">
              <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 group-focus-within:text-white/60 transition-colors" size={20} />
              <input
                type="text"
                id="cpf"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                className={`w-full pl-12 pr-4 py-4 bg-white/5 border backdrop-blur-sm rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all duration-300 ${
                  errors.cpf ? 'border-red-400/50 focus:ring-red-400/20' : 'border-white/10 hover:border-white/20'
                }`}
                placeholder={countryInfo.documentPlaceholder}
                disabled={isLoading}
              />
            </div>
            {errors.cpf && (
              <p className="text-red-300 text-sm flex items-center space-x-1">
                <span>⚠️</span>
                <span>{errors.cpf}</span>
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-white/80">
              {t('auth.register.email')}
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
                placeholder={t('auth.register.emailPlaceholder')}
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

          {/* Phone */}
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-white/80">
              {t('auth.register.phone')}
            </label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 group-focus-within:text-white/60 transition-colors" size={20} />
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full pl-12 pr-4 py-4 bg-white/5 border backdrop-blur-sm rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all duration-300 ${
                  errors.phone ? 'border-red-400/50 focus:ring-red-400/20' : 'border-white/10 hover:border-white/20'
                }`}
                placeholder={countryInfo.phoneFormat}
                disabled={isLoading}
              />
            </div>
            {errors.phone && (
              <p className="text-red-300 text-sm flex items-center space-x-1">
                <span>⚠️</span>
                <span>{errors.phone}</span>
              </p>
            )}
          </div>

          {/* Referral Code */}
          <div>
            <label htmlFor="referralCode" className="block text-sm font-medium text-gray-300 mb-2">
              {t('auth.register.referralCode')}
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                id="referralCode"
                name="referralCode"
                value={formData.referralCode}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 bg-surface border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                  errors.referralCode ? 'border-error' : 'border-surface-light'
                }`}
                placeholder={t('auth.register.referralCodePlaceholder')}
                maxLength={8}
                disabled={isLoading}
              />
            </div>
            {errors.referralCode && (
              <p className="text-error text-sm mt-1">{errors.referralCode}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-white/80">
              {t('auth.register.password')}
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
                placeholder={t('auth.register.passwordPlaceholder')}
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

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/80">
              {t('auth.register.confirmPassword')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full pl-10 pr-12 py-3 bg-surface border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                  errors.confirmPassword ? 'border-error' : 'border-surface-light'
                }`}
                placeholder={t('auth.register.confirmPasswordPlaceholder')}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-error text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-6"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus size={20} />
                <span>{t('auth.register.createAccount')}</span>
              </>
            )}
          </button>
        </form>

      {/* Login Link */}
      <div className="text-center mt-6 space-y-3">
        <p className="text-white/60">
          {t('auth.register.hasAccount')}{' '}
          <Link 
            to="/login" 
            className="text-yellow-400 hover:text-yellow-300 transition-colors font-medium underline underline-offset-2 decoration-yellow-400/50 hover:decoration-yellow-300"
          >
            {t('auth.register.signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
