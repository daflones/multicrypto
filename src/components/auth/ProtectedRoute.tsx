import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const publicPaths = ['/login', '/register', '/admin/6785/login', '/admin/6785/admin'];

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();
  const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path));

  // Se for uma rota pública, não precisa verificar autenticação
  if (isPublicPath) {
    return <>{children}</>;
  }

  // Se estiver carregando, mostra um loader
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Se não estiver autenticado, redireciona para o login
  if (!isAuthenticated) {
    // Salva a rota atual para redirecionar após o login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se estiver tudo certo, renderiza os filhos
  return <>{children}</>;
};

export default ProtectedRoute;
