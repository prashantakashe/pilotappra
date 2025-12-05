// quick-check-data.js
// Simple script to check if DWS data exists

const admin = require('./functions/node_modules/firebase-admin');

try {
  admin.initializeApp({
    projectId: 'app-pilot-60ce3'
  });
} catch (e) {
  // Already initialized
}

const db = admin.firestore();

async function checkData() {
  try {
    console.log('🔍 Checking Daily Work Status data...\n');
    
    // Check dws_entries collection
    console.log('Checking dws_entries collection...');
    const entriesSnap = await db.collection('dws_entries').limit(5).get();
    console.log(`  ✅ Found ${entriesSnap.size} entries (showing max 5)`);
    
    if (entriesSnap.size > 0) {
      console.log('\n📋 Sample Entry:');
      const firstEntry = entriesSnap.docs[0];
      const data = firstEntry.data();
      console.log(`  ID: ${firstEntry.id}`);
      console.log(`  Project: ${data.projectName || 'N/A'}`);
      console.log(`  Activity: ${data.mainActivity || 'N/A'}`);
      console.log(`  Assigned To: ${data.assignedTo || 'N/A'}`);
      console.log(`  Status: ${data.finalStatus || 'N/A'}`);
      console.log(`  Target Date: ${data.targetDate ? new Date(data.targetDate.toDate()).toLocaleDateString() : 'N/A'}`);
    }
    
    // Check with target dates
    console.log('\n🎯 Checking entries with target dates...');
    const withTargetDates = await db.collection('dws_entries')
      .where('targetDate', '!=', null)
      .limit(10)
      .get();
    console.log(`  ✅ Found ${withTargetDates.size} entries with target dates`);
    
    // Check users collection for managers
    console.log('\n👥 Checking for managers/admins...');
    const managersSnap = await db.collection('users')
      .where('role', 'in', ['admin', 'manager'])
      .get();
    console.log(`  ✅ Found ${managersSnap.size} managers/admins`);
    
    if (managersSnap.size > 0) {
      managersSnap.docs.forEach(doc => {
        const user = doc.data();
        console.log(`    • ${user.email || 'No email'} (${user.role})`);
      });
    }
    
    console.log('\n✅ Data check complete!');
    console.log('\n💡 Next steps:');
    console.log('   1. The scheduled function will run daily at 9 AM IST');
    console.log('   2. Or manually trigger via Firebase Console');
    console.log('   3. Check that Firebase Email Extension is installed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkData();
