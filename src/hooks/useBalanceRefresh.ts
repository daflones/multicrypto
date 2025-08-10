import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

// Hook para atualizar saldo automaticamente
export const useBalanceRefresh = () => {
  const { refreshBalance, user } = useAuthStore();

  useEffect(() => {
    if (!user?.id) return;

    // Atualizar saldo ao montar o componente
    refreshBalance();

    // Atualizar saldo a cada 30 segundos
    const interval = setInterval(() => {
      refreshBalance();
    }, 30000);

    // Atualizar saldo quando a janela ganha foco
    const handleFocus = () => {
      refreshBalance();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?.id, refreshBalance]);

  return { refreshBalance };
};
