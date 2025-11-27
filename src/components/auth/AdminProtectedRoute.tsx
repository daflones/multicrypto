import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface Props {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<Props> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  const isAdmin = user?.role === 'admin' || (user as any)?.is_admin === true;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Se não estiver autenticado, redireciona para login de admin
  if (!isAuthenticated) {
    return <Navigate to="/admin/6785/login" state={{ from: location }} replace />;
  }

  // Se estiver autenticado mas não for admin, redireciona para dashboard normal
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
