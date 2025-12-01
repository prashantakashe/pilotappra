# App Layout System Documentation

## Overview
This document describes the universal layout system implemented across the application.

## Core Components

### 1. AppLayout Component (`src/components/AppLayout.tsx`)

**Purpose**: Universal layout wrapper for all authenticated screens

**Features**:
- TopBar with burger menu (mobile/tablet only), page title, user avatar
- SideBar with navigation items (collapsible on desktop, overlay on mobile/tablet)
- Back button support for sub-screens
- Context-aware sidebar items (module-specific or main navigation)
- Responsive behavior across all screen sizes

**Usage**:
```tsx
import { AppLayout } from '../components/AppLayout';
import { RATE_ANALYSIS_DETAIL_NAV } from '../constants/sidebarMenus';

<AppLayout
  title="Rate Analysis - Tender Detail"
  activeRoute="RateAnalysis"
  showBackButton={true}
  sidebarItems={RATE_ANALYSIS_DETAIL_NAV}
  onBackPress={() => navigation.navigate('RateAnalysis')}
>
  {/* Your screen content here */}
</AppLayout>
```

**Props**:
- `children`: React.ReactNode - Screen content
- `title`: string - Page title shown in TopBar
- `activeRoute`: string - Currently active route for sidebar highlighting
- `showBackButton?`: boolean - Whether to show back arrow (default: false)
- `sidebarItems?`: MenuItem[] - Custom sidebar items (uses main nav if not provided)
- `onBackPress?`: () => void - Custom back button handler

### 2. Module-Specific Sidebars (`src/constants/sidebarMenus.ts`)

Pre-configured sidebar menus for different modules and screens:

#### MAIN_NAV (Dashboard, Profile, Settings)
```typescript
[
  { key: 'Dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'Tender', label: 'Tender', icon: '📋' },
  { key: 'RateAnalysis', label: 'Rate Analysis', icon: '🧮' },
  { key: 'Engineering', label: 'Engineering', icon: '⚙️' },
  { key: 'Projects', label: 'Projects', icon: '🏗️' },
  { key: 'Settings', label: 'Settings', icon: '⚙️' },
]
```

#### TENDER_MODULE_NAV
```typescript
[
  { key: 'Tender', label: 'All Tenders', icon: '📋' },
  { key: 'AddTenderForm', label: 'Create Tender', icon: '➕' },
  { key: 'TenderDrafts', label: 'Drafts', icon: '📝' },
  { key: 'TenderArchive', label: 'Archive', icon: '📦' },
  { key: 'Dashboard', label: '← Back to Main', icon: '🏠' },
]
```

#### RATE_ANALYSIS_NAV
```typescript
[
  { key: 'RateAnalysis', label: 'All Tenders', icon: '🧮' },
  { key: 'RateMasterList', label: 'Master Rates', icon: '📊' },
  { key: 'RateTemplates', label: 'Templates', icon: '📄' },
  { key: 'Dashboard', label: '← Back to Main', icon: '🏠' },
]
```

#### RATE_ANALYSIS_DETAIL_NAV
```typescript
[
  { key: 'BOQParsing', label: 'BOQ Parsing', icon: '📊' },
  { key: 'RateBreakdown', label: 'Rate Breakdown', icon: '💵' },
  { key: 'Comparison', label: 'Comparison', icon: '⚖️' },
  { key: 'Export', label: 'Export', icon: '📤' },
  { key: 'RateAnalysis', label: '← Back to List', icon: '🧮' },
]
```

#### TENDER_DETAIL_NAV
```typescript
[
  { key: 'Overview', label: 'Overview', icon: '📄' },
  { key: 'Stages', label: 'Stages', icon: '📈' },
  { key: 'Documents', label: 'Documents', icon: '📁' },
  { key: 'BOQ', label: 'BOQ', icon: '💰' },
  { key: 'Team', label: 'Team', icon: '👥' },
  { key: 'Tender', label: '← Back to Tenders', icon: '📋' },
]
```

## Layout Behavior

### Desktop (>900px)
- Sidebar: Always visible, can collapse (260px → 72px)
- TopBar: No burger menu (sidebar always accessible)
- Back button: Shows as separate bar below TopBar when needed
- Content margin: 260px or 72px (collapsed)

