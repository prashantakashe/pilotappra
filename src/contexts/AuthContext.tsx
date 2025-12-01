// src/contexts/AuthContext.tsx
import React, { createContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { onAuthStateChanged, signOut as fbSignOut, User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { userService } from '../services/userService';

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Update last login
        try {
          await userService.updateLastLogin(u.uid);
        } catch (error) {
          console.error('Error updating last login:', error);
        }
      }
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser(auth.currentUser);
    }
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
