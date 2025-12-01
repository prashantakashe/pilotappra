// src/components/escalation/CalculationTab.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { EscalationMaster } from '../../types/escalation';

interface CalculationTabProps {
  master: EscalationMaster | null;
}

const CalculationTab: React.FC<CalculationTabProps> = ({ master }) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Escalation Calculation</Text>
        <Text style={styles.subtitle}>Coming Soon</Text>
        <Text style={styles.description}>
          This tab will show:
        </Text>
        <View style={styles.features}>
          <Text style={styles.feature}>• Detailed escalation breakdown by component</Text>
          <Text style={styles.feature}>• Formula application with all parameters</Text>
          <Text style={styles.feature}>• Base vs Current index comparison</Text>
          <Text style={styles.feature}>• Total escalation amount</Text>
          <Text style={styles.feature}>• Export to Excel/PDF</Text>
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

export default CalculationTab;
