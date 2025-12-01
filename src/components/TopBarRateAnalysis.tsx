// src/components/TopBarRateAnalysis.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import type { Tender } from '../types/tender';

interface TopBarRateAnalysisProps {
  tenders: Tender[];
  selectedTenderId: string;
  onTenderChange: (tenderId: string) => void;
  onNewTender: () => void;
}

export const TopBarRateAnalysis: React.FC<TopBarRateAnalysisProps> = ({
  tenders,
  selectedTenderId,
  onTenderChange,
  onNewTender
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Text style={styles.label}>Select Tender:</Text>
        {Platform.OS === 'web' ? (
          <select
            value={selectedTenderId}
            onChange={(e) => onTenderChange((e.target as HTMLSelectElement).value)}
            style={{
              padding: 10,
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              background: '#fff',
              fontSize: 14,
              color: '#374151',
              minWidth: 300,
              cursor: 'pointer'
            }}
          >
            {tenders.length === 0 && <option value="">No tenders available</option>}
            {tenders.map((t) => (
              <option key={t.tenderId} value={t.tenderId}>
                {t.tenderNo || t.tenderId} - {t.title}
              </option>
            ))}
          </select>
        ) : (
          <Text style={styles.mobileNote}>Use web version for tender selector</Text>
        )}
      </View>
      
      <TouchableOpacity style={styles.newButton} onPress={onNewTender}>
        <Text style={styles.newButtonText}>+ New Tender</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151'
  },
  mobileNote: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic'
  },
  newButton: {
    backgroundColor: '#1E90FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  newButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  }
});
