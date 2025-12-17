
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export const getSecurityDeposits = async (projectId) => {
  const q = query(collection(db, 'securityDeposits'), where('projectId', '==', projectId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
};

export const addSecurityDeposit = async (projectId, data) => {
  const docRef = await addDoc(collection(db, 'securityDeposits'), { ...data, projectId });
  const docSnap = await docRef.get(); // get() is not available in modular API, so fetch manually
  return { id: docRef.id, ...data, projectId };
};

export const updateSecurityDeposit = async (id, data) => {
  await updateDoc(doc(db, 'securityDeposits', id), data);
};

export const deleteSecurityDeposit = async (id) => {
  await deleteDoc(doc(db, 'securityDeposits', id));
};
