/**
 * Sistema de notificação de pagamentos
 * Simula notificações em tempo real usando localStorage
 */

export interface PaymentNotification {
  paymentId: string;
  status: 'aprovado' | 'cancelado' | 'expirado';
  amount: number;
  timestamp: number;
}

class PaymentNotificationService {
  private listeners: Map<string, (notification: PaymentNotification) => void> = new Map();
  private storageKey = 'cryptoyield_payment_notifications';

  constructor() {
    // Escutar mudanças no localStorage (para simular notificações entre abas)
    window.addEventListener('storage', this.handleStorageChange.bind(this));
    
    // Verificar notificações pendentes ao inicializar
    this.checkPendingNotifications();
  }

  /**
   * Registrar listener para um pagamento específico
   */
  onPaymentUpdate(paymentId: string, callback: (notification: PaymentNotification) => void) {
    this.listeners.set(paymentId, callback);
  }

  /**
   * Remover listener de um pagamento
   */
  removeListener(paymentId: string) {
    this.listeners.delete(paymentId);
  }

  /**
   * Simular recebimento de notificação (seria chamado pelo webhook)
   */
  notifyPaymentUpdate(notification: PaymentNotification) {
    
    // Salvar no localStorage
    const notifications = this.getStoredNotifications();
    notifications.push(notification);
    localStorage.setItem(this.storageKey, JSON.stringify(notifications));
    
    // Notificar listener se existir
    const listener = this.listeners.get(notification.paymentId);
    if (listener) {
      listener(notification);
    }
  }

  /**
   * Verificar notificações pendentes
   */
  private checkPendingNotifications() {
    const notifications = this.getStoredNotifications();
    const now = Date.now();
    
    // Processar notificações dos últimos 5 minutos
    const recentNotifications = notifications.filter(
      n => now - n.timestamp < 5 * 60 * 1000
    );

    recentNotifications.forEach(notification => {
      const listener = this.listeners.get(notification.paymentId);
      if (listener) {
        listener(notification);
      }
    });

    // Limpar notificações antigas
    const validNotifications = notifications.filter(
      n => now - n.timestamp < 30 * 60 * 1000 // Manter por 30 minutos
    );
    
    if (validNotifications.length !== notifications.length) {
      localStorage.setItem(this.storageKey, JSON.stringify(validNotifications));
    }
  }

  /**
   * Lidar com mudanças no localStorage (notificações de outras abas)
   */
  private handleStorageChange(event: StorageEvent) {
    if (event.key === this.storageKey && event.newValue) {
      try {
        const notifications: PaymentNotification[] = JSON.parse(event.newValue);
        const latestNotification = notifications[notifications.length - 1];
        
        if (latestNotification) {
          const listener = this.listeners.get(latestNotification.paymentId);
          if (listener) {
            listener(latestNotification);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao processar notificação do localStorage:', error);
      }
    }
  }

  /**
   * Obter notificações armazenadas
   */
  private getStoredNotifications(): PaymentNotification[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Erro ao ler notificações do localStorage:', error);
      return [];
    }
  }

  /**
   * Limpar todas as notificações
   */
  clearNotifications() {
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Simular webhook (para testes)
   */
  simulateWebhook(paymentId: string, status: 'aprovado' | 'cancelado' | 'expirado', amount: number) {
    
    setTimeout(() => {
      this.notifyPaymentUpdate({
        paymentId,
        status,
        amount,
        timestamp: Date.now()
      });
    }, 2000); // Simular delay de 2 segundos
  }
}

// Instância singleton
export const paymentNotificationService = new PaymentNotificationService();

// Função helper para usar no componente
export const usePaymentNotification = (
  paymentId: string, 
  onUpdate: (notification: PaymentNotification) => void
) => {
  const subscribe = () => {
    paymentNotificationService.onPaymentUpdate(paymentId, onUpdate);
  };

  const unsubscribe = () => {
    paymentNotificationService.removeListener(paymentId);
  };

  return { subscribe, unsubscribe };
};
