import React from 'react';
import { TrendingUp, Star } from 'lucide-react';
import { Product } from '../../services/supabase';
import { getProductImage } from '../../utils/imageUtils';

interface ProductCardProps {
  product: Product;
  userInvestmentCount: number;
  onInvest: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onInvest 
}) => {
  const isPremium = product.product_type === 'premium';

  return (
    <div className="bg-surface rounded-xl p-4 border border-surface-light hover:border-primary/30 transition-all duration-300 relative overflow-hidden">
      {/* Premium Badge */}
      {isPremium && (
        <div className="absolute top-3 right-3 bg-gradient-to-r from-warning to-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center space-x-1">
          <Star size={12} />
          <span>PREMIUM</span>
        </div>
      )}

      {/* Product Image */}
      <div className="relative mb-4">
        <img 
          src={product.image_path || getProductImage(product.name)} 
          alt={product.name}
          className="w-full h-32 object-cover rounded-lg"
          onError={(e) => {
            e.currentTarget.src = getProductImage(product.name);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg" />
      </div>

      {/* Product Info */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-bold text-white mb-1">{product.name}</h3>
          {product.description && (
            <p className="text-sm text-gray-400 line-clamp-2">{product.description}</p>
          )}
        </div>

        {/* Investment Details */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Investimento mínimo:</span>
            <span className="text-white font-semibold">R$ 50,00</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Rendimento/dia:</span>
            <span className="text-success font-semibold flex items-center space-x-1">
              <TrendingUp size={14} />
              <span>8%</span>
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Duração:</span>
            <span className="text-white font-semibold">{product.duration_days || 30} dias</span>
          </div>
        </div>

        {/* ROI Information */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg p-3">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-300">ROI mensal:</span>
              <span className="text-success font-semibold text-lg">
                240%
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-300 text-xs">Rendimento diário:</span>
              <span className="text-success text-xs">
                8% ao dia
              </span>
            </div>
          </div>
        </div>

        {/* Investment Range */}
        <div className="bg-background/50 rounded-lg p-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Valor de investimento:</span>
            <span className="text-white font-semibold">
              R$ 50 - R$ 50.000
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onInvest(product)}
          className="w-full py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white"
        >
          <span>Investir Agora</span>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
