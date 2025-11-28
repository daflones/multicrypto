import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Search,
  Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { formatCurrency } from '../../../utils/formatters';
import ProductModal from '../modals/ProductModal';
import Pagination from '../../ui/Pagination';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  min_investment?: number;
  max_investment?: number;
  duration_days: number;
  daily_yield_percentage: number;
  is_active: boolean;
  image_path?: string;
  created_at: string;
  updated_at: string;
}

const ProductsSection: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // 20 produtos por página

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginação
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId);

      if (error) {
        console.error('Error updating product status:', error);
        alert('Erro ao atualizar status do produto');
        return;
      }

      // Atualizar estado local
      setProducts(products.map(product => 
        product.id === productId ? { ...product, is_active: !currentStatus } : product
      ));
    } catch (error) {
      console.error('Error toggling product status:', error);
      alert('Erro ao atualizar status do produto');
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('Error deleting product:', error);
        alert('Erro ao excluir produto');
        return;
      }

      // Atualizar estado local
      setProducts(products.filter(product => product.id !== productId));
      alert('Produto excluído com sucesso!');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Erro ao excluir produto');
    }
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingProduct(null);
    fetchProducts(); // Recarregar produtos após edição
  };

  const activeProducts = products.filter(p => p.is_active);
  const totalInvestments = products.length;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white">Produtos</h1>
          <p className="text-gray-400 text-sm">Gerencie produtos de investimento</p>
        </div>
        
        <button
          onClick={handleCreateProduct}
          className="flex items-center justify-center space-x-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors w-full sm:w-auto"
        >
          <Plus size={20} />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Stats Cards - Grid 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-surface-light rounded-xl p-3">
          <p className="text-gray-400 text-xs">Total</p>
          <p className="text-xl font-bold text-white">{products.length}</p>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-xl p-3">
          <p className="text-gray-400 text-xs">Ativos</p>
          <p className="text-xl font-bold text-green-400">{activeProducts.length}</p>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-xl p-3">
          <p className="text-gray-400 text-xs">Preço Médio</p>
          <p className="text-lg font-bold text-primary truncate">
            {products.length > 0 
              ? formatCurrency(products.reduce((sum, p) => sum + p.price, 0) / products.length)
              : formatCurrency(0)
            }
          </p>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-xl p-3">
          <p className="text-gray-400 text-xs">Investimentos</p>
          <p className="text-xl font-bold text-yellow-400">{totalInvestments}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
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

      {/* Products Cards */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando...</p>
        </div>
      ) : paginatedProducts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          Nenhum produto encontrado
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedProducts.map((product) => (
            <div
              key={product.id}
              className="bg-surface border border-surface-light rounded-xl overflow-hidden"
            >
              {/* Product Header com imagem */}
              <div className="flex items-start p-4">
                {/* Imagem */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-background/50 flex-shrink-0 mr-4">
                  {product.image_path ? (
                    <img
                      src={product.image_path}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/images/crypto-placeholder.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="text-gray-500" size={24} />
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-white truncate">{product.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                      product.is_active 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {product.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="text-primary font-bold text-lg">{formatCurrency(product.price)}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {product.daily_yield_percentage}% ao dia • {product.duration_days} dias
                  </p>
                </div>
              </div>

              {/* Ações */}
              <div className="flex border-t border-surface-light">
                <button
                  onClick={() => toggleProductStatus(product.id, product.is_active)}
                  className={`flex-1 py-3 text-sm font-medium flex items-center justify-center space-x-2 ${
                    product.is_active 
                      ? 'text-red-400 hover:bg-red-500/10' 
                      : 'text-green-400 hover:bg-green-500/10'
                  }`}
                >
                  {product.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                  <span>{product.is_active ? 'Desativar' : 'Ativar'}</span>
                </button>
                
                <div className="w-px bg-surface-light" />
                
                <button
                  onClick={() => handleEditProduct(product)}
                  className="flex-1 py-3 text-sm font-medium text-primary flex items-center justify-center space-x-2 hover:bg-primary/10"
                >
                  <Edit size={16} />
                  <span>Editar</span>
                </button>
                
                <div className="w-px bg-surface-light" />
                
                <button
                  onClick={() => deleteProduct(product.id)}
                  className="flex-1 py-3 text-sm font-medium text-red-400 flex items-center justify-center space-x-2 hover:bg-red-500/10"
                >
                  <Trash2 size={16} />
                  <span>Excluir</span>
                </button>
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

      {/* Product Modal */}
      {showModal && (
        <ProductModal
          product={editingProduct}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default ProductsSection;
