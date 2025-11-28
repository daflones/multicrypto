import React from 'react';
import { LogOut, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCurrency } from '../../hooks/useCurrency';
import NotificationBell from '../notifications/NotificationBell';
import LanguageSelector from '../common/LanguageSelector';

const MobileNavbar: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { formatAmount } = useCurrency();

  const handleLogout = () => {
    if (confirm(t('profile.logout') + '?')) {
      logout();
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface border-b border-surface-light">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <div 
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <img src="/images/logo.png" alt="Multi Crypto" className="w-full h-full object-cover" />
          </div>
          <span className="text-white font-bold text-lg">Multi Crypto</span>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center space-x-3">
          {user && (
            <div className="text-right">
              <p className="text-xs text-gray-400">{t('dashboard.totalBalance')}</p>
              <p className="text-sm font-semibold text-success">
                {formatAmount((user.balance || 0) + (user.commission_balance || 0))}
              </p>
            </div>
          )}
          
          <LanguageSelector showLabel={false} />
          <NotificationBell />
          
          {/* Botão Admin */}
          {isAdmin && (
            <button
              onClick={() => navigate('/admin/6785/admin')}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1"
              title="Painel Admin"
            >
              <Shield size={14} />
              <span>Admin</span>
            </button>
          )}
          
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
            title={t('profile.logout')}
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default MobileNavbar;
