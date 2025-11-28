import React, { useState } from 'react';
import { Menu, Shield } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import UsersSection from '../../components/admin/sections/UsersSection';
import InvestmentsSection from '../../components/admin/sections/InvestmentsSection';
import TransactionsSection from '../../components/admin/sections/TransactionsSection';
import WithdrawalsSection from '../../components/admin/sections/WithdrawalsSection';
import ProductsSection from '../../components/admin/sections/ProductsSection';
import AnalyticsSection from '../../components/admin/sections/AnalyticsSection';
import SettingsSection from '../../components/admin/sections/SettingsSection';

const AdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState('users');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getSectionTitle = () => {
    const titles: Record<string, string> = {
      users: 'Usuários',
      investments: 'Investimentos',
      transactions: 'Transações',
      withdrawals: 'Saques',
      products: 'Produtos',
      analytics: 'Análises',
      settings: 'Configurações'
    };
    return titles[activeSection] || 'Admin';
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'users':
        return <UsersSection />;
      case 'investments':
        return <InvestmentsSection />;
      case 'transactions':
        return <TransactionsSection />;
      case 'withdrawals':
        return <WithdrawalsSection />;
      case 'products':
        return <ProductsSection />;
      case 'analytics':
        return <AnalyticsSection />;
      case 'settings':
        return <SettingsSection />;
      default:
        return <UsersSection />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Mobile Header */}
        <header className="lg:hidden bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center space-x-2">
            <Shield size={20} className="text-primary" />
            <span className="font-bold text-white">{getSectionTitle()}</span>
          </div>
          <div className="w-10" /> {/* Spacer para centralizar o título */}
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {renderSection()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
