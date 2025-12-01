// src/components/Card.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface CardProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
  headerColor?: string;
}

/**
 * Generic card component for KPI and widgets
 * Rounded corners, subtle shadow, light-blue accent header
 */
const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  actionLabel,
  onActionPress,
  style,
  headerColor = colors.PRIMARY_LIGHT,
}) => {
  return (
    <View style={[styles.card, style]}>
      {title && (
        <View style={[styles.header, { backgroundColor: headerColor }]}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {actionLabel && onActionPress && (
            <TouchableOpacity
              onPress={onActionPress}
              accessibilityLabel={`${actionLabel} button`}
              accessibilityHint={`Press to ${actionLabel.toLowerCase()}`}
            >
              <Text style={styles.actionText}>{actionLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.WHITE,
    borderRadius: 8,
    overflow: 'hidden',
    // Shadow for elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY,
  },
  subtitle: {
    fontSize: 13,
    color: colors.TEXT_SECONDARY,
    marginTop: 2,
  },
  actionText: {
    fontSize: 14,
    color: colors.ACTION_BLUE,
    fontWeight: '600',
  },
  content: {
    padding: spacing.md,
  },
});

export default Card;
