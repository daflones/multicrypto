import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const AdminLayout: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-background text-white flex">
      {/* Background gradient + visual details (admin) */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background"></div>
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl"></div>
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-secondary/20 blur-3xl"></div>
        <div className="absolute bottom-[-4rem] left-1/3 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(212,175,55,0.08),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(124,58,237,0.08),transparent_35%)]"></div>
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>
      {/* Topbar (always visible) */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-surface/80 backdrop-blur-md border-b border-surface-light">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <img src="/images/logo.png" alt="Multi Crypto" className="w-full h-full object-cover" />
            </div>
            <span className="font-semibold">Admin</span>
          </div>
          <button onClick={() => setOpen(true)} className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20">Menu</button>
        </div>
      </div>
      {/* Sidebar hidden (mobile-only layout) */}
      <aside className="hidden" aria-hidden="true"></aside>

      {/* Drawer (always available) */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-surface border-r border-surface-light p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Admin</h2>
              <button onClick={() => setOpen(false)} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20">Fechar</button>
            </div>
            <nav className="space-y-2" onClick={() => setOpen(false)}>
              <NavLink to="/admin" end className={({ isActive }) => `block px-3 py-2 rounded-md ${isActive ? 'bg-primary/20 text-primary' : 'hover:bg-white/5'}`}>Dashboard</NavLink>
              <NavLink to="/admin/usuarios" className={({ isActive }) => `block px-3 py-2 rounded-md ${isActive ? 'bg-primary/20 text-primary' : 'hover:bg-white/5'}`}>Usuários</NavLink>
              <NavLink to="/admin/produtos" className={({ isActive }) => `block px-3 py-2 rounded-md ${isActive ? 'bg-primary/20 text-primary' : 'hover:bg-white/5'}`}>Produtos</NavLink>
              <NavLink to="/admin/recargas" className={({ isActive }) => `block px-3 py-2 rounded-md ${isActive ? 'bg-primary/20 text-primary' : 'hover:bg-white/5'}`}>Recargas</NavLink>
              <NavLink to="/admin/saques" className={({ isActive }) => `block px-3 py-2 rounded-md ${isActive ? 'bg-primary/20 text-primary' : 'hover:bg-white/5'}`}>Saques</NavLink>
              <NavLink to="/admin/investimentos" className={({ isActive }) => `block px-3 py-2 rounded-md ${isActive ? 'bg-primary/20 text-primary' : 'hover:bg-white/5'}`}>Investimentos</NavLink>
              <NavLink to="/admin/config" className={({ isActive }) => `block px-3 py-2 rounded-md ${isActive ? 'bg-primary/20 text-primary' : 'hover:bg-white/5'}`}>Configurações</NavLink>
            </nav>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 p-4 pt-16 overflow-auto flex justify-center">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
