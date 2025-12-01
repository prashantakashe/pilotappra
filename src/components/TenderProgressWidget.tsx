// src/components/TenderProgressWidget.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { tenderService } from '../services/tenderService';
import { calculateProgressPercent } from '../constants/stageConfig';
import { dateUtils } from '../utils/dateUtils';
import type { Tender } from '../types/tender';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface TenderProgressWidgetProps {
  onNavigateToTenders: (filter?: { status?: string; urgentOnly?: boolean }) => void;
}

export const TenderProgressWidget: React.FC<TenderProgressWidgetProps> = ({
  onNavigateToTenders
}) => {
  const [loading, setLoading] = useState(true);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [averageProgress, setAverageProgress] = useState(0);
  const [urgentCount, setUrgentCount] = useState(0);

  useEffect(() => {
    // Subscribe to active tenders (draft + active status)
    const unsubscribe = tenderService.subscribeTenders(
      (updatedTenders) => {
        const activeTenders = updatedTenders.filter(t => 
          t.status === 'active' || t.status === 'draft' || t.status === 'submitted'
        );
        setTenders(activeTenders);

        // Calculate average progress
        if (activeTenders.length > 0) {
          const totalProgress = activeTenders.reduce((sum, t) => {
            const progress = t.progressPercent || calculateProgressPercent(t.stageCompletion);
            return sum + progress;
          }, 0);
          setAverageProgress(Math.round(totalProgress / activeTenders.length));
        } else {
          setAverageProgress(0);
        }

        // Count urgent tenders (deadline <= 7 days)
        const urgentTenders = activeTenders.filter(t => {
          const daysRemaining = dateUtils.getDaysRemaining(t.submissionDeadline);
          return daysRemaining >= 0 && daysRemaining <= 7;
        });
        setUrgentCount(urgentTenders.length);

        setLoading(false);
      },
      {
        status: undefined, // Get all statuses
        sortField: 'submissionDeadline',
        sortOrder: 'asc'
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.ACTION_BLUE} size="small" />
          <Text style={styles.loadingText}>Loading tender progress...</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onNavigateToTenders({ status: 'active' })}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.cardIcon}>📈</Text>
        <Text style={styles.cardTitle}>Tender Progress</Text>
      </View>

      {tenders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No active tenders</Text>
          <Text style={styles.emptySubtext}>Create your first tender to track progress</Text>
        </View>
      ) : (
        <>
          {/* Average Progress */}
          <View style={styles.statRow}>
            <View style={styles.statLeft}>
              <Text style={styles.statLabel}>Average Progress</Text>
              <Text style={styles.statSubtext}>{tenders.length} active tender{tenders.length > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.statRight}>
              <Text style={styles.progressPercent}>{averageProgress}%</Text>
            </View>
          </View>

          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${averageProgress}%` }
              ]}
            />
          </View>

          {/* Urgent Tenders */}
          {urgentCount > 0 && (
            <TouchableOpacity
              style={styles.urgentSection}
              onPress={() => onNavigateToTenders({ urgentOnly: true })}
            >
              <Text style={styles.urgentIcon}>⚠️</Text>
              <View style={styles.urgentText}>
                <Text style={styles.urgentCount}>{urgentCount}</Text>
                <Text style={styles.urgentLabel}> tender{urgentCount > 1 ? 's' : ''} with deadline ≤7 days</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Action Link */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onNavigateToTenders({ status: 'active' })}
          >
            <Text style={styles.actionText}>View All Tenders →</Text>
          </TouchableOpacity>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.WHITE,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 4,
    borderLeftColor: colors.ACTION_BLUE,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm
  },
  loadingText: {
    fontSize: 13,
    color: colors.TEXT_SECONDARY
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm
  },
  cardIcon: {
    fontSize: 28
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.TEXT_PRIMARY
  },
  emptyState: {
    paddingVertical: spacing.lg,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.TEXT_SECONDARY,
    marginBottom: spacing.xs
  },
  emptySubtext: {
    fontSize: 12,
    color: colors.TEXT_SECONDARY
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  statLeft: {
    flex: 1
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY,
    marginBottom: 2
  },
  statSubtext: {
    fontSize: 11,
    color: colors.TEXT_SECONDARY
  },
  statRight: {
    alignItems: 'flex-end'
  },
  progressPercent: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.ACTION_BLUE
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.md
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.ACTION_BLUE,
    borderRadius: 4
  },
  urgentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm
  },
  urgentIcon: {
    fontSize: 20
  },
  urgentText: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flex: 1
  },
  urgentCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D97706'
  },
  urgentLabel: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '600'
  },
  actionButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: spacing.xs
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ACTION_BLUE
  }
});
