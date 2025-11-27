import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Search,
  Image as ImageIcon,
  DollarSign,
  Calendar
} from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { formatCurrency, formatDate } from '../../../utils/formatters';
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
  const totalInvestments = products.length; // Aqui você pode buscar o número real de investimentos

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Produtos</h1>
          <p className="text-gray-400">Gerencie produtos de investimento</p>
        </div>
        
        <button
          onClick={handleCreateProduct}
          className="flex items-center space-x-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-surface-light rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total de Produtos</p>
              <p className="text-2xl font-bold text-white">{products.length}</p>
            </div>
            <Package className="text-primary" size={24} />
          </div>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Produtos Ativos</p>
              <p className="text-2xl font-bold text-green-400">{activeProducts.length}</p>
            </div>
            <Eye className="text-green-400" size={24} />
          </div>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Preço Médio</p>
              <p className="text-2xl font-bold text-primary">
                {products.length > 0 
                  ? formatCurrency(products.reduce((sum, p) => sum + p.price, 0) / products.length)
                  : formatCurrency(0)
                }
              </p>
            </div>
            <DollarSign className="text-primary" size={24} />
          </div>
        </div>
        
        <div className="bg-surface border border-surface-light rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Investimentos</p>
              <p className="text-2xl font-bold text-yellow-400">{totalInvestments}</p>
            </div>
            <Calendar className="text-yellow-400" size={24} />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full pl-10 pr-4 py-2 bg-surface border border-surface-light rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary"
        />
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Carregando produtos...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedProducts.map((product) => (
            <div
              key={product.id}
              className="bg-surface border border-surface-light rounded-lg overflow-hidden hover:border-primary/30 transition-colors"
            >
              {/* Product Image */}
              <div className="relative h-48 bg-background/50">
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
                    <ImageIcon className="text-gray-500" size={48} />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.is_active 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {product.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{product.name}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2">{product.description}</p>
                </div>

                {/* Price and Details */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Preço:</span>
                    <span className="text-primary font-bold text-lg">{formatCurrency(product.price)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Rendimento:</span>
                    <span className="text-green-400 font-medium">{product.daily_yield_percentage}% ao dia</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Duração:</span>
                    <span className="text-white">{product.duration_days} dias</span>
                  </div>

                  {product.min_investment && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Mín/Máx:</span>
                      <span className="text-white text-sm">
                        {formatCurrency(product.min_investment)} - {formatCurrency(product.max_investment || product.price)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-surface-light">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="p-2 text-gray-400 hover:text-primary transition-colors"
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    
                    <button
                      onClick={() => toggleProductStatus(product.id, product.is_active)}
                      className={`p-2 transition-colors ${
                        product.is_active 
                          ? 'text-green-400 hover:text-green-300' 
                          : 'text-red-400 hover:text-red-300'
                      }`}
                      title={product.is_active ? 'Desativar' : 'Ativar'}
                    >
                      {product.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <span className="text-xs text-gray-500">
                    {formatDate(product.created_at)}
                  </span>
                </div>
              </div>
            </div>
            ))}
            
            {paginatedProducts.length === 0 && !loading && (
              <div className="col-span-full text-center py-12">
                <Package size={48} className="text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">{filteredProducts.length === 0 ? 'Nenhum produto encontrado' : 'Nenhum resultado na página atual'}</p>
              </div>
            )}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                maxVisiblePages={10}
              />
            </div>
          )}
        </>
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
