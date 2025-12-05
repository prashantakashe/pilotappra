// src/components/dailyWorkStatus/DWSDashboardTab.tsx
/**
 * Dashboard Tab for Daily Work Status module
 * Shows overview metrics and quick stats
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useResponsive } from '../../hooks/useResponsive';
import { dailyWorkStatusService, getDashboardMetrics } from '../../services/dailyWorkStatusService';
import type { DWSDashboardMetrics, DWSDailyEntry, DWSStatus } from '../../types/dailyWorkStatus';

interface DWSDashboardTabProps {
  onNavigate?: (tab: 'DWSMaster' | 'DWSDaily' | 'DWSReport' | 'DWSDashboard' | 'DWSUsers', filter?: string) => void;
}

export const DWSDashboardTab: React.FC<DWSDashboardTabProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DWSDashboardMetrics | null>(null);
  const [recentEntries, setRecentEntries] = useState<DWSDailyEntry[]>([]);
  const [statuses, setStatuses] = useState<DWSStatus[]>([]);
  
  const { isMobile } = useResponsive();

  // Inject tooltip CSS for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.innerHTML = `
        [title] {
          position: relative;
          cursor: pointer;
        }
        [title]:hover::after {
          content: attr(title);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.85);
          color: white;
          padding: 6px 10px;
          border-radius: 4px;
          white-space: nowrap;
          font-size: 12px;
          z-index: 10000;
          pointer-events: none;
          margin-bottom: 5px;
        }
        [title]:hover::before {
          content: '';
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 5px solid transparent;
          border-top-color: rgba(0, 0, 0, 0.85);
          z-index: 10000;
          pointer-events: none;
        }
      `;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

  useEffect(() => {
    loadData();
    
    // Subscribe to entries for real-time updates
    const unsubEntries = dailyWorkStatusService.subscribeToEntries((entries) => {
      setRecentEntries(entries.slice(0, 5));
    });
    
    const unsubStatuses = dailyWorkStatusService.subscribeToStatuses(setStatuses);
    
    return () => {
      unsubEntries();
      unsubStatuses();
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getDashboardMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('[DWS Dashboard] Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get today's date
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.ACTION_BLUE} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>📊 Dashboard - Overview</Text>
        <Text style={styles.dateText}>{formattedDate}</Text>
      </View>
      
      {/* Notification Banner */}
      <View style={styles.notificationBanner}>
        <Text style={styles.notificationIcon}>🔔</Text>
        <Text style={styles.notificationText}>
          Reminder: Log today's work entries by end of day!
        </Text>
      </View>
      
      {/* KPI Cards */}
      <View style={[styles.kpiRow, isMobile && styles.kpiRowMobile]}>
        <TouchableOpacity 
          style={[styles.kpiCard, { backgroundColor: '#E3F2FD' }]}
          onPress={() => onNavigate?.('DWSDaily')}
          {...(Platform.OS === 'web' && { title: 'View Daily Entries' })}
        >
          <Text style={styles.kpiIcon}>📋</Text>
          <Text style={styles.kpiValue}>{metrics?.todayEntries || 0}</Text>
          <Text style={styles.kpiLabel}>Today's Entries</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.kpiCard, { backgroundColor: '#E8F5E9' }]}
          onPress={() => onNavigate?.('DWSMaster')}
          {...(Platform.OS === 'web' && { title: 'View Projects' })}
        >
          <Text style={styles.kpiIcon}>🏗️</Text>
          <Text style={styles.kpiValue}>{metrics?.activeProjects || 0}</Text>
          <Text style={styles.kpiLabel}>Active Projects</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.kpiCard, { backgroundColor: '#FFF3E0' }]}
          onPress={() => onNavigate?.('DWSMaster')}
          {...(Platform.OS === 'web' && { title: 'View Personnel' })}
        >
          <Text style={styles.kpiIcon}>👷</Text>
          <Text style={styles.kpiValue}>{metrics?.totalPersonnel || 0}</Text>
          <Text style={styles.kpiLabel}>Personnel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.kpiCard, { backgroundColor: '#FCE4EC' }]}
          onPress={() => onNavigate?.('DWSDaily')}
          {...(Platform.OS === 'web' && { title: 'View Pending Items' })}
        >
          <Text style={styles.kpiIcon}>⏳</Text>
          <Text style={styles.kpiValue}>{metrics?.pendingApprovals || 0}</Text>
          <Text style={styles.kpiLabel}>Pending</Text>
        </TouchableOpacity>
      </View>
      
      {/* Status Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>📈 Work Status Summary</Text>
        <View style={styles.statusSummaryRow}>
          <TouchableOpacity 
            style={[styles.statusItem, { borderLeftColor: '#28a745' }]}
            onPress={() => onNavigate?.('DWSDaily', 'Completed')}
            {...(Platform.OS === 'web' && { title: 'View Completed Activities' })}
          >
            <Text style={styles.statusValue}>{metrics?.completedActivities || 0}</Text>
            <Text style={styles.statusLabel}>Completed</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statusItem, { borderLeftColor: '#ffc107' }]}
            onPress={() => onNavigate?.('DWSDaily', 'Ongoing')}
            {...(Platform.OS === 'web' && { title: 'View Ongoing Activities' })}
          >
            <Text style={styles.statusValue}>{metrics?.ongoingActivities || 0}</Text>
            <Text style={styles.statusLabel}>Ongoing</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statusItem, { borderLeftColor: '#dc3545' }]}
            onPress={() => onNavigate?.('DWSDaily', 'Not Started')}
            {...(Platform.OS === 'web' && { title: 'View Not Started Activities' })}
          >
            <Text style={styles.statusValue}>{metrics?.notStartedActivities || 0}</Text>
            <Text style={styles.statusLabel}>Not Started</Text>
          </TouchableOpacity>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>Overall Progress</Text>
          <View style={styles.progressBar}>
            {metrics && (metrics.completedActivities + metrics.ongoingActivities + metrics.notStartedActivities) > 0 && (
              <>
                <View 
                  style={[
                    styles.progressSegment, 
                    { 
                      flex: metrics.completedActivities, 
                      backgroundColor: '#28a745' 
                    }
                  ]} 
                />
                <View 
                  style={[
                    styles.progressSegment, 
                    { 
                      flex: metrics.ongoingActivities, 
                      backgroundColor: '#ffc107' 
                    }
                  ]} 
                />
                <View 
                  style={[
                    styles.progressSegment, 
                    { 
                      flex: metrics.notStartedActivities, 
                      backgroundColor: '#dc3545' 
                    }
                  ]} 
                />
              </>
            )}
          </View>
        </View>
      </View>
      
      {/* Recent Entries */}
      <View style={styles.recentCard}>
        <Text style={styles.cardTitle}>📝 Recent Work Entries</Text>
        {recentEntries.length > 0 ? (
          recentEntries.map((entry) => (
            <TouchableOpacity 
              key={entry.id} 
              style={styles.entryItem}
              onPress={() => onNavigate?.('DWSDaily')}
              {...(Platform.OS === 'web' && { title: 'View in Daily Entry' })}
            >
              <View style={styles.entryHeader}>
                <Text style={styles.entryProject}>{entry.projectName}</Text>
                <View style={[
                  styles.entryStatus,
                  { backgroundColor: statuses.find(s => s.name === entry.finalStatus)?.color || '#6c757d' }
                ]}>
                  <Text style={styles.entryStatusText}>{entry.finalStatus}</Text>
                </View>
              </View>
              <Text style={styles.entryActivity} numberOfLines={2}>{entry.mainActivity || 'No activity description'}</Text>
              <View style={styles.entryFooter}>
                <Text style={styles.entryMeta}>👤 {entry.assignedTo}</Text>
                <Text style={styles.entryMeta}>⏱️ {entry.hours || 0}h</Text>
                <Text style={styles.entryMeta}>📅 {entry.dateTime}</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No recent entries</Text>
            <Text style={styles.emptySubtext}>Start logging your daily work activities</Text>
          </View>
        )}
      </View>
      
      {/* Quick Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.cardTitle}>💡 Quick Tips</Text>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>Log your activities daily for accurate tracking</Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>Add status updates to keep your team informed</Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>Use sub-activities for detailed task breakdowns</Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipBullet}>•</Text>
          <Text style={styles.tipText}>Generate reports to analyze productivity trends</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  loadingText: {
    marginTop: 12,
    color: colors.TEXT_SECONDARY
  },
  header: {
    padding: spacing.lg
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.TEXT_PRIMARY,
    marginBottom: spacing.xs
  },
  dateText: {
    fontSize: 14,
    color: colors.TEXT_SECONDARY
  },
  notificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    marginBottom: spacing.lg
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: spacing.sm
  },
  notificationText: {
    flex: 1,
    fontSize: 14,
    color: '#856404'
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg
  },
  kpiRowMobile: {
    flexDirection: 'column'
  },
  kpiCard: {
    flex: 1,
    minWidth: 140,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      web: { 
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s'
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2
      }
    })
  },
  kpiIcon: {
    fontSize: 32,
    marginBottom: spacing.sm
  },
  kpiValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.TEXT_PRIMARY,
    marginBottom: spacing.xs
  },
  kpiLabel: {
    fontSize: 12,
    color: colors.TEXT_SECONDARY,
    textAlign: 'center'
  },
  summaryCard: {
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
    marginBottom: spacing.md
  },
  statusSummaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg
  },
  statusItem: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderLeftWidth: 4,
    alignItems: 'center',
    ...Platform.select({
      web: { 
        cursor: 'pointer',
        transition: 'transform 0.2s, background-color 0.2s'
      }
    })
  },
  statusValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.TEXT_PRIMARY
  },
  statusLabel: {
    fontSize: 12,
    color: colors.TEXT_SECONDARY,
    marginTop: spacing.xs
  },
  progressContainer: {
    marginTop: spacing.sm
  },
  progressLabel: {
    fontSize: 12,
    color: colors.TEXT_SECONDARY,
    marginBottom: spacing.xs
  },
  progressBar: {
    flexDirection: 'row',
    height: 12,
    backgroundColor: '#E9ECEF',
    borderRadius: 6,
    overflow: 'hidden'
  },
  progressSegment: {
    height: '100%'
  },
  recentCard: {
    backgroundColor: '#fff',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: 12,
    ...Platform.select({
      web: { boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }
    })
  },
  entryItem: {
    padding: spacing.md,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.ACTION_BLUE,
    ...Platform.select({
      web: { 
        cursor: 'pointer',
        transition: 'background-color 0.2s, transform 0.2s'
      }
    })
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  entryProject: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY
  },
  entryStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4
  },
  entryStatusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500'
  },
  entryActivity: {
    fontSize: 13,
    color: colors.TEXT_SECONDARY,
    marginBottom: spacing.xs
  },
  entryFooter: {
    flexDirection: 'row',
    gap: spacing.md
  },
  entryMeta: {
    fontSize: 11,
    color: colors.TEXT_SECONDARY
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center'
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.sm
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.TEXT_SECONDARY,
    marginTop: spacing.xs
  },
  tipsCard: {
    backgroundColor: '#E8F4FD',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B3D9F2'
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: spacing.xs
  },
  tipBullet: {
    fontSize: 14,
    color: colors.ACTION_BLUE,
    marginRight: spacing.sm,
    fontWeight: '700'
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#1565C0'
  }
});
