import React from 'react';
import { useAuthStore } from '../store/authStore';

const AdminDashboard: React.FC = () => {
  const { logout } = useAuthStore();

  return (
    <div className="p-8 text-white min-h-screen bg-background">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Painel de Administração</h1>
        <button
          onClick={logout}
          className="px-4 py-2 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700"
        >
          Sair
        </button>
      </div>
      <div className="bg-surface p-6 rounded-lg shadow-lg">
        <p className="text-lg">Bem-vindo ao painel de administração. Aqui você poderá gerenciar depósitos, saques e usuários.</p>
        {/* Conteúdo do dashboard de admin virá aqui */}
      </div>
    </div>
  );
};

export default AdminDashboard;
