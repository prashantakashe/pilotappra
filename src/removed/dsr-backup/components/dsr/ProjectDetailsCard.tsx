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
});

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  detailRow_last: {
    marginBottom: 0,
  },
  label: {
    fontSize: 13,
    color: colors.TEXT_SECONDARY,
    fontWeight: '500',
  },
  value: {
    fontSize: 13,
    color: colors.TEXT_PRIMARY,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: '#FAFAFB',
    borderTopWidth: 1,
    borderTopColor: colors.BORDER_LIGHT,
    borderBottomWidth: 1,
    borderBottomColor: colors.BORDER_LIGHT,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ACTION_BLUE,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 11,
    color: colors.TEXT_SECONDARY,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: colors.BORDER_LIGHT,
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.BORDER_LIGHT,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  editButton: {
    backgroundColor: '#E9F5FF',
  },
  deleteButton: {
    backgroundColor: '#FFF5F6',
  },
  actionDivider: {
    width: 1,
    backgroundColor: colors.BORDER_LIGHT,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sourceBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
});
