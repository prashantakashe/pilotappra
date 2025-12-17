// src/services/tenderDraftService.ts
import { collection, doc, setDoc, getDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { TenderDraft, TenderFormData } from '../types/tender';

export const tenderDraftService = {
  async saveDraft(draftId: string, formData: Partial<TenderFormData>, documents: any[] = []): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    console.log('[DraftService] Saving draft:', { draftId, userId: user.uid, email: user.email });
    
    const draftRef = doc(db, 'drafts', user.uid, 'tenderDrafts', draftId);
    console.log('[DraftService] Draft path:', `drafts/${user.uid}/tenderDrafts/${draftId}`);
    
    // Remove undefined values and convert dates to ISO strings
    const cleanedFormData = Object.entries(formData).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        // Convert Date objects to ISO strings for Firestore
        if (value instanceof Date) {
          acc[key] = value.toISOString();
        } else if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as any).toDate === 'function') {
          // Firestore Timestamp
          acc[key] = (value as any).toDate().toISOString();
        } else {
          acc[key] = value;
        }
      }
      return acc;
    }, {} as any);
    
    console.log('[DraftService] Cleaned form data keys:', Object.keys(cleanedFormData));
    console.log('[DraftService] Sample values:', {
      title: cleanedFormData.title,
      publishDate: cleanedFormData.publishDate,
      workType: cleanedFormData.workType
    });
    
    const draftData = {
      draftId,
      userId: user.uid,
      formData: cleanedFormData,
      documents: documents || [],
      lastSavedAt: Timestamp.now(),
    };
    
    console.log('[DraftService] Attempting setDoc with merge...');
    try {
      await setDoc(draftRef, draftData, { merge: true });
      console.log('[DraftService] ✅ setDoc completed successfully');
    } catch (err: any) {
      console.error('[DraftService] ❌ setDoc failed:', err);
      console.error('[DraftService] Error code:', err.code);
      console.error('[DraftService] Error details:', err.message);
      throw err;
    }
  },

  async loadDraft(draftId: string): Promise<TenderDraft | null> {
    const user = auth.currentUser;
    if (!user) return null;

    const draftRef = doc(db, 'drafts', user.uid, 'tenderDrafts', draftId);
    const snap = await getDoc(draftRef);
    
    if (!snap.exists()) return null;
    return snap.data() as TenderDraft;
  },

  async deleteDraft(draftId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const draftRef = doc(db, 'drafts', user.uid, 'tenderDrafts', draftId);
    await deleteDoc(draftRef);
  },

  generateDraftId(): string {
    return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
};
