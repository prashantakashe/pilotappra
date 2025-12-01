// src/services/rateAnalysisService.ts
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebase';
import type { RateAnalysisDoc, RateBreakdown } from '../types/tender';

export const rateAnalysisService = {
  // Live list within a tender
  subscribeList(tenderId: string, cb: (list: RateAnalysisDoc[]) => void) {
    const q = query(collection(db, 'tenders', tenderId, 'rateAnalysis'), orderBy('lastEditedAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const rows: RateAnalysisDoc[] = [];
      snap.forEach((d) => rows.push({ id: d.id, tenderId, ...(d.data() as any) }));
      cb(rows);
    });
  },

  // Live single doc
  subscribeDoc(tenderId: string, raId: string, cb: (doc: RateAnalysisDoc | null) => void) {
    const ref = doc(db, 'tenders', tenderId, 'rateAnalysis', raId);
    return onSnapshot(ref, (snap) => {
      if (!snap.exists()) return cb(null);
      cb({ id: snap.id, tenderId, ...(snap.data() as any) } as RateAnalysisDoc);
    });
  },

  async create(tenderId: string, payload: Partial<RateAnalysisDoc>) {
    const fn = httpsCallable(functions, 'raCreate');
    const res = await fn({ tenderId, rateAnalysis: payload });
    return (res.data as any).id as string;
  },

  async update(tenderId: string, raId: string, changes: Partial<RateAnalysisDoc>) {
    const fn = httpsCallable(functions, 'raUpdate');
    await fn({ tenderId, raId, changes });
  },

  async remove(tenderId: string, raId: string) {
    const fn = httpsCallable(functions, 'raDelete');
    await fn({ tenderId, raId });
  },

  async lock(tenderId: string, raId: string) {
    const fn = httpsCallable(functions, 'raLock');
    await fn({ tenderId, raId });
  },

  async unlock(tenderId: string, raId: string) {
    const fn = httpsCallable(functions, 'raUnlock');
    await fn({ tenderId, raId });
  },
};
