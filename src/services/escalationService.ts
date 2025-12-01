// src/services/escalationService.ts
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc,
  deleteDoc,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth } from './firebase';
import type { 
  EscalationMaster, 
  PriceIndex, 
  EscalationBill, 
  UploadedFile 
} from '../types/escalation';

const COLLECTIONS = {
  MASTERS: 'escalation_masters',
  INDICES: 'price_indices',
  BILLS: 'escalation_bills',
};

// ============ Master Data Operations ============

export const saveMasterData = async (master: Omit<EscalationMaster, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> => {
  try {
    const userId = auth.currentUser?.uid;
    console.log('[EscalationService] saveMasterData - User ID:', userId);
    
    if (!userId) {
      console.error('[EscalationService] No user authenticated');
      throw new Error('User not authenticated');
    }

    const masterData: any = {
      ...master,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: userId,
    };

    console.log('[EscalationService] Attempting to save master data:', masterData);
    const docRef = await addDoc(collection(db, COLLECTIONS.MASTERS), masterData);
    console.log('[EscalationService] ✅ Master data saved with ID:', docRef.id);
    
    return docRef.id;
  } catch (error: any) {
    console.error('[EscalationService] ❌ Error saving master data:', error);
    console.error('[EscalationService] Error code:', error.code);
    console.error('[EscalationService] Error message:', error.message);
    console.error('[EscalationService] Full error:', JSON.stringify(error, null, 2));
    
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied: Check Firestore security rules for escalation_masters collection');
    }
    
    throw new Error(`Failed to save master data: ${error.message}`);
  }
};

export const updateMasterData = async (
  masterId: string, 
  updates: Partial<EscalationMaster>
): Promise<void> => {
  try {
    const masterRef = doc(db, COLLECTIONS.MASTERS, masterId);
    
    await updateDoc(masterRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    
    console.log('[EscalationService] Master data updated:', masterId);
  } catch (error: any) {
    console.error('[EscalationService] Error updating master data:', error);
    throw new Error(`Failed to update master data: ${error.message}`);
  }
};

export const getMasterData = async (masterId: string): Promise<EscalationMaster | null> => {
  try {
    const masterRef = doc(db, COLLECTIONS.MASTERS, masterId);
    const masterSnap = await getDoc(masterRef);
    
    if (!masterSnap.exists()) {
      return null;
    }
    
    const data = masterSnap.data();
    return {
      id: masterSnap.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as EscalationMaster;
  } catch (error: any) {
    console.error('[EscalationService] Error fetching master data:', error);
    throw new Error(`Failed to fetch master data: ${error.message}`);
  }
};

export const getAllMasters = async (): Promise<EscalationMaster[]> => {
  try {
    const userId = auth.currentUser?.uid;
    console.log('[EscalationService] getAllMasters - User ID:', userId);
    
    if (!userId) {
      console.error('[EscalationService] No user authenticated');
      throw new Error('User not authenticated');
    }

    console.log('[EscalationService] Querying escalation_masters collection...');
    const q = query(
      collection(db, COLLECTIONS.MASTERS),
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    console.log('[EscalationService] Query returned', querySnapshot.size, 'documents');
    
    const masters: EscalationMaster[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('[EscalationService] Processing master document:', doc.id, data);
      masters.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as EscalationMaster);
    });
    
    console.log('[EscalationService] ✅ Returning', masters.length, 'masters');
    return masters;
  } catch (error: any) {
    console.error('[EscalationService] ❌ Error fetching masters:', error);
    console.error('[EscalationService] Error code:', error.code);
    console.error('[EscalationService] Error message:', error.message);
    
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied: Check Firestore security rules for escalation_masters collection');
    }
    
    throw new Error(`Failed to fetch masters: ${error.message}`);
  }
};

// ============ Price Index Operations ============

