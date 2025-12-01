// quick-test-tender.js - Quick test for Karad Project tender creation
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'app-pilot-60ce3.firebasestorage.app'
});

const db = admin.firestore();

async function createKaradTender() {
  try {
    console.log('🏗️  Creating Karad Project Tender...\n');

    // Get user UID for aaa@gmail.com
    const userRecord = await admin.auth().getUserByEmail('aaa@gmail.com');
    const uid = userRecord.uid;
    console.log('✅ Found user:', userRecord.email, '(UID:', uid, ')');

    // Generate tender number
    const year = new Date().getFullYear();
    const counterRef = db.collection('_counters').doc('tenderNumbers');
    
    const tenderNo = await db.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let yearCounters = counterDoc.exists ? counterDoc.data()?.years || {} : {};
      const currentCount = yearCounters[year] || 0;
      const nextNumber = currentCount + 1;
      yearCounters[year] = nextNumber;
      transaction.set(counterRef, { years: yearCounters }, { merge: true });
      return `TNR-${year}-${String(nextNumber).padStart(4, '0')}`;
    });

    console.log('📋 Generated Tender Number:', tenderNo);

    // Create tender document
    const tenderData = {
      tenderId: '', // Will update after creation
      tenderNo: tenderNo,
      title: 'Karad Project',
      shortName: 'Karad',
      workType: 'Sports',
      tenderSource: 'GEM',
      tenderSourceOther: null,
      estimatedValue: 78000000,
      currency: 'INR',
      description: 'Sports facility project in Karad',
      
      client: 'Municipal Corporation Karad',
      department: 'Sports & Youth Affairs',
      tenderUID: 'KARAD-SPORTS-2025',
      externalLink: null,
      
      country: 'India',
      state: 'Maharashtra',
      city: 'Karad',
      siteAddress: 'Karad, Maharashtra',
      prebidMeetingAddress: null,
      
      publishDate: admin.firestore.Timestamp.fromDate(new Date('2025-11-10')),
      prebidMeetingDate: null,
      queryDeadline: null,
      documentPurchaseDeadline: null,
      submissionDeadline: admin.firestore.Timestamp.fromDate(new Date('2025-11-25T23:59:59')),
      technicalOpeningDate: null,
      financialOpeningDate: null,
      
      reminderEnabled: true,
      reminderLeadDays: 3,
      
      boqFileUrl: null,
      boqItemCount: 0,
      tenderValue: 78000000,
      paymentTerms: null,
      
      tenderManager: 'Prashant',
      engineeringLead: null,
      estimationEngineer: null,
      documentController: null,
      additionalMembers: [],
      
      status: 'active',
      submissionMode: 'Online',
      internalNotes: 'Test tender created for Karad Sports Project',
      emdAmount: null,
      
      membersMap: {
        [uid]: 'owner'
      },
      rateAnalysisAllowedRoles: ['estimator', 'owner'],
      
      createdBy: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastModifiedBy: uid,
      lastModifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      
      tenderProgressPercent: 0,
      documentProgressSummary: {
        mandatoryCompleted: 0,
        mandatoryTotal: 0
      }
    };

    // Create tender
    const tenderRef = await db.collection('tenders').add(tenderData);
    await tenderRef.update({ tenderId: tenderRef.id });

    console.log('✅ Tender Created Successfully!');
    console.log('   Tender ID:', tenderRef.id);
    console.log('   Tender No:', tenderNo);
    console.log('   Title:', tenderData.title);
    console.log('   Value: ₹', (tenderData.estimatedValue / 10000000).toFixed(2), 'Cr');
    console.log('   Deadline:', new Date('2025-11-25').toLocaleDateString());
    
    // Create status history
    await tenderRef.collection('statusHistory').add({
      status: 'active',
      changedBy: uid,
      changedAt: admin.firestore.FieldValue.serverTimestamp(),
      notes: 'Tender created - Karad Sports Project'
    });

    console.log('✅ Status history created');

    // Create audit log
    await db.collection('audit_logs').add({
      entity: 'tender',
      entityId: tenderRef.id,
      action: 'TENDER_CREATED',
      performedBy: uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        tenderNo: tenderNo,
        title: tenderData.title,
        estimatedValue: tenderData.estimatedValue
      }
    });

    console.log('✅ Audit log created');
    console.log('\n🎉 SUCCESS! You can now view this tender in the Tender Main Screen!');
    console.log('📱 Navigate to: Tenders → Filter by "Active" status');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createKaradTender();
