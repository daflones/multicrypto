import React from 'react';
import { TrendingUp, Lock, Star } from 'lucide-react';
import { Product } from '../../services/supabase';
import { formatCurrency } from '../../utils/formatters';
import { getProductImage } from '../../utils/imageUtils';

interface ProductCardProps {
  product: Product;
  userInvestmentCount: number;
  onInvest: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  userInvestmentCount, 
  onInvest 
}) => {
  const canInvest = userInvestmentCount < product.max_purchases;
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
            <span className="text-sm text-gray-400">Investimento:</span>
            <span className="text-white font-semibold">{formatCurrency(product.price)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Rendimento/dia:</span>
            <span className="text-success font-semibold flex items-center space-x-1">
              <TrendingUp size={14} />
              <span>{formatCurrency(product.daily_yield)}</span>
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Duração:</span>
            <span className="text-white font-semibold">{product.duration_days || 30} dias</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Limite:</span>
            <span className={`font-semibold ${canInvest ? 'text-white' : 'text-warning'}`}>
              {userInvestmentCount}/{product.max_purchases}
            </span>
          </div>
        </div>

        {/* Total Return Calculation */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg p-3">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-300">Total de rendimentos:</span>
              <span className="text-success font-semibold">
                {formatCurrency((product.daily_yield || 0) * (product.duration_days || 30))}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-gray-600 pt-1">
              <span className="text-gray-300 font-medium">Retorno total:</span>
              <span className="text-white font-bold">
                {formatCurrency((product.price || 0) + ((product.daily_yield || 0) * (product.duration_days || 30)))}
              </span>
            </div>
          </div>
        </div>

        {/* ROI Calculation */}
        <div className="bg-background/50 rounded-lg p-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">ROI total:</span>
            <span className="text-success font-semibold">
              {product.price > 0 ? ((((product.daily_yield || 0) * (product.duration_days || 30)) / product.price) * 100).toFixed(1) : '0.0'}%
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onInvest(product)}
          disabled={!canInvest}
          className={`w-full py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 ${
            canInvest 
              ? 'bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white' 
              : 'bg-gray-600 cursor-not-allowed text-gray-400'
          }`}
        >
          {!canInvest && <Lock size={16} />}
          <span>{canInvest ? 'Investir Agora' : 'Limite Atingido'}</span>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
