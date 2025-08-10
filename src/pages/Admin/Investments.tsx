import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../services/supabase';

const Investments: React.FC = () => {
  const [investments, setInvestments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ user_id: string; product_id: string; amount: string; status: string }>({ user_id: '', product_id: '', amount: '', status: 'active' });

  // Se a tabela tiver outro nome no seu projeto (ex.: purchases, user_investments), altere aqui.
  const INVESTMENTS_TABLE = 'user_investments';

  const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      // Tenta ordenar por created_at; se não existir, faz fallback para ordenar por id
      let invRes = await supabase
        .from(INVESTMENTS_TABLE)
        .select('*')
        .order('created_at', { ascending: false });
      if (invRes.error && String(invRes.error.message || '').includes('created_at')) {
        // retry sem created_at
        invRes = await supabase
          .from(INVESTMENTS_TABLE)
          .select('*')
          .order('id', { ascending: false });
      }
      const [usrRes, prodRes] = await Promise.all([
        supabase.from('users').select('id, email, cpf'),
        supabase.from('products').select('id, name')
      ]);
      if (invRes.error) throw invRes.error;
      if (usrRes.error) throw usrRes.error;
      if (prodRes.error) throw prodRes.error;
      setInvestments(invRes.data || []);
      setUsers(usrRes.data || []);
      setProducts(prodRes.data || []);
    } catch (e: any) {
      if (String(e.message || '').includes('relation') && String(e.message || '').includes(INVESTMENTS_TABLE)) {
        setError(`Tabela "${INVESTMENTS_TABLE}" não encontrada. Ajuste o nome em INVESTMENTS_TABLE nesta página ou crie a tabela no Supabase.`);
      } else {
        setError(e.message || 'Erro ao carregar investimentos');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const usersMap = useMemo(() => Object.fromEntries(users.map((u: any) => [u.id, u])), [users]);
  const productsMap = useMemo(() => Object.fromEntries(products.map((p: any) => [p.id, p])), [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return investments;
    return investments.filter((i) => {
      const u = usersMap[i.user_id];
      const p = productsMap[i.product_id];
      const email = String(u?.email || '').toLowerCase();
      const cpf = String(u?.cpf || '');
      const pname = String(p?.name || '').toLowerCase();
      return email.includes(q) || cpf.includes(q) || pname.includes(q) || String(i.status || '').toLowerCase().includes(q);
    });
  }, [investments, usersMap, productsMap, query]);

  const openEdit = (i: any) => {
    setEditing(i);
    setForm({
      user_id: i.user_id || '',
      product_id: i.product_id || '',
      amount: String(i.amount ?? 0),
      status: i.status || 'active',
    });
  };

  const submitEdit = async () => {
    if (!editing) return;
    try {
      setSaving(true);
      const amount = Number(String(form.amount).replace(',', '.'));
      if (Number.isNaN(amount)) throw new Error('Valor inválido');
      const payload: any = {
        user_id: form.user_id || null,
        product_id: form.product_id || null,
        amount,
        status: form.status || null,
      };
      const { error } = await supabase.from(INVESTMENTS_TABLE).update(payload).eq('id', editing.id);
      if (error) throw error;
      setEditing(null);
      await load();
    } catch (e: any) {
      alert(e.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const removeInvestment = async (i: any) => {
    if (!confirm('Remover este investimento? Esta ação é irreversível.')) return;
    try {
      const { error } = await supabase.from(INVESTMENTS_TABLE).delete().eq('id', i.id);
      if (error) throw error;
      await load();
    } catch (e: any) {
      alert(e.message || 'Erro ao remover');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-bold">Investimentos</h1>
        <div className="flex gap-2 items-center">
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="bg-black/30 border border-gray-700 rounded-md px-3 py-2" placeholder="Buscar por email/CPF/produto/status" />
          <button onClick={load} className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20">Atualizar</button>
          <button disabled className="px-3 py-2 rounded-md bg-primary/30 cursor-not-allowed" title="Em breve">Criar Investimento</button>
        </div>
      </div>

      {error && <div className="text-red-400">{error}</div>}

      {/* Tabela (desktop) */}
      <div className="bg-surface rounded-md border border-gray-700 overflow-x-auto hidden md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-black/20">
            <tr>
              <th className="text-left px-4 py-3">Usuário</th>
              <th className="text-left px-4 py-3">Produto</th>
              <th className="text-left px-4 py-3">Valor</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Criado em</th>
              <th className="text-left px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6 text-gray-400" colSpan={6}>Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td className="px-4 py-6 text-gray-400" colSpan={6}>Nenhum investimento encontrado.</td></tr>
            ) : (
              filtered.map((i) => {
                const u = usersMap[i.user_id];
                const p = productsMap[i.product_id];
                return (
                  <tr key={i.id} className="border-t border-gray-800">
                    <td className="px-4 py-3">
                      <div className="font-medium">{u?.email || '—'}</div>
                      <div className="text-xs text-gray-400">CPF: {u?.cpf || '—'}</div>
                    </td>
                    <td className="px-4 py-3">{p?.name || '—'}</td>
                    <td className="px-4 py-3">{currency(Number(i.amount || 0))}</td>
                    <td className="px-4 py-3 capitalize">{i.status || '-'}</td>
                    <td className="px-4 py-3">{new Date(i.created_at).toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3 space-x-2">
                      <button onClick={() => openEdit(i)} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20">Editar</button>
                      <button onClick={() => removeInvestment(i)} className="px-2 py-1 rounded bg-red-600/80 hover:bg-red-600">Remover</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Cards (mobile) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {loading ? (
          <div className="text-gray-400">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-400">Nenhum investimento encontrado.</div>
        ) : (
          filtered.map((i) => {
            const u = usersMap[i.user_id];
            const p = productsMap[i.product_id];
            return (
              <div key={i.id} className="bg-surface border border-gray-700 rounded-md p-4 space-y-2">
                <div className="font-semibold break-all">{u?.email || '—'}</div>
                <div className="text-sm text-gray-400">CPF: {u?.cpf || '—'}</div>
                <div className="text-sm">Produto: {p?.name || '—'}</div>
                <div className="text-sm">Valor: {currency(Number(i.amount || 0))}</div>
                <div className="text-xs uppercase text-gray-400">Status: {i.status || '-'}</div>
                <div className="text-xs text-gray-500">{(() => {
                  const dt = i.created_at || i.inserted_at || i.createdAt || i.purchase_date || i.start_date || i.created || i.updated_at;
                  return dt ? new Date(dt).toLocaleString('pt-BR') : '—';
                })()}</div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => openEdit(i)} className="flex-1 px-2 py-2 rounded bg-white/10 hover:bg-white/20">Editar</button>
                  <button onClick={() => removeInvestment(i)} className="flex-1 px-2 py-2 rounded bg-red-600/80 hover:bg-red-600">Remover</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Edição */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => !saving && setEditing(null)} />
          <div className="relative bg-surface border border-gray-700 rounded-lg w-[95%] max-w-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Editar Investimento</h2>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Usuário</label>
                <select value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} className="w-full bg-black/30 border border-gray-700 rounded-md px-3 py-2">
                  <option value="">Selecione...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Produto</label>
                <select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} className="w-full bg-black/30 border border-gray-700 rounded-md px-3 py-2">
                  <option value="">Selecione...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Valor (BRL)</label>
                  <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full bg-black/30 border border-gray-700 rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full bg-black/30 border border-gray-700 rounded-md px-3 py-2">
                    <option value="active">active</option>
                    <option value="pending">pending</option>
                    <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
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

export default Investments;
