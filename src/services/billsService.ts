import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';

const BILLS_COLLECTION = 'project_bills';

export async function getBills(projectId: string) {
  const q = query(collection(db, BILLS_COLLECTION), where('projectId', '==', projectId));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addBill(projectId: string, bill: any) {
  const data = { ...bill, projectId, createdAt: Timestamp.now() };
  const ref = await addDoc(collection(db, BILLS_COLLECTION), data);
  return { id: ref.id, ...data };
}

export async function updateBill(billId: string, bill: any) {
  const ref = doc(db, BILLS_COLLECTION, billId);
  await updateDoc(ref, bill);
}

export async function deleteBill(billId: string) {
  const ref = doc(db, BILLS_COLLECTION, billId);
  await deleteDoc(ref);
}
