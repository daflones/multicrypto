import { supabase } from './supabase';

export interface Notification {
  id: string;
  user_id: string;
  type: 'referral_new' | 'referral_indirect' | 'referral_level3' | 'deposit_approved' | 'deposit_rejected' | 'withdraw_approved' | 'withdraw_rejected' | 'product_expired' | 'commission_level1' | 'commission_level2' | 'commission_level3' | 'investment_approved' | 'investment_rejected';
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: string;
}

export class NotificationService {
  static async getUserNotifications(userId: string, limit: number = 20) {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error('Erro ao buscar notificações');
      }

      return notifications || [];
    } catch (error) {
      console.error('Get notifications error:', error);
      throw error;
    }
  }

  static async getUnreadCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        throw new Error('Erro ao contar notificações não lidas');
      }

      return count || 0;
    } catch (error) {
      console.error('Get unread count error:', error);
      return 0;
    }
  }

  static async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        throw new Error('Erro ao marcar notificação como lida');
      }

      return true;
    } catch (error) {
      console.error('Mark as read error:', error);
      throw error;
    }
  }

  static async markAllAsRead(userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        throw new Error('Erro ao marcar todas as notificações como lidas');
      }

      return true;
    } catch (error) {
      console.error('Mark all as read error:', error);
      throw error;
    }
  }

  static async createNotification(
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    data?: any
  ) {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          data,
          is_read: false
        })
        .select()
        .single();

      if (error) {
        throw new Error('Erro ao criar notificação');
      }

      return notification;
    } catch (error) {
      console.error('Create notification error:', error);
      throw error;
    }
  }

  // Função para verificar produtos expirados  // Verificar produtos expirados (temporariamente desabilitado - sem end_date na tabela)
  static async checkExpiredProducts(_userId: string): Promise<Notification[]> {
    try {
      // TODO: Implementar quando a coluna end_date for adicionada à tabela user_investments
      // Por enquanto, retorna array vazio para evitar erros
      return [];
    } catch (error) {
      console.error('Error checking expired products:', error);
      return [];
    }
  }

  // Função para obter ícone da notificação
  static getNotificationIcon(type: Notification['type']): string {
    const icons = {
      'referral_new': '🎉',
      'referral_indirect': '💰',
      'referral_level3': '🚀',
      'deposit_approved': '✅',
      'deposit_rejected': '❌',
      'withdraw_approved': '💸',
      'withdraw_rejected': '❌',
      'product_expired': '⏰',
      'commission_level1': '🏆',
      'commission_level2': '🏅',
      'commission_level3': '🎖️',
      'investment_approved': '✅',
      'investment_rejected': '❌'
    } as const;
    return icons[type] || '📢';
  }

  // Função para obter cor da notificação
  static getNotificationColor(type: Notification['type']): string {
    const colors = {
      'referral_new': 'text-green-400',
      'referral_indirect': 'text-yellow-400',
      'referral_level3': 'text-amber-400',
      'deposit_approved': 'text-green-400',
      'deposit_rejected': 'text-red-400',
      'withdraw_approved': 'text-green-400',
      'withdraw_rejected': 'text-red-400',
      'product_expired': 'text-orange-400',
      'commission_level1': 'text-emerald-400',
      'commission_level2': 'text-amber-400',
      'commission_level3': 'text-violet-400',
      'investment_approved': 'text-green-400',
      'investment_rejected': 'text-red-400'
    } as const;
    return colors[type] || 'text-gray-400';
  }
}
