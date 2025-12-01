// test-tender-save.js - Script to test tender creation with provided data
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFunctions, httpsCallable, connectFunctionsEmulator } = require('firebase/functions');

const firebaseConfig = {
  apiKey: 'AIzaSyA7YoZo9xtZiGdkHWjMvAiAYNoSRlD7avE',
  authDomain: 'app-pilot-60ce3.firebaseapp.com',
  projectId: 'app-pilot-60ce3',
  storageBucket: 'app-pilot-60ce3.firebasestorage.app',
  messagingSenderId: '638337969804',
  appId: '1:638337969804:web:5fcb8ac58acd44221455a9',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app);

// Uncomment to use emulator
// connectFunctionsEmulator(functions, 'localhost', 5001);

async function testTenderCreation() {
  try {
    console.log('🔐 Authenticating...');
    
    // You need to provide your Firebase email/password
    // Replace with actual credentials or use existing auth
    const email = process.argv[2] || 'test@example.com';
    const password = process.argv[3] || 'password';
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Authenticated as:', auth.currentUser.email);
    } catch (authError) {
      console.error('❌ Authentication failed:', authError.code);
      console.log('Usage: node test-tender-save.js <email> <password>');
      process.exit(1);
    }

    console.log('\n📝 Creating tender with data:');
    const tenderData = {
      title: 'Karad Project',
      shortName: 'Karad',
      workType: 'Sports',
      tenderSource: 'GEM',
      tenderSourceOther: '',
      estimatedValue: '78000000',
      currency: 'INR',
      description: 'Test tender for Karad Sports Project',
      
      // Identification
      client: 'Test Client',
      department: 'Sports Department',
      tenderUID: 'KARAD-2025-001',
      externalLink: '',
      
      // Location
      country: 'India',
      state: 'Maharashtra',
      city: 'Karad',
      siteAddress: 'Karad, Maharashtra',
      prebidMeetingAddress: '',
      
      // Key Dates (ISO format)
      publishDate: '2025-11-10T00:00:00.000Z',
      prebidMeetingDate: null,
      queryDeadline: null,
      documentPurchaseDeadline: null,
      submissionDeadline: '2025-11-25T23:59:59.000Z',
      technicalOpeningDate: null,
      financialOpeningDate: null,
      reminderEnabled: true,
      reminderLeadDays: 3,
      
      // BOQ/Financial
      boqFileUrl: '',
      boqItemCount: 0,
      tenderValue: '78000000',
      paymentTerms: '',
      
      // Team
      tenderManager: 'Prashant',
      engineeringLead: '',
      estimationEngineer: '',
      documentController: '',
      additionalMembers: [],
      
      // Workflow
      status: 'active',
      submissionMode: 'Online',
      internalNotes: 'Test tender created via script',
      emdAmount: '',
      
      // Optional
      prebidQueryInstructions: '',
      extraReminders: '',
      bidProbabilityScore: null,
      
      draftId: 'test-draft-' + Date.now(),
      documents: []
    };

    console.log(JSON.stringify(tenderData, null, 2));

    console.log('\n🚀 Calling finalizeTenderCreate function...');
    const finalizeTenderCreate = httpsCallable(functions, 'finalizeTenderCreate');
    
    const result = await finalizeTenderCreate(tenderData);
    
    console.log('\n✅ SUCCESS! Tender created:');
    console.log('Tender ID:', result.data.tenderId);
    console.log('Tender No:', result.data.tenderNo);
    console.log('\n📋 You can now view this tender in the Tender Main Screen!');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.code || error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Check if Firebase Auth user exists
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('Already authenticated as:', user.email);
    testTenderCreation();
  }
});

// Start the test
testTenderCreation();
