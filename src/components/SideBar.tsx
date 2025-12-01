// src/components/SideBar.tsx
import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export interface SideBarItem {
  id: string;
  label: string;
  icon: string;
  onPress: () => void;
}

interface SideBarProps {
  items: SideBarItem[];
  active?: string;
  onLogout: () => void;
  userName?: string;
  isOpen?: boolean;
}

const SideBar: React.FC<SideBarProps> = ({
  items,
  active,
  onLogout,
  userName,
  isOpen = true,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width > 900;

  if (!isDesktop && !isOpen) {
    return null;
  }

  const content = (
    <View style={styles.content}>
      {userName && (
        <View style={styles.userSection}>
          <Ionicons name="person-circle" size={48} color={colors.ACTION_BLUE} />
          <Text style={styles.userName}>{userName}</Text>
        </View>
      )}

      <ScrollView style={styles.menuContainer}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.menuItem, active === item.id && styles.menuItemActive]}
            onPress={item.onPress}
          >
            <Ionicons
              name={item.icon as any}
              size={20}
              color={active === item.id ? colors.ACTION_BLUE : colors.TEXT_PRIMARY}
            />
            <Text
              style={[
                styles.menuLabel,
                active === item.id && styles.menuLabelActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Ionicons name="log-out" size={20} color={colors.ERROR_RED} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  if (isDesktop) {
    return (
      <View style={styles.desktopContainer}>
        <SafeAreaView style={styles.desktopSafeArea}>{content}</SafeAreaView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.mobileContainer}>
      {content}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  desktopContainer: {
    width: 260,
    backgroundColor: colors.PRIMARY_LIGHT,
    borderRightWidth: 1,
    borderRightColor: colors.BORDER_LIGHT,
  },
  desktopSafeArea: {
    flex: 1,
  },
  mobileContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 260,
    backgroundColor: colors.PRIMARY_LIGHT,
    zIndex: 1000,
  },
  content: {
    flex: 1,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  userSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.BORDER_LIGHT,
  },
  userName: {
    marginTop: spacing.md,
    fontSize: 16,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY,
    textAlign: 'center',
  },
  menuContainer: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: 8,
  },
  menuItemActive: {
    backgroundColor: colors.WHITE,
  },
  menuLabel: {
    marginLeft: spacing.md,
    fontSize: 14,
    fontWeight: '500',
    color: colors.TEXT_PRIMARY,
  },
  menuLabelActive: {
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginVertical: spacing.md,
    borderRadius: 8,
    borderTopWidth: 1,
    borderTopColor: colors.BORDER_LIGHT,
  },
  logoutText: {
    marginLeft: spacing.md,
    fontSize: 14,
    fontWeight: '600',
    color: colors.ERROR_RED,
  },
});

export default SideBar;
