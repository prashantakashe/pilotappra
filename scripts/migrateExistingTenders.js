// scripts/migrateExistingTenders.js
// Run this once to add Stage 1 completion to existing tenders
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateExistingTenders() {
  console.log('Starting migration of existing tenders...');
  
  const tendersSnapshot = await db.collection('tenders').get();
  console.log(`Found ${tendersSnapshot.size} tenders`);
  
  let migratedCount = 0;
  let skippedCount = 0;
  
  const batch = db.batch();
  
  tendersSnapshot.forEach((doc) => {
    const tender = doc.data();
    
    // Check if already has stageCompletion
    if (tender.stageCompletion && tender.stageCompletion['1_identification']) {
      console.log(`Skipping ${doc.id} - already has Stage 1`);
      skippedCount++;
      return;
    }
    
    console.log(`Migrating ${doc.id} (${tender.tenderNo})`);
    
    // Add Stage 1 completion
    batch.update(doc.ref, {
      stageCompletion: {
        '1_identification': {
          done: true,
          by: tender.createdBy || 'system',
          at: tender.createdAt || admin.firestore.Timestamp.now(),
          evidenceRefs: []
        }
      },
      progressPercent: 6.25
    });
    
    migratedCount++;
  });
  
  if (migratedCount > 0) {
    await batch.commit();
    console.log(`✅ Migration complete! Updated ${migratedCount} tenders, skipped ${skippedCount}`);
  } else {
    console.log(`✅ No tenders to migrate. Skipped ${skippedCount} tenders.`);
  }
  
  process.exit(0);
}

migrateExistingTenders().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
