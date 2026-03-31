import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import React from 'react';
import MatchToast from '../components/common/MatchToast';

export interface Notification {
  id: number;
  type: string;
  message: string;
  match_id?: number;
  lost_item_id?: number;
  found_item_id?: number;
  score?: number;
  score_pct?: string;
  lost_item_title?: string;
  found_item_thumbnail?: string;
  timestamp: string;
  read: boolean;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  const connect = useCallback(() => {
    if (!user) return;

    // In a real app, you'd get the actual JWT token. Using uid for mock.
    const token = user.uid; 
    const wsUrl = `ws://localhost:8000/api/v1/notifications/ws/${user.uid}?token=${token}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      reconnectAttempts.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const newNotification: Notification = {
          ...data,
          id: Date.now(), // Mock ID
          read: false,
        };
        
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        
        if (data.type === 'MATCH_FOUND') {
          // Show custom toast
          toast.custom((t) => React.createElement(MatchToast, { notification: newNotification, t }));
        } else {
          toast(data.message);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current += 1;
          connect();
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;
  }, [user]);

  useEffect(() => {
    connect();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  // Mock fetching initial notifications
  useEffect(() => {
    if (user) {
      // Fetch from REST API
      // fetch('/api/v1/notifications')...
    }
  }, [user]);

  const markAsRead = useCallback((id: number) => {
    setNotifications((prev) => 
      prev.map((n) => {
        if (n.id === id && !n.read) {
          setUnreadCount((c) => Math.max(0, c - 1));
          return { ...n, read: true };
        }
        return n;
      })
    );
    // Call REST API to mark as read
    // fetch(`/api/v1/notifications/${id}/read`, { method: 'PATCH' })
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    // Call REST API to mark all as read
    // fetch(`/api/v1/notifications/read-all`, { method: 'PATCH' })
  }, []);

  return { notifications, unreadCount, markAsRead, markAllRead };
}
