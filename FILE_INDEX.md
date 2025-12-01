# Complete File Index & Descriptions

## 📋 Root Level Files

| File | Purpose |
|------|---------|
| `App.tsx` | Main application entry point, sets up navigation and auth provider |
| `app.json` | Expo configuration (app name, version, build settings) |
| `package.json` | NPM dependencies and scripts (npm start, npm run web, etc.) |
| `tsconfig.json` | TypeScript compiler configuration |
| `firebase.json` | Firebase CLI configuration for deployments |
| `.firebaserc` | Firebase project ID mapping |
| `.gitignore` | Git ignore patterns (node_modules, .env, etc.) |

## 📚 Documentation Files

| File | Purpose | Audience |
|------|---------|----------|
| `README.md` | Complete project documentation | Developers, stakeholders |
| `SETUP_GUIDE.md` | Step-by-step setup instructions | New developers |
| `QA_TEST_PLAN.md` | Testing scenarios and manual tests | QA team, developers |
| `ARCHITECTURE.md` | Technical design and system overview | Architects, seniors |
| `PROJECT_SUMMARY.md` | Quick navigation and overview | Everyone |

## 🔐 Firebase Configuration Files

| File | Purpose | Location |
|------|---------|----------|
| `firestore.rules` | Firestore security rules (deploy to Firebase) | Root |
| `storage.rules` | Cloud Storage security rules (deploy to Firebase) | Root |
| `functions/package.json` | Cloud Functions dependencies | functions/ |
| `functions/tsconfig.json` | TypeScript config for Cloud Functions | functions/ |
| `functions/src/index.ts` | Cloud Functions code (mediated messages, etc.) | functions/src/ |

## 🏗️ Source Code Structure (`src/`)

### Components (`src/components/`)
Reusable UI components used across screens.

| File | Component | Purpose |
|------|-----------|---------|
| `ButtonPrimary.tsx` | ButtonPrimary | Primary action button with loading state |
| `InputText.tsx` | InputText | Text input with label and error display |
| `PasswordInput.tsx` | PasswordInput | Password field with eye toggle visibility |
| `TopBar.tsx` | TopBar | Top navigation bar with burger menu and profile |
| `SideBar.tsx` | SideBar | Left sidebar navigation (responsive) |

### Screens (`src/screens/`)
Full-page components representing app screens.

| File | Screen | Route | Authentication |
|------|--------|-------|-----------------|
| `LoginScreen.tsx` | Login | `/auth/login` | Not required |
| `SignUpScreen.tsx` | Sign Up | `/auth/signup` | Not required |
| `ForgotPasswordScreen.tsx` | Forgot Password | `/auth/forgot-password` | Not required |
| `MainScreen.tsx` | Main Layout | - | Required |
| `DashboardScreen.tsx` | Dashboard | `/app/dashboard` | Required |
| `ProfileScreen.tsx` | Profile | `/app/profile` | Required |

### Navigation (`src/navigation/`)
Navigation structure and routing logic.

| File | Purpose |
|------|---------|
| `RootNavigator.tsx` | Root navigator - switches between auth/app based on login state |
| `AuthNavigator.tsx` | Stack navigator for login/signup/forgot password |
| `AppNavigator.tsx` | Drawer navigator for dashboard/profile screens |

### Services (`src/services/`)
Business logic and external service integration.

| File | Purpose | Key Functions |
|------|---------|---|
| `firebase.ts` | Firebase initialization | Exports: auth, db, storage |
| `authService.ts` | Authentication logic | signUp(), signIn(), sendPasswordReset(), signOut() |
| `userService.ts` | User profile operations | getUserProfile(), updateUserProfile(), updateLastLogin() |

### Context (`src/contexts/`)
React Context for global state management.

| File | Purpose | Provides |
|------|---------|----------|
| `AuthContext.tsx` | Authentication state provider | user, loading, isAuthenticated, signOut() |

### Theme (`src/theme/`)
Design system constants.

| File | Purpose | Contains |
|------|---------|----------|
| `colors.ts` | Color palette | PRIMARY_LIGHT, ACTION_BLUE, TEXT_PRIMARY, etc. |
| `spacing.ts` | Spacing system | xs, sm, md, lg, xl, xxl values |

### Utils (`src/utils/`)
Utility functions for common operations.

| File | Purpose | Functions |
|------|---------|----------|
| `validators.ts` | Form validation functions | validateEmail(), validatePassword(), validateFullName() |
| `mapFirebaseError.ts` | Firebase error mapping | mapFirebaseError() → friendly error messages |

## 📊 File Size Reference

```
Core Application:
- App.tsx                           ~0.5 KB
- src/contexts/AuthContext.tsx      ~2.0 KB
- src/services/authService.ts       ~2.5 KB
- src/services/userService.ts       ~1.5 KB

Screens:
- LoginScreen.tsx                   ~3.5 KB
- SignUpScreen.tsx                  ~4.5 KB
- ForgotPasswordScreen.tsx          ~2.5 KB
- DashboardScreen.tsx               ~3.0 KB
- ProfileScreen.tsx                 ~5.0 KB

Components:
- PasswordInput.tsx                 ~2.5 KB
- ButtonPrimary.tsx                 ~1.5 KB
- InputText.tsx                     ~1.5 KB
- TopBar.tsx                        ~2.0 KB
- SideBar.tsx                       ~3.5 KB

Total Source: ~40-50 KB (before minification)
```

