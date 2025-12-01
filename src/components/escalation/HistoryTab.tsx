// src/components/escalation/HistoryTab.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { EscalationBill } from '../../types/escalation';

interface HistoryTabProps {
  masterId?: string;
  onBillSelect: (bill: EscalationBill) => void;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ masterId, onBillSelect }) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Bills History</Text>
        <Text style={styles.subtitle}>Coming Soon</Text>
        <Text style={styles.description}>
          This tab will show:
        </Text>
        <View style={styles.features}>
          <Text style={styles.feature}>• List of all escalation bills</Text>
          <Text style={styles.feature}>• Filter by date, status, amount</Text>
          <Text style={styles.feature}>• Quick view bill details</Text>
          <Text style={styles.feature}>• Edit/delete bills</Text>
          <Text style={styles.feature}>• Export bills to Excel/PDF</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: spacing.lg,
    backgroundColor: '#fff',
    margin: spacing.md,
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.TEXT_PRIMARY,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 18,
    color: colors.TEXT_SECONDARY,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: 14,
    color: colors.TEXT_SECONDARY,
    marginBottom: spacing.md,
  },
  features: {
    marginTop: spacing.sm,
  },
  feature: {
    fontSize: 14,
    color: colors.TEXT_PRIMARY,
    marginBottom: spacing.xs,
  },
});

export default HistoryTab;
