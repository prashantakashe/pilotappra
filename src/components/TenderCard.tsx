// src/components/TenderCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { TenderStatusBadge } from './TenderStatusBadge';
import { ProgressBar } from './ProgressBar';
import { TeamAvatarRow } from './TeamAvatarRow';
import { dateUtils } from '../utils/dateUtils';
import { formatUtils } from '../utils/formatUtils';
import { getCompletedStagesCount, getNextStage, TOTAL_STAGES } from '../constants/stageConfig';
import type { Tender } from '../types/tender';

interface TenderCardProps {
  tender: Tender;
  onPress: () => void;
  onRateAnalysis: () => void;
  onUploadDocument: () => void;
  onMore: () => void;
  onStagePress?: () => void; // Navigate to Stages tab
}

export const TenderCard: React.FC<TenderCardProps> = ({
  tender,
  onPress,
  onRateAnalysis,
  onUploadDocument,
  onMore,
  onStagePress
}) => {
  const daysRemaining = dateUtils.getDaysRemaining(tender.submissionDeadline);
  const urgencyColor = dateUtils.getDeadlineUrgencyColor(daysRemaining);
  
  // Calculate team members from membersMap
  const teamMembers = Object.entries(tender.membersMap || {}).map(([uid, role]) => ({
    name: tender.tenderManager || uid, // Placeholder - would fetch actual names
    role
  }));

  const docProgress = tender.documentProgressSummary || { mandatoryCompleted: 0, mandatoryTotal: 0 };
  const progress = tender.tenderProgressPercent || 0;

  // Stage progress
  const completedStagesCount = getCompletedStagesCount(tender.stageCompletion);
  const stageProgress = tender.progressPercent || 0;
  const nextStage = getNextStage(tender.stageCompletion);
  
  // Debug logging
  if (completedStagesCount === 0 && tender.stageCompletion) {
    console.log(`[TenderCard] DEBUG: tender ${tender.tenderNo}:`, {
      hasstageCompletion: !!tender.stageCompletion,
      stageCompletionKeys: Object.keys(tender.stageCompletion),
      stage1: tender.stageCompletion['1_identification'],
      completedStagesCount,
      progressPercent: tender.progressPercent
    });
  }

  return (
    <TouchableOpacity
      style={[styles.card, Platform.OS === 'web' && styles.cardHover]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Row 1: Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.tenderNo}>{tender.tenderNo || 'N/A'}</Text>
          <Text style={styles.title} numberOfLines={2}>
            {tender.title}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.estimatedValue}>
            {formatUtils.formatCurrency(tender.estimatedValue, tender.currency)}
          </Text>
        </View>
      </View>

      {/* Status Badge */}
      <View style={styles.statusRow}>
        <TenderStatusBadge status={tender.status} />
      </View>

      {/* Row 2: Meta Information */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Short Name</Text>
          <Text style={styles.metaValue}>{tender.shortName || 'N/A'}</Text>
        </View>

        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Client</Text>
          <Text style={styles.metaValue}>
            {tender.client || 'N/A'}
            {tender.department && ` / ${tender.department}`}
          </Text>
        </View>

        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Source</Text>
          <View style={styles.sourceRow}>
            <Text style={styles.metaValue}>{tender.tenderSource}</Text>
            {tender.tenderSource === 'Other' && tender.tenderSourceOther && (
              <Text style={styles.metaValueSmall}> ({tender.tenderSourceOther})</Text>
            )}
          </View>
        </View>

        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Location</Text>
          <Text style={styles.metaValue}>
            {formatUtils.formatLocation(tender.city, tender.state)}
          </Text>
        </View>

        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Submission Deadline</Text>
          <View style={styles.deadlineRow}>
            <Text style={[styles.metaValue, { color: urgencyColor, fontWeight: '600' }]}>
              {dateUtils.formatDate(tender.submissionDeadline)}
            </Text>
            <Text style={[styles.daysLeft, { color: urgencyColor }]}>
              ({dateUtils.formatDaysRemaining(daysRemaining)})
            </Text>
          </View>
        </View>

        {tender.boqFileUrl && (
          <View style={styles.iconBadge}>
            <Text style={styles.iconText}>📊 BOQ</Text>
          </View>
        )}

        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Last Updated</Text>
          <Text style={styles.metaValueSmall}>
            {dateUtils.getRelativeTime(tender.lastUpdated)}
          </Text>
        </View>
      </View>

      {/* Quick Note Snippet */}
      {tender.internalNotes && (
        <View style={styles.noteRow}>
          <Text style={styles.noteIcon}>💬</Text>
          <Text style={styles.noteText} numberOfLines={1}>
            {formatUtils.truncate(tender.internalNotes, 80)}
          </Text>
        </View>
      )}

      {/* Tender Stage Progress */}
      <TouchableOpacity 
        style={styles.stageProgressRow}
        onPress={(e) => {
          e.stopPropagation();
          onStagePress?.();
        }}
        disabled={!onStagePress}
        activeOpacity={0.7}
      >
        <View style={styles.stageProgressLeft}>
          <Text style={styles.stageProgressLabel}>
            Tender Progress: {completedStagesCount}/{TOTAL_STAGES} Stages
          </Text>
          {nextStage && (
            <Text style={styles.nextStageHint}>
              Next: Stage {nextStage.number} — {nextStage.title}
            </Text>
          )}
        </View>
        <View style={styles.stageProgressRight}>
          <Text style={styles.stageProgressPercent}>{stageProgress}%</Text>
        </View>
        <View style={styles.stageProgressBarContainer}>
          <ProgressBar
            progress={stageProgress}
            height={4}
            showLabel={false}
            color="#10B981"
          />
        </View>
      </TouchableOpacity>

      {/* Row 3: Progress & Team */}
      <View style={styles.indicatorRow}>
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>
            Documents: {formatUtils.formatDocProgress(docProgress.mandatoryCompleted, docProgress.mandatoryTotal)}
          </Text>
          <ProgressBar
            progress={progress}
            height={6}
            showLabel={false}
          />
        </View>

        <View style={styles.teamSection}>
          {teamMembers.length > 0 && (
            <TeamAvatarRow members={teamMembers} maxVisible={3} />
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onRateAnalysis();
            }}
          >
            <Text style={styles.actionIcon}>📊</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onUploadDocument();
            }}
          >
            <Text style={styles.actionIcon}>📎</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onMore();
            }}
          >
            <Text style={styles.actionIcon}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer: Tender ID */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>ID: {tender.tenderId}</Text>
        {tender.externalLink && (
          <Text style={styles.footerLink}>🔗 External Link</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2
      }
    })
  },
  cardHover: {
    // Web-only hover styles handled via CSS in web build
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  headerLeft: {
    flex: 1,
    marginRight: 16
  },
  headerRight: {
    alignItems: 'flex-end'
  },
  tenderNo: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 24
  },
  estimatedValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E90FF'
  },
  statusRow: {
    marginBottom: 12
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 12
  },
  metaItem: {
    minWidth: '30%',
    marginBottom: 8
  },
  metaLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2
  },
  metaValue: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500'
  },
  metaValueSmall: {
    fontSize: 11,
    color: '#6B7280'
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  daysLeft: {
    fontSize: 12,
    fontWeight: '600'
  },
  iconBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    alignSelf: 'flex-start'
  },
  iconText: {
    fontSize: 12
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    gap: 8
  },
  noteIcon: {
    fontSize: 14
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: '#4B5563',
    fontStyle: 'italic'
  },
  stageProgressRow: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5'
  },
  stageProgressLeft: {
    flex: 1,
    marginBottom: 6
  },
  stageProgressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 2
  },
  nextStageHint: {
    fontSize: 10,
    color: '#10B981',
    fontStyle: 'italic'
  },
  stageProgressRight: {
    position: 'absolute',
    top: 10,
    right: 10
  },
  stageProgressPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669'
  },
  stageProgressBarContainer: {
    marginTop: 4
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12
  },
  progressSection: {
    flex: 2,
    minWidth: 120
  },
  progressLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4
  },
  teamSection: {
    flex: 1,
    alignItems: 'center'
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 8
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  actionIcon: {
    fontSize: 16
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6'
  },
  footerText: {
    fontSize: 10,
    color: '#9CA3AF'
  },
  footerLink: {
    fontSize: 10,
    color: '#1E90FF'
  }
});
