// src/screens/DashboardScreen.tsx
import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { MAIN_NAV } from '../constants/sidebarMenus';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { useResponsive } from '../hooks/useResponsive';
import { TenderProgressWidget } from '../components/TenderProgressWidget';
import { runStage1Migration } from '../utils/migrationUtils';
import { auth } from '../services/firebase';

const DashboardScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useContext(AuthContext)!;
  const { isMobile, isTablet } = useResponsive();
  const [migrating, setMigrating] = useState(false);


  const handleNavigateToTenders = (filter?: { status?: string; urgentOnly?: boolean }) => {
    if (filter?.urgentOnly) {
      // Navigate to tenders with urgent filter (would require implementing urgency filter in TenderMainScreen)
      navigation.navigate('Tender', { selectedStatus: 'active' });
    } else {
      navigation.navigate('Tender', { selectedStatus: filter?.status || 'all' });
    }
  };

  // Debug function to run Stage 1 migration (one-time operation)
  const handleRunMigration = async () => {
    if (migrating) return;
    
    const confirmed = Platform.OS === 'web' 
      ? window.confirm('Run Stage 1 migration for existing tenders? This will add Stage 1 completion to all tenders that don\'t have it.')
      : await new Promise((resolve) => {
          Alert.alert(
            'Run Migration',
            'Run Stage 1 migration for existing tenders? This will add Stage 1 completion to all tenders that don\'t have it.',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Run Migration', onPress: () => resolve(true) }
            ]
          );
        });
    
    if (!confirmed) return;
    
    try {
      setMigrating(true);
      const result = await runStage1Migration();
      
      const message = `Migration complete!\n\nMigrated: ${result.migratedCount} tenders\nSkipped: ${result.skippedCount} tenders\nTotal: ${result.totalTenders} tenders`;
      
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Success', message);
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to run migration';
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMsg}`);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setMigrating(false);
    }
  };

  return (
    <AppLayout title="Dashboard" activeRoute="Dashboard" sidebarItems={MAIN_NAV}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
      <View style={[styles.header, isTablet && styles.headerTablet]}>
        <Text style={styles.greeting}>Welcome, {user?.email?.split('@')[0]}!</Text>
        <Text style={styles.subtext}>Here's your dashboard</Text>
      </View>

      {/* Tender Progress Widget */}
      <TenderProgressWidget onNavigateToTenders={handleNavigateToTenders} />

      <View style={[styles.cardsContainer, !isMobile && styles.gridContainer]}>
        <View style={[styles.card, !isMobile && styles.cardGrid]}>
          <Text style={styles.cardIcon}>📊</Text>
          <Text style={styles.cardTitle}>Analytics</Text>
          <Text style={styles.cardDescription}>View your stats and reports</Text>
        </View>

        <View style={[styles.card, !isMobile && styles.cardGrid]}>
          <Text style={styles.cardIcon}>⚙️</Text>
          <Text style={styles.cardTitle}>Settings</Text>
          <Text style={styles.cardDescription}>Manage your preferences</Text>
        </View>

        <View style={[styles.card, !isMobile && styles.cardGrid]}>
          <Text style={styles.cardIcon}>📱</Text>
          <Text style={styles.cardTitle}>Mobile</Text>
          <Text style={styles.cardDescription}>Access on the go</Text>
        </View>

        <View style={[styles.card, !isMobile && styles.cardGrid]}>
          <Text style={styles.cardIcon}>🔔</Text>
          <Text style={styles.cardTitle}>Notifications</Text>
          <Text style={styles.cardDescription}>Stay updated</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Account Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>User ID:</Text>
          <Text style={styles.infoValue}>{user?.uid?.substring(0, 16)}...</Text>
        </View>
        
        {/* Debug: Stage 1 Migration Button */}
        <TouchableOpacity
          style={styles.migrationButton}
          onPress={handleRunMigration}
          disabled={migrating}
        >
          <Text style={styles.migrationButtonText}>
            {migrating ? '⏳ Running Migration...' : '🔧 Run Stage 1 Migration (Debug)'}
          </Text>
        </TouchableOpacity>
      </View>
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
  header: {
    marginBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  headerTablet: {
    marginBottom: spacing.xxl,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.TEXT_PRIMARY,
    marginBottom: spacing.sm,
  },
  subtext: {
    fontSize: 14,
    color: colors.TEXT_SECONDARY,
  },
  cardsContainer: {
    marginBottom: spacing.xl,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: colors.PRIMARY_LIGHT,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.ACTION_BLUE,
  },
  cardGrid: {
    width: '48%',
    marginRight: spacing.md,
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.TEXT_PRIMARY,
    marginBottom: spacing.sm,
  },
  cardDescription: {
    fontSize: 12,
    color: colors.TEXT_SECONDARY,
  },
  infoCard: {
    backgroundColor: colors.PRIMARY_LIGHT,
    borderRadius: 12,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.ACTION_BLUE,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.TEXT_PRIMARY,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.WHITE,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY,
  },
  infoValue: {
    fontSize: 14,
    color: colors.TEXT_SECONDARY,
  },
  migrationButton: {
    marginTop: spacing.md,
    backgroundColor: '#F59E0B',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  migrationButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default DashboardScreen;
