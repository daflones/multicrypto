import React from 'react';
import { 
  Users, 
  TrendingUp, 
  CreditCard, 
  Package, 
  Shield,
  LogOut,
  DollarSign,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeSection, onSectionChange, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const menuItems = [
    {
      id: 'users',
      label: 'Usuários',
      icon: Users,
      description: 'Gerenciar usuários'
    },
    {
      id: 'investments',
      label: 'Investimentos',
      icon: TrendingUp,
      description: 'Ver investimentos'
    },
    {
      id: 'transactions',
      label: 'Transações',
      icon: CreditCard,
      description: 'Histórico'
    },
    {
      id: 'withdrawals',
      label: 'Saques',
      icon: DollarSign,
      description: 'Aprovar/Recusar'
    },
    {
      id: 'products',
      label: 'Produtos',
      icon: Package,
      description: 'Gerenciar'
    }
  ];

  const handleLogout = () => {
    if (confirm('Tem certeza que deseja sair?')) {
      logout();
      navigate('/admin/6785/login');
    }
  };

  const handleSectionChange = (section: string) => {
    onSectionChange(section);
    onClose(); // Fecha o menu no mobile após selecionar
  };

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 lg:w-64 bg-gray-900 border-r border-gray-800 
        flex flex-col h-full
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <Shield className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-white font-bold">Admin</h1>
                <p className="text-gray-400 text-xs">Multi Crypto</p>
              </div>
            </div>
            {/* Botão fechar no mobile */}
            <button 
              onClick={onClose}
              className="lg:hidden p-2 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleSectionChange(item.id)}
                className={`
                  w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                <Icon size={20} />
                <div className="text-left flex-1">
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className="text-xs opacity-70">{item.description}</div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 p-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors"
          >
            <LogOut size={18} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
