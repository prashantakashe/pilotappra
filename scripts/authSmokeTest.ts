import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, getAuth } from 'firebase/auth';

// Inline firebase config to avoid module resolution issues in Node context
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

async function run() {
  const timestamp = Date.now();
  const email = `testuser+${timestamp}@example.com`;
  const password = 'Str0ngPass!12345';
  console.log('Starting auth smoke test');
  console.log('Creating user:', email);
  try {
    const createRes = await createUserWithEmailAndPassword(auth, email, password);
    console.log('User created UID:', createRes.user.uid);
    await signOut(auth);
    console.log('Signed out after creation');
    const signInRes = await signInWithEmailAndPassword(auth, email, password);
    console.log('Signed back in UID:', signInRes.user.uid);
    console.log('Auth smoke test SUCCESS');
  } catch (err: any) {
    console.error('Auth smoke test FAILED:', err.code, err.message);
    process.exit(1);
  }
}

run();
