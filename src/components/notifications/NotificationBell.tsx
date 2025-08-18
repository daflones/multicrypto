import React, { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Trash } from 'lucide-react';
import { NotificationService, Notification } from '../../services/notification.service';
import { useAuthStore } from '../../store/authStore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const NotificationBell: React.FC = () => {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Buscar notificações
  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const [notificationsData, unreadCountData] = await Promise.all([
        NotificationService.getUserNotifications(user.id),
        NotificationService.getUnreadCount(user.id)
      ]);
      
      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      // Se apagar uma não lida, ajusta o contador
      const deleted = notifications.find(n => n.id === notificationId);
      if (deleted && !deleted.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Verificar produtos expirados
  const checkExpiredProducts = async () => {
    if (!user?.id) return;
    try {
      await NotificationService.checkExpiredProducts(user.id);
      fetchNotifications(); // Atualizar após verificar
    } catch (error) {
      console.error('Error checking expired products:', error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      checkExpiredProducts();
      
      // Atualizar a cada 30 segundos
      const interval = setInterval(() => {
        fetchNotifications();
        checkExpiredProducts();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    
    try {
      await NotificationService.markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={toggleNotifications}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-surface-light rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-surface-light">
              <h3 className="text-white font-semibold">Notificações</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-primary hover:text-primary/80 flex items-center space-x-1"
                  >
                    <CheckCheck size={14} />
                    <span>Marcar todas</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-400">
                  Carregando...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  Nenhuma notificação
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-surface-light hover:bg-surface-light/50 transition-colors ${
                      !notification.is_read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className={`text-lg ${NotificationService.getNotificationColor(notification.type)}`}>
                        {NotificationService.getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className={`text-sm font-medium ${
                            !notification.is_read ? 'text-white' : 'text-gray-300'
                          }`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-2 ml-2">
                            {!notification.is_read && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="text-primary hover:text-primary/80"
                                title="Marcar como lida"
                              >
                                <Check size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(notification.id)}
                              className="text-red-400 hover:text-red-300"
                              title="Apagar"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <p className={`text-xs mt-1 ${
                          !notification.is_read ? 'text-gray-300' : 'text-gray-400'
                        }`}>
                          {notification.message}
                        </p>
                        
                        <p className="text-xs text-gray-500 mt-2">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-surface-light text-center">
                <button className="text-xs text-primary hover:text-primary/80">
                  Ver todas as notificações
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
