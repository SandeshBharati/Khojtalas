import { useState, useEffect, useCallback } from 'react';
import { 
  ref,
  get,
  update,
  push,
  onValue,
  query as rtdbQuery,
  orderByChild,
  equalTo,
  serverTimestamp
} from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { matchFoundItem, matchLostItem } from '../services/matchingService';

export function useAdmin() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    pending: 0,
    approved_today: 0,
    rejected_today: 0,
    total_items: 0,
    total_users: 0,
    total_matches: 0,
    resolved_items: 0
  });
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [approvedItems, setApprovedItems] = useState<any[]>([]);
  const [rejectedItems, setRejectedItems] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (profile?.role !== 'admin') return;
    try {
      const itemsSnap = await get(ref(db, 'items'));
      const usersSnap = await get(ref(db, 'users'));
      const matchesSnap = await get(ref(db, 'matches'));

      let pending = 0, approved = 0, rejected = 0, resolved = 0, total = 0;
      itemsSnap.forEach((child) => {
        total++;
        const status = child.val().status;
        if (status === 'pending') pending++;
        else if (status === 'approved') approved++;
        else if (status === 'rejected') rejected++;
        else if (status === 'resolved') resolved++;
      });

      let totalUsers = 0;
      usersSnap.forEach(() => { totalUsers++; });

      let totalMatches = 0;
      matchesSnap.forEach(() => { totalMatches++; });

      setStats({
        pending,
        approved_today: approved,
        rejected_today: rejected,
        total_items: total,
        total_users: totalUsers,
        total_matches: totalMatches,
        resolved_items: resolved
      });
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.role !== 'admin') {
      setIsLoading(false);
      return;
    }

    fetchStats();

    // Set up real-time listener for pending items
    const pendingQuery = rtdbQuery(
      ref(db, 'items'),
      orderByChild('status'),
      equalTo('pending')
    );

    const unsubscribePending = onValue(pendingQuery, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach((child) => {
        items.push({ id: child.key!, ...child.val() });
      });
      // Sort by createdAt descending
      items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setPendingItems(items.slice(0, 50));
      fetchStats();
      setIsLoading(false);
    }, (err) => {
      console.error('Error fetching pending items:', err);
      setError(err.message);
      setIsLoading(false);
    });

    return () => unsubscribePending();
  }, [profile, fetchStats]);

  const fetchApprovedItems = async () => {
    setIsLoading(true);
    try {
      const q = rtdbQuery(
        ref(db, 'items'),
        orderByChild('status'),
        equalTo('approved')
      );
      const snapshot = await get(q);
      const items: any[] = [];
      snapshot.forEach((child) => {
        items.push({ id: child.key!, ...child.val() });
      });
      items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setApprovedItems(items.slice(0, 50));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRejectedItems = async () => {
    setIsLoading(true);
    try {
      const q = rtdbQuery(
        ref(db, 'items'),
        orderByChild('status'),
        equalTo('rejected')
      );
      const snapshot = await get(q);
      const items: any[] = [];
      snapshot.forEach((child) => {
        items.push({ id: child.key!, ...child.val() });
      });
      items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setRejectedItems(items.slice(0, 50));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const snapshot = await get(ref(db, 'users'));
      const usersArr: any[] = [];
      snapshot.forEach((child) => {
        usersArr.push({ id: child.key!, ...child.val() });
      });
      setUsers(usersArr);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const reviewItem = async (id: string, action: 'approve' | 'reject', note?: string) => {
    if (action === 'reject' && !note) {
      throw new Error('Admin note is required for rejection');
    }

    // Optimistic update
    setPendingItems(prev => prev.filter(item => item.id !== id));
    
    try {
      const itemRef = ref(db, `items/${id}`);
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      
      await update(itemRef, {
        status: newStatus,
        reviewed_by: profile?.uid,
        reviewed_at: serverTimestamp(),
        ...(note && { admin_note: note })
      });

      // Notify the item owner about approval/rejection
      const snap = await get(itemRef);
      if (snap.exists()) {
        const itemData = snap.val();
        if (itemData.userId) {
          const notifType = action === 'approve' ? 'item_approved' : 'item_rejected';
          const notifMessage = action === 'approve'
            ? `Your ${itemData.type || 'item'} report "${itemData.category || 'item'}" has been approved and is now visible to others.`
            : `Your ${itemData.type || 'item'} report "${itemData.category || 'item'}" was rejected.${note ? ' Reason: ' + note : ''}`;
          await push(ref(db, 'notifications'), {
            userId: itemData.userId,
            type: notifType,
            message: notifMessage,
            read: false,
            createdAt: Date.now()
          });
        }
      }

      toast.success(`Item ${newStatus} successfully`);
      fetchStats();

      // After approval, run the AI matching engine in the background
      if (action === 'approve') {
        const snapForMatch = await get(itemRef);
        if (snapForMatch.exists()) {
          const itemData = { id: snapForMatch.key!, ...snapForMatch.val() } as any;
          if (itemData.type === 'lost') {
            matchLostItem(snapForMatch.key!, itemData).catch(console.error);
          } else {
            matchFoundItem(snapForMatch.key!, itemData).catch(console.error);
          }
        }
      }
      
    } catch (err: any) {
      console.error('Error reviewing item:', err);
      toast.error('Failed to review item');
      // Revert optimistic update by refetching
      fetchStats();
    }
  };

  const revokeItem = async (id: string) => {
    try {
      const itemRef = ref(db, `items/${id}`);
      await update(itemRef, {
        status: 'pending',
        reviewed_by: null,
        reviewed_at: null,
        admin_note: null
      });
      toast.success('Item approval revoked');
      fetchApprovedItems();
      fetchStats();
    } catch (err: any) {
      console.error('Error revoking item:', err);
      toast.error('Failed to revoke item');
    }
  };

  const deactivateUser = async (id: string) => {
    try {
      const userRef = ref(db, `users/${id}`);
      await update(userRef, {
        is_active: false
      });
      toast.success('User deactivated');
      fetchUsers();
    } catch (err: any) {
      console.error('Error deactivating user:', err);
      toast.error('Failed to deactivate user');
    }
  };

  return {
    stats,
    pendingItems,
    approvedItems,
    rejectedItems,
    users,
    fetchApprovedItems,
    fetchRejectedItems,
    fetchUsers,
    reviewItem,
    revokeItem,
    deactivateUser,
    isLoading,
    error
  };
}
