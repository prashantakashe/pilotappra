import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyA7YoZo9xtZiGdkHWjMvAiAYNoSRlD7avE',
  authDomain: 'app-pilot-60ce3.firebaseapp.com',
  projectId: 'app-pilot-60ce3',
  storageBucket: 'app-pilot-60ce3.firebasestorage.app',
  messagingSenderId: '638337969804',
  appId: '1:638337969804:web:5fcb8ac58acd44221455a9'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  const email = `exttest+${Date.now()}@example.com`;
  const password = 'ExtStr0ngPass!12345';
  console.log('Extended auth test start');
  console.log('Registering user', email);
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  console.log('Created UID:', uid);

  // Allow Firestore trigger delay (if any) – we created doc on client but still verify
  // Wait a moment for Firestore write from client sign-up to propagate
  await new Promise(r => setTimeout(r, 2500));

  const userDocRef = doc(db, 'users', uid);
  const snap = await getDoc(userDocRef);
  if (!snap.exists()) {
    console.error('FAIL: Firestore user document missing');
    process.exit(1);
  }
  const data = snap.data();
  const requiredFields = ['email','name','createdAt','role','lastLogin'];
  const missing = requiredFields.filter(f => !(f in data));
  if (missing.length) {
    console.error('FAIL: Missing fields:', missing);
    process.exit(1);
  }
  console.log('Firestore doc verified fields:', Object.keys(data));

  await signOut(auth);
  console.log('Signed out. Signing in again...');
  await signInWithEmailAndPassword(auth, email, password);
  console.log('Re-login success');
  console.log('Extended auth test SUCCESS');
}

run().catch(e => { console.error('Extended auth test FAILED', e); process.exit(1); });
