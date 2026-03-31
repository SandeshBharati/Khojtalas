import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  onSnapshot,
  orderBy,
  limit,
  getCountFromServer,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

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
      const itemsRef = collection(db, 'items');
      const usersRef = collection(db, 'users');
      const matchesRef = collection(db, 'matches');

      const pendingCount = await getCountFromServer(query(itemsRef, where('status', '==', 'pending')));
      const totalCount = await getCountFromServer(itemsRef);
      const usersCount = await getCountFromServer(usersRef);
      const matchesCount = await getCountFromServer(matchesRef);

      // For today's stats, we'd normally query by date, but for simplicity we'll just get counts
      // In a real app, you'd use where('reviewed_at', '>=', startOfDay)
      const approvedCount = await getCountFromServer(query(itemsRef, where('status', '==', 'approved')));
      const rejectedCount = await getCountFromServer(query(itemsRef, where('status', '==', 'rejected')));
      const resolvedCount = await getCountFromServer(query(itemsRef, where('status', '==', 'resolved')));

      setStats({
        pending: pendingCount.data().count,
        approved_today: approvedCount.data().count, // Simplified
        rejected_today: rejectedCount.data().count, // Simplified
        total_items: totalCount.data().count,
        total_users: usersCount.data().count,
        total_matches: matchesCount.data().count,
        resolved_items: resolvedCount.data().count
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
    const pendingQuery = query(
      collection(db, 'items'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingItems(items);
      fetchStats(); // Update stats when pending items change
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
      const q = query(
        collection(db, 'items'),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      setApprovedItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRejectedItems = async () => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'items'),
        where('status', '==', 'rejected'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      setRejectedItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
      const itemRef = doc(db, 'items', id);
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      
      await updateDoc(itemRef, {
        status: newStatus,
        reviewed_by: profile?.uid,
        reviewed_at: serverTimestamp(),
        ...(note && { admin_note: note })
      });

      toast.success(`Item ${newStatus} successfully`);
      fetchStats();
      
      // In a real app, you'd trigger an email here via Cloud Functions
      // Since we don't have a backend, we just simulate it
      console.log(`Simulating email to user: Item ${newStatus}`);
      
    } catch (err: any) {
      console.error('Error reviewing item:', err);
      toast.error('Failed to review item');
      // Revert optimistic update by refetching
      fetchStats();
    }
  };

  const revokeItem = async (id: string) => {
    try {
      const itemRef = doc(db, 'items', id);
      await updateDoc(itemRef, {
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
      const userRef = doc(db, 'users', id);
      await updateDoc(userRef, {
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
