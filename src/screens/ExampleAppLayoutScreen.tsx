// src/screens/ExampleAppLayoutScreen.tsx
/**
 * Example Screen Using AppLayout
 * 
 * This demonstrates how to implement a screen with the new universal layout system:
 * - Uses AppLayout component
 * - Custom sidebar navigation
 * - Back button support
 * - Module-specific navigation
 * - Responsive design
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AppLayout } from '../components/AppLayout';
import { TENDER_MODULE_NAV } from '../constants/sidebarMenus';
import { spacing } from '../theme/spacing';
import { colors } from '../theme/colors';

interface ExampleAppLayoutScreenProps {
  navigation: any;
}

export const ExampleAppLayoutScreen: React.FC<ExampleAppLayoutScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'settings'>('overview');

  return (
    <AppLayout
      title="Example Screen"
      activeRoute="Tender"
      showBackButton={true}
      sidebarItems={TENDER_MODULE_NAV}
      onBackPress={() => navigation.goBack()}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* Header Section */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>📱 Universal Layout System</Text>
          <Text style={styles.headerSubtitle}>
            This screen demonstrates the new AppLayout component with:
          </Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>✓ TopBar with title and user avatar</Text>
            <Text style={styles.featureItem}>✓ Collapsible sidebar (desktop) / overlay (mobile)</Text>
            <Text style={styles.featureItem}>✓ Back button in TopBar (← arrow on left)</Text>
            <Text style={styles.featureItem}>✓ Module-specific sidebar items</Text>
            <Text style={styles.featureItem}>✓ Responsive behavior across all devices</Text>
            <Text style={styles.featureItem}>✓ Consistent styling and spacing</Text>
          </View>
        </View>

        {/* Tabs Section */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'details' && styles.tabActive]}
            onPress={() => setActiveTab('details')}
          >
            <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>
              Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
            onPress={() => setActiveTab('settings')}
          >
            <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
              Settings
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content Cards */}
        {activeTab === 'overview' && (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📊 Layout Behavior</Text>
              <Text style={styles.cardText}>
                <Text style={styles.bold}>Desktop {'>'} 900px:</Text>{'\n'}
                • Sidebar always visible, can collapse (260px → 72px){'\n'}
                • No burger menu in TopBar{'\n'}
                • Content margin adjusts automatically{'\n\n'}
                
                <Text style={styles.bold}>Tablet (480-900px):</Text>{'\n'}
                • Sidebar as overlay modal{'\n'}
                • Burger menu visible{'\n'}
                • Closes after navigation{'\n\n'}
                
                <Text style={styles.bold}>Mobile {'<'} 480px:</Text>{'\n'}
                • Sidebar as overlay modal{'\n'}
                • Burger menu visible{'\n'}
                • Full-width content
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>🎨 Styling Guidelines</Text>
              <View style={styles.colorSwatch}>
                <View style={[styles.color, { backgroundColor: colors.ACTION_BLUE }]}>
                  <Text style={styles.colorLabel}>Primary Blue</Text>
                </View>
                <View style={[styles.color, { backgroundColor: colors.PRIMARY_LIGHT }]}>
                  <Text style={[styles.colorLabel, { color: colors.ACTION_BLUE }]}>Light Blue</Text>
                </View>
                <View style={[styles.color, { backgroundColor: colors.TEXT_PRIMARY }]}>
                  <Text style={styles.colorLabel}>Text Primary</Text>
                </View>
                <View style={[styles.color, { backgroundColor: colors.TEXT_SECONDARY }]}>
                  <Text style={styles.colorLabel}>Text Secondary</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'details' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📋 Implementation Example</Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>
                {`import { AppLayout } from '../components/AppLayout';
import { TENDER_MODULE_NAV } from '../constants/sidebarMenus';

const MyScreen = ({ navigation }) => {
  return (
    <AppLayout
      title="My Screen"
      activeRoute="Tender"
      showBackButton={true}
      sidebarItems={TENDER_MODULE_NAV}
      onBackPress={() => navigation.goBack()}
    >
      <ScrollView>
        {/* Your content here */}
      </ScrollView>
    </AppLayout>
  );
};`}
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'settings' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚙️ Configuration</Text>
            <Text style={styles.cardText}>
              Define custom sidebar items in <Text style={styles.code}>src/constants/sidebarMenus.ts</Text>:
            </Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>
                {`export const MY_MODULE_NAV: MenuItem[] = [
  { key: 'Action1', label: 'Action 1', icon: '🔧' },
  { key: 'Action2', label: 'Action 2', icon: '📝' },
  { key: 'Dashboard', label: '← Back', icon: '🏠' },
];`}
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsCard}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.buttonText}>Go to Dashboard</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('RateAnalysis')}
          >
            <Text style={styles.secondaryButtonText}>Go to Rate Analysis</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: spacing.lg,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.ACTION_BLUE,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.TEXT_PRIMARY,
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.TEXT_SECONDARY,
    marginBottom: spacing.md,
  },
  featureList: {
    marginTop: spacing.md,
  },
  featureItem: {
    fontSize: 14,
    color: colors.TEXT_PRIMARY,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.PRIMARY_LIGHT,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.TEXT_SECONDARY,
  },
  tabTextActive: {
    color: colors.ACTION_BLUE,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.ACTION_BLUE,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.TEXT_PRIMARY,
    marginBottom: spacing.md,
  },
  cardText: {
    fontSize: 14,
    color: colors.TEXT_PRIMARY,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 13,
  },
  codeBlock: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#D1D5DB',
    lineHeight: 18,
  },
  colorSwatch: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
  },
  color: {
    width: '48%',
    height: 80,
    borderRadius: 8,
    marginBottom: spacing.sm,
    marginRight: '2%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  primaryButton: {
    backgroundColor: colors.ACTION_BLUE,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: colors.ACTION_BLUE,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.ACTION_BLUE,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExampleAppLayoutScreen;
