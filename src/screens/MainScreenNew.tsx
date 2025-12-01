// src/screens/MainScreenNew.tsx
import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { MAIN_NAV } from '../constants/sidebarMenus';
import Card from '../components/Card';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { useResponsive } from '../hooks/useResponsive';
import { userService } from '../services/userService';

interface MainScreenNewProps {
  navigation: any;
}

// Mock data for KPIs and activity
const mockKPIs = {
  projectsCount: 12,
  activeTenders: 5,
  pendingTasks: 8,
};

const mockActivity = [
  { id: '1', text: 'Project Alpha milestone completed', time: '2 hours ago' },
  { id: '2', text: 'New tender submission received', time: '5 hours ago' },
  { id: '3', text: 'Engineering review completed', time: '1 day ago' },
  { id: '4', text: 'Budget approved for Project Beta', time: '2 days ago' },
];

const mockAnalytics = [
  { label: 'On Time', value: 75, color: colors.ACTION_BLUE },
  { label: 'Delayed', value: 15, color: '#FFA500' },
  { label: 'Completed', value: 10, color: '#10B981' },
];

/**
 * MainScreen - Dashboard landing screen after login
 * Responsive layout with greeting, KPI cards, activity stream, and analytics
 * Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns
 */
const MainScreenNew: React.FC<MainScreenNewProps> = ({ navigation }) => {
  // Initialize with a neutral value; derive from user in effects
  const [userName, setUserName] = useState('User');
  const { user } = useContext(AuthContext)!;
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // Fetch user profile to get full name
  useEffect(() => {
    // Immediate fallback based on auth data
    if (user?.displayName) {
      setUserName(user.displayName.split(' ')[0]);
    } else if (user?.email) {
      setUserName(user.email.split('@')[0]);
    }

    // Then try Firestore profile for canonical name
    if (user?.uid) {
      userService
        .getUserProfile(user.uid)
        .then((profile) => {
          if (profile?.name) {
            const firstName = profile.name.split(' ')[0];
            setUserName(firstName);
          }
        })
        .catch(console.error);
    }
  }, [user]);

  return (
    <AppLayout title="Dashboard" activeRoute="Dashboard" sidebarItems={MAIN_NAV}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Greeting Section */}
        <View style={styles.greeting}>
          <Text style={styles.greetingTitle}>Welcome back, {userName}!</Text>
          <Text style={styles.greetingSubtitle}>
            {user?.email || 'User'}
          </Text>
        </View>

        {/* KPI Row */}
        <View style={[
          styles.kpiRow,
          isMobile && styles.kpiRowMobile,
          isTablet && styles.kpiRowTablet,
        ]}>
          <View style={[styles.kpiCard, isMobile && styles.kpiCardMobile]}>
            <Card title="Projects">
              <Text style={styles.kpiValue}>{mockKPIs.projectsCount}</Text>
              <Text style={styles.kpiLabel}>Active Projects</Text>
            </Card>
          </View>
          
          <View style={[styles.kpiCard, isMobile && styles.kpiCardMobile]}>
            <Card title="Tenders">
              <Text style={styles.kpiValue}>{mockKPIs.activeTenders}</Text>
              <Text style={styles.kpiLabel}>Active Tenders</Text>
            </Card>
          </View>
          
          <View style={[styles.kpiCard, isMobile && styles.kpiCardMobile]}>
            <Card title="Tasks">
              <Text style={styles.kpiValue}>{mockKPIs.pendingTasks}</Text>
              <Text style={styles.kpiLabel}>Pending Tasks</Text>
            </Card>
          </View>
        </View>

        {/* Content Grid */}
        <View style={[
          styles.grid,
          isMobile && styles.gridMobile,
          isTablet && styles.gridTablet,
        ]}>
          {/* Recent Activity */}
          <View style={[styles.gridItem, isMobile && styles.gridItemMobile]}>
            <Card title="Recent Activity" actionLabel="View All" onActionPress={() => {}}>
              {mockActivity.map((item) => (
                <View key={item.id} style={styles.activityItem}>
                  <Text style={styles.activityText}>{item.text}</Text>
                  <Text style={styles.activityTime}>{item.time}</Text>
                </View>
              ))}
            </Card>
          </View>

          {/* Analytics */}
          <View style={[styles.gridItem, isMobile && styles.gridItemMobile]}>
            <Card title="Project Status">
              <View style={styles.analyticsContainer}>
                {mockAnalytics.map((item, index) => (
                  <View key={index} style={styles.analyticsItem}>
                    <View style={[styles.analyticsBar, { width: `${item.value}%`, backgroundColor: item.color }]} />
                    <View style={styles.analyticsLabel}>
                      <Text style={styles.analyticsText}>{item.label}</Text>
                      <Text style={styles.analyticsValue}>{item.value}%</Text>
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        </View>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>📝</Text>
              <Text style={styles.actionLabel}>New Tender</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>🏗️</Text>
              <Text style={styles.actionLabel}>New Project</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionLabel}>Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionIcon}>⚙️</Text>
              <Text style={styles.actionLabel}>Settings</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  greeting: {
    marginBottom: spacing.xl,
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.TEXT_PRIMARY,
    marginBottom: spacing.xs,
  },
  greetingSubtitle: {
    fontSize: 16,
    color: colors.TEXT_SECONDARY,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  kpiRowMobile: {
    flexDirection: 'column',
  },
  kpiRowTablet: {
    flexWrap: 'wrap',
  },
  kpiCard: {
    flex: 1,
    minWidth: 150,
  },
  kpiCardMobile: {
    flex: 0,
    width: '100%',
  },
  kpiValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.ACTION_BLUE,
    marginBottom: spacing.xs,
  },
  kpiLabel: {
    fontSize: 14,
    color: colors.TEXT_SECONDARY,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  gridMobile: {
    flexDirection: 'column',
  },
  gridTablet: {
    flexWrap: 'wrap',
  },
  gridItem: {
    flex: 1,
    minWidth: 300,
  },
  gridItemMobile: {
    flex: 0,
    width: '100%',
  },
  activityItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  activityText: {
    fontSize: 14,
    color: colors.TEXT_PRIMARY,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: colors.TEXT_SECONDARY,
  },
  analyticsContainer: {
    gap: spacing.md,
  },
  analyticsItem: {
    marginBottom: spacing.sm,
  },
  analyticsBar: {
    height: 24,
    borderRadius: 4,
    marginBottom: 4,
  },
  analyticsLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  analyticsText: {
    fontSize: 14,
    color: colors.TEXT_PRIMARY,
  },
  analyticsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.PRIMARY_LIGHT,
    borderRadius: 8,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.TEXT_PRIMARY,
  },
});

export default MainScreenNew;
