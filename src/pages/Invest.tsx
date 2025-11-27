import React, { useEffect, useState } from 'react';
import { Filter, Search } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { useAuthStore } from '../store/authStore';
import { InvestmentService } from '../services/investment.service';
import ProductCard from '../components/investment/ProductCard';
import InvestmentModal from '../components/investment/InvestmentModal';
import { Product } from '../services/supabase';

const Invest: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userInvestmentCounts, setUserInvestmentCounts] = useState<{ [key: string]: number }>({});

  const { user } = useAuthStore();
  const { products, isLoadingProducts, fetchProducts } = useUserStore();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (user && products.length > 0) {
      loadInvestmentCounts();
    }
  }, [user, products]);

  const loadInvestmentCounts = async () => {
    if (!user) return;

    const counts: { [key: string]: number } = {};
    
    for (const product of products) {
      try {
        const count = await InvestmentService.getUserInvestmentCount(user.id, product.id);
        counts[product.id] = count;
      } catch (error) {
        console.error(`Error loading count for product ${product.id}:`, error);
        counts[product.id] = 0;
      }
    }
    
    setUserInvestmentCounts(counts);
  };

  const handleInvest = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    // Reload investment counts after successful investment
    loadInvestmentCounts();
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Produtos de Investimento</h1>
        <p className="text-gray-400">Escolha o melhor plano para você</p>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar produtos..."
            className="w-full pl-10 pr-4 py-3 bg-surface border border-surface-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

      </div>

      {/* Products Grid */}
      {isLoadingProducts ? (
        <div className="grid gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface rounded-xl p-4 animate-pulse">
              <div className="w-full h-32 bg-surface-light rounded-lg mb-4"></div>
              <div className="space-y-2">
                <div className="h-6 bg-surface-light rounded w-3/4"></div>
                <div className="h-4 bg-surface-light rounded w-1/2"></div>
                <div className="h-4 bg-surface-light rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              userInvestmentCount={userInvestmentCounts[product.id] || 0}
              onInvest={handleInvest}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter className="text-gray-400" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Nenhum produto encontrado</h3>
          <p className="text-gray-400">
            {searchTerm 
              ? 'Tente ajustar sua busca ou filtros'
              : 'Não há produtos disponíveis no momento'
            }
          </p>
        </div>
      )}

      {/* Investment Modal */}
      <InvestmentModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />

      {/* Info Banner */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <h3 className="text-primary font-semibold mb-2">💡 Dica Importante</h3>
        <p className="text-gray-300 text-sm">
          Diversifique seus investimentos para maximizar seus rendimentos. 
          Você pode investir em múltiplos produtos respeitando o limite de cada um.
        </p>
      </div>
    </div>
  );
};

export default Invest;