export const savePriceIndices = async (indices: Omit<PriceIndex, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> => {
  try {
    const batch: Promise<void>[] = [];
    
    for (const index of indices) {
      // Use month as document ID for easy lookup
      const indexRef = doc(db, COLLECTIONS.INDICES, index.month);
      
      batch.push(
        setDoc(indexRef, {
          ...index,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
      );
    }
    
    await Promise.all(batch);
    console.log('[EscalationService] Price indices saved:', indices.length);
  } catch (error: any) {
    console.error('[EscalationService] Error saving price indices:', error);
    throw new Error(`Failed to save price indices: ${error.message}`);
  }
};

export const getPriceIndex = async (month: string): Promise<PriceIndex | null> => {
  try {
    const indexRef = doc(db, COLLECTIONS.INDICES, month);
    const indexSnap = await getDoc(indexRef);
    
    if (!indexSnap.exists()) {
      return null;
    }
    
    const data = indexSnap.data();
    return {
      id: indexSnap.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as PriceIndex;
  } catch (error: any) {
    console.error('[EscalationService] Error fetching price index:', error);
    throw new Error(`Failed to fetch price index: ${error.message}`);
  }
};

export const getAllPriceIndices = async (): Promise<PriceIndex[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.INDICES),
      orderBy('month', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const indices: PriceIndex[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      indices.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as PriceIndex);
    });
    
    return indices;
  } catch (error: any) {
    console.error('[EscalationService] Error fetching price indices:', error);
    throw new Error(`Failed to fetch price indices: ${error.message}`);
  }
};

export const getPriceIndicesRange = async (startMonth: string, endMonth: string): Promise<PriceIndex[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.INDICES),
      where('month', '>=', startMonth),
      where('month', '<=', endMonth),
      orderBy('month', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const indices: PriceIndex[]= [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      indices.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as PriceIndex);
    });
    
    return indices;
  } catch (error: any) {
    console.error('[EscalationService] Error fetching price indices range:', error);
    throw new Error(`Failed to fetch price indices range: ${error.message}`);
  }
};

// ============ Escalation Bill Operations ============

export const saveEscalationBill = async (bill: Omit<EscalationBill, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const billData: any = {
      ...bill,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: userId,
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.BILLS), billData);
    console.log('[EscalationService] Escalation bill saved with ID:', docRef.id);
    
    return docRef.id;
  } catch (error: any) {
    console.error('[EscalationService] Error saving escalation bill:', error);
    throw new Error(`Failed to save escalation bill: ${error.message}`);
  }
};

export const updateEscalationBill = async (
  billId: string, 
  updates: Partial<EscalationBill>
): Promise<void> => {
  try {
    const billRef = doc(db, COLLECTIONS.BILLS, billId);
    
    await updateDoc(billRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    
    console.log('[EscalationService] Escalation bill updated:', billId);
  } catch (error: any) {
    console.error('[EscalationService] Error updating escalation bill:', error);
    throw new Error(`Failed to update escalation bill: ${error.message}`);
  }
};

export const getEscalationBill = async (billId: string): Promise<EscalationBill | null> => {
  try {
    const billRef = doc(db, COLLECTIONS.BILLS, billId);
    const billSnap = await getDoc(billRef);
    
    if (!billSnap.exists()) {
      return null;
    }
    
    const data = billSnap.data();
    return {
      id: billSnap.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      approvedAt: data.approvedAt?.toDate(),
    } as EscalationBill;
  } catch (error: any) {
    console.error('[EscalationService] Error fetching escalation bill:', error);
    throw new Error(`Failed to fetch escalation bill: ${error.message}`);
  }
};

export const getAllEscalationBills = async (masterId?: string): Promise<EscalationBill[]> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    let q;
    if (masterId) {
      q = query(
        collection(db, COLLECTIONS.BILLS),
        where('createdBy', '==', userId),
        where('masterId', '==', masterId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, COLLECTIONS.BILLS),
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    const bills: EscalationBill[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      bills.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        approvedAt: data.approvedAt?.toDate(),
      } as EscalationBill);
    });
    
    return bills;
  } catch (error: any) {
    console.error('[EscalationService] Error fetching escalation bills:', error);
    throw new Error(`Failed to fetch escalation bills: ${error.message}`);
  }
};

