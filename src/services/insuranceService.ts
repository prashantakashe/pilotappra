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

const INSURANCE_COLLECTION = 'project_insurances';

export async function getInsurances(projectId: string) {
  const q = query(collection(db, INSURANCE_COLLECTION), where('projectId', '==', projectId));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addInsurance(projectId: string, insurance: any) {
  const data = { ...insurance, projectId, createdAt: Timestamp.now() };
  const ref = await addDoc(collection(db, INSURANCE_COLLECTION), data);
  return { id: ref.id, ...data };
}

export async function updateInsurance(insuranceId: string, insurance: any) {
  const ref = doc(db, INSURANCE_COLLECTION, insuranceId);
  await updateDoc(ref, insurance);
}

export async function deleteInsurance(insuranceId: string) {
  const ref = doc(db, INSURANCE_COLLECTION, insuranceId);
  await deleteDoc(ref);
}
