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
  referralCode?: string; // opcional
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
        throw new Error('Falha ao atualizar senha no Supabase Auth');
      }

      return true;
    } catch (error) {
      throw error;
    }
  }
  static async register(data: RegisterData) {
    try {
      // Validate CPF
      if (!validateCPF(data.cpf)) {
        throw new Error('CPF inválido');
      }

      // Verifica código de convite apenas se fornecido
      let referrer: any = null;
      if (data.referralCode && data.referralCode.trim() !== '') {
        const { data: refUser, error: refError } = await supabase
          .from('users')
          .select('id, referral_code, email')
          .eq('referral_code', data.referralCode)
          .single();
        if (!refError && refUser) {
          referrer = refUser;
        } else {
          throw new Error('Código de convite inválido');
        }
      }

      // Check if CPF or email already exists
      const { data: existingUsers, error: existingError } = await supabase
        .from('users')
        .select('id')
        .or(`and(cpf.eq.${data.cpf.replace(/\D/g, '')},email.eq.${data.email})`);

      if (existingError) {
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
            referral_code: data.referralCode && data.referralCode.trim() !== '' ? data.referralCode : null
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
          referred_by: referrer ? referrer.id : null,
          balance: 0
        })
        .select()
        .single();

      if (insertError) {
        // If user table insert fails, clean up auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error('Erro ao criar perfil: ' + insertError.message);
      }

      // Enviar notificação apenas se houver referenciador
      if (referrer) {
        try {
          await NotificationService.createNotification(
            referrer.id,
            'referral_new',
            'Novo cadastro na sua rede',
            `${data.email} acabou de se cadastrar usando seu código de convite.`,
            { new_user_id: newUser.id, new_user_email: data.email }
          );
        } catch (notifyErr) {
          throw new Error('Erro ao criar notificação de cadastro');
        }
      }

      return { user: newUser, success: true };
    } catch (error) {
      throw error;
    }
  }

  static async login(data: LoginData) {
    try {
      // 1. Busca o usuário na tabela users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', data.email)
        .single();

      if (userError || !userData) {
        throw new Error('Email ou senha incorretos');
      }

      // 2. Verifica a senha usando bcrypt
      const isValidPassword = await bcrypt.compare(data.password, userData.password_hash);
      
      if (!isValidPassword) {
        throw new Error('Email ou senha incorretos');
      }

      // 3. Tenta autenticar com o Supabase Auth
      
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (authError) {
        if (authError.message.includes('Email not confirmed')) {
          // E-mail não confirmado, mas continuando...
        } else {
          throw new Error('Erro na autenticação');
        }
      }
      
      // Remove o hash da senha antes de retornar
      const { password_hash, ...userWithoutPassword } = userData;
      
      return { user: userWithoutPassword, success: true };
    } catch (error) {
      throw error;
    }
  }

  static async getCurrentUser(userId: string) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, cpf, email, phone, referral_code, balance, commission_balance, withdrawal_limit, created_at, role')
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
    // Validar userId antes de chamar
    if (!userId || typeof userId !== 'string' || userId.length < 10) {
      return {
        level1: [], level2: [], level3: [], level4: [],
        level5: [], level6: [], level7: []
      };
    }

    // Usar diretamente o fallback que funciona corretamente
    return this.getReferralTreeFallback(userId);
  }

  // Método fallback (antigo) caso a RPC falhe
  private static async getReferralTreeFallback(userId: string) {
    try {
      // Buscar apenas nível 1 inicialmente para melhor UX
      const { data: level1Raw, error: level1Error } = await supabase
        .from('users')
        .select(`
          id, email, phone, referral_code, created_at, balance,
          user_investments!inner(amount)
        `)
        .eq('referred_by', userId)
        .limit(50); // ✅ Limitar resultados

      if (level1Error) {
        throw new Error('Erro ao buscar equipe');
      }

      // Calcular total_invested de forma mais eficiente
      const level1 = (level1Raw || []).map(user => ({
        ...user,
        total_invested: user.user_investments?.reduce((sum: number, inv: any) => sum + inv.amount, 0) || 0
      }));

      const referralTree = {
        level1,
        level2: [] as any[],
        level3: [] as any[],
        level4: [] as any[],
        level5: [] as any[],
        level6: [] as any[],
        level7: [] as any[]
      };

      // ✅ Carregar outros níveis apenas se nível 1 tiver membros
      if (level1.length > 0) {
        // Buscar níveis 2-7 de forma mais eficiente (apenas se necessário)
        let currentLevelIds = level1.map(user => user.id);
        
        for (let level = 2; level <= 7 && currentLevelIds.length > 0; level++) {
          const { data: levelRaw } = await supabase
            .from('users')
            .select(`
              id, email, phone, referral_code, created_at, balance, referred_by,
              user_investments(amount)
            `)
            .in('referred_by', currentLevelIds)
            .limit(100); // ✅ Limitar por nível

          if (!levelRaw || levelRaw.length === 0) break;

          const levelData = levelRaw.map(user => ({
            ...user,
            total_invested: user.user_investments?.reduce((sum: number, inv: any) => sum + inv.amount, 0) || 0
          }));
          
          switch (level) {
            case 2: referralTree.level2 = levelData; break;
            case 3: referralTree.level3 = levelData; break;
            case 4: referralTree.level4 = levelData; break;
            case 5: referralTree.level5 = levelData; break;
            case 6: referralTree.level6 = levelData; break;
            case 7: referralTree.level7 = levelData; break;
          }

          currentLevelIds = levelData.map(user => user.id);
        }
      }

      return referralTree;
    } catch (error) {
      console.error('Get referral tree fallback error:', error);
      throw error;
    }
  }
}
