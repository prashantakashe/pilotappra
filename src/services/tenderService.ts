// src/services/tenderService.ts
import { collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, where, Timestamp, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from './firebase';
import type { Tender } from '../types/tender';

export type TenderStatus = 'draft' | 'active' | 'to_submit' | 'submitted' | 'won' | 'lost' | 'archived';
export type SortField = 'createdAt' | 'submissionDeadline' | 'estimatedValue' | 'lastUpdated';
export type SortOrder = 'asc' | 'desc';

interface SubscribeTendersOptions {
  status?: TenderStatus;
  sortField?: SortField;
  sortOrder?: SortOrder;
}

export const tenderService = {
  async listMyTenders(): Promise<Tender[]> {
    const user = auth.currentUser;
    if (!user) return [];
    // We can't query map membership directly; fetch all and filter client-side.
    // For production, add an index like members array. For now, fetch recent 50.
    const q = query(collection(db, 'tenders'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const result: Tender[] = [];
    snap.forEach((d) => {
      const data = d.data() as any;
      if (data.membersMap && data.membersMap[user.uid]) {
        result.push({ tenderId: d.id, ...data } as Tender);
      }
    });
    return result;
  },

  /**
   * Real-time listener for all tenders the user has access to
   * Supports filtering by status and sorting
   * Returns unsubscribe function
   */
  subscribeTenders(
    callback: (tenders: Tender[]) => void,
    options: SubscribeTendersOptions = {}
  ): () => void {
    const user = auth.currentUser;
    if (!user) {
      console.error('[TenderService] No authenticated user');
      callback([]);
      return () => {};
    }

    const { status, sortField = 'createdAt', sortOrder = 'desc' } = options;

    // Build query
    let q = query(collection(db, 'tenders'));

    // Add status filter if provided
    if (status) {
      q = query(q, where('status', '==', status));
    }

    // Add sorting
    q = query(q, orderBy(sortField, sortOrder));

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log(`[TenderService] Snapshot received with ${snapshot.size} documents`);
        const tenders: Tender[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data() as any;
          console.log(`[TenderService] Document ${doc.id}:`, {
            title: data.title,
            status: data.status,
            membersMap: data.membersMap,
            hasMembership: data.membersMap && data.membersMap[user.uid]
          });
          
          // Filter by user membership (client-side)
          if (data.membersMap && data.membersMap[user.uid]) {
            tenders.push({
              tenderId: doc.id,
              ...data,
              // Convert Firestore Timestamps to Date objects for consistency
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
              lastUpdated: data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate() : data.lastUpdated,
              submissionDeadline: data.submissionDeadline instanceof Timestamp ? data.submissionDeadline.toDate() : data.submissionDeadline,
            } as Tender);
          }
        });

        console.log(`[TenderService] Real-time update: ${tenders.length} tenders (filtered from ${snapshot.size})`);
        console.log(`[TenderService] Current user UID: ${user.uid}`);
        callback(tenders);
      },
      (error) => {
        console.error('[TenderService] Error in subscribeTenders:', error);
        callback([]);
      }
    );

    return unsubscribe;
  },

  /**
   * Filter tenders by search query
   * Searches in: title, tenderNo, client, shortName
   */
  filterTendersBySearch(tenders: Tender[], searchQuery: string): Tender[] {
    if (!searchQuery || !searchQuery.trim()) {
      return tenders;
    }

    const query = searchQuery.toLowerCase().trim();

    return tenders.filter((tender) => {
      return (
        tender.title?.toLowerCase().includes(query) ||
        tender.tenderNo?.toLowerCase().includes(query) ||
        tender.client?.toLowerCase().includes(query) ||
        tender.shortName?.toLowerCase().includes(query) ||
        tender.tenderId?.toLowerCase().includes(query)
      );
    });
  },

  /**
   * Sort tenders by field (client-side)
   */
  sortTenders(tenders: Tender[], field: SortField, order: SortOrder = 'desc'): Tender[] {
    return [...tenders].sort((a, b) => {
      let aVal: any = a[field];
      let bVal: any = b[field];

      // Handle dates
      if (aVal instanceof Date) aVal = aVal.getTime();
      if (bVal instanceof Date) bVal = bVal.getTime();

      // Handle nulls
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Compare
      if (order === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  },

  subscribeTender(tenderId: string, cb: (t: Tender | null) => void) {
    const ref = doc(db, 'tenders', tenderId);
    return onSnapshot(ref, (snap) => {
      if (!snap.exists()) return cb(null);
      cb({ tenderId: snap.id, ...snap.data() } as Tender);
    });
  },

  async createTender(title: string, shortName?: string) {
    const fn = httpsCallable(functions, 'tenderCreate');
    const res = await fn({ title, shortName });
    return (res.data as any).id as string;
  },

  async generateTenderNumber() {
    const fn = httpsCallable(functions, 'generateTenderNumber');
    const res = await fn({});
    return (res.data as any).tenderNo as string;
  },

  async finalizeTenderCreate(data: any) {
    const fn = httpsCallable(functions, 'finalizeTenderCreate');
    const res = await fn(data);
    return (res.data as any).tenderId as string;
  },

  async updateTender(tenderId: string, updates: Partial<Tender>) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    const ref = doc(db, 'tenders', tenderId);
    const payload: any = {
      ...updates,
      lastModifiedBy: user.uid,
      lastUpdated: serverTimestamp(),
    };
    await updateDoc(ref, payload);
    return true;
  },

  async deleteTender(tenderId: string) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    const ref = doc(db, 'tenders', tenderId);
    await deleteDoc(ref);
    return true;
  },

  async logAudit(tenderId: string, action: string, metadata?: any) {
    const fn = httpsCallable(functions, 'logTenderAudit');
    await fn({ tenderId, action, metadata });
  },
};
