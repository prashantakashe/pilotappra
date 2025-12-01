// src/components/SideBarNew.tsx
import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Modal,
  Animated,
  Pressable,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { useResponsive } from '../hooks/useResponsive';

export interface MenuItem {
  key: string;
  label: string;
  icon: string;
}

interface SideBarNewProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (routeKey: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  activeRoute?: string;
  userName?: string;
  menuItems?: MenuItem[]; // Allow custom menu items
}

const defaultMenuItems: MenuItem[] = [
  { key: 'Dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'Tender', label: 'Tender', icon: '📋' },
  { key: 'RateAnalysis', label: 'Rate Analysis', icon: '🧮' },
  { key: 'Engineering', label: 'Engineering', icon: '⚙️' },
  { key: 'Projects', label: 'Projects', icon: '🏗️' },
  { key: 'Settings', label: 'Settings', icon: '⚙️' },
];

/**
 * SideBar with collapsible mode
 * Mobile: overlay drawer sliding from left
 * Desktop: persistent drawer, collapsible to icon-only mode
 * Width: 260px normal, 72px collapsed
 * Item height: 48px
 */
const SideBarNew: React.FC<SideBarNewProps> = ({
  isOpen,
  onClose,
  onNavigate,
  collapsed = false,
  onToggleCollapse,
  activeRoute = 'Dashboard',
  userName = 'User',
  menuItems, // Custom menu items
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const sidebarWidth = collapsed ? 72 : 260;
  
  // Use custom menu items or default
  const items = menuItems || defaultMenuItems;

  const handleNavigate = (key: string) => {
    onNavigate(key);
    if (isMobile || isTablet) {
      onClose();
    }
  };

  const handleLogout = () => {
    onNavigate('Logout');
    onClose();
  };

  const renderContent = () => (
    <View style={[styles.sidebar, { width: sidebarWidth }]}>
      {/* Collapse Toggle for Desktop */}
      {isDesktop && onToggleCollapse && (
        <TouchableOpacity
          style={styles.collapseButton}
          onPress={onToggleCollapse}
          accessibilityLabel={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          accessibilityRole="button"
        >
          <Text style={styles.collapseIcon}>{collapsed ? '»' : '«'}</Text>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        {/* Menu Items */}
        {items.map((item) => {
          const isActive = activeRoute === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.menuItem,
                isActive && styles.menuItemActive,
                collapsed && styles.menuItemCollapsed,
              ]}
              onPress={() => handleNavigate(item.key)}
              accessibilityLabel={item.label}
              accessibilityHint={`Navigate to ${item.label}`}
              accessibilityRole="button"
            >
              {isActive && <View style={styles.activeIndicator} />}
              <Text style={styles.menuIcon}>{item.icon}</Text>
              {!collapsed && (
                <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
                  {item.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutItem, collapsed && styles.menuItemCollapsed]}
          onPress={handleLogout}
          accessibilityLabel="Logout"
          accessibilityHint="Sign out of your account"
          accessibilityRole="button"
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          {!collapsed && <Text style={styles.logoutLabel}>Logout</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // Mobile/Tablet: Modal overlay
  if (isMobile || isTablet) {
    console.log('[SideBarNew] Rendering as modal (mobile/tablet), isOpen:', isOpen);
    return (
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            {renderContent()}
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  // Desktop: Persistent drawer
  console.log('[SideBarNew] Rendering desktop sidebar, isOpen:', isOpen);
  if (!isOpen) {
    console.log('[SideBarNew] Desktop sidebar returning null because isOpen is false');
    return null;
  }
  return renderContent();
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  sidebar: {
    height: '100%',
    backgroundColor: colors.WHITE,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  collapseButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  collapseIcon: {
    fontSize: 20,
    color: colors.TEXT_PRIMARY,
  },
  menuContainer: {
    flex: 1,
    paddingVertical: spacing.md,
  },
  menuItem: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.xs,
    borderRadius: 4,
    position: 'relative',
  },
  menuItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  menuItemActive: {
    backgroundColor: colors.PRIMARY_LIGHT,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.ACTION_BLUE,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  menuIcon: {
    fontSize: 20,
    width: 24,
    textAlign: 'center',
  },
  menuLabel: {
    marginLeft: spacing.md,
    fontSize: 14,
    fontWeight: '500',
    color: colors.TEXT_PRIMARY,
  },
  menuLabelActive: {
    fontWeight: '600',
    color: colors.ACTION_BLUE,
  },
  logoutItem: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.xs,
    marginTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: spacing.md,
  },
  logoutIcon: {
    fontSize: 20,
    width: 24,
    textAlign: 'center',
  },
  logoutLabel: {
    marginLeft: spacing.md,
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
});

export default SideBarNew;
