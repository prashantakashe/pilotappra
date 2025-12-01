// src/services/authService.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export const authService = {
  // Sign Up with email and password
  async signUp(email: string, password: string, fullName: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: fullName,
        email: email,
        createdAt: serverTimestamp(),
        role: 'user',
        lastLogin: serverTimestamp(),
      });

      // Send email verification
      await sendEmailVerification(user);

      return { success: true, user, message: 'Account created. Please verify your email.' };
    } catch (error) {
      throw error;
    }
  },

  // Sign In with email and password
  async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      throw error;
    }
  },

  // Send password reset email
  async sendPasswordReset(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'If an account exists, we\'ve sent password reset instructions.' };
    } catch (error) {
      throw error;
    }
  },

  // Sign out
  async signOut() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  // Get current user
  getCurrentUser() {
    return auth.currentUser;
  },
};
