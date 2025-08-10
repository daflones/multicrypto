import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../utils/formatters';
import NotificationBell from '../notifications/NotificationBell';

const MobileNavbar: React.FC = () => {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    if (confirm('Tem certeza que deseja sair?')) {
      logout();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface border-b border-surface-light">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <img src="/images/logo.png" alt="Multi Crypto" className="w-full h-full object-cover" />
          </div>
          <span className="text-white font-bold text-lg">Multi Crypto</span>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center space-x-3">
          {user && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Saldo</p>
              <p className="text-sm font-semibold text-success">
                {formatCurrency(user.balance)}
              </p>
            </div>
          )}
          
          <NotificationBell />
          
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default MobileNavbar;
