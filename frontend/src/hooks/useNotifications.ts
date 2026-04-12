import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, update, query as rtdbQuery, orderByChild, equalTo } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  type: string;
  message: string;
  matchId?: string;
  read: boolean;
  createdAt: any;
  /** ISO string derived from createdAt for display */
  timestamp: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      prevIdsRef.current = new Set();
      isFirstLoad.current = true;
      return;
    }

    const q = rtdbQuery(
      ref(db, 'notifications'),
      orderByChild('userId'),
      equalTo(user.uid)
    );

    const unsubscribe = onValue(q, (snapshot) => {
      const items: Notification[] = [];
      snapshot.forEach((child) => {
        const data = child.val();
        const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        items.push({
          id: child.key!,
          type: data.type || 'system',
          message: data.message || '',
          matchId: data.matchId,
          read: !!data.read,
          createdAt: data.createdAt,
          timestamp: createdAt.toISOString(),
        });
      });
      // Sort by createdAt descending
      items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      
      // Show toast for new notifications (skip on first load)
      if (!isFirstLoad.current) {
        const prevIds = prevIdsRef.current;
        items.forEach((n) => {
          if (!prevIds.has(n.id) && !n.read) {
            if (n.type === 'match_found' && n.matchId) {
              toast('Match Found!', {
                description: n.message,
                action: { label: 'View', onClick: () => window.location.assign(`/matches/${n.matchId}`) },
                duration: 8000,
              });
            } else if (n.type === 'item_approved') {
              toast.success('Item Approved', { description: n.message, duration: 5000 });
            } else if (n.type === 'item_rejected') {
              toast.error('Item Rejected', { description: n.message, duration: 5000 });
            }
          }
        });
      }
      isFirstLoad.current = false;
      prevIdsRef.current = new Set(items.map((n) => n.id));

      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.read).length);
    }, (err) => {
      console.error('useNotifications listener error', err);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await update(ref(db, `notifications/${id}`), { read: true });
    } catch (err) {
      console.error('Failed to mark notification read', err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    try {
      const updates: Record<string, any> = {};
      unread.forEach((n) => {
        updates[`notifications/${n.id}/read`] = true;
      });
      await update(ref(db), updates);
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  }, [notifications]);

  return { notifications, unreadCount, markAsRead, markAllRead };
}
