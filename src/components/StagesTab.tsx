// src/components/StagesTab.tsx
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, ActivityIndicator, Alert } from 'react-native';
import { StagePanel } from './StagePanel';
import { STAGE_ORDER, StageId, calculateProgressPercent, getCompletedStagesCount, TOTAL_STAGES } from '../constants/stageConfig';
import * as stageService from '../services/stageService';
import { Tender } from '../types/tender';
import { ProgressBar } from './ProgressBar';

interface StagesTabProps {
  tender: Tender;
  userRole: string; // Current user's role from membersMap or custom claims
  onTenderUpdate?: (updatedTender: Tender) => void;
}

export const StagesTab: React.FC<StagesTabProps> = ({
  tender,
  userRole,
  onTenderUpdate
}) => {
  const [loading, setLoading] = useState(false);

  // Calculate progress
  const completedCount = getCompletedStagesCount(tender.stageCompletion);
  const progressPercent = calculateProgressPercent(tender.stageCompletion);

  // Get auto-eligibility status for all stages
  const autoEligibility = stageService.getAutoEligibilityStatus(tender);

  // Handle stage completion
  const handleMarkComplete = useCallback(
    async (stageId: StageId, evidenceRefs: string[], notes: string) => {
      try {
        setLoading(true);

        const result = await stageService.finalizeStage(
          tender.tenderId,
          stageId,
          evidenceRefs,
          notes
        );

        if (result.success && result.tender) {
          // Update parent component with new tender data
          onTenderUpdate?.(result.tender);
          
          // Show success message
          if (Platform.OS === 'web') {
            alert(result.message || 'Stage completed successfully!');
          } else {
            Alert.alert('Success', result.message || 'Stage completed successfully!');
          }
        } else {
          throw new Error(result.error || 'Failed to complete stage');
        }
      } catch (error: any) {
        console.error('[StagesTab] Error completing stage:', error);
        if (Platform.OS === 'web') {
          alert(error.message || 'Failed to complete stage');
        } else {
          Alert.alert('Error', error.message || 'Failed to complete stage');
        }
      } finally {
        setLoading(false);
      }
    },
    [tender.tenderId, onTenderUpdate]
  );

  return (
    <View style={styles.container}>
      {/* Overall Progress Header */}
      <View style={styles.progressHeader}>
        <View style={styles.progressHeaderTop}>
          <Text style={styles.progressTitle}>Tender Workflow Progress</Text>
          <Text style={styles.progressCount}>
            {completedCount}/{TOTAL_STAGES} Stages Complete
          </Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <ProgressBar
            progress={progressPercent}
            height={8}
            showLabel={false}
            color="#10B981"
          />
          <Text style={styles.progressPercent}>{progressPercent}%</Text>
        </View>

        <View style={styles.progressMeta}>
          <Text style={styles.progressMetaText}>
            {completedCount === TOTAL_STAGES
              ? '🎉 All stages completed! Tender is fully processed.'
              : `${TOTAL_STAGES - completedCount} stage${TOTAL_STAGES - completedCount > 1 ? 's' : ''} remaining`}
          </Text>
        </View>
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Updating stage...</Text>
        </View>
      )}

      {/* Vertical Stepper: All 16 Stages */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {STAGE_ORDER.map((stageId, index) => {
          const completion = tender.stageCompletion?.[stageId];
          const isAutoEligible = autoEligibility[stageId] || false;

          return (
            <View key={stageId} style={styles.stageWrapper}>
              {/* Connector Line (except last stage) */}
              {index < STAGE_ORDER.length - 1 && (
                <View
                  style={[
                    styles.connector,
                    completion?.done && styles.connectorCompleted
                  ]}
                />
              )}

              <StagePanel
                stageId={stageId}
                completion={completion}
                userRole={userRole}
                onMarkComplete={handleMarkComplete}
                autoEligible={isAutoEligible}
              />
            </View>
          );
        })}

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  progressHeader: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3
      }
    })
  },
  progressHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827'
  },
  progressCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669'
  },
  progressBarContainer: {
    position: 'relative',
    marginBottom: 8
  },
  progressPercent: {
    position: 'absolute',
    right: 0,
    top: -20,
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981'
  },
  progressMeta: {
    alignItems: 'center'
  },
  progressMetaText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic'
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280'
  },
  scrollContainer: {
    flex: 1
  },
  scrollContent: {
    padding: 16
  },
  stageWrapper: {
    position: 'relative'
  },
  connector: {
    position: 'absolute',
    left: 35,
    top: 40,
    width: 3,
    height: 40,
    backgroundColor: '#E5E7EB',
    zIndex: -1
  },
  connectorCompleted: {
    backgroundColor: '#86EFAC'
  },
  bottomSpacer: {
    height: 40
  }
});
