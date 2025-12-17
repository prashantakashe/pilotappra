// src/components/RateAnalysisTenderCard.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, TextInput, Alert } from 'react-native';
import type { Tender } from '../types/tender';
import { dateUtils } from '../utils/dateUtils';
import { formatUtils } from '../utils/formatUtils';
import { tenderService } from '../services/tenderService';

interface RateAnalysisTenderCardProps {
  tender: Tender;
  onPress: () => void;
  onPressMarket?: () => void;
  onPressSSR?: () => void;
}

export const RateAnalysisTenderCard: React.FC<RateAnalysisTenderCardProps> = ({
  tender,
  onPress,
  onPressMarket,
  onPressSSR
}) => {
  const daysRemaining = dateUtils.getDaysRemaining(tender.submissionDeadline);
  const urgencyColor = dateUtils.getDeadlineUrgencyColor(daysRemaining);
  
  // Status color mapping
  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      'upcoming': '#9CA3AF', // gray
      'active': '#3B82F6',    // blue
      'submitted': '#6366F1', // indigo
      'won': '#10B981',       // green
      'lost': '#EF4444',      // red
      'draft': '#F59E0B'      // amber
    };
    return statusMap[status.toLowerCase()] || '#9CA3AF';
  };

  // Calculate progress (if items exist)
  const itemsCompleted = tender.boqItemCount || 0;
  const totalItems = tender.boqItemCount || 0;
  const progressPercent = totalItems > 0 ? Math.round((itemsCompleted / totalItems) * 100) : 0;

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(tender.title || '');
  const [client, setClient] = useState(tender.client || '');
  const [department, setDepartment] = useState(tender.department || '');
  const [estimatedValue, setEstimatedValue] = useState(
    (tender.estimatedValue ?? tender.value ?? 0).toString()
  );

  const handleSave = async () => {
    try {
      await tenderService.updateTender(tender.tenderId, {
        title: title?.trim() || tender.title,
        client: client?.trim() || null,
        department: department?.trim() || null,
        estimatedValue: Number(estimatedValue) || 0,
      });
      setIsEditing(false);
    } catch (e: any) {
      Alert.alert('Save failed', e.message || 'Unable to save changes');
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Tender: ${tender.title}`}
    >
      {/* Action Icons - only show during edit mode */}
      {isEditing && (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.iconBtn, styles.saveIconBtn]} onPress={handleSave} accessibilityRole="button" accessibilityLabel="Save changes">
            <Text style={[styles.iconText, styles.saveIconText]}>💾</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              setIsEditing(false);
              setTitle(tender.title || '');
              setClient(tender.client || '');
              setDepartment(tender.department || '');
              setEstimatedValue((tender.estimatedValue ?? tender.value ?? 0).toString());
            }}
            accessibilityRole="button"
            accessibilityLabel="Cancel edit"
          >
            <Text style={styles.iconText}>✖️</Text>
          </TouchableOpacity>
        </View>
      )}
      {/* Tender ID */}
      <Text style={styles.tenderId}>ID: {tender.tenderNo || tender.tenderId}</Text>
      
      {/* Short Title */}
      {isEditing ? (
        <TextInput
          style={[styles.title, styles.input]}
          value={title}
          onChangeText={setTitle}
          placeholder="Tender title"
        />
      ) : (
        <Text style={styles.title} numberOfLines={2}>
          {tender.title}
        </Text>
      )}
      
      {/* Client / Department */}
      {isEditing ? (
        <View>
          <TextInput
            style={[styles.clientInfo, styles.input]}
            value={client}
            onChangeText={setClient}
            placeholder="Client"
          />
          <TextInput
            style={[styles.clientInfo, styles.input, { marginTop: 6 }]}
            value={department}
            onChangeText={setDepartment}
            placeholder="Department"
          />
        </View>
      ) : (
        <Text style={styles.clientInfo} numberOfLines={1}>
          {tender.client || 'N/A'}
          {tender.department && ` / ${tender.department}`}
        </Text>
      )}
      
      {/* Submission Deadline */}
      <View style={styles.deadlineRow}>
        <Text style={[styles.deadline, { color: urgencyColor }]}>
          📅 {dateUtils.formatDate(tender.submissionDeadline)}
        </Text>
        <Text style={[styles.daysLeft, { color: urgencyColor }]}>
          ({dateUtils.formatDaysRemaining(daysRemaining)})
        </Text>
      </View>
      
      {/* Estimated Value */}
      {isEditing ? (
        <TextInput
          style={[styles.value, styles.input]}
          value={estimatedValue}
          onChangeText={setEstimatedValue}
          keyboardType="decimal-pad"
          placeholder="Estimated value"
        />
      ) : (
        <Text style={styles.value}>
          {formatUtils.formatCurrency(tender.estimatedValue, tender.currency)}
        </Text>
      )}
      
      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tender.status) }]}>
        <Text style={styles.statusText}>
          {tender.status.charAt(0).toUpperCase() + tender.status.slice(1)}
        </Text>
      </View>
      
      {/* Progress Indicator */}
      {totalItems > 0 && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>
            {itemsCompleted}/{totalItems} items
          </Text>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent}%` }
              ]}
            />
          </View>
        </View>
      )}
      
      {/* Action Buttons - Market RA and SSR RA */}
      {onPressMarket && onPressSSR ? (
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.raButton, styles.marketButton]} 
            onPress={onPressMarket}
          >
            <Text style={styles.raButtonText}>📊 Market RA</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.raButton, styles.ssrButton]} 
            onPress={onPressSSR}
          >
            <Text style={styles.raButtonText}>📈 SSR RA</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.openButton} onPress={onPress}>
          <Text style={styles.openButtonText}>Open →</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease',
        cursor: 'pointer'
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
  tenderId: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 24
  },
  clientInfo: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4
  },
  deadline: {
    fontSize: 13,
    fontWeight: '600'
  },
  daysLeft: {
    fontSize: 12,
    fontWeight: '600'
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E90FF',
    marginBottom: 12
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 12
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase'
  },
  progressContainer: {
    marginBottom: 12
  },
  progressLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1E90FF',
    borderRadius: 3
  },
  openButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  openButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E90FF'
  },
  actionsRow: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  iconText: {
    fontSize: 14,
  },
  deleteIconBtn: {
    backgroundColor: '#fff5f5',
    borderColor: '#ffe3e3',
  },
  deleteIconText: { color: '#dc2626' },
  saveIconBtn: {
    backgroundColor: '#ecfdf5',
    borderColor: '#bbf7d0',
  },
  saveIconText: { color: '#059669' },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  }
  ,
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  raButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  marketButton: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  ssrButton: {
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  raButtonText: {
    fontWeight: '700',
    color: '#111827'
  }
});
