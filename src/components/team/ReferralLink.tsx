import React, { useState } from 'react';
import { Copy, Check, Share2, Users, Gift } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const ReferralLink: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const { user } = useAuthStore();

  if (!user) return null;

  const referralLink = `${window.location.origin}/register?ref=${user.referral_code}`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareReferralLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Multi Crypto - Plataforma de Investimentos',
          text: 'Comece a investir em criptomoedas comigo na Multi Crypto!',
          url: referralLink,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      copyToClipboard(referralLink);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="text-white" size={24} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Convide Amigos</h2>
        <p className="text-gray-400">
          Ganhe comissões de até 20% dos investimentos da sua equipe
        </p>
      </div>

      {/* Referral Code */}
      <div className="bg-surface rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Seu Código de Convite:
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={user.referral_code}
            readOnly
            className="flex-1 bg-background border border-surface-light rounded-lg px-3 py-2 text-white text-center font-mono text-lg"
          />
          <button
            onClick={() => copyToClipboard(user.referral_code)}
            className="p-2 bg-primary hover:bg-primary/80 rounded-lg transition-colors"
          >
            {copied ? (
              <Check className="text-white" size={16} />
            ) : (
              <Copy className="text-white" size={16} />
            )}
          </button>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-surface rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Link de Convite:
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 bg-background border border-surface-light rounded-lg px-3 py-2 text-white text-sm"
          />
          <button
            onClick={() => copyToClipboard(referralLink)}
            className="p-2 bg-primary hover:bg-primary/80 rounded-lg transition-colors"
          >
            {copied ? (
              <Check className="text-white" size={16} />
            ) : (
              <Copy className="text-white" size={16} />
            )}
          </button>
        </div>
      </div>

      {/* Share Button */}
      <button
        onClick={shareReferralLink}
        className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center space-x-2"
      >
        <Share2 size={20} />
        <span>Compartilhar Link</span>
      </button>

      {/* Commission Structure */}
      <div className="bg-surface rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Gift className="text-primary" size={20} />
          <span>Estrutura de Comissões</span>
        </h3>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold text-xs">1</span>
              </div>
              <p className="text-white font-medium text-sm">Nível 1</p>
            </div>
            <span className="text-success font-bold">10%</span>
          </div>

          <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-secondary/20 rounded-full flex items-center justify-center">
                <span className="text-secondary font-bold text-xs">2</span>
              </div>
              <p className="text-white font-medium text-sm">Nível 2</p>
            </div>
            <span className="text-success font-bold">4%</span>
          </div>

          <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-warning/20 rounded-full flex items-center justify-center">
                <span className="text-warning font-bold text-xs">3</span>
              </div>
              <p className="text-white font-medium text-sm">Nível 3</p>
            </div>
            <span className="text-success font-bold">2%</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="flex flex-col items-center p-2 bg-background/50 rounded-lg">
              <div className="w-6 h-6 bg-success/20 rounded-full flex items-center justify-center mb-1">
                <span className="text-success font-bold text-xs">4</span>
              </div>
              <span className="text-success font-bold text-xs">1%</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-background/50 rounded-lg">
              <div className="w-6 h-6 bg-success/20 rounded-full flex items-center justify-center mb-1">
                <span className="text-success font-bold text-xs">5</span>
              </div>
              <span className="text-success font-bold text-xs">1%</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-background/50 rounded-lg">
              <div className="w-6 h-6 bg-success/20 rounded-full flex items-center justify-center mb-1">
                <span className="text-success font-bold text-xs">6</span>
              </div>
              <span className="text-success font-bold text-xs">1%</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-background/50 rounded-lg">
              <div className="w-6 h-6 bg-success/20 rounded-full flex items-center justify-center mb-1">
                <span className="text-success font-bold text-xs">7</span>
              </div>
              <span className="text-success font-bold text-xs">1%</span>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
          <p className="text-success text-sm text-center">
            <strong>Total: 20%</strong> de comissão sobre todos os investimentos da sua equipe!
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <h4 className="text-primary font-semibold mb-2">Como funciona:</h4>
        <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
          <li>Compartilhe seu código ou link de convite</li>
          <li>Seus amigos se cadastram usando seu código</li>
          <li>Quando eles investem, você ganha comissão automaticamente</li>
          <li>As comissões são creditadas no seu saldo instantaneamente</li>
        </ol>
      </div>
    </div>
  );
};

export default ReferralLink;
