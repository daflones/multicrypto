import React from 'react';
import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../utils/formatters';
import NotificationBell from '../notifications/NotificationBell';
import LanguageSelector from '../common/LanguageSelector';

const MobileNavbar: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    if (confirm(t('profile.logout') + '?')) {
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
              <p className="text-xs text-gray-400">{t('dashboard.totalBalance')}</p>
              <p className="text-sm font-semibold text-success">
                {formatCurrency((user.balance || 0) + (user.commission_balance || 0))}
              </p>
            </div>
          )}
          
          <LanguageSelector showLabel={false} />
          <NotificationBell />
          
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
