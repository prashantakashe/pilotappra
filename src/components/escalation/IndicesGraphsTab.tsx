// src/components/escalation/IndicesGraphsTab.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface IndicesGraphsTabProps {
  masterId?: string;
}

const IndicesGraphsTab: React.FC<IndicesGraphsTabProps> = ({ masterId }) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Price Indices & Graphs</Text>
        <Text style={styles.subtitle}>Coming Soon</Text>
        <Text style={styles.description}>
          This tab will allow you to:
        </Text>
        <View style={styles.features}>
          <Text style={styles.feature}>• Import price indices from CSV</Text>
          <Text style={styles.feature}>• Edit historical index values</Text>
          <Text style={styles.feature}>• View index trends with charts</Text>
          <Text style={styles.feature}>• Compare multiple time periods</Text>
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

export default IndicesGraphsTab;
