import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, User, Package, Filter, Search, Eye } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import Pagination from '../../ui/Pagination';

interface Investment {
  id: string;
  amount: number;
  status: 'active' | 'completed' | 'cancelled';
  purchase_date: string;
  start_date: string;
  end_date: string;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  product: {
    id: string;
    name: string;
    price: number;
  };
}

const InvestmentsSection: React.FC = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // 20 investimentos por página

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_investments')
        .select(`
          id,
          amount,
          status,
          purchase_date,
          start_date,
          end_date,
          created_at,
          user:users(id, name, email),
          product:products(id, name, price)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching investments:', error);
        return;
      }

      // Processar dados com tipagem correta
      const processedInvestments = (data || []).map((inv: any) => ({
        id: inv.id,
        amount: inv.amount,
        status: inv.status,
        purchase_date: inv.purchase_date,
        start_date: inv.start_date,
        end_date: inv.end_date,
        created_at: inv.created_at,
        user: {
          id: Array.isArray(inv.user) ? inv.user[0]?.id : inv.user?.id || '',
          name: Array.isArray(inv.user) ? inv.user[0]?.name : inv.user?.name || '',
          email: Array.isArray(inv.user) ? inv.user[0]?.email : inv.user?.email || ''
        },
        product: {
          id: Array.isArray(inv.product) ? inv.product[0]?.id : inv.product?.id || '',
          name: Array.isArray(inv.product) ? inv.product[0]?.name : inv.product?.name || '',
          price: Array.isArray(inv.product) ? inv.product[0]?.price : inv.product?.price || 0
        }
      }));

      setInvestments(processedInvestments);
    } catch (error) {
      console.error('Error fetching investments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvestments = investments.filter(investment => {
    const matchesSearch = 
      investment.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investment.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investment.product.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || investment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Paginação
  const totalItems = filteredInvestments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInvestments = filteredInvestments.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const activeInvestments = investments.filter(inv => inv.status === 'active');
  const completedInvestments = investments.filter(inv => inv.status === 'completed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'completed':
        return 'Finalizado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Investimentos</h1>
          <p className="text-gray-400">Visualize e gerencie todos os investimentos</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-surface-light rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Investido</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalInvested)}</p>
            </div>
            <TrendingUp className="text-primary" size={24} />
          </div>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Investimentos Ativos</p>
              <p className="text-2xl font-bold text-green-400">{activeInvestments.length}</p>
            </div>
            <Calendar className="text-green-400" size={24} />
          </div>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Finalizados</p>
              <p className="text-2xl font-bold text-blue-400">{completedInvestments.length}</p>
            </div>
            <Package className="text-blue-400" size={24} />
          </div>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Valor Médio</p>
              <p className="text-2xl font-bold text-yellow-400">
                {investments.length > 0 ? formatCurrency(totalInvested / investments.length) : formatCurrency(0)}
              </p>
            </div>
            <TrendingUp className="text-yellow-400" size={24} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por usuário ou produto..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-surface-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as typeof statusFilter);
              setCurrentPage(1);
            }}
            className="bg-surface border border-surface-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="completed">Finalizados</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Investments Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando investimentos...</p>
        </div>
      ) : (
        <div className="bg-surface border border-surface-light rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background/50 border-b border-surface-light">
                <tr>
                  <th className="text-left p-4 text-gray-400 font-medium">Usuário</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Produto</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Valor</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Data</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Período</th>
                  <th className="text-left p-4 text-gray-400 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInvestments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      {filteredInvestments.length === 0 ? 'Nenhum investimento encontrado' : 'Nenhum resultado na página atual'}
                    </td>
                  </tr>
                ) : (
                  paginatedInvestments.map((investment) => (
                    <tr key={investment.id} className="border-b border-surface-light hover:bg-background/30">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                            <User size={16} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{investment.user.name}</p>
                            <p className="text-gray-400 text-sm">{investment.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-white font-medium">{investment.product.name}</p>
                          <p className="text-gray-400 text-sm">Preço: {formatCurrency(investment.product.price)}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-primary font-bold text-lg">{formatCurrency(investment.amount)}</p>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(investment.status)}`}>
                          {getStatusText(investment.status)}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="text-white">{formatDate(investment.purchase_date)}</p>
                        <p className="text-gray-400 text-sm">{formatDate(investment.created_at)}</p>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <p className="text-white">Início: {formatDate(investment.start_date)}</p>
                          <p className="text-gray-400">Fim: {formatDate(investment.end_date)}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <button className="p-2 text-gray-400 hover:text-primary transition-colors">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-surface-light">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InvestmentsSection;
