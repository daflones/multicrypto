import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthService, LoginData, RegisterData } from '../services/auth.service';
import { supabase } from '../services/supabase';

interface User {
  id: string;
  cpf: string;
  email: string;
  phone: string;
  referral_code: string;
  balance: number;
  commission_balance: number;
  created_at: string;
  role: string;
  withdrawal_limit?: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateBalance: (newBalance: number) => void;
  refreshBalance: () => Promise<void>;
  checkUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false, // Começa como false para evitar deadlock de carregamento
      error: null,

      checkUser: async () => {
        try {
          const currentState = get();
          
          // Evita chamadas duplicadas apenas se já carregado e autenticado
          // (não bloqueia quando isLoading=true para não criar deadlock)

          // Se já estiver autenticado, não precisa verificar novamente
          if (currentState.isAuthenticated && currentState.user) return;
          
          set({ isLoading: true, error: null });
          
          // Verifica a sessão atual
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error("Erro ao verificar sessão:", sessionError);
            throw sessionError;
          }
          
          if (!session?.user) {
            // Se não houver sessão, limpa o estado e retorna
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false 
            });
            return;
          }
          
          // Se já temos um usuário e o ID é o mesmo, não precisamos buscar novamente
          if (currentState.user?.id === session.user.id) {
            set({ 
              isAuthenticated: true, 
              isLoading: false 
            });
            return;
          }
          
          try {
            // Busca os dados do perfil
            const { data: userProfile, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (error) {
              console.error("Erro ao buscar perfil do usuário:", error);
              // Se não encontrar o perfil, faz logout para limpar a sessão inválida
              await supabase.auth.signOut();
              throw new Error('Perfil de usuário não encontrado');
            }

            set({ 
              user: userProfile, 
              isAuthenticated: true,
              error: null,
              isLoading: false 
            });
          } catch (profileError) {
            console.error("Erro ao carregar perfil:", profileError);
            set({ 
              user: null, 
              isAuthenticated: false,
              isLoading: false,
              error: 'Não foi possível carregar o perfil do usuário'
            });
          }
        } catch (error) {
          console.error("Erro na verificação de autenticação:", error);
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: 'Não foi possível verificar a autenticação'
          });
        }
      },

      login: async (data: LoginData) => {
        // Evita travar quando o flag persistido está desatualizado
        if (get().isAuthenticated) {
          try {
            await get().checkUser();
          } catch {}
          if (get().isAuthenticated) {
            return; // Já autenticado e sessão válida
          }
        }

        set({ isLoading: true, error: null });
        
        try {
          // Faz o login usando o serviço
          const result = await AuthService.login(data);
          
          // Atualiza o estado com os dados do usuário retornados pelo serviço
          set({
            user: result.user,
            isAuthenticated: true,
            error: null,
            isLoading: false
          });
          
          return result.user;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Email ou senha inválidos';
          set({ 
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            isLoading: false 
          });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          await AuthService.register(data);
          await get().checkUser();
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Erro ao criar conta' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await supabase.auth.signOut();
        } catch (e) {
          console.error('Erro ao deslogar do Supabase:', e);
        }
        // Limpa o estado e o storage persistido
        set({ user: null, isAuthenticated: false, error: null, isLoading: false });
        try {
          localStorage.removeItem('auth-storage');
        } catch (e) {
          console.warn('Não foi possível limpar o storage de autenticação:', e);
        }
        // Garante saída redirecionando para a tela de login
        try {
          if (typeof window !== 'undefined') {
            window.location.replace('/login');
          }
        } catch {}
      },

      updateBalance: (newBalance: number) => {
        set((state) => ({
          user: state.user ? { ...state.user, balance: newBalance } : null,
        }));
      },

      refreshBalance: async () => {
        const { user } = get();
        if (!user?.id) return;

        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('balance, commission_balance, withdrawal_limit')
            .eq('id', user.id)
            .single();

          if (error) throw error;
          if (userData) {
            set((state) => ({
              user: state.user ? { 
                ...state.user, 
                balance: userData.balance,
                commission_balance: userData.commission_balance || 0,
                withdrawal_limit: userData.withdrawal_limit
              } : null,
            }));
          }
        } catch (error) {
          console.error('Erro ao atualizar saldo:', error);
        }
      },
      
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        // Verifica se o estado foi hidratado corretamente antes de chamar checkUser
        if (state) {
          // Usa setTimeout para garantir que a hidratação esteja completa
          setTimeout(() => {
            state.checkUser().catch(error => {
              console.error('Erro ao verificar usuário após hidratação:', error);
            });
          }, 0);
        }
      },
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
