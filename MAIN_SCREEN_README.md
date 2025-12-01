# Main Screen & App Shell Implementation

## Overview
Complete React Native (Expo) + TypeScript implementation with responsive TopBar, collapsible SideBar, and dashboard with KPI widgets.

## Features Implemented

### ✅ Core Components
- **TopBar**: Burger menu, title, avatar (56px height, responsive)
- **SideBarNew**: Collapsible sidebar (260px → 72px on desktop, overlay on mobile)
- **Card**: Reusable card component with accent headers
- **useResponsive**: Hook for breakpoints (Mobile ≤480, Tablet 481-900, Desktop >900)

### ✅ Screens
- **MainScreenNew**: Dashboard with greeting, KPI cards, activity stream, analytics
- **TenderScreen**: Placeholder for tender management
- **EngineeringScreen**: Placeholder for engineering tasks
- **ProjectsScreen**: Placeholder for project management
- **SettingsScreen**: Placeholder for app settings

### ✅ Services
- **mediatedMessages.ts**: Cloud Function wrapper for secure client-to-client messaging

### ✅ Navigation
- Updated AppNavigator with all module screens
- Sidebar navigation with active route highlighting

## Responsive Behavior

### Mobile (≤480px)
- Sidebar: Hidden by default, opens as overlay
- Content: Single column, full-width cards
- KPI cards: Stack vertically

### Tablet (481-900px)
- Sidebar: Overlay mode (wider than mobile)
- Content: 2-column grid where possible
- KPI cards: 2 columns with wrapping

### Desktop (>900px)
- Sidebar: Persistent (docked), collapsible to icons-only
- Content: 3-column grid, max-width 1200px
- KPI cards: 3 columns side-by-side

## Color Theme (Exact Spec)
```typescript
WHITE = '#FFFFFF'
ACTION_BLUE = '#1E90FF'
PRIMARY_LIGHT = '#D9EEFF'
TEXT_PRIMARY = '#222222'
TEXT_SECONDARY = '#666666'
```

## File Structure
```
src/
├── components/
│   ├── TopBar.tsx              ← Updated (56px height, burger/title/avatar)
│   ├── SideBarNew.tsx          ← New (collapsible, overlay/persistent)
│   └── Card.tsx                ← New (reusable card with accent header)
├── screens/
│   ├── MainScreenNew.tsx       ← New (dashboard with KPIs/widgets)
│   ├── TenderScreen.tsx        ← New (placeholder)
│   ├── EngineeringScreen.tsx   ← New (placeholder)
│   ├── ProjectsScreen.tsx      ← New (placeholder)
│   └── SettingsScreen.tsx      ← New (placeholder)
├── hooks/
│   └── useResponsive.ts        ← New (breakpoint logic)
├── services/
│   └── mediatedMessages.ts     ← New (Cloud Function wrapper)
└── navigation/
    └── AppNavigator.tsx        ← Updated (all module screens)
```

## Running the App

### Start Development Server
```powershell
npx expo start
```

### Access Web Version
```powershell
# Press 'w' in terminal, or
npx expo start --web
```

### Access Mobile
- **Android**: Press 'a' (requires emulator) or scan QR with Expo Go
- **iOS**: Press 'i' (requires Mac) or scan QR with Expo Go

## Testing Checklist

### ✅ Responsive Tests
- [ ] Mobile (360px width): Sidebar overlay, single column
- [ ] Tablet (768px width): Sidebar overlay, 2 columns
- [ ] Desktop (1366px width): Persistent sidebar, collapse toggle works

### ✅ Sidebar Tests
- [ ] Mobile: Opens on burger press, closes on navigation
- [ ] Desktop: Collapse toggle switches 260px ↔ 72px
- [ ] Active route highlights with blue accent (#D9EEFF)

### ✅ Navigation Tests
- [ ] All menu items navigate correctly
- [ ] Logout signs out and returns to login
- [ ] Profile avatar button navigates to profile

### ✅ Accessibility
- [ ] All buttons have accessibilityLabel
- [ ] Touch targets ≥48px
- [ ] Color contrast ≥4.5:1

## Cloud Function Integration

### sendMediatedMessage (Already Deployed)
```typescript
import { mediatedMessages } from './services/mediatedMessages';

// Call from any screen
const result = await mediatedMessages.sendMessage({
  toUserId: 'recipient-uid',
  content: 'Message content',
  subject: 'Optional subject'
});
```

### HTTP Endpoint (Alternative)
```typescript
const token = await user.getIdToken();
const result = await mediatedMessages.sendMessageHttp({
  toUserId: 'recipient-uid',
  content: 'Message content'
}, token);
```

## Security Notes

### ✅ Implemented
- No client PII exposed in UI
- All messages go through Cloud Function (sendMediatedMessage)
- Firestore rules prevent direct message writes
- Client reads only their own messages

### ❌ Do Not
- Display client contact info anywhere
- Write messages directly to Firestore from client
- Expose recipient details in UI

## Next Steps

1. **Test on actual devices**:
   ```powershell
   npm run android  # For Android
   npm run ios      # For iOS (Mac only)
   ```

2. **Implement real data**:
   - Replace mock KPIs with Firestore queries
   - Add real activity stream from audit logs
   - Implement analytics with Charts library

3. **Add features to placeholder screens**:
   - TenderScreen: Tender list, submission form
   - EngineeringScreen: Task management
   - ProjectsScreen: Project tracking
   - SettingsScreen: User preferences

4. **Deploy**:
   - Web: `npx expo build:web`
   - Android: `eas build --platform android`
   - iOS: `eas build --platform ios`

## Dependencies Added
All dependencies already installed:
- @react-navigation/native
- @react-navigation/native-stack
- @react-navigation/drawer
- react-native-gesture-handler
- react-native-reanimated
- firebase (with Cloud Functions)

## Contact
All client communication must use the Cloud Function endpoint. Never expose client contact information in the UI.

---

**Status**: ✅ All core features implemented and ready for testing
