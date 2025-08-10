import React from 'react';
import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';

const Products: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', price: '', daily_yield: '', duration_days: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, daily_yield, duration_days, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const editProduct = (p: any) => {
    setEditing(p);
    setForm({
      name: p.name || '',
      price: String(p.price ?? 0),
      daily_yield: String(p.daily_yield ?? 0),
      duration_days: String(p.duration_days ?? 0),
    });
  };

  const removeProduct = async (p: any) => {
    if (!confirm(`Remover produto ${p.name}? Esta ação é irreversível.`)) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', p.id);
      if (error) throw error;
      await load();
      alert('Produto removido com sucesso');
    } catch (e: any) {
      alert(e.message || 'Erro ao remover produto');
    }
  };

  const submitEdit = async () => {
    if (!editing) return;
    try {
      setSaving(true);
      const price = Number(String(form.price).replace(',', '.'));
      const daily_yield = Number(String(form.daily_yield).replace(',', '.'));
      const duration_days = parseInt(String(form.duration_days), 10);
      if ([price, daily_yield].some(Number.isNaN) || Number.isNaN(duration_days)) {
        throw new Error('Valores inválidos');
      }
      const payload = {
        name: form.name?.trim() || null,
        price,
        daily_yield,
        duration_days,
      };
      const { error } = await supabase.from('products').update(payload).eq('id', editing.id);
      if (error) throw error;
      setEditing(null);
      await load();
    } catch (e: any) {
      alert(e.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <div className="flex gap-2 items-center">
          <button onClick={load} className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20">Atualizar</button>
        </div>
      </div>

      {/* Tabela (desktop) */}
      <div className="bg-surface rounded-md border border-gray-700 overflow-x-auto hidden md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-black/20">
            <tr>
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">Nome</th>
              <th className="text-left px-4 py-3">Preço</th>
              <th className="text-left px-4 py-3">Yield Diário (%)</th>
              <th className="text-left px-4 py-3">Duração (dias)</th>
              <th className="text-left px-4 py-3">Criado em</th>
              <th className="text-left px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6 text-gray-400" colSpan={7}>Carregando...</td></tr>
            ) : error ? (
              <tr><td className="px-4 py-6 text-red-400" colSpan={7}>{error}</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="px-4 py-6 text-gray-400" colSpan={7}>Nenhum produto encontrado.</td></tr>
            ) : (
              items.map((p) => (
                <tr key={p.id} className="border-t border-gray-800">
                  <td className="px-4 py-3">{p.id}</td>
                  <td className="px-4 py-3">{p.name}</td>
                  <td className="px-4 py-3">{Number(p.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-4 py-3">{p.daily_yield}%</td>
                  <td className="px-4 py-3">{p.duration_days}</td>
                  <td className="px-4 py-3">{new Date(p.created_at).toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3 space-x-2">
                    <button onClick={() => editProduct(p)} className="px-2 py-1 rounded bg-white/10 hover:bg-white/20">Editar</button>
                    <button onClick={() => removeProduct(p)} className="px-2 py-1 rounded bg-red-600/80 hover:bg-red-600">Remover</button>
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
        ) : error ? (
          <div className="text-red-400">{error}</div>
        ) : items.length === 0 ? (
          <div className="text-gray-400">Nenhum produto encontrado.</div>
        ) : (
          items.map((p) => (
            <div key={p.id} className="bg-surface border border-gray-700 rounded-md p-4 space-y-2">
              <div className="font-semibold break-all">{p.name}</div>
              <div className="text-sm">Preço: {Number(p.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              <div className="text-sm text-gray-400">Yield Diário: {p.daily_yield}%</div>
              <div className="text-sm text-gray-400">Duração: {p.duration_days} dias</div>
              <div className="text-xs text-gray-500">{new Date(p.created_at).toLocaleString('pt-BR')}</div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => editProduct(p)} className="flex-1 px-2 py-2 rounded bg-white/10 hover:bg-white/20">Editar</button>
                <button onClick={() => removeProduct(p)} className="flex-1 px-2 py-2 rounded bg-red-600/80 hover:bg-red-600">Remover</button>
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
            <h2 className="text-lg font-semibold mb-4">Editar Produto</h2>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-black/30 border border-gray-700 rounded-md px-3 py-2" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Preço (BRL)</label>
                  <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full bg-black/30 border border-gray-700 rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Yield Diário (%)</label>
                  <input value={form.daily_yield} onChange={(e) => setForm({ ...form, daily_yield: e.target.value })} className="w-full bg-black/30 border border-gray-700 rounded-md px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Duração (dias)</label>
                <input value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} className="w-full bg-black/30 border border-gray-700 rounded-md px-3 py-2" />
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

export default Products;
