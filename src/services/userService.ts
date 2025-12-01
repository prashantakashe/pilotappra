// src/services/userService.ts
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: any;
  lastLogin: any;
}

export const userService = {
  // Get user profile
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as User;
      }
      return null;
    } catch (error) {
      throw error;
    }
  },

  // Update user profile
  async updateUserProfile(userId: string, data: Partial<User>) {
    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, {
        ...data,
        lastLogin: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  // Update last login
  async updateLastLogin(userId: string) {
    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, {
        lastLogin: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      throw error;
    }
  },
};
