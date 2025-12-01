// src/components/AppLayout.tsx
/**
 * AppLayout - Universal layout wrapper for all authenticated screens
 * 
 * Features:
 * - TopBar with burger menu (mobile/tablet), page title, user avatar with profile menu
 * - SideBar with navigation items (collapsible on desktop, overlay on mobile)
 * - Back button support for sub-screens
 * - Context-aware sidebar items (module-specific or main navigation)
 * - Responsive behavior across all screen sizes
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Menu, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import TopBar from './TopBar';
import SideBarNew from './SideBarNew';
import { useResponsive } from '../hooks/useResponsive';
import { auth } from '../services/firebase';

export interface MenuItem {
  key: string;
  label: string;
  icon: string;
}

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  activeRoute: string;
  showBackButton?: boolean;
  sidebarItems?: MenuItem[]; // Custom sidebar items for sub-screens
  onBackPress?: () => void;
  onSidebarItemPress?: (key: string) => void; // Custom handler for sidebar navigation
}

// Main navigation items (default)
const MAIN_NAV_ITEMS: MenuItem[] = [
  { key: 'Dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'Tender', label: 'Tender', icon: '📋' },
  { key: 'RateAnalysis', label: 'Rate Analysis', icon: '🧮' },
  { key: 'Engineering', label: 'Engineering', icon: '⚙️' },
  { key: 'Projects', label: 'Projects', icon: '🏗️' },
  { key: 'Settings', label: 'Settings', icon: '⚙️' },
];

/**
 * AppLayout Component
 * Wraps all authenticated screens with consistent layout structure
 */
export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title,
  activeRoute,
  showBackButton = false,
  sidebarItems,
  onBackPress,
  onSidebarItemPress,
}) => {
  const navigation = useNavigation<any>();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);

  // Sidebar behavior: auto-close on mobile/tablet, open on desktop
  useEffect(() => {
    console.log('[AppLayout] Device type:', { isMobile, isTablet, isDesktop });
    if (isMobile || isTablet) {
      console.log('[AppLayout] Setting sidebar to closed (mobile/tablet)');
      setSidebarOpen(false);
    } else {
      console.log('[AppLayout] Setting sidebar to open (desktop)');
      setSidebarOpen(true);
    }
  }, [isMobile, isTablet, isDesktop]);

  // Force sidebar open on desktop regardless of state
  const shouldShowSidebar = isDesktop ? true : sidebarOpen;

  // Get sidebar items (custom or main navigation)
  const menuItems = sidebarItems || MAIN_NAV_ITEMS;

  // Handle navigation from sidebar
  const handleNavigate = (routeKey: string) => {
    // Close sidebar on mobile/tablet after navigation
    if (isMobile || isTablet) {
      setSidebarOpen(false);
    }

    // If custom handler provided, use it
    if (onSidebarItemPress) {
      onSidebarItemPress(routeKey);
      return;
    }

    if (routeKey === 'Logout') {
      auth.signOut();
      return;
    }

    // If already on this route, just close sidebar
    if (routeKey === activeRoute) {
      setSidebarOpen(false);
      return;
    }

    // Navigate to route
    if (routeKey === 'Dashboard') {
      navigation.navigate('MainNew');
    } else {
      navigation.navigate(routeKey);
    }
  };

  // Handle back button press
  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  // Handle avatar/profile menu
  const handleAvatarPress = () => {
    navigation.navigate('Profile');
  };

  // Calculate content margin based on sidebar state
  const contentMargin = isDesktop && sidebarOpen ? (sidebarCollapsed ? 72 : 260) : 0;

  // Get user name for sidebar
  const userName = auth.currentUser?.displayName || 
                   auth.currentUser?.email?.split('@')[0] || 
                   'User';

  return (
    <View style={styles.container}>
      {/* TopBar - Always at top */}
      <TopBar
        title={title}
        onBurgerPress={() => setSidebarOpen(!sidebarOpen)}
        onAvatarPress={handleAvatarPress}
        showBurger={isMobile || isTablet}
        userName={userName}
      />

      {/* Back Button (if needed) */}
      {showBackButton && (
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBack}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      )}

      {/* Main Layout: Sidebar + Content */}
      <View style={styles.layoutContainer}>
        {/* SideBar - Desktop: persistent, Mobile: modal overlay */}
        <SideBarNew
          isOpen={shouldShowSidebar}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onNavigate={handleNavigate}
          activeRoute={activeRoute}
          userName={userName}
          menuItems={menuItems}
        />

        {/* Main Content Area */}
        <View style={styles.content}>
          {children}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    flexDirection: 'column',
  },
  backButton: {
    height: 48,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 5,
  },
  backIcon: {
    fontSize: 24,
    color: '#1E90FF',
    fontWeight: '600',
  },
  layoutContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 0,
  },
  content: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingLeft: 0,
    marginLeft: 0,
  },
});
