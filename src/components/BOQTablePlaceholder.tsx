// src/components/BOQTablePlaceholder.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import type { Tender } from '../types/tender';

interface BOQTablePlaceholderProps {
  tender: Tender;
}

export const BOQTablePlaceholder: React.FC<BOQTablePlaceholderProps> = ({ tender }) => {
  // Phase 1: No BOQ items yet (will be parsed in Phase 2)
  // For now, show empty state or sample structure
  const boqItems: any[] = [];

  const handleOpenRateDisabled = () => {
    alert('Open Rate functionality will be available in Phase 2');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bill of Quantities (BOQ)</Text>
      
      {boqItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No BOQ Items</Text>
          <Text style={styles.emptyText}>
            Upload a BOQ file above to populate this table. In Phase 2, files will be parsed automatically.
          </Text>
        </View>
      ) : (
        <ScrollView horizontal style={styles.tableScroll}>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.tableHeader, styles.colItemNo]}>
                <Text style={styles.tableHeaderText}>Item No</Text>
              </View>
              <View style={[styles.tableCell, styles.tableHeader, styles.colDescription]}>
                <Text style={styles.tableHeaderText}>Description</Text>
              </View>
              <View style={[styles.tableCell, styles.tableHeader, styles.colQty]}>
                <Text style={styles.tableHeaderText}>Qty</Text>
              </View>
              <View style={[styles.tableCell, styles.tableHeader, styles.colUnit]}>
                <Text style={styles.tableHeaderText}>Unit</Text>
              </View>
              <View style={[styles.tableCell, styles.tableHeader, styles.colRate]}>
                <Text style={styles.tableHeaderText}>Rate</Text>
              </View>
              <View style={[styles.tableCell, styles.tableHeader, styles.colAmount]}>
                <Text style={styles.tableHeaderText}>Amount</Text>
              </View>
              <View style={[styles.tableCell, styles.tableHeader, styles.colAction]}>
                <Text style={styles.tableHeaderText}>Action</Text>
              </View>
            </View>

            {/* Table Rows */}
            {boqItems.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <View style={[styles.tableCell, styles.colItemNo]}>
                  <Text style={styles.tableCellText}>{item.itemNo || index + 1}</Text>
                </View>
                <View style={[styles.tableCell, styles.colDescription]}>
                  <Text style={styles.tableCellText}>{item.description || 'N/A'}</Text>
                </View>
                <View style={[styles.tableCell, styles.colQty]}>
                  <Text style={styles.tableCellText}>{item.quantity || 0}</Text>
                </View>
                <View style={[styles.tableCell, styles.colUnit]}>
                  <Text style={styles.tableCellText}>{item.unit || 'N/A'}</Text>
                </View>
                <View style={[styles.tableCell, styles.colRate]}>
                  <Text style={styles.tableCellText}>
                    {item.rate ? `₹${item.rate}` : '—'}
                  </Text>
                </View>
                <View style={[styles.tableCell, styles.colAmount]}>
                  <Text style={styles.tableCellText}>
                    {item.amount ? `₹${item.amount}` : '—'}
                  </Text>
                </View>
                <View style={[styles.tableCell, styles.colAction]}>
                  <TouchableOpacity
                    style={styles.openRateButtonDisabled}
                    onPress={handleOpenRateDisabled}
                    disabled={true}
                  >
                    <Text style={styles.openRateButtonText}>Phase 2</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <View style={styles.phaseNotice}>
        <Text style={styles.phaseNoticeText}>
          🔒 <Text style={styles.phaseNoticeBold}>Open Rate buttons are disabled</Text> in Phase 1. 
          Rate Builder modal and analysis features will be available in Phase 2.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2
      }
    })
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20
  },
  tableScroll: {
    marginBottom: 16
  },
  table: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  tableCell: {
    padding: 12,
    justifyContent: 'center'
  },
  tableHeader: {
    backgroundColor: '#F9FAFB'
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase'
  },
  tableCellText: {
    fontSize: 13,
    color: '#111827'
  },
  colItemNo: {
    width: 80
  },
  colDescription: {
    width: 300
  },
  colQty: {
    width: 80,
    alignItems: 'flex-end'
  },
  colUnit: {
    width: 80
  },
  colRate: {
    width: 100,
    alignItems: 'flex-end'
  },
  colAmount: {
    width: 120,
    alignItems: 'flex-end'
  },
  colAction: {
    width: 100,
    alignItems: 'center'
  },
  openRateButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    opacity: 0.6
  },
  openRateButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280'
  },
  phaseNotice: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FCD34D'
  },
  phaseNoticeText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 18
  },
  phaseNoticeBold: {
    fontWeight: '700'
  }
});

