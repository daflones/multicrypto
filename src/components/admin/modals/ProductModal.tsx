import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Save, DollarSign, Calendar, Percent } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { formatCurrency } from '../../../utils/formatters';

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

interface ProductModalProps {
  product?: Product | null;
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    min_investment: product?.min_investment || 0,
    max_investment: product?.max_investment || 0,
    duration_days: product?.duration_days || 60,
    daily_yield_percentage: product?.daily_yield_percentage || 5,
    is_active: product?.is_active ?? true,
    image_path: product?.image_path || ''
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB');
      return;
    }

    try {
      setUploadingImage(true);

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        alert('Erro ao fazer upload da imagem');
        return;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_path: publicUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erro ao fazer upload da imagem');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.name.trim()) {
      alert('Nome do produto é obrigatório');
      return;
    }
    
    if (!formData.description.trim()) {
      alert('Descrição do produto é obrigatória');
      return;
    }
    
    if (formData.price <= 0) {
      alert('Preço deve ser maior que zero');
      return;
    }
    
    if (formData.duration_days <= 0) {
      alert('Duração deve ser maior que zero');
      return;
    }
    
    if (formData.daily_yield_percentage <= 0 || formData.daily_yield_percentage > 100) {
      alert('Taxa de rendimento deve estar entre 0.1% e 100%');
      return;
    }

    try {
      setLoading(true);

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: formData.price,
        min_investment: formData.min_investment || null,
        max_investment: formData.max_investment || null,
        duration_days: formData.duration_days,
        daily_yield_percentage: formData.daily_yield_percentage,
        is_active: formData.is_active,
        image_path: formData.image_path || null,
        updated_at: new Date().toISOString()
      };

      if (product) {
        // Atualizar produto existente
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);

        if (error) {
          console.error('Error updating product:', error);
          alert('Erro ao atualizar produto');
          return;
        }

        alert('Produto atualizado com sucesso!');
      } else {
        // Criar novo produto
        const { error } = await supabase
          .from('products')
          .insert([{
            ...productData,
            created_at: new Date().toISOString()
          }]);

        if (error) {
          console.error('Error creating product:', error);
          alert('Erro ao criar produto');
          return;
        }

        alert('Produto criado com sucesso!');
      }

      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-surface-light rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-light">
          <div>
            <h2 className="text-xl font-bold text-white">
              {product ? 'Editar Produto' : 'Novo Produto'}
            </h2>
            <p className="text-gray-400">
              {product ? 'Atualize as informações do produto' : 'Crie um novo produto de investimento'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Imagem do Produto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <ImageIcon size={20} />
              <span>Imagem do Produto</span>
            </h3>
            
            <div className="flex items-center space-x-4">
              {/* Preview da Imagem */}
              <div className="w-32 h-32 bg-background/50 border border-surface-light rounded-lg overflow-hidden">
                {formData.image_path ? (
                  <img
                    src={formData.image_path}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="text-gray-500" size={32} />
                  </div>
                )}
              </div>
              
              {/* Upload Button */}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="flex items-center space-x-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {uploadingImage ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload size={16} />
                  )}
                  <span>{uploadingImage ? 'Enviando...' : 'Escolher Imagem'}</span>
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
                </p>
              </div>
            </div>
          </div>

          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Informações Básicas</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome do Produto *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-background border border-surface-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                placeholder="Ex: Bitcoin Premium"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descrição *
              </label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-background border border-surface-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary resize-none"
                placeholder="Descreva o produto de investimento..."
              />
            </div>
          </div>

          {/* Configurações Financeiras */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <DollarSign size={20} />
              <span>Configurações Financeiras</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Preço do Produto *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-background border border-surface-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Investimento Mínimo
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.min_investment}
                  onChange={(e) => setFormData({ ...formData, min_investment: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-background border border-surface-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Investimento Máximo
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.max_investment}
                  onChange={(e) => setFormData({ ...formData, max_investment: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-background border border-surface-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center space-x-1">
                  <Percent size={16} />
                  <span>Rendimento Diário (%) *</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  required
                  value={formData.daily_yield_percentage}
                  onChange={(e) => setFormData({ ...formData, daily_yield_percentage: parseFloat(e.target.value) || 5 })}
                  className="w-full bg-background border border-surface-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Configurações de Tempo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Calendar size={20} />
              <span>Configurações de Tempo</span>
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duração (dias) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.duration_days}
                onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 60 })}
                className="w-full bg-background border border-surface-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
              />
              <p className="text-xs text-gray-500 mt-1">
                Período em dias que o investimento ficará ativo
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Status</h3>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-primary bg-surface border-surface-light rounded focus:ring-primary"
              />
              <label htmlFor="is_active" className="text-white">
                Produto ativo (disponível para investimento)
              </label>
            </div>
          </div>

          {/* Preview dos Cálculos */}
          {formData.price > 0 && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <h4 className="text-primary font-medium mb-2">Preview dos Rendimentos</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-300">Rendimento diário:</p>
                  <p className="text-white font-bold">
                    {formatCurrency(formData.price * (formData.daily_yield_percentage / 100))}
                  </p>
                </div>
                <div>
                  <p className="text-gray-300">Rendimento total:</p>
                  <p className="text-white font-bold">
                    {formatCurrency(formData.price * (formData.daily_yield_percentage / 100) * formData.duration_days)}
                  </p>
                </div>
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
              disabled={loading}
              className="flex items-center space-x-2 bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              <span>{loading ? 'Salvando...' : 'Salvar Produto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
