// test-delay-report.js
// Test script to trigger Delay Analysis Report manually

const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyA7YoZo9xtZiGdkHWjMvAiAYNoSRlD7avE',
  authDomain: 'app-pilot-60ce3.firebaseapp.com',
  projectId: 'app-pilot-60ce3',
  storageBucket: 'app-pilot-60ce3.firebasestorage.app',
  messagingSenderId: '638337969804',
  appId: '1:638337969804:web:5fcb8ac58acd44221455a9'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app);

async function testDelayAnalysisReport() {
  try {
    console.log('🔐 Signing in...');
    
    // Sign in with test credentials
    const userCredential = await signInWithEmailAndPassword(
      auth,
      'prashant@example.com', // Update with your admin email
      'test123' // Update with your password
    );
    
    console.log('✅ Signed in as:', userCredential.user.email);
    console.log('\n📊 Triggering Delay Analysis Report...');
    
    // Call the function
    const triggerReport = httpsCallable(functions, 'triggerDelayAnalysisReport');
    const result = await triggerReport();
    
    console.log('\n✅ Report Generated Successfully!');
    console.log('📧 Email sent to managers/admins');
    console.log('\n📈 Statistics:');
    console.log(`   🔴 Overdue Tasks: ${result.data.delayedCount}`);
    console.log(`   🟡 Due Today: ${result.data.dueTodayCount}`);
    console.log(`   🟢 Upcoming (7 days): ${result.data.upcomingCount}`);
    console.log(`\n${result.data.message}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    if (error.details) {
      console.error('Details:', error.details);
    }
    process.exit(1);
  }
}

// Run the test
console.log('🧪 Delay Analysis Report - Test Script');
console.log('=====================================\n');
testDelayAnalysisReport();
