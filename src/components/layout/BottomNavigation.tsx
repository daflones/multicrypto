import React from 'react';
import { Home, TrendingUp, Users, User, Wallet } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const BottomNavigation: React.FC = () => {
  const { t } = useTranslation();
  
  const navItems = [
    { path: '/', icon: Home, label: t('navigation.home') },
    { path: '/invest', icon: TrendingUp, label: t('navigation.invest') },
    { path: '/team', icon: Users, label: t('navigation.team') },
    { path: '/withdraw', icon: Wallet, label: t('navigation.withdraw') },
    { path: '/profile', icon: User, label: t('navigation.profile') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-surface-light z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-primary' : 'text-gray-400 hover:text-white'
              }`
            }
          >
            <item.icon size={20} />
            <span className="text-xs mt-1">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
