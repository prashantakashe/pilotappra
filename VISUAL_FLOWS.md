# Visual Flow Diagrams

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER AUTHENTICATION FLOW                      │
└─────────────────────────────────────────────────────────────────┘

SIGN UP
═══════════════════════════════════════════════════════════════════
SignUpScreen
    ↓
    │ User enters: name, email, password, confirm
    ↓
Validate Form (Client-Side)
    ├─ Name: min 2 chars ✓
    ├─ Email: valid format ✓
    ├─ Password: 8+ chars, uppercase, number, special ✓
    └─ Confirm matches Password ✓
    ↓
authService.signUp(email, password, name)
    ↓
Firebase Auth: createUserWithEmailAndPassword()
    ├─ Success: User created in Firebase Auth
    └─ Error: Throw error (email already exists, etc.)
    ↓
Create Firestore Document (/users/{uid})
    ├─ name
    ├─ email
    ├─ role: "user"
    ├─ createdAt: serverTimestamp()
    └─ lastLogin: serverTimestamp()
    ↓
sendEmailVerification()
    ↓
Show: "Check your email to verify"
    ↓
User clicks email link
    ↓
User verified, can now login


LOGIN
═══════════════════════════════════════════════════════════════════
LoginScreen
    ↓
    │ User enters: email, password
    ↓
Validate (Client-Side)
    ├─ Email not empty ✓
    ├─ Password not empty ✓
    └─ Email format valid ✓
    ↓
authService.signIn(email, password)
    ↓
Firebase Auth: signInWithEmailAndPassword()
    ├─ Success: User authenticated
    └─ Error: Throw error
    ↓
AuthContext watches onAuthStateChanged()
    ↓
user object set in context
    ↓
Navigation automatically switches to AppNavigator
    ↓
Dashboard shown


LOGOUT
═══════════════════════════════════════════════════════════════════
ProfileScreen: Click "Logout"
    ↓
    │ Confirm dialog
    ↓
authService.signOut()
    ↓
Firebase Auth: signOut()
    ↓
AuthContext watches change
    ↓
user object set to null
    ↓
Navigation automatically switches to AuthNavigator
    ↓
Login screen shown


SESSION PERSISTENCE
═══════════════════════════════════════════════════════════════════
App starts
    ↓
onAuthStateChanged() listener attached
    ↓
Firebase checks cached token
    ├─ Valid token → user object populated
    ├─ Invalid token → user set to null
    └─ No token → user set to null
    ↓
Navigation renders based on user state
    ↓
If user exists → show Dashboard
If user null → show Login
```

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                              │
│  (Entry point, sets up Navigation & Auth Provider)         │
└──────────────────────┬──────────────────────────────────────┘
                       │
           ┌───────────┴────────────┐
           ↓                        ↓
    ┌──────────────────┐    ┌───────────────────┐
    │ NavigationContainer│    │AuthProvider      │
    │ (React Navigation) │    │(Auth State Mgmt) │
    └──────┬───────────┘    └───┬────────────────┘
           │                    │
           │  uses              │
           ↓                    ↓
    ┌──────────────────────────────────────┐
    │       RootNavigator                  │
    │ (Decides: Auth Stack or App Stack)  │
    └──────────────┬───────────────────────┘
                   │
        ┌──────────┴──────────┐
        ↓                     ↓
    ┌──────────────┐    ┌──────────────┐
    │ AuthNavigator│    │ AppNavigator │
    │ (Not logged) │    │ (Logged in)  │
    └──┬───────┬──┘    └──────┬───────┘
       │       │              │
    ┌──┴─┐ ┌──┴───┐    ┌──────┴─────┐
    │    │ │      │    │            │
    ↓    ↓ ↓      ↓    ↓            ↓
   Login SignUp Forgot MainScreen  Stack
                Pass  (wrapper)
                        │
                    ┌───┴────┐
                    ↓        ↓
                Dashboard  Profile
                (inside MainScreen)
```

## Firestore Data Structure

