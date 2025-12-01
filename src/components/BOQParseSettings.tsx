// src/components/BOQParseSettings.tsx
/**
 * BOQ Parse Settings Component - Phase 2
 * 
 * Interactive header mapping UI shown when parser confidence is low
 * Features:
 * - Visual column mapping (drag/drop or select)
 * - Preview of first 30 rows with mapping applied
 * - Auto-fix suggestions
 * - Save mapping as template for future use
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal
} from 'react-native';

interface BOQParseSettingsProps {
  visible: boolean;
  onClose: () => void;
  detectedMapping: Record<string, number>;
  previewRows: any[][];
  onConfirm: (mapping: Record<string, number>) => void;
  onSaveTemplate?: (mapping: Record<string, number>, name: string) => void;
}

const CANONICAL_FIELDS = [
  { key: 'SrNo', label: 'Serial Number', required: true },
  { key: 'Description', label: 'Description', required: true },
  { key: 'Quantity', label: 'Quantity', required: true },
  { key: 'Unit', label: 'Unit', required: true },
  { key: 'Rate', label: 'Rate', required: true },
  { key: 'Amount', label: 'Amount', required: true },
  { key: 'ItemCode', label: 'Item Code', required: false },
  { key: 'Remark', label: 'Remarks', required: false }
];

export const BOQParseSettings: React.FC<BOQParseSettingsProps> = ({
  visible,
  onClose,
  detectedMapping,
  previewRows,
  onConfirm,
  onSaveTemplate
}) => {
  const [mapping, setMapping] = useState<Record<string, number>>(detectedMapping);
  const [showAutoFixSuggestions, setShowAutoFixSuggestions] = useState(false);

  if (!visible) return null;

  const handleFieldMapping = (canonicalField: string, columnIndex: number) => {
    setMapping(prev => ({
      ...prev,
      [canonicalField]: columnIndex
    }));
  };

  const handleClearMapping = (canonicalField: string) => {
    setMapping(prev => {
      const next = { ...prev };
      delete next[canonicalField];
      return next;
    });
  };

  const handleAutoFix = () => {
    // Auto-fix suggestions: combine columns, trim prefixes
    // Placeholder for Phase 2
    setShowAutoFixSuggestions(true);
  };

  const handleConfirm = () => {
    // Validate required fields are mapped
    const missingRequired = CANONICAL_FIELDS
      .filter(f => f.required && mapping[f.key] === undefined)
      .map(f => f.label);
    
    if (missingRequired.length > 0) {
      alert(`Please map required fields: ${missingRequired.join(', ')}`);
      return;
    }
    
    onConfirm(mapping);
  };

  const renderHeaderRow = () => {
    if (previewRows.length === 0) return null;
    const headerRow = previewRows[0];
    
    return (
      <View style={styles.headerRowPreview}>
        {headerRow.map((cell, index) => (
          <View key={index} style={styles.headerCell}>
            <Text style={styles.headerCellText}>{String(cell)}</Text>
            <Text style={styles.columnIndex}>Col {index + 1}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderMappingControls = () => {
    return (
      <View style={styles.mappingControls}>
        <Text style={styles.sectionTitle}>Field Mapping</Text>
        {CANONICAL_FIELDS.map(field => {
          const mappedColumn = mapping[field.key];
          const isMapped = mappedColumn !== undefined;
          
          return (
            <View key={field.key} style={styles.mappingRow}>
              <View style={styles.fieldLabel}>
                <Text style={styles.fieldName}>{field.label}</Text>
                {field.required && <Text style={styles.requiredBadge}>Required</Text>}
              </View>
              
              <View style={styles.mappingControl}>
                {isMapped ? (
                  <View style={styles.mappedColumn}>
                    <Text style={styles.mappedColumnText}>
                      Column {mappedColumn + 1}: {previewRows[0]?.[mappedColumn]}
                    </Text>
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={() => handleClearMapping(field.key)}
                    >
                      <Text style={styles.clearButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.unmappedState}>
                    <Text style={styles.unmappedText}>Not mapped</Text>
                  </View>
                )}
              </View>
              
              {/* Column selector */}
              <ScrollView horizontal style={styles.columnSelector}>
                {previewRows[0]?.map((cell, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.columnOption,
                      mapping[field.key] === index && styles.selectedColumn
                    ]}
                    onPress={() => handleFieldMapping(field.key, index)}
                  >
                    <Text style={styles.columnOptionText}>
                      Col {index + 1}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          );
        })}
      </View>
    );
  };

  const renderPreview = () => {
    const previewData = previewRows.slice(1, 11); // First 10 data rows
    
    return (
      <View style={styles.previewSection}>
        <Text style={styles.sectionTitle}>Preview (First 10 Rows)</Text>
        <ScrollView horizontal>
          <View>
            {/* Header */}
            <View style={styles.previewHeaderRow}>
              {CANONICAL_FIELDS.filter(f => mapping[f.key] !== undefined).map(field => (
                <View key={field.key} style={styles.previewHeaderCell}>
                  <Text style={styles.previewHeaderText}>{field.label}</Text>
                </View>
              ))}
            </View>
            
            {/* Data rows */}
            {previewData.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.previewDataRow}>
                {CANONICAL_FIELDS.filter(f => mapping[f.key] !== undefined).map(field => {
                  const colIndex = mapping[field.key];
                  const cellValue = row[colIndex];
                  
                  return (
                    <View key={field.key} style={styles.previewDataCell}>
                      <Text style={styles.previewDataText} numberOfLines={2}>
                        {String(cellValue || '')}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>BOQ Parse Settings</Text>
            <Text style={styles.subtitle}>
              Map Excel columns to standard BOQ fields
            </Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {renderHeaderRow()}
          {renderMappingControls()}
          {renderPreview()}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleAutoFix}
          >
            <Text style={styles.buttonText}>🔧 Auto-Fix Suggestions</Text>
          </TouchableOpacity>
          
          <View style={styles.footerRight}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleConfirm}
            >
              <Text style={[styles.buttonText, styles.primaryButtonText]}>
                Confirm & Parse
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3
      }
    })
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280'
  },
  closeButton: {
    padding: 8
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6B7280',
    fontWeight: '700'
  },
  content: {
    flex: 1,
    padding: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16
  },
  headerRowPreview: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'scroll'
  },
  headerCell: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    minWidth: 120
  },
  headerCellText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4
  },
  columnIndex: {
    fontSize: 11,
    color: '#9CA3AF'
  },
  mappingControls: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  mappingRow: {
    marginBottom: 20
  },
  fieldLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  fieldName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginRight: 8
  },
  requiredBadge: {
    fontSize: 11,
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600'
  },
  mappingControl: {
    marginBottom: 8
  },
  mappedColumn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  mappedColumnText: {
    fontSize: 13,
    color: '#1E40AF',
    flex: 1
  },
  clearButton: {
    padding: 4
  },
  clearButtonText: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '700'
  },
  unmappedState: {
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FCD34D'
  },
  unmappedText: {
    fontSize: 13,
    color: '#92400E',
    fontStyle: 'italic'
  },
  columnSelector: {
    flexDirection: 'row'
  },
  columnOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB'
  },
  selectedColumn: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6'
  },
  columnOptionText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600'
  },
  previewSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  previewHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6
  },
  previewHeaderCell: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    minWidth: 120
  },
  previewHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151'
  },
  previewDataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  previewDataCell: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    minWidth: 120
  },
  previewDataText: {
    fontSize: 12,
    color: '#111827'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    ...Platform.select({
      web: { boxShadow: '0 -1px 3px rgba(0,0,0,0.1)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3
      }
    })
  },
  footerRight: {
    flexDirection: 'row',
    gap: 12
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderColor: '#D1D5DB'
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6'
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151'
  },
  primaryButtonText: {
    color: '#fff'
  }
});
