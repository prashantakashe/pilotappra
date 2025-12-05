// test-delay-report-admin.js
// Test script using Firebase Admin SDK to trigger Delay Analysis Report

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'app-pilot-60ce3'
});

const db = admin.firestore();

async function testDelayAnalysisReport() {
  try {
    console.log('📊 Testing Delay Analysis Report Logic...\n');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch all entries with target dates
    console.log('🔍 Fetching entries from dws_entries collection...');
    const entriesSnapshot = await db.collection('dws_entries')
      .where('targetDate', '!=', null)
      .get();

    console.log(`✅ Found ${entriesSnapshot.size} entries with target dates\n`);

    const delayedTasks = [];
    const dueTodayTasks = [];
    const upcomingTasks = [];

    entriesSnapshot.forEach((doc) => {
      const entry = doc.data();
      
      if (!entry.targetDate) return;

      const targetDate = entry.targetDate.toDate();
      targetDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const pendingSinceDays = Math.abs(daysDiff);

      const taskData = {
        id: doc.id,
        projectName: entry.projectName || 'N/A',
        mainActivity: entry.mainActivity || 'N/A',
        assignedTo: entry.assignedTo || 'Unassigned',
        targetDate: targetDate,
        currentStatus: entry.finalStatus || 'Not Started',
        daysDiff: daysDiff,
        pendingSinceDays: pendingSinceDays,
        hours: entry.hours || 0,
        subActivitiesCount: entry.subActivities ? entry.subActivities.length : 0
      };

      if (daysDiff < 0 && entry.finalStatus !== 'Completed') {
        delayedTasks.push(taskData);
      } else if (daysDiff === 0 && entry.finalStatus !== 'Completed') {
        dueTodayTasks.push(taskData);
      } else if (daysDiff > 0 && daysDiff <= 7 && entry.finalStatus !== 'Completed') {
        upcomingTasks.push(taskData);
      }
    });

    console.log('📈 Analysis Results:');
    console.log('===================\n');
    console.log(`🔴 Overdue Tasks: ${delayedTasks.length}`);
    if (delayedTasks.length > 0) {
      console.log('\n   Most Delayed:');
      delayedTasks.sort((a, b) => a.daysDiff - b.daysDiff).slice(0, 3).forEach(task => {
        console.log(`   • ${task.mainActivity} (${task.projectName})`);
        console.log(`     Assigned: ${task.assignedTo} | Delay: ${task.pendingSinceDays} days`);
      });
    }
    
    console.log(`\n🟡 Due Today: ${dueTodayTasks.length}`);
    if (dueTodayTasks.length > 0) {
      dueTodayTasks.slice(0, 3).forEach(task => {
        console.log(`   • ${task.mainActivity} - ${task.assignedTo}`);
      });
    }
    
    console.log(`\n🟢 Upcoming (Next 7 Days): ${upcomingTasks.length}`);
    if (upcomingTasks.length > 0) {
      upcomingTasks.sort((a, b) => a.daysDiff - b.daysDiff).slice(0, 3).forEach(task => {
        console.log(`   • ${task.mainActivity} (in ${task.daysDiff} days)`);
      });
    }

    console.log('\n✅ Report data generated successfully!');
    console.log('\n💡 To test email sending:');
    console.log('   1. Ensure Firebase Email Extension is installed');
    console.log('   2. Have admin/manager users with email in Firestore');
    console.log('   3. Run the scheduled function or call triggerDelayAnalysisReport');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the test
console.log('🧪 Delay Analysis Report - Admin Test');
console.log('======================================\n');
testDelayAnalysisReport();
