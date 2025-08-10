import { supabase } from './supabase';
import { generateReferralCode } from '../utils/formatters';
import { validateCPF, validatePhone, sanitizeInput, validatePassword } from '../utils/validators';
import bcrypt from 'bcryptjs';
import { NotificationService } from './notification.service';

export interface RegisterData {
  cpf: string;
  email: string;
  phone: string;
  password: string;
  referralCode: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export class AuthService {
  static async updateUserPhone(userId: string, newPhone: string) {
    try {
      const clean = sanitizeInput(newPhone).replace(/\D/g, '');
      if (!validatePhone(clean)) {
        throw new Error('Telefone inválido');
      }

      const { error } = await supabase
        .from('users')
        .update({ phone: clean })
        .eq('id', userId);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Update phone error:', error);
      throw error;
    }
  }

  static async updateUserPassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      const cur = sanitizeInput(currentPassword);
      const next = sanitizeInput(newPassword);
      if (!validatePassword(next)) {
        throw new Error('Nova senha inválida');
      }

      // Buscar hash atual
      const { data: user, error: userErr } = await supabase
        .from('users')
        .select('id, password_hash, email')
        .eq('id', userId)
        .single();
      if (userErr || !user) {
        throw new Error('Usuário não encontrado');
      }

      const ok = await bcrypt.compare(cur, user.password_hash);
      if (!ok) throw new Error('Senha atual incorreta');

      const newHash = await bcrypt.hash(next, 10);

      // Atualiza hash na tabela users
      const { error: updErr } = await supabase
        .from('users')
        .update({ password_hash: newHash })
        .eq('id', userId);
      if (updErr) throw updErr;

      // Atualiza senha no Supabase Auth para manter login funcional
      const { error: authErr } = await supabase.auth.updateUser({ password: next });
      if (authErr) {
        // Não falhar duro se auth update falhar; mas logar
        console.warn('Falha ao atualizar senha no Supabase Auth:', authErr);
      }

      return true;
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  }
  static async register(data: RegisterData) {
    try {
      // Validate CPF
      if (!validateCPF(data.cpf)) {
        throw new Error('CPF inválido');
      }

      // Check if referral code exists (buscar pelo admin criado no SQL)
      console.log('🔍 Verificando código de convite:', data.referralCode);
      
      // Primeiro, vamos tentar buscar todos os usuários para ver se a tabela tem dados
      const { data: allUsers, error: allUsersError } = await supabase
        .from('users')
        .select('id, referral_code, email');
      
      console.log('👥 Todos os usuários no banco:', allUsers, 'Erro:', allUsersError);
      
      // Agora buscar o referrer específico
      const { data: referrer, error: referrerError } = await supabase
        .from('users')
        .select('id, referral_code, email')
        .eq('referral_code', data.referralCode)
        .maybeSingle(); // Use maybeSingle em vez de single para evitar erro quando não encontrar

      console.log('📊 Resultado da busca:', { referrer, referrerError });

      if (referrerError) {
        console.error('❌ Erro ao buscar referrer:', referrerError);
        throw new Error('Erro na consulta: ' + referrerError.message);
      }
      
      if (!referrer) {
        console.error('❌ Código não encontrado:', data.referralCode);
        throw new Error('Código de convite inválido');
      }

      // Check if CPF or email already exists
      const { data: existingUsers, error: existingError } = await supabase
        .from('users')
        .select('id')
        .or(`and(cpf.eq.${data.cpf.replace(/\D/g, '')},email.eq.${data.email})`);

      if (existingError) {
        console.error('Erro ao verificar usuários existentes:', existingError);
        throw new Error('Erro ao verificar usuário existente');
      }

      if (existingUsers && existingUsers.length > 0) {
        throw new Error('CPF ou email já cadastrado');
      }

      // Create user with Supabase Auth first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            cpf: data.cpf.replace(/\D/g, ''),
            phone: data.phone.replace(/\D/g, ''),
            referral_code: data.referralCode
          }
        }
      });

      if (authError) {
        throw new Error('Erro na autenticação: ' + authError.message);
      }

      if (!authData.user) {
        throw new Error('Erro ao criar usuário');
      }

      // Generate unique referral code
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

      // Hash da senha usando bcrypt
      const passwordHash = await bcrypt.hash(data.password, 10);

      // Insert into our users table
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id, // Use the same ID from auth
          cpf: data.cpf.replace(/\D/g, ''),
          email: data.email,
          phone: data.phone.replace(/\D/g, ''),
          password_hash: passwordHash,
          referral_code: newReferralCode,
          referred_by: referrer.id,
          balance: 0
        })
        .select()
        .single();

      if (insertError) {
        // If user table insert fails, clean up auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error('Erro ao criar perfil: ' + insertError.message);
      }

      // Enviar notificação para o referenciador direto (sem mencionar comissão)
      try {
        await NotificationService.createNotification(
          referrer.id,
          'referral_new',
          'Novo cadastro na sua rede',
          `${data.email} acabou de se cadastrar usando seu código de convite.`,
          { new_user_id: newUser.id, new_user_email: data.email }
        );
      } catch (notifyErr) {
        console.error('Erro ao criar notificação de cadastro:', notifyErr);
      }

      return { user: newUser, success: true };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  static async login(data: LoginData) {
    try {
      console.log('🔑 [1/5] Iniciando login para:', data.email);
      
      // 1. Busca o usuário na tabela users
      console.log('🔍 [2/5] Buscando usuário no banco de dados...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', data.email)
        .single();

      if (userError || !userData) {
        console.error('❌ [ERRO] Usuário não encontrado na tabela users:', userError);
        throw new Error('Email ou senha incorretos');
      }
      console.log('✅ [2/5] Usuário encontrado na tabela users');

      // 2. Verifica a senha usando bcrypt
      console.log('🔐 [3/5] Verificando senha com bcrypt...');
      const isValidPassword = await bcrypt.compare(data.password, userData.password_hash);
      
      if (!isValidPassword) {
        console.error('❌ [ERRO] Senha incorreta para o usuário:', userData.email);
        throw new Error('Email ou senha incorretos');
      }
      console.log('✅ [3/5] Senha válida');

      // 3. Tenta autenticar com o Supabase Auth
      console.log('🔑 [4/5] Tentando autenticar com Supabase Auth...');
      console.log('   - Email:', data.email);
      console.log('   - Senha fornecida:', data.password ? '***' : 'vazia');
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      console.log('   - Resposta do Supabase Auth:', { authData, authError });

      if (authError) {
        if (authError.message.includes('Email not confirmed')) {
          console.log('ℹ️  [INFO] E-mail não confirmado, mas continuando...');
        } else {
          console.error('❌ [ERRO] Falha na autenticação Supabase:', {
            message: authError.message,
            status: authError.status,
            name: authError.name
          });
          throw new Error('Erro ao fazer login. Verifique suas credenciais.');
        }
      }

      console.log('✅ [4/5] Autenticação concluída com sucesso');
      
      // Remove o hash da senha antes de retornar
      const { password_hash, ...userWithoutPassword } = userData;
      
      console.log('✅ [5/5] Login finalizado com sucesso para:', userData.email);
      return { user: userWithoutPassword, success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  static async getCurrentUser(userId: string) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, cpf, email, phone, referral_code, balance, created_at')
        .eq('id', userId)
        .single();

      if (error) {
        throw new Error('Usuário não encontrado');
      }

      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  static async updateUserBalance(userId: string, newBalance: number) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error('Erro ao atualizar saldo');
      }

      return data;
    } catch (error) {
      console.error('Update balance error:', error);
      throw error;
    }
  }

  static async getUserByReferralCode(referralCode: string) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, referral_code')
        .eq('referral_code', referralCode)
        .single();

      if (error) {
        return null;
      }

      return user;
    } catch (error) {
      console.error('Get user by referral code error:', error);
      return null;
    }
  }

  static async createFirstUser(data: RegisterData) {
    try {
      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 10);

      // Generate unique referral code
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

      // Create first user without referrer
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          cpf: data.cpf.replace(/\D/g, ''),
          email: data.email,
          phone: data.phone.replace(/\D/g, ''),
          password_hash: passwordHash,
          referral_code: newReferralCode,
          referred_by: null, // Primeiro usuário não tem referrer
          balance: 0
        })
        .select()
        .single();

      return { data: newUser, error: insertError };
    } catch (error) {
      console.error('Create first user error:', error);
      return { data: null, error };
    }
  }

  static async getReferralTree(userId: string) {
    try {
      // Helper function to add total_invested to users
      const addTotalInvested = async (users: any[]) => {
        if (!users || users.length === 0) return users;
        
        const userIds = users.map(user => user.id);
        const { data: investments } = await supabase
          .from('user_investments')
          .select('user_id, amount')
          .in('user_id', userIds);
        
        return users.map(user => {
          const userInvestments = investments?.filter(inv => inv.user_id === user.id) || [];
          const total_invested = userInvestments.reduce((sum, inv) => sum + inv.amount, 0);
          return { ...user, total_invested };
        });
      };

      // Get direct referrals (level 1)
      const { data: level1Raw, error: level1Error } = await supabase
        .from('users')
        .select('id, email, referral_code, created_at, balance')
        .eq('referred_by', userId);

      if (level1Error) {
        throw new Error('Erro ao buscar equipe');
      }

      // Add total_invested to level 1
      const level1 = await addTotalInvested(level1Raw || []);

      const referralTree = {
        level1,
        level2: [] as any[],
        level3: [] as any[]
      };

      // Get level 2 referrals
      if (level1 && level1.length > 0) {
        const level1Ids = level1.map(user => user.id);
        const { data: level2Raw, error: level2Error } = await supabase
          .from('users')
          .select('id, email, referral_code, created_at, balance, referred_by')
          .in('referred_by', level1Ids);

        if (!level2Error && level2Raw) {
          // Add total_invested to level 2
          const level2 = await addTotalInvested(level2Raw);
          referralTree.level2 = level2;

          // Get level 3 referrals
          const level2Ids = level2.map(user => user.id);
          if (level2Ids.length > 0) {
            const { data: level3Raw, error: level3Error } = await supabase
              .from('users')
              .select('id, email, referral_code, created_at, balance, referred_by')
              .in('referred_by', level2Ids);

            if (!level3Error && level3Raw) {
              // Add total_invested to level 3
              const level3 = await addTotalInvested(level3Raw);
              referralTree.level3 = level3;
            }
          }
        }
      }

      return referralTree;
    } catch (error) {
      console.error('Get referral tree error:', error);
      throw error;
    }
  }
}
