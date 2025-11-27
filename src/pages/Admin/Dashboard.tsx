import React, { useState } from 'react';
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
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {renderSection()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
