# QA Test Plan - React Native (Expo) + Firebase App

## Test Scenarios

### 1. Authentication Tests

#### 1.1 Sign Up Flow
- [ ] Navigate to Sign Up screen
- [ ] Enter invalid email → verify error message
- [ ] Enter valid email, weak password → verify password strength error
- [ ] Enter non-matching confirm password → verify error
- [ ] Fill form with valid data → Create Account button enabled
- [ ] Click Create Account → loading spinner shows
- [ ] Verify success message for email verification
- [ ] Check Firestore: new user document created with correct fields
- [ ] Verify user is redirected or shown verification prompt

#### 1.2 Login Flow
- [ ] Enter non-existent email → "User not found" error
- [ ] Enter wrong password → "Wrong password" error
- [ ] Enter valid credentials → successful login
- [ ] Verify redirect to Dashboard
- [ ] Check AuthContext has user object
- [ ] Verify lastLogin timestamp updated in Firestore

#### 1.3 Forgot Password
- [ ] Click "Forgot Password?" link
- [ ] Enter invalid email → error message
- [ ] Enter valid email → neutral success message shown
- [ ] Verify no account existence is revealed
- [ ] Check Firebase "Password Reset" email sent (in Firebase Console)
- [ ] Click link in email → password reset form
- [ ] Reset password → confirm login works with new password

#### 1.4 Session Persistence
- [ ] Login successfully
- [ ] Close and reopen app
- [ ] Verify user remains logged in (AuthContext has user)
- [ ] Check navigation shows Dashboard (not Login)

#### 1.5 Logout
- [ ] Click Profile → Logout button
- [ ] Confirm logout dialog
- [ ] Verify redirected to Login screen
- [ ] Verify user is null in AuthContext
- [ ] Verify cannot access protected screens

### 2. UI/UX Tests

#### 2.1 Password Input
- [ ] Password field shows dots/asterisks by default
- [ ] Click eye icon → password becomes visible (readable)
- [ ] Click eye icon again → password hidden again
- [ ] Both password fields have independent eye toggle

#### 2.2 Form Validation
- [ ] Empty field → error shown on blur
- [ ] Invalid email → specific error message
- [ ] Email and buttons disabled until form valid
- [ ] Buttons show loading spinner during submission
- [ ] Cannot double-click submit button

#### 2.3 Error Handling
- [ ] Firebase errors mapped to friendly messages
- [ ] Error messages appear under relevant field or as toast
- [ ] Error clears when user corrects input
- [ ] Network error handled gracefully

### 3. Responsive Design Tests

#### 3.1 Mobile (≤480px)
- [ ] All inputs fit without horizontal scroll
- [ ] Buttons full-width
- [ ] TopBar burger icon visible
- [ ] Sidebar overlays when opened
- [ ] No persistent sidebar visible
- [ ] Text readable without zooming

#### 3.2 Tablet (481–900px)
- [ ] Wider layout used
- [ ] Sidebar still overlays (not persistent)
- [ ] Cards display 1-2 per row
- [ ] Inputs maintain 48px height

#### 3.3 Desktop (>900px)
- [ ] Persistent left sidebar (260px width)
- [ ] Sidebar always visible (not overlay)
- [ ] Content area adjusts for sidebar
- [ ] Cards display in grid (2+ columns)
- [ ] TopBar burger icon hidden (sidebar persistent)

### 4. Navigation Tests

#### 4.1 Auth Navigation
- [ ] Login → can navigate to Sign Up
- [ ] Sign Up → can navigate to Login
- [ ] Forgot Password → can navigate back to Login
- [ ] After successful login → redirected to Dashboard

#### 4.2 App Navigation
- [ ] Dashboard → click Profile → navigates to Profile
- [ ] Profile → click Dashboard → navigates back
- [ ] Sidebar items navigate correctly
- [ ] Active menu item highlighted

