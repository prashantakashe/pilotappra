// src/components/TopBar.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface TopBarProps {
  title?: string;
  onBurgerPress?: () => void;
  onAvatarPress?: () => void;
  showBurger?: boolean;
  userName?: string;
}

/**
 * TopBar component with burger menu, title, and avatar
 * Height: 56px, horizontal padding: 12
 * Title font-size: 18-20, weight 600
 */
const TopBar: React.FC<TopBarProps> = ({ 
  title = 'Dashboard', 
  onBurgerPress,
  onAvatarPress,
  showBurger = true,
  userName = 'User'
}) => {
  return (
    <View style={styles.topBar}>
      {/* Burger Menu Button - Only on mobile/tablet or when showBurger is true */}
      {showBurger ? (
        <TouchableOpacity
          style={styles.burgerButton}
          onPress={onBurgerPress}
          accessibilityLabel="Menu"
          accessibilityHint="Open navigation menu"
          accessibilityRole="button"
        >
          <Text style={styles.burgerIcon}>☰</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.burgerButton} />
      )}

      {/* Title */}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {/* User Avatar/Profile Button with Name */}
      <TouchableOpacity
        style={styles.avatarButton}
        onPress={onAvatarPress}
        accessibilityLabel="Profile"
        accessibilityHint="View profile or account settings"
        accessibilityRole="button"
      >
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.avatarIcon}>👤</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 10,
  },
  burgerButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  burgerIcon: {
    fontSize: 24,
    color: colors.TEXT_PRIMARY,
  },
  title: {
    flex: 1,
    fontSize: 19,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  avatarButton: {
    flexDirection: 'row',
    height: 48,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY,
  },
  avatarIcon: {
    fontSize: 24,
    color: colors.ACTION_BLUE,
  },
});

export default TopBar;
