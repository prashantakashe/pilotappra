import { useState, useCallback } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

/**
 * Custom hook for Firestore operations related to price escalation
 */
export const useFirestore = (collectionName: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (queryConstraints = []) => {
    setLoading(true);
    try {
      const colRef = collection(db, collectionName);
      let q = colRef;
      
      // TODO: Apply query constraints if provided
      const snapshot = await getDocs(colRef);
      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setData(documents);
      setError(null);
      return documents;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error(`Error fetching from ${collectionName}:`, err);
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  const addDocument = useCallback(async (documentData: any) => {
    try {
      const colRef = collection(db, collectionName);
      const docRef = await addDoc(colRef, {
        ...documentData,
        createdAt: new Date(),
      });
      
      const newDoc = { id: docRef.id, ...documentData };
      setData(prev => [...prev, newDoc]);
      return newDoc;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  }, [collectionName]);

  const updateDocument = useCallback(async (docId: string, updates: any) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, updates);
      
      setData(prev =>
        prev.map(d => (d.id === docId ? { ...d, ...updates } : d))
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  }, [collectionName]);

  const deleteDocument = useCallback(async (docId: string) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      
      setData(prev => prev.filter(d => d.id !== docId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  }, [collectionName]);

  return {
    data,
    loading,
    error,
    fetchData,
    addDocument,
    updateDocument,
    deleteDocument,
  };
};

export default useFirestore;
