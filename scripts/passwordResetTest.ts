import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

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
  const email = `pwreset+${Date.now()}@example.com`;
  const password = 'ResetStr0ngPass!12345';
  console.log('Password reset test start');
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  console.log('Created user UID:', cred.user.uid);
  console.log('Requesting password reset (email delivery cannot be verified here)...');
  await sendPasswordResetEmail(auth, email);
  console.log('Password reset request SUCCESS (email should arrive externally)');
  console.log('Password reset test COMPLETE');
}

run().catch(e => { console.error('Password reset test FAILED', e); process.exit(1); });
