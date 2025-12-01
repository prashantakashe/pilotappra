// src/components/StagePanel.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { STAGE_CONFIGS, StageId, userCanCompleteStage } from '../constants/stageConfig';
import { StageCompletionInfo } from '../types/tender';
import { dateUtils } from '../utils/dateUtils';

interface StagePanelProps {
  stageId: StageId;
  completion?: StageCompletionInfo;
  userRole: string;
  onMarkComplete: (stageId: StageId, evidenceRefs: string[], notes: string) => Promise<void>;
  autoEligible?: boolean;
}

export const StagePanel: React.FC<StagePanelProps> = ({
  stageId,
  completion,
  userRole,
  onMarkComplete,
  autoEligible = false
}) => {
  const config = STAGE_CONFIGS[stageId];
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<string[]>([]);

  const isCompleted = completion?.done === true;
  const canComplete = userCanCompleteStage(stageId, userRole);
  const isManualTrigger = config.triggerType === 'manual' || config.triggerType === 'hybrid';

  const handleMarkComplete = async () => {
    if (!canComplete) return;
    
    try {
      setLoading(true);
      await onMarkComplete(stageId, evidenceFiles, notes);
      setNotes('');
      setEvidenceFiles([]);
    } catch (error) {
      console.error('[StagePanel] Error marking stage complete:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, isCompleted && styles.containerCompleted]}>
      {/* Stage Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.stageNumber, isCompleted && styles.stageNumberCompleted]}>
            {isCompleted ? (
              <Text style={styles.checkmark}>✓</Text>
            ) : (
              <Text style={styles.numberText}>{config.number}</Text>
            )}
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.description}>{config.description}</Text>
          </View>
        </View>
        
        {isCompleted && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>✓ Done</Text>
          </View>
        )}
      </View>

      {/* Completion Details (if completed) */}
      {isCompleted && completion && (
        <View style={styles.completionInfo}>
          <Text style={styles.completionPhrase}>{config.completionPhrase}</Text>
          <Text style={styles.completionMeta}>
            Completed by {completion.by || 'Unknown'} on{' '}
            {completion.at ? dateUtils.formatDate(completion.at) : 'Unknown date'}
          </Text>
          
          {/* Evidence Files */}
          {completion.evidenceRefs && completion.evidenceRefs.length > 0 && (
            <View style={styles.evidenceSection}>
              <Text style={styles.evidenceLabel}>Evidence Files:</Text>
              {completion.evidenceRefs.map((ref, index) => (
                <TouchableOpacity key={index} style={styles.evidenceItem}>
                  <Text style={styles.evidenceIcon}>📎</Text>
                  <Text style={styles.evidenceText}>{ref.split('/').pop()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Auto-complete Conditions */}
      {!isCompleted && config.autoConditions && (
        <View style={styles.conditionsSection}>
          <Text style={styles.conditionsLabel}>Auto-complete conditions:</Text>
          <Text style={styles.conditionsText}>{config.autoConditions}</Text>
          
          {autoEligible && (
            <View style={styles.eligibleBadge}>
              <Text style={styles.eligibleText}>✓ Conditions met</Text>
            </View>
          )}
        </View>
      )}

      {/* Manual Completion Button */}
      {!isCompleted && isManualTrigger && canComplete && (
        <View style={styles.actionsSection}>
          {config.evidenceRequired && (
            <View style={styles.uploadSection}>
              <Text style={styles.uploadLabel}>Upload Evidence (optional):</Text>
              <TouchableOpacity style={styles.uploadButton}>
                <Text style={styles.uploadButtonText}>📎 Attach Files</Text>
              </TouchableOpacity>
              {evidenceFiles.length > 0 && (
                <Text style={styles.uploadCount}>{evidenceFiles.length} file(s) attached</Text>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[styles.completeButton, loading && styles.completeButtonDisabled]}
            onPress={handleMarkComplete}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.completeButtonText}>Mark Stage {config.number} Completed</Text>
            )}
          </TouchableOpacity>

          {!canComplete && (
            <Text style={styles.permissionWarning}>
              You don't have permission to complete this stage
            </Text>
          )}
        </View>
      )}

      {/* Role Requirements */}
      {!isCompleted && config.requiredRoles && config.requiredRoles.length > 0 && (
        <View style={styles.roleSection}>
          <Text style={styles.roleLabel}>Required roles:</Text>
          <Text style={styles.roleText}>{config.requiredRoles.join(', ')}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2
      }
    })
  },
  containerCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  headerLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 12
  },
  stageNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center'
  },
  stageNumberCompleted: {
    backgroundColor: '#10B981'
  },
  numberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151'
  },
  checkmark: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '700'
  },
  headerText: {
    flex: 1
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18
  },
  statusBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff'
  },
  completionInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12
  },
  completionPhrase: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 6
  },
  completionMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8
  },
  evidenceSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  evidenceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6
  },
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 6
  },
  evidenceIcon: {
    fontSize: 14
  },
  evidenceText: {
    fontSize: 12,
    color: '#1E90FF',
    textDecorationLine: 'underline'
  },
  conditionsSection: {
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FED7AA'
  },
  conditionsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9A3412',
    marginBottom: 4
  },
  conditionsText: {
    fontSize: 12,
    color: '#7C2D12',
    lineHeight: 18
  },
  eligibleBadge: {
    marginTop: 8,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start'
  },
  eligibleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46'
  },
  actionsSection: {
    marginTop: 12
  },
  uploadSection: {
    marginBottom: 12
  },
  uploadLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6
  },
  uploadButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center'
  },
  uploadButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151'
  },
  uploadCount: {
    fontSize: 11,
    color: '#059669',
    marginTop: 4
  },
  completeButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44
  },
  completeButtonDisabled: {
    backgroundColor: '#9CA3AF'
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff'
  },
  permissionWarning: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 8,
    textAlign: 'center'
  },
  roleSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  roleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2
  },
  roleText: {
    fontSize: 12,
    color: '#374151',
    fontStyle: 'italic'
  }
});
