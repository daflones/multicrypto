import React, { useEffect, useState } from 'react';
import { AdminService } from '../../services/admin.service';

const currency = (v: number) => v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const Withdrawals: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  const [emailFilter, setEmailFilter] = useState('');
  const [cpfFilter, setCpfFilter] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await AdminService.listTransactions({ type: 'withdrawal' });
      setItems(data);
      const ids = (data || []).map((t: any) => t.user_id);
      const map = await AdminService.getUsersMap(ids);
      setUsersMap(map);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar saques');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (id: string) => {
    try {
      await AdminService.approveWithdrawal(id);
      await load();
    } catch (e: any) {
      alert(e.message || 'Erro ao aprovar saque');
    }
  };

  const reject = async (id: string) => {
    const reason = prompt('Motivo da recusa (opcional):') || undefined;
    try {
      await AdminService.rejectTransaction(id, reason);
      await load();
    } catch (e: any) {
      alert(e.message || 'Erro ao recusar saque');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Saques</h1>
        <div className="flex items-center gap-2">
          <input
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            placeholder="Filtrar por email"
            className="px-3 py-2 rounded-md bg-black/30 border border-gray-700 text-sm"
          />
          <input
            value={cpfFilter}
            onChange={(e) => setCpfFilter(e.target.value)}
            placeholder="Filtrar por CPF"
            className="px-3 py-2 rounded-md bg-black/30 border border-gray-700 text-sm"
          />
          <button onClick={load} className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20">Atualizar</button>
        </div>
      </div>

      {error && <div className="text-red-400">{error}</div>}

      {/* Tabela (desktop) - desabilitada para mobile-only */}
      <div className="hidden">
        <table className="min-w-full text-xs md:text-sm">
          <thead className="bg-black/20">
            <tr>
              <th className="text-left px-2 md:px-3 py-2 md:py-3">Data</th>
              <th className="text-left px-2 md:px-3 py-2 md:py-3">Usuário</th>
              <th className="text-left px-2 md:px-3 py-2 md:py-3">Valor solicitado</th>
              <th className="text-left px-2 md:px-3 py-2 md:py-3">Taxa (5%)</th>
              <th className="text-left px-2 md:px-3 py-2 md:py-3">Líquido</th>
              <th className="text-left px-2 md:px-3 py-2 md:py-3 hidden lg:table-cell">Método</th>
              <th className="text-left px-2 md:px-3 py-2 md:py-3 hidden lg:table-cell">Destino</th>
              <th className="text-left px-2 md:px-3 py-2 md:py-3">Status</th>
              <th className="text-left px-2 md:px-3 py-2 md:py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-6 text-gray-400" colSpan={9}>Carregando...</td></tr>
            ) : (
              (() => {
                const filtered = items.filter((tx: any) => {
                  const u = usersMap[tx.user_id] || {};
                  const emailOk = emailFilter ? String(u.email || '').toLowerCase().includes(emailFilter.toLowerCase()) : true;
                  const cpfOk = cpfFilter ? String(u.cpf || '').includes(cpfFilter) : true;
                  return emailOk && cpfOk;
                });
                if (filtered.length === 0) {
                  return <tr><td className="px-4 py-6 text-gray-400" colSpan={9}>Nenhum saque encontrado.</td></tr>;
                }
                return (
                  <>
                    {filtered.map((tx: any) => {
                      const amount = Number(tx.amount || 0);
                      const fee = Number(tx.fee ?? amount * 0.05);
                      const net = Math.max(0, amount - fee);
                      const u = usersMap[tx.user_id] || {};
                      return (
                        <tr key={tx.id} className="border-t border-gray-800 align-top">
                          <td className="px-2 md:px-3 py-2 md:py-3 whitespace-nowrap">{new Date(tx.created_at).toLocaleString('pt-BR')}</td>
                          <td className="px-2 md:px-3 py-2 md:py-3">
                            {tx.user_id}
                            <div className="text-gray-400 text-xs">{u.email}</div>
                            {u.cpf && <div className="text-gray-500 text-xs">CPF: {u.cpf}</div>}
                            {u.phone && <div className="text-gray-500 text-xs">Tel: {u.phone}</div>}
                            <div className="text-gray-500 text-xs">Role: {u.role || '-'}</div>
                            <div className="text-gray-500 text-xs">Saldo: {currency(Number(u.balance || 0))}</div>
                          </td>
                          <td className="px-2 md:px-3 py-2 md:py-3 whitespace-nowrap">{currency(amount)}</td>
                          <td className="px-2 md:px-3 py-2 md:py-3 whitespace-nowrap">{currency(fee)} </td>
                          <td className="px-2 md:px-3 py-2 md:py-3 whitespace-nowrap">{currency(net)}</td>
                          <td className="px-2 md:px-3 py-2 md:py-3 uppercase whitespace-nowrap hidden lg:table-cell">{tx.payment_method || '-'}</td>
                          <td className="px-2 md:px-3 py-2 md:py-3 break-all hidden lg:table-cell">{tx.wallet_address || '-'}</td>
                          <td className="px-2 md:px-3 py-2 md:py-3">
                            <span className={`px-2 py-1 rounded text-xs ${tx.status === 'approved' ? 'bg-green-600/30 text-green-400' : tx.status === 'rejected' ? 'bg-red-600/30 text-red-400' : 'bg-yellow-600/30 text-yellow-300'}`}>{tx.status}</span>
                          </td>
                          <td className="px-2 md:px-3 py-2 md:py-3 space-x-2 whitespace-nowrap">
                            {tx.status === 'pending' && (
                              <>
                                <button onClick={() => approve(tx.id)} className="px-2 py-1 rounded bg-green-600 hover:bg-green-700">Aprovar</button>
                                <button onClick={() => reject(tx.id)} className="px-2 py-1 rounded bg-red-600 hover:bg-red-700">Recusar</button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </>
                );
              })()
            )}
          </tbody>
        </table>
      </div>

      {/* Cards (mobile) - sempre visíveis */}
      <div className="grid grid-cols-1 gap-3">
        {loading ? (
          <div className="text-gray-400">Carregando...</div>
        ) : (() => {
          const filtered = items.filter((tx: any) => {
            const u = usersMap[tx.user_id] || {};
            const emailOk = emailFilter ? String(u.email || '').toLowerCase().includes(emailFilter.toLowerCase()) : true;
            const cpfOk = cpfFilter ? String(u.cpf || '').includes(cpfFilter) : true;
            return emailOk && cpfOk;
          });
          if (filtered.length === 0) return <div className="text-gray-400">Nenhum saque encontrado.</div>;
          return (
            <>
              {filtered.map((tx: any) => {
                const amount = Number(tx.amount || 0);
                const fee = Number(tx.fee ?? amount * 0.05);
                const net = Math.max(0, amount - fee);
                const u = usersMap[tx.user_id] || {};
                return (
                  <div key={tx.id} className="bg-surface border border-gray-700 rounded-md p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString('pt-BR')}</div>
                      <span className={`px-2 py-1 rounded text-xs ${tx.status === 'approved' ? 'bg-green-600/30 text-green-400' : tx.status === 'rejected' ? 'bg-red-600/30 text-red-400' : 'bg-yellow-600/30 text-yellow-300'}`}>{tx.status}</span>
                    </div>
                    <div className="font-semibold break-all">{u.email || '—'}</div>
                    {u.cpf && <div className="text-sm text-gray-400">CPF: {u.cpf}</div>}
                    {u.phone && <div className="text-sm text-gray-400">Tel: {u.phone}</div>}
                    <div className="text-sm">Solicitado: {currency(amount)}</div>
                    <div className="text-sm text-gray-400">Taxa (5%): {currency(fee)}</div>
                    <div className="text-sm">Líquido: {currency(net)}</div>
                    <div className="text-xs text-gray-400">Método: <span className="uppercase">{tx.payment_method || '-'}</span></div>
                    <div className="text-xs break-all text-gray-400">Destino: {tx.wallet_address || '-'}</div>
                    <div className="text-xs text-gray-400">User ID: {tx.user_id}</div>
                    {tx.status === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => approve(tx.id)} className="flex-1 px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-sm">Aprovar</button>
                        <button onClick={() => reject(tx.id)} className="flex-1 px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-sm">Recusar</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default Withdrawals;
