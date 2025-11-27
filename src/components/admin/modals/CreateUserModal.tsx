import React, { useState } from 'react';
import { X, UserPlus, Save } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import bcrypt from 'bcryptjs';

interface CreateUserModalProps {
  onClose: () => void;
  onUpdate: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: ''
  });

  const generateReferralCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.name.trim()) {
      alert('Nome é obrigatório');
      return;
    }
    
    if (!formData.email.trim()) {
      alert('Email é obrigatório');
      return;
    }
    
    if (!formData.cpf.trim()) {
      alert('CPF é obrigatório');
      return;
    }
    
    if (!formData.phone.trim()) {
      alert('Telefone é obrigatório');
      return;
    }
    
    if (!formData.password || formData.password.length < 6) {
      alert('Senha deve ter no mínimo 6 caracteres');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      alert('As senhas não coincidem');
      return;
    }

    try {
      setLoading(true);

      // Verificar se CPF ou email já existem
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('id')
        .or(`cpf.eq.${formData.cpf.replace(/\D/g, '')},email.eq.${formData.email}`);

      if (checkError) {
        console.error('Error checking existing user:', checkError);
        alert('Erro ao verificar usuário existente');
        return;
      }

      if (existingUsers && existingUsers.length > 0) {
        alert('CPF ou email já cadastrado');
        return;
      }

      // Verificar código de indicação (se fornecido)
      let referrerId = null;
      if (formData.referralCode.trim()) {
        const { data: referrer, error: referrerError } = await supabase
          .from('users')
          .select('id')
          .eq('referral_code', formData.referralCode.trim().toUpperCase())
          .single();

        if (referrerError || !referrer) {
          alert('Código de indicação inválido');
          return;
        }

        referrerId = referrer.id;
      }

      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            cpf: formData.cpf.replace(/\D/g, ''),
            phone: formData.phone.replace(/\D/g, '')
          }
        }
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        alert('Erro ao criar usuário: ' + authError.message);
        return;
      }

      if (!authData.user) {
        alert('Erro ao criar usuário');
        return;
      }

      // Gerar código de indicação único
      let newReferralCode = generateReferralCode();
      let codeExists = true;
      
      while (codeExists) {
        const { data: existingCode } = await supabase
          .from('users')
          .select('id')
          .eq('referral_code', newReferralCode)
          .single();
        
        if (!existingCode) {
          codeExists = false;
        } else {
          newReferralCode = generateReferralCode();
        }
      }

      // Hash da senha
      const passwordHash = await bcrypt.hash(formData.password, 10);

      // Inserir na tabela users
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          name: formData.name.trim(),
          email: formData.email.trim(),
          cpf: formData.cpf.replace(/\D/g, ''),
          phone: formData.phone.replace(/\D/g, ''),
          password_hash: passwordHash,
          referral_code: newReferralCode,
          referred_by: referrerId,
          balance: 0,
          commission_balance: 0,
          is_active: true,
          role: 'user'
        });

      if (insertError) {
        console.error('Error inserting user:', insertError);
        // Tentar limpar o usuário do Auth se falhar
        await supabase.auth.admin.deleteUser(authData.user.id);
        alert('Erro ao criar perfil do usuário: ' + insertError.message);
        return;
      }

      alert('Usuário criado com sucesso!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Erro ao criar usuário');
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
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <UserPlus size={24} />
              <span>Criar Novo Usuário</span>
            </h2>
            <p className="text-gray-400">Adicione um novo usuário ao sistema</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informações Pessoais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Informações Pessoais</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-surface border border-surface-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                placeholder="João da Silva"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  CPF *
                </label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  className="w-full bg-surface border border-surface-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  placeholder="000.000.000-00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Telefone *
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-surface border border-surface-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>
            </div>
          </div>

          {/* Credenciais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Credenciais de Acesso</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-surface border border-surface-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                placeholder="usuario@email.com"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Senha *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-surface border border-surface-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmar Senha *
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full bg-surface border border-surface-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  placeholder="Repita a senha"
                  required
                  minLength={6}
                />
              </div>
            </div>
          </div>

          {/* Código de Indicação */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Indicação (Opcional)</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Código de Indicação
              </label>
              <input
                type="text"
                value={formData.referralCode}
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                className="w-full bg-surface border border-surface-light rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                placeholder="ABC123"
                maxLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                Deixe em branco se o usuário não foi indicado
              </p>
            </div>
          </div>

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
              <span>{loading ? 'Criando...' : 'Criar Usuário'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
