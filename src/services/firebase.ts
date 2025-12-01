// src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyA7YoZo9xtZiGdkHWjMvAiAYNoSRlD7avE',
  authDomain: 'app-pilot-60ce3.firebaseapp.com',
  projectId: 'app-pilot-60ce3',
  storageBucket: 'app-pilot-60ce3.firebasestorage.app',
  messagingSenderId: '638337969804',
  appId: '1:638337969804:web:5fcb8ac58acd44221455a9',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Connect to emulators in development (optional - comment out to use production)
// if (__DEV__ || window.location.hostname === 'localhost') {
//   connectAuthEmulator(auth, 'http://localhost:9099');
//   connectFirestoreEmulator(db, 'localhost', 8080);
//   connectStorageEmulator(storage, 'localhost', 9199);
//   connectFunctionsEmulator(functions, 'localhost', 5001);
// }