```
┌─────────────────────────────────────────────────────────────┐
│              FIRESTORE DATABASE STRUCTURE                   │
└─────────────────────────────────────────────────────────────┘

users/ collection
═════════════════════════════════════════════════════════════
├─ {uid1}/
│  ├─ name: "John Doe"
│  ├─ email: "john@example.com"
│  ├─ role: "user"
│  ├─ createdAt: Timestamp
│  └─ lastLogin: Timestamp
│
├─ {uid2}/
│  └─ [same structure]
│
└─ [more users...]

Security:
  ✓ Users can read/write only their own document
  ✗ Users cannot delete their document
  ✗ Other users cannot read this document


messages/ collection (Server-created only)
═════════════════════════════════════════════════════════════
├─ {msgId1}/
│  ├─ fromUserId: "user123"
│  ├─ toUserId: "user456"
│  ├─ content: "Hello!"
│  ├─ subject: "Greeting"
│  ├─ status: "new"
│  ├─ createdAt: Timestamp
│  └─ updatedAt: Timestamp
│
└─ [more messages...]

Security:
  ✗ Clients CANNOT create messages directly
  ✓ Clients can read if sender OR recipient
  ✗ Clients cannot modify or delete
  ✓ Only Cloud Functions can create


audit_logs/ collection (Server-created only)
═════════════════════════════════════════════════════════════
├─ {logId1}/
│  ├─ action: "MESSAGE_SENT"
│  ├─ performedBy: "user123"
│  ├─ messageId: "msg789"
│  ├─ timestamp: Timestamp
│  └─ meta: { contentLength: 45 }
│
└─ [more logs...]

Security:
  ✗ Clients CANNOT create logs
  ✗ Clients cannot read these logs
  ✓ Only Cloud Functions write
  ✓ Only admins can read (via Firebase Admin SDK)
```

## Navigation Stack Structure

```
┌─────────────────────────────────────────────────────────────┐
│                   NAVIGATION STACKS                         │
└─────────────────────────────────────────────────────────────┘

UNAUTHENTICATED STATE
═════════════════════════════════════════════════════════════
RootNavigator
└─ AuthNavigator (Stack)
   ├─ LoginScreen (default)
   │  └─ Links: SignUp, ForgotPassword
   │
   ├─ SignUpScreen
   │  └─ Link: Back to Login
   │
   └─ ForgotPasswordScreen
      └─ Link: Back to Login

Navigation:
  • User scrolls through screens
  • No authentication required
  • Can go back to Login from any screen


AUTHENTICATED STATE
═════════════════════════════════════════════════════════════
RootNavigator
└─ AppNavigator (Stack)
   └─ DrawerNavigator (Drawer)
      │
      ├─ DashboardStack
      │  └─ DashboardScreen
      │     (inside MainScreen wrapper)
      │
      └─ ProfileStack
         └─ ProfileScreen
            (inside MainScreen wrapper)

MainScreen (Wrapper for all authenticated screens)
├─ TopBar
│  ├─ Burger menu (toggles sidebar)
│  ├─ Title
│  └─ User avatar (goes to profile)
│
├─ SideBar (responsive)
│  ├─ On Mobile: Overlay when opened
│  ├─ On Tablet: Overlay when opened
│  ├─ On Desktop: Always visible (260px)
│  │
│  └─ Menu items:
│     ├─ Dashboard
│     ├─ Profile
│     └─ Logout
│
└─ Content Area (flex: 1)
   ├─ DashboardScreen or
   └─ ProfileScreen

Navigation:
  • User logged in
  • Cannot go back to Login
  • Sidebar toggles on mobile/tablet
  • Always visible on desktop
```

## Responsive Design Breakpoints

```
┌─────────────────────────────────────────────────────────────┐
│            RESPONSIVE DESIGN BREAKPOINTS                    │
└─────────────────────────────────────────────────────────────┘

MOBILE (≤ 480px)
═════════════════════════════════════════════════════════════
┌──────────────────────┐
│     TopBar (60px)    │
│ [Burger] Title [👤] │
├──────────────────────┤
│                      │
│   Full width         │
│   Content Area       │
│   (padding: 16)      │
│                      │
│   Single column      │
│   Buttons full width │
│                      │
└──────────────────────┘

SideBar: Overlay (260px width)
  • Opens from left when burger clicked
  • Closes when item selected
  • Has drop shadow


TABLET (481 - 900px)
═════════════════════════════════════════════════════════════
┌────────────────────────────────────┐
│       TopBar (60px)                │
│ [Burger] Title             [👤]    │
├────────────────────────────────────┤
│                                    │
│   Wider Content Area               │
│   (padding: 24, max-width: 80%)   │
│                                    │
│   2 columns layout                 │
│   Larger fonts                     │
│                                    │
└────────────────────────────────────┘

SideBar: Still overlay
  • Opens from left on burger click
  • Does NOT persist


DESKTOP (> 900px)
═════════════════════════════════════════════════════════════
┌────────────────────┬────────────────────────────┐
│   TopBar (60px)                                 │
├────────────────────┼────────────────────────────┤
│ SideBar            │  Content Area              │
│ (260px, fixed)     │                            │
│                    │  ┌──────────┬──────────┐  │
│ • Dashboard        │  │  Card    │  Card    │  │
│ • Profile          │  ├──────────┼──────────┤  │
│ • Logout           │  │  Card    │  Card    │  │
│                    │  └──────────┴──────────┘  │
│                    │                            │
│ (Always visible)   │  (flex: 1, uses full)     │
│                    │                            │
└────────────────────┴────────────────────────────┘

SideBar: Persistent
  • Always visible on left
  • No overlay
  • Width: 260px (fixed)


RESPONSIVE CALCULATIONS
═════════════════════════════════════════════════════════════
const { width } = useWindowDimensions();

if (width <= 480) {
  // Mobile styles
  // - Full width containers
  // - Single column
  // - Overlay sidebar
}

else if (width <= 900) {
  // Tablet styles
  // - Wider containers (80% max)
  // - Still overlay sidebar
}

else {
  // Desktop styles
  // - Persistent sidebar
  // - Multi-column layout
  // - More whitespace
}
```