### Tablet (480px - 900px)
- Sidebar: Overlay modal, closed by default
- TopBar: Shows burger menu
- Back button: Shows below TopBar when needed
- Content margin: 0px

### Mobile (<480px)
- Sidebar: Overlay modal, closed by default
- TopBar: Shows burger menu
- Back button: Shows below TopBar when needed
- Content margin: 0px
- Sidebar items: Same as larger screens (no special mobile layout)

## Navigation Patterns

### Main Navigation
Used on: Dashboard, Profile, Settings
- Shows all main modules
- No back button

### Module Navigation  
Used on: Tender List, Rate Analysis List, Engineering, Projects
- Shows module-specific actions
- Includes "Back to Main" option

### Detail Navigation
Used on: Tender Detail, Rate Analysis Detail
- Shows detail-specific tabs/sections
- Back button in TopBar
- Includes "Back to Module" option in sidebar

## Implementation Guide

### Converting Existing Screen

**Before**:
```tsx
const MyScreen = ({ navigation }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  return (
    <View>
      <TopBar title="My Screen" onBurgerPress={...} />
      <SideBarNew isOpen={sidebarOpen} ... />
      <ScrollView>
        {/* content */}
      </ScrollView>
    </View>
  );
};
```

**After**:
```tsx
import { AppLayout } from '../components/AppLayout';
import { MY_MODULE_NAV } from '../constants/sidebarMenus';

const MyScreen = ({ navigation }) => {
  return (
    <AppLayout
      title="My Screen"
      activeRoute="MyModule"
      sidebarItems={MY_MODULE_NAV}
    >
      <ScrollView>
        {/* content */}
      </ScrollView>
    </AppLayout>
  );
};
```

### Adding New Module Sidebar

1. Define menu items in `src/constants/sidebarMenus.ts`:
```typescript
export const MY_MODULE_NAV: MenuItem[] = [
  { key: 'Action1', label: 'Action 1', icon: '🔧' },
  { key: 'Action2', label: 'Action 2', icon: '📝' },
  { key: 'Dashboard', label: '← Back to Main', icon: '🏠' },
];
```

2. Use in screen:
```tsx
<AppLayout
  title="My Module"
  activeRoute="MyModule"
  sidebarItems={MY_MODULE_NAV}
>
  {/* content */}
</AppLayout>
```

## Styling Guidelines

### Content Area
- Background: `#F9FAFB` (light gray)
- Max width: 1200px (centered)
- Padding: 16px

### Cards
- Background: `#FFFFFF`
- Border radius: 12px
- Border: 1px solid `#E5E7EB`
- Accent: 4px left border in `#1E90FF` (blue)

### Colors
- Primary Blue: `#1E90FF`
- Primary Light: `#EFF6FF`
- Text Primary: `#111827`
- Text Secondary: `#6B7280`
- Border: `#E5E7EB`
- Error Red: `#EF4444`
- Success Green: `#10B981`

## Firebase Security

### Authentication Requirements
- All routes require authenticated user
- Redirect to Login if not authenticated
- User context available via `auth.currentUser`

### Firestore Rules
See `firestore.rules` for detailed permissions

### Storage Rules
See `storage.rules` for file access permissions

## Best Practices

1. **Always use AppLayout** for authenticated screens
2. **Define module-specific sidebars** in `sidebarMenus.ts`
3. **Show back button** on detail/sub-screens
4. **Use consistent spacing** (8, 12, 16, 24, 32px)
5. **Test on all screen sizes** (mobile, tablet, desktop)
6. **Keep sidebar items** to 5-7 items max
7. **Use descriptive icons** from emoji set
8. **Include "Back to X"** option in sub-screen sidebars

## Future Enhancements

- [ ] Profile dropdown menu in TopBar avatar
- [ ] Breadcrumb navigation for deep screens
- [ ] Keyboard shortcuts for sidebar items
- [ ] Customizable sidebar width
- [ ] Theme switching (light/dark mode)
- [ ] Sidebar item badges (notifications)
- [ ] Recently visited screens section
- [ ] Favorite/pinned items
