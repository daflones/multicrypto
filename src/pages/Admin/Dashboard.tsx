import React from 'react';
import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const [usersRes, invRes, txRes] = await Promise.all([
        supabase.from('users').select('balance'),
        supabase.from('user_investments').select('amount'),
        supabase.from('transactions').select('id, status').eq('status', 'pending')
      ]);

      if (usersRes.error) throw usersRes.error;
      if (invRes.error) throw invRes.error;
      if (txRes.error) throw txRes.error;

      const sumBalance = (usersRes.data || []).reduce((acc: number, u: any) => acc + Number(u.balance || 0), 0);
      const sumInvested = (invRes.data || []).reduce((acc: number, i: any) => acc + Number(i.amount || 0), 0);
      const pendCount = (txRes.data || []).length;

      setTotalBalance(sumBalance);
      setTotalInvested(sumInvested);
      setPendingCount(pendCount);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar KPIs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20">Atualizar</button>
        </div>
      </div>

      {error && <div className="text-red-400">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface p-4 rounded-md border border-gray-700">
          <p className="text-sm text-gray-400">Total em caixa</p>
          <p className="text-2xl font-semibold">{loading ? '—' : currency(totalBalance)}</p>
        </div>
        <div className="bg-surface p-4 rounded-md border border-gray-700">
          <p className="text-sm text-gray-400">Total investido</p>
          <p className="text-2xl font-semibold">{loading ? '—' : currency(totalInvested)}</p>
        </div>
        <div className="bg-surface p-4 rounded-md border border-gray-700">
          <p className="text-sm text-gray-400">Pendências (recargas/saques)</p>
          <p className="text-2xl font-semibold">{loading ? '—' : pendingCount}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
