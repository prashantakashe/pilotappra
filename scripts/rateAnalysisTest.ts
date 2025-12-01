// scripts/rateAnalysisTest.ts
// Simple script to exercise Rate Analysis callable functions.
// Usage: npx ts-node scripts/rateAnalysisTest.ts <email> <password>
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "REPLACED_API_KEY",
  authDomain: "app-pilot-60ce3.firebaseapp.com",
  projectId: "app-pilot-60ce3",
  storageBucket: "app-pilot-60ce3.appspot.com",
  messagingSenderId: "501654495984",
  appId: "1:501654495984:web:8bed59dd5862b62766c915"
};

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error('Provide email and password: npx ts-node scripts/rateAnalysisTest.ts <email> <password>');
    process.exit(1);
  }
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  await signInWithEmailAndPassword(auth, email, password);
  const functions = getFunctions(app, 'us-central1');

  const tenderCreate = httpsCallable(functions, 'tenderCreate');
  const raCreate = httpsCallable(functions, 'raCreate');
  const raUpdate = httpsCallable(functions, 'raUpdate');

  // 1. Create tender
  const tRes: any = await tenderCreate({ title: 'Test Tender CI', shortName: 'TT' });
  console.log('Tender created:', tRes.data);
  const tenderId = tRes.data.id;

  // 2. Create Rate Analysis
  const raRes: any = await raCreate({ tenderId, rateAnalysis: { description: 'Concrete M20', unit: 'Cum', quantity: 10, rateBreakdown: { materials: 1200, labour: 300, plant: 150, transport: 50, overheads: 100, profit: 200, other: 0 } } });
  console.log('RA created:', raRes.data);
  const raId = raRes.data.id;

  // 3. Update Rate Analysis
  await raUpdate({ tenderId, raId, changes: { quantity: 12, rateBreakdown: { materials: 1250, labour: 320, plant: 150, transport: 55, overheads: 110, profit: 220, other: 0 } } });
  console.log('RA updated.');

  console.log('SUCCESS');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
