import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth-context';

export interface Notification {
  id: string;
  user_id?: string;
  target_role?: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean; // mapped from is_read
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'read' | 'user_id'> & { user_id?: string, target_role?: string }) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    
    // We want notifications where user_id = me OR (target_role is not null AND target_role = my_role)
    // Supabase OR syntax: .or(`user_id.eq.${user.id},target_role.eq.${user.role}`)
    // Note: ensure user.role is defined.
    
    try {
        let query = supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50); // limit to last 50 for now

        if (user.role) {
            query = query.or(`user_id.eq.${user.id},target_role.eq.${user.role}`);
        } else {
            query = query.eq('user_id', user.id);
        }

        const { data, error } = await query;
        
        if (error) throw error;

        if (data) {
            setNotifications(data.map((n: any) => ({
                id: n.id,
                title: n.title,
                message: n.message,
                created_at: n.created_at,
                read: n.is_read,
                type: n.type,
                user_id: n.user_id,
                target_role: n.target_role
            })));
        }
    } catch (error) {
        console.error("Error fetching notifications:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
        setNotifications([]);
        return;
    }

    fetchNotifications();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload: any) => {
          const newNotif = payload.new as any;
          
          // Check if this notification is relevant to us
          const isForMe = newNotif.user_id === user.id;
          const isForMyRole = user.role && newNotif.target_role === user.role;

          if (isForMe || isForMyRole) {
            setNotifications((prev) => [
              {
                id: newNotif.id,
                title: newNotif.title,
                message: newNotif.message,
                created_at: newNotif.created_at,
                read: newNotif.is_read,
                type: newNotif.type,
                user_id: newNotif.user_id,
                target_role: newNotif.target_role
              },
              ...prev,
            ]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
        },
        (_payload: any) => {
            fetchNotifications(); // Reload to keep it simple or update optimistically
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'read' | 'user_id'> & { user_id?: string, target_role?: string }) => {
    try {
        // If no user_id or target_role specified, assume it's for the current user (e.g. self-notification)
        // BUT usually we use this to notify OTHERS.
        
        const { error } = await supabase.from('notifications').insert({
            title: notification.title,
            message: notification.message,
            type: notification.type || 'info',
            user_id: notification.user_id, // can be null if target_role is set
            target_role: notification.target_role,
            is_read: false
        });

        if (error) throw error;
    } catch (err) {
        console.error("Error adding notification:", err);
    }
  };

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    
    try {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    } catch (err) {
        console.error("Error marking as read", err);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    
    // We should only mark visible ones as read, or all valid ones.
    // Simplifying to mark visible list.
    const ids = notifications.map(n => n.id);
    if (ids.length === 0) return;

    try {
        await supabase.from('notifications').update({ is_read: true }).in('id', ids);
    } catch (err) {
        console.error("Error marking all as read", err);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, loading }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
