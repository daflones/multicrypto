import React, { useState } from 'react';
import { X, TrendingUp, AlertCircle, DollarSign } from 'lucide-react';
import { Product } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { formatCurrency } from '../../utils/formatters';
import { NotificationService } from '../../services/notification.service';
import { useNavigate } from 'react-router-dom';

interface InvestmentModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const InvestmentModal: React.FC<InvestmentModalProps> = ({ 
  product, 
  isOpen, 
  onClose 
}) => {
  const [isInvesting, setIsInvesting] = useState(false);
  const { user, updateBalance } = useAuthStore();
  const { createInvestment } = useUserStore();
  const navigate = useNavigate();

  if (!isOpen || !product || !user) return null;

  const handleInvest = async () => {
    try {
      setIsInvesting(true);
      
      // Check if user has sufficient balance
      if (user.balance < product.price) {
        // Notificação de rejeição por saldo insuficiente
        try {
          await NotificationService.createNotification(
            user.id,
            'investment_rejected',
            'Investimento não realizado',
            'Desculpe, seu investimento não foi realizado por: saldo insuficiente.' ,
            { product_id: product.id, product_name: product.name }
          );
        } catch {}
        alert('Saldo insuficiente. Faça um depósito primeiro.');
        return;
      }

      // Create investment
      await createInvestment(user.id, product.id, product.price);
      
      // Update user balance in store
      updateBalance(user.balance - product.price);
      
      // Notificação de sucesso
      try {
        await NotificationService.createNotification(
          user.id,
          'investment_approved',
          'Parabéns! Investimento realizado',
          `Parabéns, seu produto ${product.name} foi adquirido com sucesso.`,
          { product_id: product.id, product_name: product.name, amount: product.price }
        );
      } catch {}

      alert('Investimento realizado com sucesso!');
      // Redirecionar para Meus Investimentos
      navigate('/my-investments');
      onClose();
    } catch (error) {
      console.error('Investment error:', error);
      const reason = error instanceof Error ? error.message : 'Erro ao realizar investimento';
      // Notificação de rejeição com motivo
      try {
        await NotificationService.createNotification(
          user.id,
          'investment_rejected',
          'Investimento não realizado',
          `Desculpe, seu investimento não foi realizado por: ${reason}`,
          { product_id: product.id, product_name: product.name }
        );
      } catch {}
      alert(reason);
    } finally {
      setIsInvesting(false);
    }
  };

  const monthlyReturn = product.daily_yield * 30;
  const roi = (monthlyReturn / product.price) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-light">
          <h2 className="text-xl font-bold text-white">Confirmar Investimento</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Product Info */}
          <div className="text-center">
            <img 
              src={product.image_path || '/images/crypto-placeholder.jpg'} 
              alt={product.name}
              className="w-20 h-20 object-cover rounded-lg mx-auto mb-3"
              onError={(e) => {
                e.currentTarget.src = '/images/crypto-placeholder.jpg';
              }}
            />
            <h3 className="text-lg font-bold text-white mb-2">{product.name}</h3>
            <p className="text-sm text-gray-400">{product.description}</p>
          </div>

          {/* Investment Details */}
          <div className="bg-background/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Valor do investimento:</span>
              <span className="text-white font-semibold text-lg">
                {formatCurrency(product.price)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Rendimento diário:</span>
              <span className="text-success font-semibold flex items-center space-x-1">
                <TrendingUp size={16} />
                <span>{formatCurrency(product.daily_yield)}</span>
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Rendimento mensal:</span>
              <span className="text-success font-semibold">
                {formatCurrency(monthlyReturn)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">ROI mensal:</span>
              <span className="text-success font-semibold">
                {roi.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Balance Check */}
          <div className="bg-background/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">Seu saldo atual:</span>
              <span className="text-white font-semibold">
                {formatCurrency(user.balance)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Saldo após investimento:</span>
              <span className={`font-semibold ${
                user.balance >= product.price ? 'text-success' : 'text-error'
              }`}>
                {formatCurrency(user.balance - product.price)}
              </span>
            </div>
          </div>

          {/* Warning */}
          {user.balance < product.price && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="text-error flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-error font-medium text-sm">Saldo Insuficiente</p>
                <p className="text-error/80 text-sm mt-1">
                  Você precisa de {formatCurrency(product.price - user.balance)} a mais para realizar este investimento.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleInvest}
              disabled={isInvesting || user.balance < product.price}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isInvesting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <DollarSign size={20} />
                  <span>Confirmar Investimento</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentModal;
