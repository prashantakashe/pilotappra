// functions/src/migrateTenders.ts
// One-time migration function to add Stage 1 to existing tenders
import * as functions from 'firebase-functions';
import admin from 'firebase-admin';

export const migrateTendersAddStage1 = functions.https.onCall(async (data, context) => {
  // Only allow admin to run this
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  console.log('Starting migration of existing tenders...');
  
  const tendersSnapshot = await admin.firestore().collection('tenders').get();
  console.log(`Found ${tendersSnapshot.size} tenders`);
  
  let migratedCount = 0;
  let skippedCount = 0;
  
  const batch = admin.firestore().batch();
  
  tendersSnapshot.forEach((doc) => {
    const tender = doc.data();
    
    // Check if already has stageCompletion with Stage 1
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
          by: tender.createdBy || context.auth!.uid,
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
  }
  
  return {
    success: true,
    message: `Migration complete! Updated ${migratedCount} tenders, skipped ${skippedCount}`,
    migratedCount,
    skippedCount
  };
});
