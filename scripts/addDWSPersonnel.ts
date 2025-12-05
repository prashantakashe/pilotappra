/**
 * Script to add Daily Work Status personnel contacts
 * 
 * Prerequisites:
 * 1. Install firebase-admin: npm install firebase-admin
 * 2. Download service account key from Firebase Console
 * 3. Save it as serviceAccountKey.json in project root
 * 
 * Run: npx ts-node scripts/addDWSPersonnel.ts
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin
// NOTE: Replace this with your actual service account path or use environment variables
try {
  const serviceAccount = require('../serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('[Add Personnel] Error: serviceAccountKey.json not found');
  console.log('[Add Personnel] Please download service account key from Firebase Console');
  console.log('[Add Personnel] Save it as serviceAccountKey.json in project root');
  process.exit(1);
}

const db = admin.firestore();

// Personnel data - UPDATE THIS with your actual personnel
const personnel = [
  {
    name: "Rajesh Kumar",
    email: "rajesh.kumar@company.com",
    mobile: "+919876543210",
    role: "Site Engineer",
    projects: ["Jalgaon Bridge", "Karad Tender"],
    active: true
  },
  {
    name: "Priya Sharma",
    email: "priya.sharma@company.com",
    mobile: "+919876543211",
    role: "Project Manager",
    projects: ["Jalgaon Bridge"],
    active: true
  },
  {
    name: "Amit Patel",
    email: "amit.patel@company.com",
    mobile: "+919876543212",
    role: "Supervisor",
    projects: ["Karad Tender"],
    active: true
  },
  // Add more personnel here...
];

async function addPersonnel() {
  console.log('[Add Personnel] Starting...');

  try {
    for (const person of personnel) {
      // Check if already exists
      const existing = await db.collection('dailyWorkPersonnel')
        .where('name', '==', person.name)
        .limit(1)
        .get();

      if (!existing.empty) {
        console.log(`[Add Personnel] ${person.name} already exists, skipping`);
        continue;
      }

      // Add to Firestore
      await db.collection('dailyWorkPersonnel').add({
        ...person,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`[Add Personnel] ✅ Added ${person.name}`);
    }

    console.log('[Add Personnel] Complete!');
    process.exit(0);
  } catch (error) {
    console.error('[Add Personnel] Error:', error);
    process.exit(1);
  }
}

// Run the script
addPersonnel();
