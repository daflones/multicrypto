import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { loginSchema, LoginFormData } from '../../utils/validators';

const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  
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
      </div>
    </div>
  );
};

export default LoginForm;
