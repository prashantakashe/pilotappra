// src/components/escalation/CreateBillTab.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import type { EscalationMaster } from '../../types/escalation';

interface CreateBillTabProps {
  master: EscalationMaster | null;
  onBillCreated: () => void;
}

const CreateBillTab: React.FC<CreateBillTabProps> = ({ master, onBillCreated }) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create Escalation Bill</Text>
        <Text style={styles.subtitle}>Coming Soon</Text>
        <Text style={styles.description}>
          This tab will allow you to:
        </Text>
        <View style={styles.features}>
          <Text style={styles.feature}>• Enter bill details (number, date, period)</Text>
          <Text style={styles.feature}>• Input gross work done amount</Text>
          <Text style={styles.feature}>• Select components (cement, steel quantities)</Text>
          <Text style={styles.feature}>• Preview escalation calculation</Text>
          <Text style={styles.feature}>• Save and generate bill</Text>
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

export default CreateBillTab;
