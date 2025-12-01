// src/components/dailyWorkStatus/DWSUserManagementTab.tsx
/**
 * User Management Tab for Daily Work Status module
 * Placeholder for user role management
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

export const DWSUserManagementTab: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>👤 User Management</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔐 Role-Based Access Control</Text>
        <Text style={styles.description}>
          Manage user roles and permissions for the Daily Work Status module.
        </Text>
        
        <View style={styles.rolesContainer}>
          <View style={styles.roleCard}>
            <Text style={styles.roleIcon}>👑</Text>
            <Text style={styles.roleTitle}>Admin</Text>
            <Text style={styles.roleDesc}>Full access to all features including user management</Text>
          </View>
          
          <View style={styles.roleCard}>
            <Text style={styles.roleIcon}>👔</Text>
            <Text style={styles.roleTitle}>Manager</Text>
            <Text style={styles.roleDesc}>Can view reports, manage projects, and approve entries</Text>
          </View>
          
          <View style={styles.roleCard}>
            <Text style={styles.roleIcon}>👷</Text>
            <Text style={styles.roleTitle}>Employee</Text>
            <Text style={styles.roleDesc}>Can create and edit own daily work entries</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.comingSoonCard}>
        <Text style={styles.comingSoonIcon}>🚧</Text>
        <Text style={styles.comingSoonTitle}>Coming Soon</Text>
        <Text style={styles.comingSoonText}>
          User management functionality will be available in a future update.
          This will include:
        </Text>
        <View style={styles.featureList}>
          <Text style={styles.featureItem}>• Add/remove users from the module</Text>
          <Text style={styles.featureItem}>• Assign roles (Admin, Manager, Employee)</Text>
          <Text style={styles.featureItem}>• Set project-level permissions</Text>
          <Text style={styles.featureItem}>• View user activity logs</Text>
          <Text style={styles.featureItem}>• Approval workflows</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.TEXT_PRIMARY,
    padding: spacing.lg
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
    ...Platform.select({
      web: { boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }
    })
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY,
    marginBottom: spacing.sm
  },
  description: {
    fontSize: 14,
    color: colors.TEXT_SECONDARY,
    marginBottom: spacing.lg
  },
  rolesContainer: {
    gap: spacing.md
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.ACTION_BLUE
  },
  roleIcon: {
    fontSize: 24,
    marginRight: spacing.md
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY,
    width: 80
  },
  roleDesc: {
    flex: 1,
    fontSize: 13,
    color: colors.TEXT_SECONDARY
  },
  comingSoonCard: {
    backgroundColor: '#FEF3C7',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
    alignItems: 'center'
  },
  comingSoonIcon: {
    fontSize: 48,
    marginBottom: spacing.sm
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: spacing.sm
  },
  comingSoonText: {
    fontSize: 14,
    color: '#78350F',
    textAlign: 'center',
    marginBottom: spacing.md
  },
  featureList: {
    alignSelf: 'stretch'
  },
  featureItem: {
    fontSize: 13,
    color: '#78350F',
    marginBottom: spacing.xs
  }
});
