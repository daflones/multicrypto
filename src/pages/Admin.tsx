import React from 'react';
import { useAuthStore } from '../store/authStore';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

const AdminPage: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  // Se o usuário está logado e tem a role 'admin', mostra o dashboard.
  // Caso contrário, mostra a página de login de admin.
  if (isAuthenticated && user?.role === 'admin') {
    return <AdminDashboard />;
  }

  return <AdminLogin />;
};

export default AdminPage;