## Security Rules Flow

```
┌─────────────────────────────────────────────────────────────┐
│            FIRESTORE SECURITY RULES FLOW                    │
└─────────────────────────────────────────────────────────────┘

READ /users/{uid}
═════════════════════════════════════════════════════════════
Client Request
  │
  └─→ Is user authenticated?
      ├─ NO  → DENY ✗
      └─ YES → Check UID match
              ├─ request.auth.uid == uid?
              │ ├─ YES → ALLOW ✓
              │ └─ NO  → DENY ✗

USER PROFILE READ DENIED EXAMPLES:
  • User not logged in          → DENY
  • Trying to read other user   → DENY
  • User can only read own data → ALLOW


CREATE /messages/{id}
═════════════════════════════════════════════════════════════
Client Request
  │
  └─→ Allow create?
      └─ NO (always false)      → DENY ✗

Cloud Function Request
  │
  └─→ Allow create?
      └─ YES (functions are trusted) → ALLOW ✓

(Clients NEVER create messages)


READ /messages/{id}
═════════════════════════════════════════════════════════════
Client Request
  │
  └─→ Is user authenticated?
      ├─ NO  → DENY ✗
      └─ YES → Check if participant
              ├─ fromUserId == request.auth.uid?
              │ ├─ YES → ALLOW ✓
              │ └─ NO
              │
              └─ toUserId == request.auth.uid?
                 ├─ YES → ALLOW ✓
                 └─ NO  → DENY ✗

MESSAGE VISIBILITY:
  • Only sender can read           → YES ✓
  • Only recipient can read        → YES ✓
  • Other users cannot read        → NO ✗
  • Clients cannot read audit logs → NO ✗


STORAGE RULES
═════════════════════════════════════════════════════════════
READ/WRITE /profiles/{userId}/*
  │
  └─→ request.auth.uid == userId?
      ├─ YES → ALLOW ✓
      └─ NO  → DENY ✗

STORAGE ACCESS:
  • User can read own profile    → YES ✓
  • User can write own profile   → YES ✓
  • User cannot read other's     → NO ✗
  • User cannot write other's    → NO ✗
```

## Cloud Functions Flow

```
┌─────────────────────────────────────────────────────────────┐
│              CLOUD FUNCTIONS FLOW                           │
└─────────────────────────────────────────────────────────────┘

CLIENT CALLS: sendMediatedMessage()
═════════════════════════════════════════════════════════════

Client Code (React)
│
└─→ httpsCallable('sendMediatedMessage')({
    toUserId: 'user456',
    content: 'Hello',
    subject: 'Hi'
  })
  │
  └─→ [Firebase sends to Cloud Function]


CLOUD FUNCTION RECEIVES
═════════════════════════════════════════════════════════════

sendMediatedMessage(data, context)
│
├─→ Check: Is user authenticated?
│  ├─ NO  → throw HttpsError 'unauthenticated'
│  └─ YES → Continue
│
├─→ Validate: data contains toUserId & content?
│  ├─ NO  → throw HttpsError 'invalid-argument'
│  └─ YES → Continue
│
├─→ Check: Recipient exists?
│  ├─ NO  → throw HttpsError 'not-found'
│  └─ YES → Continue
│
├─→ Create Message Document
│  ├─ fromUserId: context.auth.uid (sender)
│  ├─ toUserId: data.toUserId (recipient)
│  ├─ content: data.content
│  ├─ status: 'new'
│  └─ createdAt: serverTimestamp()
│
├─→ Create Audit Log
│  ├─ action: 'MESSAGE_SENT'
│  ├─ performedBy: context.auth.uid
│  └─ timestamp: serverTimestamp()
│
└─→ Return Success Response


CLIENT RECEIVES RESPONSE
═════════════════════════════════════════════════════════════

{ success: true, messageId: 'msg123' }
│
└─→ Show "Message sent!" to user


ERROR SCENARIOS
═════════════════════════════════════════════════════════════

No Auth Token
→ throw 'unauthenticated' error
→ Client shows "Please login to send message"

Invalid Data
→ throw 'invalid-argument' error
→ Client shows "Please fill all fields"

Recipient Not Found
→ throw 'not-found' error
→ Client shows "Recipient doesn't exist"

Database Error
→ throw 'internal' error
→ Client shows "Error sending message, try again"
```

---

Use these diagrams to understand how the application works internally!
