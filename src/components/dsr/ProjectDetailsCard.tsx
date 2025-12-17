// Module removed: ProjectDetailsCard (DSR)
// Placeholder to avoid breaking imports. The SSR/DSR submodule has been
// removed from this repository and will be implemented elsewhere.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const ProjectDetailsCard: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.message}>SSR/DSR module removed — component stub.</Text>
  </View>
);

export default ProjectDetailsCard;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  message: { color: '#666' },
  // The following styles are not used in this stub, but kept for compatibility
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4, // spacing.xs fallback
  },
  detailRow_last: {
    marginBottom: 0,
  },
  label: {
    fontSize: 13,
    color: '#888', // colors.TEXT_SECONDARY fallback
    fontWeight: '500',
  },
  value: {
    fontSize: 13,
    color: '#222', // colors.TEXT_PRIMARY fallback
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
});
