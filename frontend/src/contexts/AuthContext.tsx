import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ref, get, set, serverTimestamp } from 'firebase/database';

interface UserProfile {
  uid: string;
  email: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  createdAt: any;
  notifications?: {
    emailOnApproval: boolean;
    emailOnMatch: boolean;
    inAppNotifications: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const userRef = ref(db, `users/${firebaseUser.uid}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val() as UserProfile;
          // Auto-upgrade admin users if they aren't already
          const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
          if (adminEmails.includes(firebaseUser.email || '') && data.role !== 'admin') {
            data.role = 'admin';
            try {
              await set(ref(db, `users/${firebaseUser.uid}/role`), 'admin');
            } catch (e) {
              console.error("Failed to upgrade user to admin", e);
            }
          }
          setProfile(data);
        } else {
          // Create new user profile
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'Anonymous User',
            role: (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean).includes((firebaseUser.email || '').toLowerCase()) ? 'admin' : 'user',
            createdAt: serverTimestamp()
          };
          
          try {
            await set(userRef, newProfile);
            setProfile(newProfile);
          } catch (error) {
            console.error("Error creating user profile:", error);
          }
        }
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
