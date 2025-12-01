# Architecture & Technical Design

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React Native App (Expo)              │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Navigation Layer                                  │ │
│  │  - AuthNavigator (Login, SignUp, ForgotPassword)  │ │
│  │  - AppNavigator (Dashboard, Profile)              │ │
│  └────────────────────────────────────────────────────┘ │
│                            │                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Authentication Context (AuthProvider)            │ │
│  │  - Manages user state globally                    │ │
│  │  - Listens to onAuthStateChanged                  │ │
│  └────────────────────────────────────────────────────┘ │
│                            │                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Services Layer                                    │ │
│  │  - AuthService (signup, login, logout)           │ │
│  │  - UserService (profile, update)                 │ │
│  │  - FirebaseService (initialization)              │ │
│  └────────────────────────────────────────────────────┘ │
│                            │                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Theme & Utils                                     │ │
│  │  - Colors, Spacing constants                      │ │
│  │  - Validators, Error mappers                      │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────┐
│              Firebase Backend (Cloud)                    │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Authentication (Email/Password)                  │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Firestore Database                               │ │
│  │  - /users/{uid} - User profiles                   │ │
│  │  - /messages/{id} - Mediated messages             │ │
│  │  - /audit_logs/{id} - Activity logs               │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Cloud Storage                                     │ │
│  │  - /profiles/{uid}/ - User profile data           │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Cloud Functions                                   │ │
│  │  - sendMediatedMessage() - Secure messaging       │ │
│  │  - createUserRecord() - User lifecycle            │ │
│  │  - deleteUserRecord() - Cleanup                   │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Authentication Flow

### Sign Up Flow
```
1. User fills form (name, email, password)
2. Client validates locally:
   - Email format
   - Password strength (8+ chars, uppercase, number, special)
   - Confirm password matches
3. AuthService.signUp() called:
   - Firebase createUserWithEmailAndPassword()
   - Create /users/{uid} document in Firestore
   - Send email verification
4. Success:
   - User redirected to verification notice
   - Email sent to user
5. Email verified:
   - User can login
   - AuthContext automatically updates
```

### Login Flow
```
1. User enters email + password
2. Client validates format
3. AuthService.signIn() called:
   - Firebase signInWithEmailAndPassword()
   - AuthContext watches onAuthStateChanged()
   - User object populated
4. Success:
   - Navigation automatically switches to AppNavigator
   - Dashboard displayed
5. Session persists:
   - FirebaseAuth handles token refresh
   - App reopened = still logged in
```

### Logout Flow
```
1. User clicks Logout
2. AuthService.signOut() called:
   - Firebase signOut()
   - User set to null
   - AuthContext notified
3. Navigation automatically switches to AuthNavigator
4. User back at Login screen
```

## State Management

### AuthContext Structure
```typescript
{
  user: User | null              // Firebase Auth user
  loading: boolean               // Auth check in progress
  isAuthenticated: boolean       // user !== null
  signOut: () => Promise<void>  // Logout function
  refreshUser: () => Promise<void>  // Refresh auth token
}
```

### Data Flow
```
Firebase Auth Events
    ↓
onAuthStateChanged() listener
    ↓
AuthContext useEffect
    ↓
user state updated
    ↓
all components re-render
    ↓
RootNavigator switches stacks
```

## Component Architecture

### Page Structure
```
LoginScreen
├── ScrollView (for keyboard handling)
├── Header
│  ├── Logo/Icon
│  └── Title
├── Form
│  ├── InputText (email)
│  ├── PasswordInput (password with toggle)
│  └── ButtonPrimary (submit)
└── Footer
   └── Links (forgot password, sign up)
```

### Component Reusability
```
InputText Component
├── Label (optional)
├── TextInput (RN native)
└── Error message (optional)
Used in: LoginScreen, SignUpScreen, ProfileScreen

PasswordInput Component
├── Label (optional)
├── TextInput + Eye toggle
└── Error message (optional)
Used in: LoginScreen, SignUpScreen

ButtonPrimary Component
├── Title
├── Loading spinner (conditional)
└── Disabled state
Used in: All screens with actions
```

## Data Models

### Users Collection
```json
{
  "uid": "auth_user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "createdAt": "2024-01-01T12:00:00Z",
  "lastLogin": "2024-01-02T15:30:00Z"
}
```

### Messages Collection (Server-created only)
```json
{
  "messageId": "auto_generated",
  "fromUserId": "user123",
  "toUserId": "user456",
  "content": "Hello, this is a message",
  "subject": "Greeting",
  "status": "new",
  "createdAt": "2024-01-02T16:00:00Z",
  "updatedAt": "2024-01-02T16:00:00Z"
}
```

### Audit Logs Collection
```json
{
  "logId": "auto_generated",
  "action": "MESSAGE_SENT",
  "performedBy": "user123",
  "toUser": "user456",
  "messageId": "msg789",
  "timestamp": "2024-01-02T16:00:00Z",
  "meta": {
    "contentLength": 45
  }
}
```

## Security Architecture

