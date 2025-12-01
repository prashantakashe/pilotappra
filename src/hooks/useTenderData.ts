import { useEffect, useState, useCallback } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import type { StandardBOQRow } from '../services/boqParser';
import type { RateRevision } from '../components/RateBuilder';

interface UseTenderDataOptions {
  tenderId: string;
}

interface UseTenderDataReturn {
  tender: any | null;
  parsedBoq: StandardBOQRow[] | null;
  loading: boolean;
  error: string | null;
  updateParsedBoqRevision: (itemIndex: number, revisionKey: string, revisionObj: RateRevision) => Promise<void>;
}

/**
 * Hook to fetch tender data and provide update capability for parsed BOQ revisions.
 * 
 * Usage:
 *   const { tender, parsedBoq, updateParsedBoqRevision } = useTenderData({ tenderId: 'xyz' });
 * 
 * TODO: Wire to actual Firestore collection - currently needs:
 *   - Firestore collection path (currently assumes 'tenders')
 *   - Proper error handling and retry logic
 *   - Optimistic updates
 *   - Real-time listener subscription
 */
export const useTenderData = ({ tenderId }: UseTenderDataOptions): UseTenderDataReturn => {
  const [tender, setTender] = useState<any | null>(null);
  const [parsedBoq, setParsedBoq] = useState<StandardBOQRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tender data on mount or when tenderId changes
  useEffect(() => {
    if (!tenderId) {
      setError('Tender ID is required');
      setLoading(false);
      return;
    }

    const fetchTenderData = async () => {
      try {
        setLoading(true);
        setError(null);

        // TODO: Replace 'tenders' with actual Firestore collection path
        const docRef = doc(db, 'tenders', tenderId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const tenderData = docSnap.data();
          setTender(tenderData);
          setParsedBoq(tenderData.parsedBoq || []);
        } else {
          setError('Tender not found');
          setTender(null);
          setParsedBoq(null);
        }
      } catch (err) {
        console.error('Error fetching tender data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch tender data');
      } finally {
        setLoading(false);
      }
    };

    fetchTenderData();
  }, [tenderId]);

  /**
   * Updates a parsed BOQ item with a new rate revision.
   * 
   * Saves to Firestore path:
   *   tenders/{tenderId}/parsedBoq/{itemIndex}/revisions/{revisionKey}
   * 
   * Example:
   *   await updateParsedBoqRevision(0, 'R1', { rate: 450, amount: 2250, ... })
   * 
   * TODO: Implement optimistic updates (update local state first, sync later)
   * TODO: Add retry logic for failed saves
   * TODO: Add batch update support for multiple items
   */
  const updateParsedBoqRevision = useCallback(
    async (itemIndex: number, revisionKey: string, revisionObj: RateRevision) => {
      if (!tenderId) {
        throw new Error('Tender ID is required');
      }

      if (itemIndex < 0 || itemIndex >= (parsedBoq?.length || 0)) {
        throw new Error(`Invalid item index: ${itemIndex}`);
      }

      try {
        // TODO: Replace 'tenders' with actual Firestore collection path
        const docRef = doc(db, 'tenders', tenderId);

        // Build the update path dynamically
        // Path: parsedBoq.{itemIndex}.revisions.{revisionKey}
        const updatePath = `parsedBoq.${itemIndex}.revisions.${revisionKey}`;

        // Update Firestore document
        await updateDoc(docRef, {
          [updatePath]: revisionObj,
        });

        // Optimistically update local state
        // TODO: Make this more robust with proper state management
        if (parsedBoq) {
          const updatedBoq = [...parsedBoq];
          if (!updatedBoq[itemIndex].revisions) {
            updatedBoq[itemIndex].revisions = {};
          }
          (updatedBoq[itemIndex].revisions as any)[revisionKey] = revisionObj;
          setParsedBoq(updatedBoq);
        }

        // TODO: Emit success notification
        console.log(`Revision ${revisionKey} saved for item ${itemIndex}`);
      } catch (err) {
        console.error('Error updating parsed BOQ revision:', err);
        // TODO: Emit error notification
        throw err;
      }
    },
    [tenderId, parsedBoq]
  );

  return {
    tender,
    parsedBoq,
    loading,
    error,
    updateParsedBoqRevision,
  };
};

/**
 * Alternative approach: Using context for global tender data (Optional).
 * 
 * If multiple components need tender data, consider creating a TenderContext:
 * 
 * const TenderContext = createContext<UseTenderDataReturn | null>(null);
 * 
 * export const TenderProvider: React.FC<{ tenderId: string; children: ReactNode }> = ({
 *   tenderId,
 *   children,
 * }) => {
 *   const tenderData = useTenderData({ tenderId });
 *   return <TenderContext.Provider value={tenderData}>{children}</TenderContext.Provider>;
 * };
 * 
 * export const useTenderContext = () => {
 *   const context = useContext(TenderContext);
 *   if (!context) {
 *     throw new Error('useTenderContext must be used within TenderProvider');
 *   }
 *   return context;
 * };
 * 
 * Usage in components:
 *   const { parsedBoq, updateParsedBoqRevision } = useTenderContext();
 */
