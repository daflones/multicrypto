import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Phone, CreditCard, Users, UserPlus } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { registerSchema, RegisterFormData } from '../../utils/validators';
import { maskCPF, maskPhone } from '../../utils/formatters';

const RegisterForm: React.FC = () => {
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
    
    // Apply masks
    if (name === 'cpf') {
      formattedValue = maskCPF(value);
    } else if (name === 'phone') {
      formattedValue = maskPhone(value);
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
      
      // Valida o formulário
      const validatedData = registerSchema.parse(formData);
      
      // Tenta fazer o registro
      await register(validatedData);
      
      // Redireciona para o login com mensagem de sucesso
      navigate('/login', { 
        replace: true,
        state: { 
          success: 'Cadastro realizado com sucesso! Faça login para continuar.'
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
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">CY</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Crie sua conta</h1>
          <p className="text-gray-400">Comece a investir em criptomoedas hoje</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Global Error */}
          {error && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-3">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          {/* CPF */}
          <div>
            <label htmlFor="cpf" className="block text-sm font-medium text-gray-300 mb-2">
              CPF
            </label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                id="cpf"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 bg-surface border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                  errors.cpf ? 'border-error' : 'border-surface-light'
                }`}
                placeholder="000.000.000-00"
                maxLength={14}
                disabled={isLoading}
              />
            </div>
            {errors.cpf && (
              <p className="text-error text-sm mt-1">{errors.cpf}</p>
            )}
          </div>

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

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
              Telefone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-3 bg-surface border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                  errors.phone ? 'border-error' : 'border-surface-light'
                }`}
                placeholder="(11) 99999-9999"
                maxLength={15}
                disabled={isLoading}
              />
            </div>
            {errors.phone && (
              <p className="text-error text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Referral Code */}
          <div>
            <label htmlFor="referralCode" className="block text-sm font-medium text-gray-300 mb-2">
              Código de convite (opcional)
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
                placeholder="Se tiver, cole o código do convite"
                maxLength={8}
                disabled={isLoading}
              />
            </div>
            {errors.referralCode && (
              <p className="text-error text-sm mt-1">{errors.referralCode}</p>
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
                placeholder="Mínimo 6 caracteres"
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

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirmar Senha
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
                placeholder="Repita sua senha"
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
                <span>Criar Conta</span>
              </>
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="text-center mt-6">
          <p className="text-gray-400">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-primary hover:text-primary/80 transition-colors font-medium">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
