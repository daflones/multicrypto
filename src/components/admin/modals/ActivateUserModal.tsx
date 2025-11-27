import React, { useState, useEffect } from 'react';
import { X, Package, Save, CheckSquare, Square } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { formatCurrency } from '../../../utils/formatters';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  daily_yield_percentage: number;
  duration_days: number;
  image_path?: string;
  is_active: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
}

interface ActivateUserModalProps {
  user: User;
  onClose: () => void;
  onUpdate: () => void;
}

interface ProductWithCustomPrice extends Product {
  customPrice?: number;
}

const ActivateUserModal: React.FC<ActivateUserModalProps> = ({ user, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ProductWithCustomPrice[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        // Ao desmarcar, remover o preço personalizado também
        const newPrices = { ...customPrices };
        delete newPrices[productId];
        setCustomPrices(newPrices);
        return prev.filter(id => id !== productId);
      } else {
        // Ao marcar, inicializar com o preço padrão
        const product = products.find(p => p.id === productId);
        if (product) {
          setCustomPrices(prev => ({ ...prev, [productId]: product.price }));
        }
        return [...prev, productId];
      }
    });
  };

  const updateCustomPrice = (productId: string, price: number) => {
    setCustomPrices(prev => ({ ...prev, [productId]: price }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedProducts.length === 0) {
      alert('Selecione pelo menos um produto para ativar o usuário');
      return;
    }

    try {
      setLoading(true);

      // Criar investimentos para cada produto selecionado
      // O usuário será automaticamente considerado ativo ao ter investimentos ativos
      const investmentsToCreate = [];

      for (const productId of selectedProducts) {
        const product = products.find(p => p.id === productId);
        if (!product) continue;

        // Usar preço personalizado se definido, senão usar preço padrão
        const investmentAmount = customPrices[productId] || product.price;

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + (product.duration_days || 60));

        investmentsToCreate.push({
          user_id: user.id,
          product_id: productId,
          amount: investmentAmount,
          status: 'active' as const,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          total_earned: 0
        });
      }

      const { error: investmentsError } = await supabase
        .from('user_investments')
        .insert(investmentsToCreate);

      if (investmentsError) {
        console.error('Error creating investments:', investmentsError);
        alert('Erro ao criar investimentos para o usuário');
        return;
      }

      alert(`Produtos adicionados com sucesso!\n${selectedProducts.length} investimento(s) criado(s) para ${user.name}.`);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error activating user:', error);
      alert('Erro ao ativar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-surface-light rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-light">
          <div>
            <h2 className="text-xl font-bold text-white">Adicionar Produtos ao Usuário</h2>
            <p className="text-gray-400">{user.name} - {user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informação */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <h3 className="text-primary font-medium mb-2">Adicionar Produtos</h3>
            <p className="text-gray-300 text-sm">
              Selecione os produtos que deseja adicionar para este usuário. 
              Você pode alterar o preço de cada produto antes de confirmar.
              O usuário será considerado ativo automaticamente ao ter pelo menos um investimento ativo.
            </p>
          </div>

          {/* Lista de Produtos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Package size={20} />
              <span>Selecione os Produtos</span>
            </h3>

            {loadingProducts ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-gray-400">Carregando produtos...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <Package size={48} className="text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400">Nenhum produto ativo disponível</p>
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => {
                  const isSelected = selectedProducts.includes(product.id);
                  const customPrice = customPrices[product.id] || product.price;
                  
                  return (
                    <div
                      key={product.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-surface-light bg-background/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <button
                          type="button"
                          onClick={() => toggleProduct(product.id)}
                          className="flex-1 text-left flex items-start space-x-3"
                        >
                          <div className="mt-1">
                            {isSelected ? (
                              <CheckSquare className="text-primary" size={24} />
                            ) : (
                              <Square className="text-gray-500" size={24} />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white mb-1">{product.name}</h4>
                            <p className="text-gray-400 text-sm">{product.description}</p>
                          </div>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Preço padrão:</span>
                          <span className="text-white">{formatCurrency(product.price)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Rendimento:</span>
                          <span className="text-green-400">{product.daily_yield_percentage}% ao dia</span>
                        </div>
                        <div className="flex justify-between col-span-2">
                          <span className="text-gray-400">Duração:</span>
                          <span className="text-white">{product.duration_days} dias</span>
                        </div>
                      </div>

                      {/* Campo de preço personalizado - só aparece se selecionado */}
                      {isSelected && (
                        <div className="pt-3 border-t border-surface-light">
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Preço para este usuário:
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={customPrice}
                            onChange={(e) => updateCustomPrice(product.id, parseFloat(e.target.value) || product.price)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-surface border border-surface-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {customPrice !== product.price && (
                              <span className="text-yellow-400">
                                Preço alterado de {formatCurrency(product.price)} para {formatCurrency(customPrice)}
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resumo */}
          {selectedProducts.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <h4 className="text-green-400 font-medium mb-2">Resumo</h4>
              <div className="space-y-1 text-sm">
                <p className="text-gray-300">
                  • Usuário: <span className="text-white font-medium">{user.name}</span>
                </p>
                <p className="text-gray-300">
                  • Produtos selecionados: <span className="text-white font-medium">{selectedProducts.length}</span>
                </p>
                <p className="text-gray-300">
                  • Valor total dos investimentos: <span className="text-primary font-medium">
                    {formatCurrency(
                      selectedProducts.reduce((sum, id) => {
                        return sum + (customPrices[id] || 0);
                      }, 0)
                    )}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-surface-light">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || selectedProducts.length === 0}
              className="flex items-center space-x-2 bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              <span>{loading ? 'Adicionando...' : 'Adicionar Produtos'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivateUserModal;
