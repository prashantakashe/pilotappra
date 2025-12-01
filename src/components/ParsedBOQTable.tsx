// src/components/ParsedBOQTable.tsx
/**
 * Parsed BOQ Table Component - Phase 2
 * 
 * Displays standardized BOQ in editable table with:
 * - Inline editing for Description, Unit, Quantity, Rate, ItemCode
 * - Auto-calculation of Amount (qty * rate)
 * - Row-level revisions and history
 * - Validation warnings and fixes
 * - Bulk operations and export
 * - Virtual scrolling for large datasets
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import type { StandardBOQRow, ParseReport } from '../services/boqParser';

interface ParsedBOQTableProps {
  parsedBoq: StandardBOQRow[];
  parseReport: ParseReport;
  tenderId: string;
  uploadedFileName?: string;
  onSave: (updatedBoq: StandardBOQRow[], revision: BOQRevision) => Promise<void>;
  onExport: (format: 'csv' | 'excel' | 'json') => void;
  onApplyMasterRates?: () => void;
}

export interface BOQRevision {
  revId: string;
  createdBy: string;
  createdAt: Date;
  changes: Array<{
    rowId: number;
    before: Partial<StandardBOQRow>;
    after: Partial<StandardBOQRow>;
  }>;
  notes: string;
}

interface ValidationIssue {
  rowIndex: number;
  field: string;
  message: string;
  suggestedFix?: () => void;
}

export const ParsedBOQTable: React.FC<ParsedBOQTableProps> = ({
  parsedBoq,
  parseReport,
  tenderId,
  uploadedFileName,
  onSave,
  onExport,
  onApplyMasterRates
}) => {
  const [editedRows, setEditedRows] = useState<Record<number, Partial<StandardBOQRow>>>({});
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showWarnings, setShowWarnings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Compute validation issues
  const validationIssues = useMemo(() => {
    const issues: ValidationIssue[] = [];
    
    parsedBoq.forEach((row, index) => {
      const effectiveRow = { ...row, ...editedRows[index] };
      
      // Check for negative values
      if (effectiveRow.quantity < 0) {
        issues.push({
          rowIndex: index,
          field: 'quantity',
          message: `Row ${index + 1}: Negative quantity (${effectiveRow.quantity})`,
          suggestedFix: () => handleQuickFix(index, 'quantity', Math.abs(effectiveRow.quantity))
        });
      }
      
      if (effectiveRow.tenderRate < 0) {
        issues.push({
          rowIndex: index,
          field: 'tenderRate',
          message: `Row ${index + 1}: Negative rate (${effectiveRow.tenderRate})`,
          suggestedFix: () => handleQuickFix(index, 'tenderRate', Math.abs(effectiveRow.tenderRate))
        });
      }
      
      // Check amount consistency (tolerance 0.5%)
      if (effectiveRow.quantity > 0 && effectiveRow.tenderRate > 0) {
        const computed = effectiveRow.quantity * effectiveRow.tenderRate;
        const diff = Math.abs(computed - effectiveRow.tenderAmount);
        const tolerance = computed * 0.005;
        
        if (diff > tolerance && diff > 0.01) {
          issues.push({
            rowIndex: index,
            field: 'tenderAmount',
            message: `Row ${index + 1}: Amount mismatch (${effectiveRow.tenderAmount.toFixed(2)} vs computed ${computed.toFixed(2)})`,
            suggestedFix: () => handleQuickFix(index, 'tenderAmount', computed)
          });
        }
      }
      
      // Check for NaN values
      if (isNaN(effectiveRow.quantity) || isNaN(effectiveRow.tenderRate) || isNaN(effectiveRow.tenderAmount)) {
        issues.push({
          rowIndex: index,
          field: 'quantity',
          message: `Row ${index + 1}: Invalid numeric value detected`
        });
      }
    });
    
    return issues;
  }, [parsedBoq, editedRows]);

  const handleQuickFix = useCallback((rowIndex: number, field: string, value: any) => {
    setEditedRows(prev => ({
      ...prev,
      [rowIndex]: {
        ...(prev[rowIndex] || {}),
        [field]: value
      }
    }));
  }, []);

  const handleCellEdit = useCallback((rowIndex: number, field: keyof StandardBOQRow, value: any) => {
    setEditedRows(prev => {
      const rowEdit: any = { ...(prev[rowIndex] || {}) };
      rowEdit[field] = value;
      
      // Auto-recalculate amount if qty or rate changed
      if (field === 'quantity' || field === 'tenderRate') {
        const row = { ...parsedBoq[rowIndex], ...rowEdit };
        const qty = parseFloat(String(row.quantity)) || 0;
        const rate = parseFloat(String(row.tenderRate)) || 0;
        rowEdit.tenderAmount = qty * rate;
      }
      
      return { ...prev, [rowIndex]: rowEdit };
    });
  }, [parsedBoq]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // Build updated BOQ
      const updatedBoq = parsedBoq.map((row, index) => ({
        ...row,
        ...editedRows[index]
      }));
      
      // Create revision record
      const revision: BOQRevision = {
        revId: `rev_${Date.now()}`,
        createdBy: 'current-user', // TODO: Get from auth context
        createdAt: new Date(),
        changes: Object.entries(editedRows).length > 0 
          ? Object.entries(editedRows).map(([index, changes]) => ({
              rowId: parseInt(index),
              before: parsedBoq[parseInt(index)],
              after: changes
            }))
          : [], // First save has no prior changes
        notes: Object.keys(editedRows).length > 0 
          ? `Updated ${Object.keys(editedRows).length} rows`
          : `Initial save of parsed BOQ - ${parsedBoq.length} rows`
      };
      
      await onSave(updatedBoq, revision);
      
      // Clear edits after successful save
      setEditedRows({});
      Alert.alert('Success', 'BOQ saved successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save BOQ');
    } finally {
      setIsSaving(false);
    }
  }, [parsedBoq, editedRows, onSave]);

  const toggleRowSelection = useCallback((rowIndex: number) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowIndex)) {
        next.delete(rowIndex);
      } else {
        next.add(rowIndex);
      }
      return next;
    });
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const renderToolbar = () => (
    <View style={styles.toolbar}>
      <View style={styles.toolbarLeft}>
        <Text style={styles.toolbarTitle}>
          Parsed BOQ
          {uploadedFileName && <Text style={styles.filenameLabel}> — {uploadedFileName}</Text>}
        </Text>
        <Text style={styles.toolbarSubtitle}>
          {parsedBoq.length} rows • {Object.keys(editedRows).length} modified • {validationIssues.length} warnings
        </Text>
      </View>
      <View style={styles.toolbarRight}>
        {validationIssues.length > 0 && (
          <TouchableOpacity
            style={[styles.toolbarButton, styles.warningButton]}
            onPress={() => setShowWarnings(!showWarnings)}
          >
            <Text style={styles.toolbarButtonText}>
              ⚠️ {validationIssues.length} Warnings
            </Text>
          </TouchableOpacity>
        )}
        
        {onApplyMasterRates && (
          <TouchableOpacity
            style={[styles.toolbarButton, styles.primaryButton]}
            onPress={onApplyMasterRates}
          >
            <Text style={[styles.toolbarButtonText, styles.primaryButtonText]}>
              Apply Master Rates
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.toolbarButton]}
          onPress={() => onExport('excel')}
        >
          <Text style={styles.toolbarButtonText}>📥 Export</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.toolbarButton, styles.primaryButton, isSaving && styles.disabledButton]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.toolbarButtonText, styles.primaryButtonText]}>
              💾 Save {Object.keys(editedRows).length > 0 ? `(${Object.keys(editedRows).length})` : ''}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderWarningsPanel = () => {
    if (!showWarnings || validationIssues.length === 0) return null;
    
    return (
      <View style={styles.warningsPanel}>
        <View style={styles.warningsPanelHeader}>
          <Text style={styles.warningsPanelTitle}>⚠️ Validation Warnings</Text>
          <TouchableOpacity onPress={() => setShowWarnings(false)}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.warningsList}>
          {validationIssues.map((issue, index) => (
            <View key={index} style={styles.warningItem}>
              <Text style={styles.warningText}>{issue.message}</Text>
              {issue.suggestedFix && (
                <TouchableOpacity
                  style={styles.fixButton}
                  onPress={issue.suggestedFix}
                >
                  <Text style={styles.fixButtonText}>Quick Fix</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderRow = (row: StandardBOQRow, index: number) => {
    const effectiveRow = { ...row, ...editedRows[index] };
    const isModified = !!editedRows[index];
    const isSelected = selectedRows.has(index);
    const hasWarning = validationIssues.some(issue => issue.rowIndex === index);
    
    // Category row
    if (!row.srNo && row.category === row.description) {
      const isExpanded = expandedCategories.has(row.category);
      return (
        <TouchableOpacity
          key={index}
          style={styles.categoryRow}
          onPress={() => toggleCategory(row.category)}
        >
          <Text style={styles.categoryIcon}>{isExpanded ? '▼' : '▶'}</Text>
          <Text style={styles.categoryText}>{row.category}</Text>
        </TouchableOpacity>
      );
    }
    
    // Check if this row should be hidden (collapsed category)
    if (row.category && !expandedCategories.has(row.category) && row.category !== row.description) {
      return null;
    }
    
    // Subtotal/Total row
    if (row.subtotal || row.grandTotal) {
      // Calculate the total for this subtotal/grandtotal row
      let calculatedAmount = 0;
      
      if (row.grandTotal) {
        // Grand total: sum all non-total, non-category rows
        calculatedAmount = parsedBoq
          .filter((r, idx) => idx < index && !r.subtotal && !r.grandTotal && !r.remark && !r.category)
          .reduce((sum, r) => sum + (r.tenderAmount || 0), 0);
      } else if (row.subtotal) {
        // Subtotal: sum until the next subtotal/grandtotal
        calculatedAmount = parsedBoq
          .filter((r, idx) => {
            if (idx >= index) return false; // After this row
            if (idx < (index - 10)) return false; // More than 10 rows back (arbitrary limit)
            return !r.subtotal && !r.grandTotal && !r.remark && !r.category;
          })
          .reduce((sum, r) => sum + (r.tenderAmount || 0), 0);
      }
      
      const displayAmount = calculatedAmount || effectiveRow.tenderAmount || 0;
      
      return (
        <View key={index} style={[styles.tableRow, styles.totalRow]}>
          <View style={[styles.tableCell, styles.colSrNo]} />
          <View style={[styles.tableCell, styles.colDescription]}>
            <Text style={styles.totalText}>{effectiveRow.description}</Text>
          </View>
          <View style={[styles.tableCell, styles.colQty]} />
          <View style={[styles.tableCell, styles.colUnit]} />
          <View style={[styles.tableCell, styles.colRate]} />
          <View style={[styles.tableCell, styles.colAmount]}>
            <Text style={styles.totalAmount}>₹{displayAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={[styles.tableCell, styles.colActions]} />
        </View>
      );
    }
    
    // Remark row
    if (row.remark) {
      return (
        <View key={index} style={[styles.tableRow, styles.remarkRow]}>
          <View style={[styles.tableCell, styles.colSrNo]} />
          <View style={[styles.tableCell, styles.colDescription, { flex: 1 }]}>
            <Text style={styles.remarkText}>💬 {effectiveRow.description}</Text>
          </View>
        </View>
      );
    }
    
    // Regular data row
    return (
      <View
        key={index}
        style={[
          styles.tableRow,
          isModified && styles.modifiedRow,
          isSelected && styles.selectedRow,
          hasWarning && styles.warningRow
        ]}
      >
        <View style={[styles.tableCell, styles.colSrNo]}>
          <TouchableOpacity onPress={() => toggleRowSelection(index)}>
            <Text style={styles.checkbox}>{isSelected ? '☑' : '☐'}</Text>
          </TouchableOpacity>
          <Text style={styles.cellText}>{effectiveRow.srNo}</Text>
          {effectiveRow.altGroup && (
            <Text style={styles.altGroupBadge}>ALT</Text>
          )}
        </View>
        
        <View style={[styles.tableCell, styles.colDescription]}>
          <TextInput
            style={[styles.cellInput, styles.descriptionInput]}
            value={effectiveRow.description || ''}
            onChangeText={(text) => handleCellEdit(index, 'description', text)}
            multiline
            placeholder="No description"
            placeholderTextColor="#D1D5DB"
          />
          {effectiveRow.itemCode && (
            <Text style={styles.itemCodeBadge}>{effectiveRow.itemCode}</Text>
          )}
        </View>
        
        <View style={[styles.tableCell, styles.colQty]}>
          <TextInput
            style={styles.cellInput}
            value={String(effectiveRow.quantity || '')}
            onChangeText={(text) => handleCellEdit(index, 'quantity', parseFloat(text) || 0)}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#D1D5DB"
          />
        </View>
        
        <View style={[styles.tableCell, styles.colUnit]}>
          <TextInput
            style={styles.cellInput}
            value={effectiveRow.unit || ''}
            onChangeText={(text) => handleCellEdit(index, 'unit', text)}
            placeholder="Unit"
            placeholderTextColor="#D1D5DB"
          />
        </View>
        
        <View style={[styles.tableCell, styles.colRate]}>
          <TextInput
            style={styles.cellInput}
            value={String(effectiveRow.tenderRate || '')}
            onChangeText={(text) => handleCellEdit(index, 'tenderRate', parseFloat(text) || 0)}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#D1D5DB"
          />
        </View>
        
        <View style={[styles.tableCell, styles.colAmount]}>
          <Text style={styles.amountText}>
            ₹{(effectiveRow.tenderAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>
        </View>
        
        <View style={[styles.tableCell, styles.colActions]}>
          {isModified && (
            <TouchableOpacity
              style={styles.revertButton}
              onPress={() => {
                setEditedRows(prev => {
                  const next = { ...prev };
                  delete next[index];
                  return next;
                });
              }}
            >
              <Text style={styles.revertButtonText}>↶</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (parsedBoq.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>No Parsed BOQ Data</Text>
        <Text style={styles.emptyText}>Upload a BOQ file to begin parsing</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderToolbar()}
      {renderWarningsPanel()}
      
      <ScrollView horizontal style={styles.tableScroll}>
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={[styles.tableCell, styles.colSrNo]}>
              <Text style={styles.headerText}>Sr No</Text>
            </View>
            <View style={[styles.tableCell, styles.colDescription]}>
              <Text style={styles.headerText}>Description</Text>
            </View>
            <View style={[styles.tableCell, styles.colQty]}>
              <Text style={styles.headerText}>Quantity</Text>
            </View>
            <View style={[styles.tableCell, styles.colUnit]}>
              <Text style={styles.headerText}>Unit</Text>
            </View>
            <View style={[styles.tableCell, styles.colRate]}>
              <Text style={styles.headerText}>Rate</Text>
            </View>
            <View style={[styles.tableCell, styles.colAmount]}>
              <Text style={styles.headerText}>Amount</Text>
            </View>
            <View style={[styles.tableCell, styles.colActions]}>
              <Text style={styles.headerText}>Actions</Text>
            </View>
          </View>
          
          {/* Table Body */}
          {parsedBoq.map((row, index) => renderRow(row, index))}
        </View>
      </ScrollView>
      
      {/* Parse Report Summary */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Sheets: {parseReport.sheets.join(', ')} • Skipped: {parseReport.rowsSkipped} rows
        </Text>
        {parseReport.warnings.length > 0 && (
          <TouchableOpacity onPress={() => setShowWarnings(true)}>
            <Text style={styles.footerLink}>View {parseReport.warnings.length} parse warnings →</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
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
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  toolbarLeft: {
    flex: 1
  },
  toolbarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2
  },
  filenameLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280'
  },
  toolbarSubtitle: {
    fontSize: 12,
    color: '#6B7280'
  },
  toolbarRight: {
    flexDirection: 'row',
    gap: 8
  },
  toolbarButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB'
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6'
  },
  warningButton: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D'
  },
  disabledButton: {
    opacity: 0.5
  },
  toolbarButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151'
  },
  primaryButtonText: {
    color: '#fff'
  },
  warningsPanel: {
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#FCD34D',
    maxHeight: 200
  },
  warningsPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FCD34D'
  },
  warningsPanelTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E'
  },
  closeButton: {
    fontSize: 18,
    color: '#92400E',
    fontWeight: '700'
  },
  warningsList: {
    padding: 12
  },
  warningItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 6
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E'
  },
  fixButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F59E0B',
    borderRadius: 4,
    marginLeft: 8
  },
  fixButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff'
  },
  tableScroll: {
    maxHeight: 600
  },
  table: {
    minWidth: '100%'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    minHeight: 44
  },
  tableHeader: {
    backgroundColor: '#F3F4F6'
  },
  modifiedRow: {
    backgroundColor: '#EFF6FF'
  },
  selectedRow: {
    backgroundColor: '#DBEAFE'
  },
  warningRow: {
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B'
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  categoryIcon: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 8
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    textTransform: 'uppercase'
  },
  totalRow: {
    backgroundColor: '#F3F4F6'
  },
  remarkRow: {
    backgroundColor: '#FEF3C7'
  },
  tableCell: {
    padding: 8,
    justifyContent: 'center'
  },
  colSrNo: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  colDescription: {
    width: 400
  },
  colQty: {
    width: 100
  },
  colUnit: {
    width: 80
  },
  colRate: {
    width: 120
  },
  colAmount: {
    width: 140
  },
  colActions: {
    width: 80
  },
  headerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151'
  },
  cellText: {
    fontSize: 13,
    color: '#111827'
  },
  cellInput: {
    fontSize: 13,
    color: '#111827',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 4,
    padding: 4,
    backgroundColor: '#fff'
  },
  descriptionInput: {
    minHeight: 36
  },
  amountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827'
  },
  totalText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    textTransform: 'uppercase'
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827'
  },
  remarkText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#92400E'
  },
  checkbox: {
    fontSize: 16
  },
  altGroupBadge: {
    fontSize: 9,
    color: '#3B82F6',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    fontWeight: '600'
  },
  itemCodeBadge: {
    fontSize: 10,
    color: '#059669',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    marginTop: 4,
    fontWeight: '600'
  },
  revertButton: {
    padding: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 4
  },
  revertButtonText: {
    fontSize: 16,
    color: '#DC2626'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB'
  },
  footerText: {
    fontSize: 11,
    color: '#6B7280'
  },
  footerLink: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '600'
  },
  emptyState: {
    padding: 60,
    alignItems: 'center'
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
    textAlign: 'center'
  }
});
