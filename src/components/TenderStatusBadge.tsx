// src/components/TenderStatusBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { TenderStatus } from '../types/tender';

interface TenderStatusBadgeProps {
  status: TenderStatus;
  size?: 'small' | 'medium';
}

const STATUS_CONFIG: Record<TenderStatus, { label: string; bgColor: string; textColor: string }> = {
  draft: {
    label: 'Draft',
    bgColor: '#F3F4F6',
    textColor: '#6B7280'
  },
  active: {
    label: 'Active',
    bgColor: '#DBEAFE',
    textColor: '#1E40AF'
  },
  to_submit: {
    label: 'To Be Submitted',
    bgColor: '#FEF3C7',
    textColor: '#92400E'
  },
  submitted: {
    label: 'Submitted',
    bgColor: '#E0E7FF',
    textColor: '#3730A3'
  },
  won: {
    label: 'Won',
    bgColor: '#D1FAE5',
    textColor: '#065F46'
  },
  lost: {
    label: 'Lost',
    bgColor: '#FEE2E2',
    textColor: '#991B1B'
  },
  archived: {
    label: 'Archived',
    bgColor: '#F3F4F6',
    textColor: '#4B5563'
  }
};

export const TenderStatusBadge: React.FC<TenderStatusBadgeProps> = ({ status, size = 'medium' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  
  return (
    <View style={[
      styles.badge,
      { backgroundColor: config.bgColor },
      size === 'small' && styles.badgeSmall
    ]}>
      <Text style={[
        styles.text,
        { color: config.textColor },
        size === 'small' && styles.textSmall
      ]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start'
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  text: {
    fontSize: 13,
    fontWeight: '600'
  },
  textSmall: {
    fontSize: 11
  }
});
