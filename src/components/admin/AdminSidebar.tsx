import React from 'react';
import { 
  Users, 
  TrendingUp, 
  CreditCard, 
  Package, 
  Settings, 
  BarChart3,
  Shield,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeSection, onSectionChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuthStore();

  const menuItems = [
    {
      id: 'users',
      label: 'Usuários',
      icon: Users,
      description: 'Gerenciar usuários e redes'
    },
    {
      id: 'investments',
      label: 'Investimentos',
      icon: TrendingUp,
      description: 'Visualizar investimentos'
    },
    {
      id: 'transactions',
      label: 'Transações',
      icon: CreditCard,
      description: 'Histórico de transações'
    },
    {
      id: 'products',
      label: 'Produtos',
      icon: Package,
      description: 'Gerenciar produtos'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Relatórios e métricas'
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: Settings,
      description: 'Configurações do sistema'
    }
  ];

  const handleLogout = () => {
    if (confirm('Tem certeza que deseja sair?')) {
      logout();
      navigate('/admin/login');
    }
  };

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
            <Shield className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Admin Panel</h1>
            <p className="text-gray-400 text-sm">CryptoYield</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`
                w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-primary/20 border border-primary/30 text-primary' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }
              `}
            >
              <div className="flex items-center space-x-3">
                <Icon size={20} />
                <div className="text-left">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs opacity-70">{item.description}</div>
                </div>
              </div>
              {isActive && <ChevronRight size={16} />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 p-3 text-gray-300 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