## 🔄 File Dependencies

### App.tsx depends on:
- `src/contexts/AuthContext.tsx`
- `src/navigation/RootNavigator.tsx`
- `react-navigation`

### AuthContext.tsx depends on:
- `src/services/firebase.ts`
- `src/services/userService.ts`
- `firebase/auth`

### LoginScreen.tsx depends on:
- `src/components/InputText.tsx`
- `src/components/PasswordInput.tsx`
- `src/components/ButtonPrimary.tsx`
- `src/services/authService.ts`
- `src/utils/validators.ts`
- `src/utils/mapFirebaseError.ts`
- `src/theme/colors.ts`
- `src/theme/spacing.ts`

### DashboardScreen.tsx depends on:
- `src/contexts/AuthContext.tsx`
- `src/theme/colors.ts`
- `src/theme/spacing.ts`

## 📝 Configuration References

### Firebase Config (`src/services/firebase.ts`)
Requires these placeholder values to be replaced:
- `REPLACE_API_KEY`
- `REPLACE_PROJECT.firebaseapp.com`
- `REPLACE_PROJECT_ID`
- `REPLACE_PROJECT.appspot.com`
- `REPLACE_SENDER_ID`
- `REPLACE_APP_ID`

### Package Dependencies (`package.json`)
Main packages:
- `react` - UI framework
- `react-native` - Mobile framework
- `expo` - Managed React Native platform
- `@react-navigation/native` - Navigation
- `firebase` - Backend
- `react-hook-form` - Form handling (optional)
- `yup` - Validation (optional)
- `@expo/vector-icons` - Icons

### Dev Dependencies
- `typescript` - Type checking
- `@types/react` - React types
- `@types/react-native` - React Native types

## 🚀 Build Artifacts

### Generated (not in repo)
```
node_modules/           - Installed dependencies
dist/                   - Web build output
build/                  - Android build output
ios/                    - iOS build output
functions/lib/          - Compiled Cloud Functions
.expo/                  - Expo cache
```

## 📂 Project Structure Summary

```
myapp/
├── Root Config
│   ├── App.tsx
│   ├── app.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── firebase.json
│   ├── .firebaserc
│   └── .gitignore
│
├── Documentation
│   ├── README.md
│   ├── SETUP_GUIDE.md
│   ├── QA_TEST_PLAN.md
│   ├── ARCHITECTURE.md
│   └── PROJECT_SUMMARY.md
│
├── Firebase Config
│   ├── firestore.rules
│   ├── storage.rules
│   └── functions/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/index.ts
│
└── Application Code (src/)
    ├── components/
    │   ├── ButtonPrimary.tsx
    │   ├── InputText.tsx
    │   ├── PasswordInput.tsx
    │   ├── TopBar.tsx
    │   └── SideBar.tsx
    ├── contexts/
    │   └── AuthContext.tsx
    ├── navigation/
    │   ├── RootNavigator.tsx
    │   ├── AuthNavigator.tsx
    │   └── AppNavigator.tsx
    ├── screens/
    │   ├── LoginScreen.tsx
    │   ├── SignUpScreen.tsx
    │   ├── ForgotPasswordScreen.tsx
    │   ├── MainScreen.tsx
    │   ├── DashboardScreen.tsx
    │   └── ProfileScreen.tsx
    ├── services/
    │   ├── firebase.ts
    │   ├── authService.ts
    │   └── userService.ts
    ├── theme/
    │   ├── colors.ts
    │   └── spacing.ts
    └── utils/
        ├── validators.ts
        └── mapFirebaseError.ts
```

## 🔗 Key File Relationships

```
App.tsx (Entry)
    ↓
RootNavigator (decides auth vs app)
    ├─→ AuthNavigator
    │   ├─→ LoginScreen (uses InputText, PasswordInput, ButtonPrimary)
    │   ├─→ SignUpScreen (uses InputText, PasswordInput, ButtonPrimary)
    │   └─→ ForgotPasswordScreen
    │
    └─→ AppNavigator
        ├─→ MainScreen (wrapper with TopBar, SideBar)
        │   ├─→ DashboardScreen
        │   └─→ ProfileScreen
        │
        └─→ AuthContext (global state)
            ├─→ firebase.ts
            ├─→ authService.ts
            └─→ userService.ts
```

## 📋 Checklist for File Updates

When customizing the project:

- [ ] Update `firebase.ts` with real Firebase config
- [ ] Update colors in `src/theme/colors.ts`
- [ ] Update spacing if needed in `src/theme/spacing.ts`
- [ ] Customize error messages in `src/utils/mapFirebaseError.ts`
- [ ] Add new validators to `src/utils/validators.ts` if needed
- [ ] Modify firestore.rules for custom collections
- [ ] Update Cloud Functions in `functions/src/index.ts`
- [ ] Customize screens as needed
- [ ] Add new components to `src/components/`
- [ ] Update README.md with project-specific info

---

**All files are ready to use. Start with SETUP_GUIDE.md for implementation steps.**
