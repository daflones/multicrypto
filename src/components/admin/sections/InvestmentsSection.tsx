import React, { useState, useEffect } from 'react';
import { User, Search } from 'lucide-react';
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
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-white">Investimentos</h1>
        <p className="text-gray-400 text-sm">Visualize todos os investimentos</p>
      </div>

      {/* Stats Cards - Grid responsivo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface border border-surface-light rounded-xl p-3 lg:p-4">
          <p className="text-gray-400 text-xs lg:text-sm">Total Investido</p>
          <p className="text-lg lg:text-2xl font-bold text-primary truncate">{formatCurrency(totalInvested)}</p>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-xl p-3 lg:p-4">
          <p className="text-gray-400 text-xs lg:text-sm">Ativos</p>
          <p className="text-xl lg:text-2xl font-bold text-green-400">{activeInvestments.length}</p>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-xl p-3 lg:p-4">
          <p className="text-gray-400 text-xs lg:text-sm">Finalizados</p>
          <p className="text-xl lg:text-2xl font-bold text-blue-400">{completedInvestments.length}</p>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-xl p-3 lg:p-4">
          <p className="text-gray-400 text-xs lg:text-sm">Valor Médio</p>
          <p className="text-lg lg:text-2xl font-bold text-yellow-400 truncate">
            {investments.length > 0 ? formatCurrency(totalInvested / investments.length) : formatCurrency(0)}
          </p>
        </div>
      </div>

      {/* Filters - Responsivo */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-surface-light rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary text-sm"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as typeof statusFilter);
            setCurrentPage(1);
          }}
          className="bg-surface border border-surface-light rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary text-sm"
        >
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="completed">Finalizados</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </div>

      {/* Investments Cards */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando...</p>
        </div>
      ) : paginatedInvestments.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          Nenhum investimento encontrado
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedInvestments.map((investment) => (
            <div 
              key={investment.id} 
              className="bg-surface border border-surface-light rounded-xl p-4"
            >
              {/* Header do Card */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    investment.status === 'active' ? 'bg-green-500/20' :
                    investment.status === 'completed' ? 'bg-blue-500/20' :
                    'bg-red-500/20'
                  }`}>
                    <User size={18} className={
                      investment.status === 'active' ? 'text-green-400' :
                      investment.status === 'completed' ? 'text-blue-400' :
                      'text-red-400'
                    } />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{investment.user.name || investment.user.email.split('@')[0]}</p>
                    <p className="text-gray-500 text-xs">{investment.product.name}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(investment.status)}`}>
                  {getStatusText(investment.status)}
                </span>
              </div>

              {/* Valor */}
              <div className="flex items-center justify-between py-2 border-t border-surface-light">
                <span className="text-gray-400 text-sm">Valor Investido</span>
                <span className="font-bold text-xl text-primary">
                  {formatCurrency(investment.amount)}
                </span>
              </div>

              {/* Info adicional */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                <span>Início: {formatDate(investment.start_date)}</span>
                <span>Fim: {formatDate(investment.end_date)}</span>
              </div>
            </div>
          ))}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="pt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                maxVisiblePages={5}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InvestmentsSection;
