import React, { useState } from 'react';
import { User, LogOut, CreditCard, Phone, Mail, Copy, Check, Settings } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { formatCPF, formatPhone, formatDate } from '../utils/formatters';
import TransactionHistory from '../components/profile/TransactionHistory';
import ChangePhoneModal from '../components/profile/ChangePhoneModal';
import ChangePasswordModal from '../components/profile/ChangePasswordModal';

const Profile: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const { user, logout } = useAuthStore();

  if (!user) return null;

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(user.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleLogout = () => {
    if (confirm('Tem certeza que deseja sair?')) {
      logout();
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="text-white" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Meu Perfil</h1>
        <p className="text-gray-400">Gerencie suas informações pessoais</p>
      </div>

      {/* User Info */}
      <div className="bg-surface rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-semibold text-white mb-4">Informações Pessoais</h2>
        
        {/* Email */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
            <Mail className="text-primary" size={20} />
          </div>
          <div className="flex-1">
            <p className="text-gray-400 text-sm">Email</p>
            <p className="text-white font-medium">{user.email}</p>
          </div>
        </div>

        {/* CPF */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
            <CreditCard className="text-secondary" size={20} />
          </div>
          <div className="flex-1">
            <p className="text-gray-400 text-sm">CPF</p>
            <p className="text-white font-medium">{formatCPF(user.cpf)}</p>
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-warning/20 rounded-lg flex items-center justify-center">
            <Phone className="text-warning" size={20} />
          </div>
          <div className="flex-1">
            <p className="text-gray-400 text-sm">Telefone</p>
            <p className="text-white font-medium">{formatPhone(user.phone)}</p>
          </div>
        </div>

        {/* Member Since */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
            <Settings className="text-gray-300" size={20} />
          </div>
          <div className="flex-1">
            <p className="text-gray-400 text-sm">Membro desde</p>
            <p className="text-white font-medium">{formatDate(user.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Referral Code */}
      <div className="bg-surface rounded-lg p-4">
        <h2 className="text-lg font-semibold text-white mb-4">Código de Convite</h2>
        <div className="flex items-center space-x-3">
          <div className="flex-1 bg-background border border-surface-light rounded-lg px-4 py-3">
            <p className="text-center text-white font-mono text-lg">{user.referral_code}</p>
          </div>
          <button
            onClick={copyReferralCode}
            className="p-3 bg-primary hover:bg-primary/80 rounded-lg transition-colors"
          >
            {copied ? (
              <Check className="text-white" size={20} />
            ) : (
              <Copy className="text-white" size={20} />
            )}
          </button>
        </div>
        <p className="text-gray-400 text-sm mt-2 text-center">
          Compartilhe este código para convidar amigos
        </p>
      </div>

      {/* Account Actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Configurações da Conta</h2>
        
        <div className="bg-surface rounded-lg overflow-hidden">
          <button
            className="w-full p-4 text-left hover:bg-surface-light transition-colors flex items-center justify-between"
            onClick={() => setShowPasswordModal(true)}
          >
            <div className="flex items-center space-x-3">
              <Settings className="text-gray-400" size={20} />
              <span className="text-white">Alterar Senha</span>
            </div>
            <span className="text-gray-400">Abrir</span>
          </button>
          
          <div className="border-t border-surface-light">
            <button
              className="w-full p-4 text-left hover:bg-surface-light transition-colors flex items-center justify-between"
              onClick={() => setShowPhoneModal(true)}
            >
              <div className="flex items-center space-x-3">
                <Phone className="text-gray-400" size={20} />
                <span className="text-white">Alterar Telefone</span>
              </div>
              <span className="text-gray-400">Abrir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-surface rounded-lg p-4">
        <TransactionHistory />
      </div>

      {/* Support */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <h3 className="text-primary font-semibold mb-2">💬 Precisa de Ajuda?</h3>
        <p className="text-gray-300 text-sm mb-3">
          Nossa equipe de suporte está sempre disponível para ajudar você.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={`https://wa.me/554399196721?text=${encodeURIComponent(`Olá, sou usuário da plataforma, meu cpf é ${user.cpf || ''}. Preciso de ajuda.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Falar com Suporte (WhatsApp)
          </a>
          <a
            href="https://chat.whatsapp.com/IEqTSpXZSC1FqqMRXJhHeg?mode=ac_t"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center bg-secondary hover:bg-secondary/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Entrar no Grupo do WhatsApp
          </a>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full bg-error hover:bg-error/80 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
      >
        <LogOut size={20} />
        <span>Sair da Conta</span>
      </button>

      {/* Modals */}
      <ChangePhoneModal isOpen={showPhoneModal} onClose={() => setShowPhoneModal(false)} />
      <ChangePasswordModal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
    </div>
  );
};

export default Profile;