#### 4.3 Protected Routes
- [ ] Cannot access Dashboard while logged out
- [ ] Cannot access Profile while logged out
- [ ] Redirected to Login if token expires
- [ ] Local navigation works within auth session

### 5. Profile Management Tests

#### 5.1 View Profile
- [ ] Profile screen shows current user info
- [ ] Email field is read-only
- [ ] Name field shows current value

#### 5.2 Edit Profile
- [ ] Click "Edit Profile" button
- [ ] Form enters edit mode
- [ ] Can modify name field
- [ ] Save/Cancel buttons appear
- [ ] Click Save → loading spinner
- [ ] Success message shown
- [ ] Profile document updated in Firestore
- [ ] Click Cancel → changes discarded, back to view mode

### 6. Firestore Security Tests

#### 6.1 Rules Validation (Firebase Emulator)
- [ ] Client cannot create message (fails)
- [ ] Client cannot read other user's profile (fails)
- [ ] Client can read own profile (succeeds)
- [ ] Client can create own profile (succeeds)
- [ ] Cloud Function can create messages (succeeds)

#### 6.2 PII Protection
- [ ] User emails not visible in public collections
- [ ] Profile photos accessible only by owner
- [ ] Audit logs don't expose user emails

### 7. Cloud Functions Tests

#### 7.1 sendMediatedMessage (if implemented)
- [ ] Function requires authentication (fails without token)
- [ ] Function requires toUserId and content
- [ ] Function creates message document with correct fields
- [ ] Message visible to sender and recipient only
- [ ] Message NOT visible to other users
- [ ] fromUserId and toUserId correctly set
- [ ] Timestamp auto-generated server-side

### 8. Performance Tests

#### 8.1 Loading Performance
- [ ] App starts within 3 seconds
- [ ] Screens load without lag
- [ ] No janky animations
- [ ] Smooth 60fps scrolling

#### 8.2 Data Loading
- [ ] Dashboard loads user data quickly
- [ ] Profile loads without delay
- [ ] Sidebar renders smoothly
- [ ] No unnecessary re-renders (check React DevTools)

### 9. Accessibility Tests

#### 9.1 Keyboard Navigation
- [ ] Tab through login form fields
- [ ] Submit form with Enter key
- [ ] Focus visible on all inputs

#### 9.2 Screen Reader
- [ ] Text fields labeled correctly
- [ ] Buttons have descriptive labels
- [ ] Icons have alt text or labels

#### 9.3 Color Contrast
- [ ] TEXT_PRIMARY (#222) on WHITE (#FFF) ✓
- [ ] ACTION_BLUE (#1E90FF) on WHITE ✓
- [ ] TEXT_SECONDARY (#666) on WHITE meets WCAG AA

### 10. Cross-Platform Tests

#### 10.1 Web (Expo)
- [ ] `npm run web` loads app
- [ ] All features work as expected
- [ ] Responsive design works
- [ ] No browser console errors

#### 10.2 Android
- [ ] App installs and runs
- [ ] Touch interactions work smoothly
- [ ] Keyboard appears for input fields
- [ ] Sidebar overlay dismissible

#### 10.3 iOS
- [ ] App installs and runs
- [ ] Safe area respected (notch/home indicator)
- [ ] Touch interactions smooth
- [ ] Back gesture works

## Edge Cases

- [ ] Very long email addresses
- [ ] Very long names
- [ ] Special characters in inputs
- [ ] Network timeout during signup
- [ ] Expired Firebase token during session
- [ ] Simultaneous requests (rapid clicking)
- [ ] Memory leaks with context providers
- [ ] Screen orientation changes
- [ ] Background/foreground app transitions

## Defect Template

```
Title: [Component] - Brief description
Severity: Critical | High | Medium | Low
Platform: Web | Android | iOS | All
Steps to Reproduce:
1.
2.
3.
Expected: 
Actual: 
Screenshots:
```

---

Run through all tests before release. Document any failures with the template above.