### Client-Side Security
```
Form Validation
  ↓
Error Handling
  ↓
Secure Storage (Firebase Auth tokens)
  ↓
No sensitive data in Redux/Context (except user object)
```

### Server-Side Security (Firestore Rules)
```
Rule: /users/{uid}
- read: Only owner (request.auth.uid == uid)
- create/update: Only owner
- delete: Never

Rule: /messages/{id}
- create: Never (only Cloud Functions)
- read: Only sender or recipient
- update/delete: Never

Rule: /* (default)
- All access: Denied
```

### Cloud Functions Security
```
sendMediatedMessage()
├─ Check authentication (required)
├─ Validate input (toUserId, content)
├─ Verify recipient exists
├─ Prevent self-messaging (optional)
├─ Write to messages collection
├─ Log to audit_logs
└─ Return success/error

(Client never directly touches messages collection)
```

## Error Handling Strategy

### Validation Errors (Client-Side)
```
Empty field → Show inline error
Invalid email → Show specific error message
Weak password → Show requirements
Confirm password mismatch → Show inline error
```

### Firebase Errors (Server-Side)
```
auth/user-not-found → "No account found with this email"
auth/wrong-password → "Incorrect password"
auth/email-already-in-use → "Email already registered"
auth/invalid-email → "Invalid email format"
firestore/permission-denied → User not authorized
firestore/not-found → Document doesn't exist
```

### Error Mapping Flow
```
Firebase throws error
    ↓
mapFirebaseError(error.code)
    ↓
Friendly error message returned
    ↓
Alert/Toast shown to user
```

## Responsive Design Strategy

### Mobile-First Approach
```
Base styles: 360px width (mobile)
  ├─ Full-width containers
  ├─ Single column layout
  ├─ Overlay sidebar
  └─ Touch-optimized (48px buttons)

Tablet styles: 481-900px
  ├─ Wider containers (80% width)
  ├─ Still overlay sidebar
  └─ Slightly larger fonts

Desktop styles: >900px
  ├─ Fixed sidebar (260px)
  ├─ Main content (flex: 1)
  ├─ Grid layouts (2+ columns)
  └─ More whitespace
```

### useWindowDimensions Hook
```typescript
const { width } = useWindowDimensions();

if (width <= 480) {
  // Mobile styles
} else if (width <= 900) {
  // Tablet styles
} else {
  // Desktop styles
}
```

## Navigation Stack Structure

### Auth Stack (Unauthenticated)
```
Stack Navigator
├─ LoginScreen (default)
├─ SignUpScreen
└─ ForgotPasswordScreen
(No header, animated transitions)
```

### App Stack (Authenticated)
```
Root Stack
└─ Drawer Navigator
   ├─ Dashboard Stack
   │  └─ DashboardScreen
   └─ Profile Stack
      └─ ProfileScreen

(Both inside MainScreen wrapper)
```

## Performance Optimizations

### Bundle Size
- Tree-shaking enabled (unused code removed)
- Code splitting per screen
- Lazy loading navigation screens
- Minimal dependencies

### Runtime Performance
- useCallback for event handlers
- useMemo for expensive computations
- Avoid inline functions in render
- React.FC for memoization
- ScrollView for list performance

### Network Performance
- Caching enabled on Firestore reads
- Batched writes where possible
- Debounced form validation
- Progressive image loading

## Testing Strategy

### Unit Tests
- Validators (email, password, name)
- Error mapping functions
- Firebase service mocking

### Integration Tests
- Auth flow (signup → login → logout)
- Profile update flow
- Message sending flow

### E2E Tests (Detox)
- User signup journey
- Dashboard navigation
- Profile editing
- Logout

### Manual Testing
- All breakpoints (mobile/tablet/desktop)
- All error scenarios
- Network failure handling
- Token expiration

## Deployment Architecture

### Web
```
npm run web
    ↓
Expo CLI starts dev server
    ↓
React Native Web compiles JSX
    ↓
Chrome DevTools for debugging
    ↓
Firebase emulator optional
```

### Android
```
expo build --platform android
    ↓
EAS Build Service
    ↓
Android APK generated
    ↓
Can test on physical device or emulator
```

### iOS
```
expo build --platform ios
    ↓
EAS Build Service (macOS required)
    ↓
iOS IPA generated
    ↓
Deploy to App Store
```

### Cloud Deployment
```
Firebase Hosting (Web)
├─ Build: npm run build
├─ Deploy: firebase deploy --only hosting
└─ URL: your-project.web.app

Cloud Functions
├─ Code: functions/src/index.ts
├─ Deploy: firebase deploy --only functions
└─ Callable from client

Firestore/Storage
├─ Data: Auto-synced
├─ Rules: firestore.rules, storage.rules
└─ Auto-scaling
```

## Scaling Considerations

### Current Setup
- Fits up to ~10,000 concurrent users
- ~100 GB Firestore storage
- Regional latency OK

### For Scaling (Future)
- Add read replicas for Firestore
- Implement caching (Redis)
- Use CDN for static assets
- Separate regions for different user groups
- API Gateway for rate limiting
- Add monitoring (Sentry, DataDog)

---

This architecture ensures scalability, security, and maintainability as the application grows.
