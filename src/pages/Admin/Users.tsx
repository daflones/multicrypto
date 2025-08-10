import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../services/supabase';

const Users: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ email: '', cpf: '', phone: '', role: 'user', balance: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('users')
        .select('id, email, cpf, phone, role, balance, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const editUser = async (u: any) => {
    setEditing(u);
    setForm({
      email: u.email || '',
      cpf: u.cpf || '',
      phone: u.phone || '',
      role: u.role || 'user',
      balance: String(u.balance ?? 0),
    });
  };

  const removeUser = async (u: any) => {
    if (!confirm(`Remover usuário ${u.email}? Esta ação é irreversível.`)) return;
    try {
      const { error } = await supabase.from('users').delete().eq('id', u.id);
      if (error) throw error;
      await load();
      alert('Usuário removido com sucesso');
    } catch (e: any) {
      alert(e.message || 'Erro ao remover usuário');
    }
  };

  const submitEdit = async () => {
    if (!editing) return;
    try {
      setSaving(true);
      const balance = Number(String(form.balance).replace(',', '.'));
      if (Number.isNaN(balance)) throw new Error('Saldo inválido');
      const payload = {
        email: form.email?.trim() || null,
        cpf: form.cpf?.trim() || null,
        phone: form.phone?.trim() || null,
        role: form.role?.trim() || 'user',
        balance,
      };
      const { error } = await supabase.from('users').update(payload).eq('id', editing.id);
      if (error) throw error;
      setEditing(null);
      await load();
    } catch (e: any) {
      alert(e.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((u) => {
      const email = String(u.email || '').toLowerCase();
      const cpf = String(u.cpf || '');
      const phone = String(u.phone || '');
      return email.includes(q) || cpf.includes(q) || phone.includes(q);
    });
  }, [items, query]);

  const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <div className="flex gap-2 items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-black/30 border border-gray-700 rounded-md px-3 py-2"
            placeholder="Buscar por email/CPF/telefone"
          />
          <button onClick={load} className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20">Atualizar</button>
        </div>
      </div>

      {error && <div className="text-red-400">{error}</div>}

      {/* Tabela (desktop) */}
      <div className="bg-surface rounded-md border border-gray-700 overflow-x-auto hidden md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-black/20">
            <tr>
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">CPF</th>
              <th className="text-left px-4 py-3">Telefone</th>
              <th className="text-left px-4 py-3">Saldo</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Criado em</th>
              <th className="text-left px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6 text-gray-400" colSpan={8}>Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="px-4 py-6 text-gray-400" colSpan={8}>Nenhum usuário encontrado.</td></tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="border-t border-gray-800">
                  <td className="px-4 py-3">{u.id}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.cpf}</td>
                  <td className="px-4 py-3">{u.phone}</td>
                  <td className="px-4 py-3">{currency(Number(u.balance || 0))}</td>
                  <td className="px-4 py-3 uppercase">{u.role || '-'}</td>
                  <td className="px-4 py-3">{new Date(u.created_at).toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3 space-x-2">
                    <button onClick={() => editUser(u)} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20">Editar</button>
                    <button onClick={() => removeUser(u)} className="px-2 py-1 rounded bg-red-600/80 hover:bg-red-600">Remover</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Cards (mobile) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {loading ? (
          <div className="text-gray-400">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-400">Nenhum usuário encontrado.</div>
        ) : (
          filtered.map((u) => (
            <div key={u.id} className="bg-surface border border-gray-700 rounded-md p-4 space-y-2">
              <div className="font-semibold break-all">{u.email}</div>
              <div className="text-sm text-gray-400">CPF: {u.cpf || '—'}</div>
              <div className="text-sm text-gray-400">Telefone: {u.phone || '—'}</div>
              <div className="text-sm">Saldo: {currency(Number(u.balance || 0))}</div>
              <div className="text-xs uppercase text-gray-400">Role: {u.role || '-'}</div>
              <div className="text-xs text-gray-500">{new Date(u.created_at).toLocaleString('pt-BR')}</div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => editUser(u)} className="flex-1 px-2 py-2 rounded bg-white/10 hover:bg-white/20">Editar</button>
                <button onClick={() => removeUser(u)} className="flex-1 px-2 py-2 rounded bg-red-600/80 hover:bg-red-600">Remover</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Edição */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => !saving && setEditing(null)} />
          <div className="relative bg-surface border border-gray-700 rounded-lg w-[95%] max-w-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Editar Usuário</h2>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-black/30 border border-gray-700 rounded-md px-3 py-2" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">CPF</label>
                  <input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} className="w-full bg-black/30 border border-gray-700 rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Telefone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full bg-black/30 border border-gray-700 rounded-md px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Role</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full bg-black/30 border border-gray-700 rounded-md px-3 py-2">
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Saldo (BRL)</label>
                  <input value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} className="w-full bg-black/30 border border-gray-700 rounded-md px-3 py-2" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button disabled={saving} onClick={() => setEditing(null)} className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-50">Cancelar</button>
              <button disabled={saving} onClick={submitEdit} className="px-3 py-2 rounded-md bg-primary hover:bg-primary/80 disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
