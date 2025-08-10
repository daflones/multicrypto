import React from 'react';
import { Outlet } from 'react-router-dom';
import MobileNavbar from './MobileNavbar';
import BottomNavigation from './BottomNavigation';
import { useBalanceRefresh } from '../../hooks/useBalanceRefresh';

const Layout: React.FC = () => {
  useBalanceRefresh();
  return (
    <div className="relative min-h-screen bg-background text-white overflow-hidden">
      {/* Background gradient + visual details */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* Base vertical gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background"></div>
        {/* Soft gold and purple glows */}
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl"></div>
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-secondary/20 blur-3xl"></div>
        <div className="absolute bottom-[-4rem] left-1/4 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl"></div>
        {/* Subtle radial accents */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(212,175,55,0.08),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(124,58,237,0.08),transparent_35%)]"></div>
        {/* Fine grid texture */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>
      <MobileNavbar />
      <main className="pb-20 pt-16">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
};

export default Layout;
