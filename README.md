# React Native (Expo) + Firebase App

A production-ready mobile-first React Native (Expo) application with Firebase authentication, Firestore, and Cloud Functions. Supports Android, iOS, and Web platforms with responsive design.

## 📋 Overview

This is a complete implementation of a secure, scalable React Native application featuring:

- **Authentication**: Email/password signup, login, and password reset
- **Cross-platform**: Android, iOS, and Web (via react-native-web)
- **Responsive Design**: Mobile-first with tablet and desktop support
- **Security**: Firebase Firestore rules, no direct client-to-client contact
- **Cloud Functions**: Mediated messaging system for secure communication
- **User Management**: Profile management, authentication state persistence

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- Firebase project (create at [firebase.google.com](https://firebase.google.com))
- Android Studio (for Android development) or Xcode (for iOS)

### 1. Installation

```bash
# Clone or download this project
cd myapp

# Install dependencies
npm install

# Install native dependencies
expo install react-native-gesture-handler react-native-reanimated react-native-screens react-native-safe-area-context @react-native-community/masked-view
```

### 2. Firebase Configuration

#### Get Your Firebase Config

1. Go to your [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click **Project Settings** (⚙️ icon)
4. Copy your Web API config:

```json
{
  "apiKey": "AIza...",
  "authDomain": "myapp-xxxxx.firebaseapp.com",
  "projectId": "myapp-xxxxx",
  "storageBucket": "myapp-xxxxx.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abcdef123456"
}
```

#### Add Config to App

Edit `src/services/firebase.ts` and replace the placeholders:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

#### Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get Started**
3. Enable **Email/Password** sign-in method

#### Deploy Firestore Rules

1. In Firebase Console, go to **Firestore Database**
2. Click **Rules** tab
3. Replace the content with `firestore.rules` from this project
4. Click **Publish**

#### Deploy Storage Rules

1. In Firebase Console, go to **Storage**
2. Click **Rules** tab
3. Replace the content with `storage.rules` from this project
4. Click **Publish**

### 3. Deploy Cloud Functions (Optional)

Cloud Functions enable secure, mediated messaging where clients never have direct contact.

```bash
# Navigate to functions folder
cd functions

# Install dependencies
npm install

# Deploy to Firebase
firebase deploy --only functions
```

### 4. Run the App

**Web (recommended for quick testing):**
```bash
npm run web
```

**Android:**
```bash
npm run android
```

**iOS (macOS only):**
```bash
npm run ios
```

**Start Expo CLI (all platforms):**
```bash
npm start
```

## 📁 Project Structure

```
myapp/
├── src/
│   ├── components/
│   │   ├── ButtonPrimary.tsx       # Primary button component
│   │   ├── InputText.tsx           # Text input component
│   │   ├── PasswordInput.tsx       # Password input with eye toggle
│   │   ├── TopBar.tsx             # Top navigation bar
│   │   └── SideBar.tsx            # Left sidebar navigation
│   ├── contexts/
│   │   └── AuthContext.tsx         # Authentication context & provider
│   ├── navigation/
│   │   ├── AuthNavigator.tsx       # Auth screens navigation
│   │   ├── AppNavigator.tsx        # App screens navigation
│   │   └── RootNavigator.tsx       # Root navigation router
│   ├── screens/
│   │   ├── LoginScreen.tsx         # Login page
│   │   ├── SignUpScreen.tsx        # Sign up page
│   │   ├── ForgotPasswordScreen.tsx # Password reset
│   │   ├── MainScreen.tsx          # Main app layout wrapper
│   │   ├── DashboardScreen.tsx     # Dashboard page
│   │   └── ProfileScreen.tsx       # Profile management
│   ├── services/
│   │   ├── firebase.ts            # Firebase initialization
│   │   ├── authService.ts         # Authentication logic
│   │   └── userService.ts         # User data operations
│   ├── theme/
│   │   ├── colors.ts              # Color constants
│   │   └── spacing.ts             # Spacing constants
│   └── utils/
│       ├── validators.ts          # Form validators
│       └── mapFirebaseError.ts    # Firebase error mapper
├── functions/
│   ├── src/
│   │   └── index.ts              # Cloud Functions code
│   ├── package.json
│   └── tsconfig.json
├── App.tsx                        # Entry point
├── app.json                       # Expo configuration
├── package.json                   # Dependencies
├── firestore.rules               # Firestore security rules
├── storage.rules                 # Storage security rules
└── README.md                      # This file
```

## 🎨 Design System

### Colors
```typescript
PRIMARY_LIGHT: '#D9EEFF'   // Light blue accents
ACTION_BLUE: '#1E90FF'     // Primary button
WHITE: '#FFFFFF'            // Background
TEXT_PRIMARY: '#222222'     // Dark text
TEXT_SECONDARY: '#666666'   // Light gray text
```

### Responsive Breakpoints
- **Mobile**: ≤480px (full-width, overlay sidebar)
- **Tablet**: 481–900px (wider containers)
- **Desktop**: >900px (persistent sidebar)

### Component Heights
- **Inputs**: 48px (48 × 16 = 3 rem)
- **Buttons**: min 48px height
- **TopBar**: 60px
- **SideBar**: 260px width

## 🔐 Security Features

### Firestore Rules
- **Users**: Only users can read/write their own data
- **Messages**: Clients cannot create messages (only Cloud Functions)
- **Audit Logs**: Immutable, server-created only

### Storage Rules
- **Profiles**: Users can only read/write their own profile directory
- **Default**: All other access denied

### Best Practices
1. ✅ Never share Firebase account credentials
2. ✅ Invite developers via Firebase → Project Settings → Users and permissions
3. ✅ Use Cloud Functions to mediate sensitive operations
4. ✅ Keep Firestore rules strict (deny by default)
5. ✅ Use `serverTimestamp()` for all timestamps
6. ✅ Store minimal PII per compliance requirements

## 📱 Features

### Authentication Screens
- **Login**: Email + Password with eye toggle
- **Sign Up**: Full name + Email + Password (with confirmation)
- **Forgot Password**: Email-based password reset with neutral messaging

### Protected Screens
- **Dashboard**: Overview of user account and stats
- **Profile**: Edit user information, manage account
- **Main Layout**: TopBar + responsive Sidebar

### Input Validation
- Email format validation (RFC 5322)
- Password strength (8+ chars, uppercase, number, special char)
- Full name validation (2+ characters)
- Confirm password matching
- Real-time error messages

## 🧪 Testing

### Manual Test Plan

1. **Sign Up Flow**
   - Fill form with valid data
   - Verify password confirmation check
   - Check email verification prompt
   - Confirm user document created in Firestore

2. **Login Flow**
   - Test with valid/invalid credentials
   - Verify error messages
   - Check redirect to Dashboard

3. **Password Reset**
   - Request reset with valid email
   - Verify neutral success message
   - Do not reveal account existence

4. **Responsive Design**
   - Test on mobile (≤480px)
   - Test on tablet (481–900px)
   - Test on desktop (>900px)
   - Verify sidebar behavior

5. **Firestore Security**
   - Try to create messages as client (should fail)
   - Try to read other users' data (should fail)
   - Verify Cloud Function creates messages (should succeed)

### Firebase Emulator (Optional)

For local testing without Firebase:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Start emulators
firebase emulators:start

# Update firebase.ts to use emulator
// Uncomment in firebase.ts:
// connectAuthEmulator(auth, 'http://localhost:9099');
// connectFirestoreEmulator(db, 'localhost', 8080);
```

## 📖 API Reference

### AuthContext

```typescript
const { user, loading, isAuthenticated, signOut, refreshUser } = useContext(AuthContext)!;
```

- `user: User | null` - Current authenticated user
- `loading: boolean` - Loading state
- `isAuthenticated: boolean` - Whether user is logged in
- `signOut(): Promise<void>` - Sign out user
- `refreshUser(): Promise<void>` - Refresh user auth state

### AuthService

```typescript
await authService.signUp(email, password, fullName);
await authService.signIn(email, password);
await authService.sendPasswordReset(email);
await authService.signOut();
authService.getCurrentUser();
```

### UserService

```typescript
const user = await userService.getUserProfile(userId);
await userService.updateUserProfile(userId, { name: 'New Name' });
await userService.updateLastLogin(userId);
```

### Cloud Function: sendMediatedMessage

**Callable from client:**
```typescript
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';

const sendMediatedMessage = httpsCallable(functions, 'sendMediatedMessage');
const result = await sendMediatedMessage({
  toUserId: 'user123',
  content: 'Hello!',
  subject: 'Greeting'
});
```

## 🔧 Configuration

### Environment-Specific Config

Create `.env` files for different environments:

```bash
# .env.production
VITE_FIREBASE_PROJECT_ID=myapp-prod
VITE_FIREBASE_AUTH_DOMAIN=myapp-prod.firebaseapp.com

# .env.staging
VITE_FIREBASE_PROJECT_ID=myapp-staging
VITE_FIREBASE_AUTH_DOMAIN=myapp-staging.firebaseapp.com
```

Then update `src/services/firebase.ts`:

```typescript
const config = {
  production: { /* prod config */ },
  staging: { /* staging config */ },
  development: { /* dev config */ }
}[process.env.NODE_ENV || 'development'];
```

## 🐛 Troubleshooting

### Build Errors

**"Cannot find module 'react'"**
- Run `npm install` to ensure dependencies are installed
- Clear cache: `expo prebuild --clean`

**"Firebase config not found"**
- Check `src/services/firebase.ts` has valid config
- Verify placeholder values are replaced with real keys

### Runtime Errors

**"User not authenticated"**
- Check auth state: `console.log(user)` in AuthContext
- Verify Firestore rules allow read on users collection
- Check browser console for Firebase errors

**"Messages collection is empty"**
- Verify Cloud Functions deployed: `firebase deploy --only functions`
- Check Firestore rules allow Cloud Functions to write
- Test Cloud Function: `firebase functions:log`

### Performance Issues

- Enable production mode: `expo publish`
- Use React DevTools Profiler
- Monitor Firestore usage in Firebase Console
- Check Network tab in browser DevTools

## 🚢 Deployment

### Web Deployment (Recommended)

**Expo.dev (easiest):**
```bash
expo publish
```

**Firebase Hosting:**
```bash
npm run web
firebase deploy --only hosting
```

**Vercel/Netlify:**
```bash
npm run build
# Deploy build/ directory
```

### Mobile Deployment

**Android:**
```bash
expo build --platform android
# Or
eas build --platform android
```

**iOS:**
```bash
expo build --platform ios
# Or
eas build --platform ios
```

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Native Docs](https://reactnative.dev)

## 📝 License

This project is provided as-is for development purposes. Customize for your own project.

## ⚡ Next Steps

1. ✅ Replace Firebase config in `src/services/firebase.ts`
2. ✅ Enable Email/Password auth in Firebase Console
3. ✅ Deploy Firestore and Storage rules
4. ✅ Deploy Cloud Functions: `firebase deploy --only functions`
5. ✅ Run `npm start` or `npm run web`
6. ✅ Test signup/login flow
7. ✅ Push to GitHub and invite team members

## 💡 Customization Tips

### Add a New Screen
1. Create `src/screens/NewScreen.tsx`
2. Add route in navigation stack
3. Update sidebar items in `MainScreen.tsx`

### Add Database Collection
1. Create Firestore collection rules in `firestore.rules`
2. Create service in `src/services/`
3. Add context if needed for state management

### Customize Colors
1. Edit `src/theme/colors.ts`
2. Update all component style references
3. Test responsive behavior

---

## 📊 Rate Analysis - Phase 2 (BOQ Parsing + Parsed BOQ UI)

**Phase 2 Deliverables**: Complete BOQ parsing engine with master parser supporting 19 parsing scenarios, editable parsed BOQ table with inline editing, validation, revisions, and export capabilities.

### Features Implemented

1. **Master BOQ Parser** (`services/boqParser.ts`)
   - Supports Excel (.xlsx, .xls) and CSV file parsing using SheetJS
   - Implements 19 parsing scenarios covering all edge cases:
     - **Scenario 1**: Direct items with all fields (SrNo, Desc, Qty, Rate, Amount)
     - **Scenario 2**: Main items with sub-items (hierarchical structure)
     - **Scenario 3**: Multi-line descriptions (continuation rows)
     - **Scenario 4-5**: Section/Category headings detection (ALL CAPS, no values)
     - **Scenario 6**: Nested numbering (1.0, 1.1, 1.1.1)
     - **Scenario 7-8**: Direct and hierarchical item structures
     - **Scenario 10**: Item code extraction (DSR, CPWD, IS, PWD, MoRTH, SOR)
     - **Scenario 11**: Lump-sum detection (no qty/unit, has amount)
     - **Scenario 12**: Alternative items grouping (10A, 10B, 10-1)
     - **Scenario 13**: Split rates consolidation (material + labour)
     - **Scenario 14**: Subtotal and Grand Total detection
     - **Scenario 15**: Remark/Note row detection
     - **Scenario 19**: Page header/footer filtering
   - Smart header mapping with fuzzy matching (50+ header variants)
   - Currency detection and normalization (₹, Rs, INR, USD, EUR, GBP)
   - Automatic amount/rate calculation when values are missing
   - Multi-sheet support with sheet name tagging
   - Comprehensive parse report with warnings and confidence scores

2. **Parsed BOQ Table** (`components/ParsedBOQTable.tsx`)
   - Fully editable table with inline editing for Description, Unit, Quantity, Rate, ItemCode
   - Auto-calculation of Amount (qty × rate) on edit
   - Validation system with real-time warnings:
     - Negative value detection
     - Amount consistency checks (tolerance: 0.5%)
     - NaN value detection
     - Quick-fix suggestions for each warning
   - Row-level features:
     - Selection checkboxes for bulk operations
     - Modified row highlighting (blue background)
     - Warning indicators (orange left border)
     - Revert button for edited rows
   - Category/Section collapsible rows
   - Special row types:
     - Section headers (collapsible)
     - Subtotal/Grand Total rows (styled)
     - Remark rows (yellow background)
     - Lump-sum items (badge)
     - Alternative groups (ALT badge)
   - Item code badges (green)
   - Currency-aware amount display (₹ with Indian locale)
   - Toolbar actions:
     - Save with revision tracking
     - Export (Excel/CSV/JSON)
     - Apply Master Rates (placeholder for Phase 3)
     - Validation panel toggle
   - Parse report summary footer

3. **BOQ Parse Settings Modal** (`components/BOQParseSettings.tsx`)
   - Interactive header mapping UI (shown when parser confidence < 0.6)
   - Visual column mapping with:
     - Detected headers preview
     - Canonical field selection
     - Column-to-field mapping interface
     - Required field validation (red badges)
   - Preview of first 10 rows with mapping applied
   - Auto-fix suggestions for ambiguous headers
   - Save mapping as template (Phase 3 feature)

4. **Updated BOQ Upload Widget** (`components/BOQUploadWidget.tsx`)
   - Integrated with parser - automatic parsing on file upload
   - Real-time parsing with progress indicator
   - Parse result display with summary (rows parsed, skipped, warnings)
   - Error handling with user-friendly messages
   - Support for .xlsx, .xls, .csv files

5. **Tender Type Extensions** (`types/tender.ts`)
   - Added `parsedBoq: StandardBOQRow[]` - Stores parsed BOQ data
   - Added `parsedAt: Timestamp` - Parse timestamp
   - Added `parsedBy: string` - User who parsed
   - Added `boqRevisions: BOQRevision[]` - Revision history

6. **Updated Rate Analysis Tender Detail** (`screens/RateAnalysisTenderDetail.tsx`)
   - Integrated ParsedBOQTable component
   - Parse settings modal integration
   - Firestore persistence for parsed BOQ and revisions
   - Export functionality (Excel/CSV/JSON)
   - Real-time BOQ loading from Firestore
   - Empty state when no parsed BOQ exists

### Standardized BOQ Schema

Every parsed row is normalized to this exact schema:

```typescript
interface StandardBOQRow {
  srNo: string;              // Original SrNo (e.g., "10", "10A", "1.1")
  category: string;          // Section/category heading
  subCategory: string;       // Trade/subsection
  description: string;       // Full merged description
  unit: string;              // e.g., m³, m², nos, LS
  quantity: number;          // Numeric quantity (0 if missing)
  tenderRate: number;        // Numeric rate per unit
  tenderAmount: number;      // Numeric amount
  itemCode: string | null;   // Extracted item code (DSR/CPWD) or null
  currency: string | null;   // e.g., INR, USD, or null
  lumpSum: boolean;          // true if lump-sum item
  altGroup: string | null;   // Group ID for alternatives (base srNo)
  remark: boolean;           // true if note/remark row
  subtotal: boolean;         // true if subtotal row
  grandTotal: boolean;       // true if Grand Total
  sheetName: string | null;  // Source sheet name
  rawRowIndex: number;       // Original sheet row index
  original: any;             // Original row raw values
}
```

### BOQ Parser Tuning & Edge Cases

#### Header Mapping Dictionary

The parser recognizes 50+ header variants across 8 canonical fields:

- **SrNo**: srno, s.no, sr, item no, itemno, sl no, slno, serial, no, item_no, s_no, sr.no, sr no
- **Description**: description, item description, work, item, particulars, work description, desc, details
- **Unit**: unit, uom, u.o.m, units, measure
- **Quantity**: qty, quantity, qnty, qty., quntity, quant, amount_qty
- **Rate**: rate, unit rate, rate per, unit_rate, price, ratepers
- **Amount**: amount, total, value, total amount, total_amount, sum
- **ItemCode**: code, item code, dsr, cpwd, item_code, itemcode, reference
- **Remark**: remarks, remark, note, notes, comments

#### Known Edge Cases

1. **Low Confidence Headers** (confidence < 0.6):
   - Parser will show BOQParseSettings modal for manual mapping
   - User can drag/drop or select correct column mappings
   - Preview shows first 10 rows with mapping applied

2. **Multi-Sheet BOQs**:
   - All sheets are parsed by default
   - Can specify `sheetName` in parse options to parse single sheet
   - Each row tagged with `sheetName` for traceability

3. **Merged Cells**:
   - Currently treated as-is (propagation not fully implemented)
   - **Phase 3 TODO**: Implement full merged cell propagation

4. **Currency Normalization**:
   - Removes: ₹, Rs., Rs, INR, $, USD, €, EUR, £, GBP
   - Removes: commas (thousands separators)
   - Handles: bracketed negatives (123) → -123

5. **Missing Values**:
   - If Amount missing: `amount = qty × rate`
   - If Rate missing: `rate = amount / qty`
   - If Qty missing: `qty = amount / rate`

6. **Split Rates** (Material + Labour):
   - **Phase 2 Limitation**: Not fully implemented
   - **Expected behavior**: `tenderRate = materialRate + labourRate`
   - **Workaround**: Pre-process Excel to consolidate rates

7. **Item Code Patterns**:
   - Regex patterns: `DSR-\d+`, `CPWD-\d+`, `IS-\d+`, `PWD-\d+`, `MoRTH-\d+`, `SOR-\d+`
   - Extracts from both ItemCode column and Description text

8. **Large Files** (>5MB or >50k rows):
   - **Phase 2 Limitation**: Runs in main thread (may block UI)
   - **Phase 3 TODO**: Offload to Web Worker / native module
   - **Recommendation**: Use file size check and show progress

#### Parser Confidence Scoring

- **High Confidence** (≥ 0.8): Auto-parse, no user interaction
- **Medium Confidence** (0.6 - 0.8): Auto-parse with warnings
- **Low Confidence** (< 0.6): Show BOQParseSettings modal

Confidence = (matched headers) / (total canonical headers)

### Testing Phase 2

To verify Rate Analysis Phase 2 implementation:

1. **Launch the app**:
   ```bash
   npm start
   # or
   npx expo start
   ```

2. **Navigate to Rate Analysis**:
   - Click "Rate Analysis" in sidebar
   - Open any tender from the list

3. **Upload a BOQ File**:
   - Click "Select BOQ File" in BOQ Upload widget
   - Choose a .xlsx or .csv file
   - Parser runs automatically
   - Success alert shows: "Parsed X rows, Skipped Y rows, Warnings Z"

4. **Verify Parse Settings** (if low confidence):
   - If header mapping confidence < 0.6, Parse Settings modal appears
   - Review detected column mappings
   - Adjust mappings if needed
   - Click "Confirm & Parse"

5. **Inspect Parsed BOQ Table**:
   - Table displays all parsed rows with standardized schema
   - Category rows are collapsible (click ▶/▼)
   - Row types indicated: Subtotal, Grand Total, Remark, Lump Sum, Alt Groups

6. **Edit BOQ Data**:
   - Click any Description, Unit, Qty, or Rate cell to edit
   - Amount auto-recalculates on Qty or Rate change
   - Modified rows highlighted in blue
   - Click ↶ revert button to undo changes

7. **Validation Warnings**:
   - Click "⚠️ Warnings" button to view validation issues
   - Negative values, amount mismatches, NaN values flagged
   - Click "Quick Fix" button to apply suggested fix

8. **Save Parsed BOQ**:
   - Click "💾 Save (X)" button (X = number of modified rows)
   - Revision created and saved to Firestore
   - Success alert: "BOQ saved successfully"

9. **Export BOQ**:
   - Click "📥 Export" button
   - Choose format: Excel (.xlsx) or CSV (.csv) or JSON (.json)
   - File downloads with standardized schema

10. **Verify Persistence**:
    - Refresh page or navigate away and back
    - Parsed BOQ should load automatically from Firestore
    - `parsedBoq`, `parsedAt`, `parsedBy` fields populated

### Unit Tests

Run parser and component tests:

```bash
npm test
```

**Test coverage includes:**

- `boqParser.test.ts`: 19+ scenarios
  - Direct items, main+sub items, multi-line descriptions
  - Section headings, subtotals, grand totals, remarks
  - Lump-sum, alternative groups, item codes
  - Currency normalization, missing value calculation
  - Header mapping, multi-sheet parsing

- `ParsedBOQTable.test.tsx`:
  - Render parsed rows
  - Validation warnings
  - Amount recalculation on edit
  - Empty state, Export functionality

### Phase 3 Roadmap

1. **Cloud Parsing Lambda** for very large BOQs (>5MB)
2. **AI-assisted header mapping** suggestions
3. **Master Rate Matching** - fuzzy match descriptions with master rates database
4. **Rate Builder Modal** - detailed rate breakdown (materials, labour, plant, etc.)
5. **Revision Comparison** - side-by-side diff of two revisions
6. **BOQ Templates** - save header mappings for reuse
7. **Web Worker Parsing** - offload to background thread
8. **Mobile File Picker** - native file selection on iOS/Android
9. **OCR for PDF BOQs** - extract tables from PDF files
10. **Bulk Operations** - apply rate, mark lump-sum, group alternatives

---

## 📊 Rate Analysis - Phase 1

**Phase 1 Deliverables**: UI shell for Rate Analysis module with tender cards, tender detail view, and BOQ upload (filename storage only). No parsing or Rate Builder in Phase 1.

### Features Implemented

1. **Rate Analysis List Screen** (`RateAnalysisList.tsx`)
   - Real-time tender subscription from existing app data
   - Responsive grid layout (1/2/3 columns for mobile/tablet/desktop)
   - Tender cards with all key information
   - Empty state with "Create New Tender" button
   - Navigation to tender detail view

2. **Rate Analysis Tender Card** (`RateAnalysisTenderCard.tsx`)
   - Displays: Tender ID, Title, Client/Department, Deadline with urgency colors
   - Shows: Estimated Value (formatted currency), Status Badge (color-coded), Progress indicator
   - Deadline urgency: Red text when ≤3 days remaining
   - Status colors: Upcoming (gray), Active (blue), Submitted (indigo), Won (green), Lost (red)
   - Fully clickable with keyboard accessibility

3. **Tender Detail Screen** (`RateAnalysisTenderDetail.tsx`)
   - Back button and breadcrumb navigation
   - Selected Tender widget showing key tender information
   - BOQ Upload widget (right column)
   - BOQ table placeholder with sample structure
   - Phase 2 notice for upcoming features

4. **BOQ Upload Widget** (`BOQUploadWidget.tsx`)
   - File selection for .xlsx, .xls, .pdf files (web only in Phase 1)
   - Filename storage (no parsing yet - Phase 2 feature)
   - Visual feedback for uploaded files
   - Replace file functionality

5. **BOQ Table Placeholder** (`BOQTablePlaceholder.tsx`)
   - Sample BOQ table structure
   - Disabled "Open Rate" buttons with "Phase 2" labels
   - Empty state when no BOQ items exist
   - Phase 2 notice for Rate Builder modal

### Testing Phase 1

To verify Rate Analysis Phase 1 implementation:

1. **Launch the app**:
   ```bash
   npm start
   # or
   expo start
   ```

2. **Navigate to Rate Analysis**:
   - Click the "Rate Analysis" (🧮) menu item in the sidebar
   - You should see the Rate Analysis List screen

3. **Verify Tender Cards Load**:
   - Tenders should load automatically from existing app data (tenderService)
   - Each card should display: ID, title, client, deadline (with days left), value, status badge, progress
   - Cards with deadlines ≤3 days should show red urgency text

4. **Click a Tender Card**:
   - Click any tender card or "Open →" button
   - Should navigate to Rate Analysis Tender Detail screen
   - Should show back button, breadcrumb, and tender info widget

5. **Upload BOQ File** (Web only):
   - Click "Select BOQ File" in the BOQ Upload widget
   - Choose an .xlsx, .xls, or .pdf file
   - Filename should be stored and displayed
   - Alert should confirm: "BOQ parsing will be available in Phase 2"

6. **Verify BOQ Table**:
   - BOQ table section should be visible (empty state if no items)
   - "Open Rate" buttons should be disabled with "Phase 2" label
   - Phase 2 notice should be prominently displayed

7. **Test Navigation**:
   - Back button should return to Rate Analysis list
   - Sidebar "Rate Analysis" menu should remain active
   - "+ New Tender" button should navigate to Add Tender Form

### Phase 2 Roadmap

Features planned for Phase 2:
- BOQ file parsing (Excel/PDF extraction)
- Rate Builder modal with analysis tools
- "Open Rate" functionality enabled
- BOQ item editing and management
- Rate calculation and breakdown
- Rate comparison and history

### Unit Tests

Run Rate Analysis tests:
```bash
npm test -- RateAnalysisTenderCard.test
npm test -- RateAnalysisList.test
```

---

**Built with React Native • Expo • Firebase • React Navigation**

For questions or issues, check the [Troubleshooting](#-troubleshooting) section or review the [Resources](#-resources).
