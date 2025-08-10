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

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