export const deleteEscalationBill = async (billId: string): Promise<void> => {
  try {
    const billRef = doc(db, COLLECTIONS.BILLS, billId);
    await deleteDoc(billRef);
    console.log('[EscalationService] Escalation bill deleted:', billId);
  } catch (error: any) {
    console.error('[EscalationService] Error deleting escalation bill:', error);
    throw new Error(`Failed to delete escalation bill: ${error.message}`);
  }
};

// ============ File Upload Operations ============

export const uploadFile = async (
  file: File | Blob,
  fileName: string,
  folder: 'masters' | 'bills'
): Promise<UploadedFile> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const timestamp = Date.now();
    const filePath = `escalation/${folder}/${userId}/${timestamp}_${fileName}`;
    const fileRef = ref(storage, filePath);
    
    const snapshot = await uploadBytes(fileRef, file);
    const url = await getDownloadURL(snapshot.ref);
    
    const uploadedFile: UploadedFile = {
      id: `${timestamp}_${fileName}`,
      name: fileName,
      size: file.size,
      type: file.type,
      url,
      uploadedAt: new Date(),
    };
    
    console.log('[EscalationService] File uploaded:', fileName);
    return uploadedFile;
  } catch (error: any) {
    console.error('[EscalationService] Error uploading file:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

export const deleteFile = async (fileUrl: string): Promise<void> => {
  try {
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
    console.log('[EscalationService] File deleted:', fileUrl);
  } catch (error: any) {
    console.error('[EscalationService] Error deleting file:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

// ============ Calculation Helpers ============

export const calculateEscalation = (
  grossWork: number,
  fixedPortion: number,
  weightages: { labour: number; pol: number; others: number; cement: number; steel: number },
  indices: {
    labour: { base: number; current: number };
    pol: { base: number; current: number };
    other: { base: number; current: number };
    steel: { base: number; current: number };
    cement: { base: number; current: number };
  },
  cementQty: number = 0,
  steelQty: number = 0,
  starCement: number = 0,
  starSteel: number = 0
) => {
  // Calculate fixed amount
  const fixedAmount = (grossWork * fixedPortion) / 100;
  
  // Calculate cement and steel amounts
  const cementAmount = cementQty * starCement;
  const steelAmount = steelQty * starSteel;
  
  // Eligible amount for escalation
  const eligibleAmount = grossWork - fixedAmount - cementAmount - steelAmount;
  
  // Calculate percentage increases
  const labourIncrease = ((indices.labour.current - indices.labour.base) / indices.labour.base) * 100;
  const polIncrease = ((indices.pol.current - indices.pol.base) / indices.pol.base) * 100;
  const otherIncrease = ((indices.other.current - indices.other.base) / indices.other.base) * 100;
  const steelIncrease = ((indices.steel.current - indices.steel.base) / indices.steel.base) * 100;
  const cementIncrease = ((indices.cement.current - indices.cement.base) / indices.cement.base) * 100;
  
  // Calculate escalations
  const escalationLabour = (eligibleAmount * weightages.labour * labourIncrease) / 100;
  const escalationPOL = (eligibleAmount * weightages.pol * polIncrease) / 100;
  const escalationOther = (eligibleAmount * weightages.others * otherIncrease) / 100;
  const escalationSteel = (cementAmount * steelIncrease) / 100;
  const escalationCement = (steelAmount * cementIncrease) / 100;
  
  const totalEscalation = escalationLabour + escalationPOL + escalationOther + escalationSteel + escalationCement;
  
  return {
    fixedAmount,
    cementAmount,
    steelAmount,
    eligibleAmount,
    escalations: {
      labour: escalationLabour,
      pol: escalationPOL,
      other: escalationOther,
      steel: escalationSteel,
      cement: escalationCement,
      total: totalEscalation,
    },
    increases: {
      labour: labourIncrease,
      pol: polIncrease,
      other: otherIncrease,
      steel: steelIncrease,
      cement: cementIncrease,
    }
  };
};
