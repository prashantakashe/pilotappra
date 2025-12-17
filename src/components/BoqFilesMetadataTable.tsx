// src/components/BoqFilesMetadataTable.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { formatUtils } from '../utils/formatUtils';
import { dateUtils } from '../utils/dateUtils';
import { tenderUploadsService } from '../services/tenderUploadsService';
import { parseBoqFile } from '../services/boqParser';
import { saveParsedBoq } from '../services/firestoreBoqApi';

export interface BoqFileRow {
  id: string;
  srNo: number;
  description: string;
  fileName: string;
  fileSize: string;
  fileLastModified: string;
  fileUrl?: string;
  parsedBoqName?: string;
  saved: boolean;
  isEditing?: boolean;
  editingDescription?: string;
  editingFileName?: string;
  isLoading?: boolean;
  isNewRow?: boolean;
}

interface BoqFilesMetadataTableProps {
  rows: BoqFileRow[];
  onRowsChange: (rows: BoqFileRow[]) => void;
  onAddRow: () => void;
  tenderId: string;
  onSaveRow?: (row: BoqFileRow) => Promise<void>;
  onDeleteRow?: (rowId: string) => Promise<void>;
  onViewFile?: (row: BoqFileRow) => void;
  onFileNameClick?: (row: BoqFileRow) => void;
  onParsedBoqClick?: (row: BoqFileRow) => void;
}

const TABLE_COLUMNS = [
  { key: 'srNo', label: 'Sr. No.', width: 60, align: 'center' as const },
  { key: 'description', label: 'Description', width: 200, align: 'left' as const },
  { key: 'fileName', label: 'File Name', width: 180, align: 'left' as const },
  { key: 'fileSize', label: 'File Size', width: 100, align: 'center' as const },
  { key: 'fileLastModified', label: 'File Last Modified', width: 140, align: 'center' as const },
  { key: 'action', label: 'Action', width: 180, align: 'center' as const },
  { key: 'parsedBoqName', label: 'Parsed BOQ', width: 140, align: 'center' as const },
];

export const BoqFilesMetadataTable: React.FC<BoqFilesMetadataTableProps> = ({
  rows,
  onRowsChange,
  onAddRow,
  tenderId,
  onSaveRow,
  onDeleteRow,
  onViewFile,
  onFileNameClick,
  onParsedBoqClick,
}) => {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const handleStartEdit = useCallback((rowId: string) => {
    const updatedRows = rows.map(row =>
      row.id === rowId
        ? { ...row, isEditing: true, editingDescription: row.description }
        : row
    );
    onRowsChange(updatedRows);
  }, [rows, onRowsChange]);

  const handleCancelEdit = useCallback((rowId: string) => {
    const updatedRows = rows.map(row =>
      row.id === rowId
        ? { ...row, isEditing: false, editingDescription: undefined }
        : row
    );
    onRowsChange(updatedRows);
  }, [rows, onRowsChange]);

  const handleUpdateDescription = useCallback(
    (rowId: string, newDescription: string) => {
      const updatedRows = rows.map(row =>
        row.id === rowId ? { ...row, editingDescription: newDescription } : row
      );
      onRowsChange(updatedRows);
    },
    [rows, onRowsChange]
  );

  const handleUpdateFileName = useCallback(
    (rowId: string, newFileName: string) => {
      const updatedRows = rows.map(row =>
        row.id === rowId ? { ...row, editingFileName: newFileName } : row
      );
      onRowsChange(updatedRows);
    },
    [rows, onRowsChange]
  );

  const handleProcessFile = useCallback(async (rowId: string, file: File) => {
    // Upload file to storage, parse it, and save parsed BOQ to Firestore
    try {
      // Mark row loading state
      onRowsChange(rows.map(r => r.id === rowId ? { ...r, isLoading: true } : r));

      // Upload to storage under tender
      const uploadedDoc = await tenderUploadsService.uploadFile(
        file,
        'BOQ' as any,
        false,
        false,
        undefined,
        tenderId
      );

      // Update row with storage metadata
      const updatedAfterUpload = rows.map(r =>
        r.id === rowId
          ? {
              ...r,
              fileName: file.name,
              editingFileName: file.name,
              fileUrl: uploadedDoc.fileUrl,
              fileSize: formatUtils.formatFileSize(file.size),
              fileLastModified: dateUtils.formatDate(new Date(file.lastModified)),
            }
          : r
      );
      onRowsChange(updatedAfterUpload);

      // Parse the file locally
      const buffer = await file.arrayBuffer();
      const parseResult = await parseBoqFile(buffer, file.name);

      // Save parsed BOQ to Firestore (this will attach parsedBoq to tender)
      await saveParsedBoq(tenderId, parseResult.parsedBoq, uploadedDoc.fileUrl, parseResult.parseReport.suggestedMapping, parseResult.parseReport.sheets);

      // Mark row parsed/linked
      const finalRow = updatedAfterUpload.find(r => r.id === rowId);
      if (!finalRow) throw new Error('Row not found');

      const finalRows = updatedAfterUpload.map(r =>
        r.id === rowId ? { ...r, parsedBoqName: file.name, saved: true, isLoading: false, isNewRow: false, isEditing: false } : r
      );
      onRowsChange(finalRows);

      // Persist metadata to Firestore after successful parse
      if (onSaveRow) {
        await onSaveRow({
          ...finalRow,
          fileName: file.name,
          parsedBoqName: file.name,
          fileSize: formatUtils.formatFileSize(file.size),
          fileLastModified: dateUtils.formatDate(new Date(file.lastModified)),
          saved: true,
        });
      }

      Alert.alert('Success', `Uploaded and parsed ${file.name}`);
    } catch (error: any) {
      console.error('[BoqFilesMetadataTable] File processing failed:', error);
      Alert.alert('Error', `Failed to upload/parse file: ${error.message || error}`);
      // Reset loading
      onRowsChange(rows.map(r => r.id === rowId ? { ...r, isLoading: false } : r));
    }
  }, [rows, onRowsChange, tenderId]);

  const pickFileMobile = useCallback(async (rowId: string) => {
    try {
      // Try expo-document-picker first
      const docPicker = await import('expo-document-picker');
      const res = await docPicker.getDocumentAsync({ type: '*/*' });
      if (res.type !== 'success') return;

      // Update row metadata so user sees filename
      const updatedRows = rows.map(r =>
        r.id === rowId
          ? { ...r, editingFileName: res.name || res.uri, fileSize: res.size ? formatUtils.formatFileSize(res.size) : r.fileSize }
          : r
      );
      onRowsChange(updatedRows);

      // Try to fetch the file as blob and process (may not work on plain RN)
      try {
        const resp = await fetch(res.uri);
        const blob = await resp.blob();
        // Attempt to construct a File (works on web)
        try {
          const f = new File([blob], res.name || 'file');
          await handleProcessFile(rowId, f as File);
        } catch (e) {
          // File constructor not available on this platform - leave as selected and ask user to Save to upload from client
          Alert.alert('File Selected', 'File selected. Press Save to persist metadata. Native upload may require additional configuration.');
        }
      } catch (err) {
        console.warn('[BoqFilesMetadataTable] Could not fetch mobile file blob', err);
        Alert.alert('Info', 'File selected. Save to persist metadata. Full upload may require native upload support.');
      }
    } catch (err) {
      console.warn('Mobile document picker not available', err);
      Alert.alert('Not available', 'Mobile file picker is not configured.');
    }
  }, [rows, onRowsChange, handleProcessFile]);

  const handleSaveRow = useCallback(
    async (rowId: string) => {
      const rowToSave = rows.find(r => r.id === rowId);
      if (!rowToSave) return;

      // Validate that fileName is provided
      const fileName = rowToSave.editingFileName || rowToSave.fileName;
      if (!fileName || fileName.trim() === '') {
        Alert.alert('Error', 'Please select a file or enter a file name');
        return;
      }

      try {
        // Update local state with new description and fileName
        const updatedRows = rows.map(row => {
          if (row.id === rowId) {
            return {
              ...row,
              description: row.editingDescription || row.description,
              fileName: row.editingFileName || row.fileName,
              isEditing: false,
              editingDescription: undefined,
              editingFileName: undefined,
              isLoading: true,
              isNewRow: false,
            };
          }
          return row;
        });
        onRowsChange(updatedRows);

        // Call parent's save handler if provided
        if (onSaveRow) {
          await onSaveRow({
            ...rowToSave,
            description: rowToSave.editingDescription || rowToSave.description,
            fileName: rowToSave.editingFileName || rowToSave.fileName,
          });
        }

        // Mark as saved
        const finalRows = updatedRows.map(row =>
          row.id === rowId ? { ...row, saved: true, isLoading: false } : row
        );
        onRowsChange(finalRows);

        Alert.alert('Success', 'File metadata saved successfully');
      } catch (error) {
        console.error('[BoqFilesMetadataTable] Error saving row:', error);
        Alert.alert('Error', 'Failed to save file metadata');
        
        // Reset loading state
        const resetRows = rows.map(row =>
          row.id === rowId ? { ...row, isLoading: false } : row
        );
        onRowsChange(resetRows);
      }
    },
    [rows, onRowsChange, onSaveRow]
  );

  const handleDeleteRow = useCallback(
    async (rowId: string) => {
      Alert.alert(
        'Delete File',
        'Are you sure you want to remove this file from the list?',
        [
          { text: 'Cancel', onPress: () => {}, style: 'cancel' },
          {
            text: 'Delete',
            onPress: async () => {
              try {
                if (onDeleteRow) {
                  await onDeleteRow(rowId);
                }
                const updatedRows = rows.filter(r => r.id !== rowId);
                onRowsChange(updatedRows);
                Alert.alert('Success', 'File removed successfully');
              } catch (error) {
                console.error('[BoqFilesMetadataTable] Error deleting row:', error);
                Alert.alert('Error', 'Failed to delete file');
              }
            },
            style: 'destructive',
          },
        ]
      );
    },
    [rows, onRowsChange, onDeleteRow]
  );

  const handleViewFile = useCallback(
    (row: BoqFileRow) => {
      if (onViewFile) {
        onViewFile(row);
      } else if (row.fileUrl) {
        // Open file URL if available
        if (Platform.OS === 'web') {
          window.open(row.fileUrl, '_blank');
        }
      }
    },
    [onViewFile]
  );

  const renderActionMenu = (row: BoqFileRow) => {
    const actions: { label: string; action: () => void; color?: string }[] = [];
    
    // For new or editing rows, show Save and Cancel first
    if (row.isEditing || row.isNewRow) {
      actions.push({
        label: 'Save',
        action: () => handleSaveRow(row.id),
        color: '#10B981',
      });
      actions.push({
        label: 'Cancel',
        action: () => handleCancelEdit(row.id),
        color: '#9CA3AF',
      });
    }
    
    // For saved rows, show Edit and Delete
    if (!row.isNewRow) {
      actions.push({
        label: 'Edit',
        action: () => handleStartEdit(row.id),
      });
      actions.push({
        label: 'Delete',
        action: () => handleDeleteRow(row.id),
        color: '#EF4444',
      });
    }

    if (row.fileUrl) {
      actions.unshift({
        label: 'View',
        action: () => handleViewFile(row),
      });
    }

    return (
      <View style={styles.actionMenuContainer}>
        {actions.map((action, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.actionButton}
            onPress={action.action}
          >
            <Text style={[styles.actionButtonText, { color: action.color || '#3B82F6' }]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (rows.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.tableHeader}>
        <Text style={styles.tableTitle}>📁 BOQ File Metadata</Text>
        <TouchableOpacity style={styles.addRowButton} onPress={onAddRow}>
          <Text style={styles.addRowButtonText}>+ Add File</Text>
        </TouchableOpacity>
      </View>

      {/* Desktop/Tablet: Horizontal Scroll Table */}
      {Platform.OS === 'web' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScrollContainer}>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableRow}>
              {TABLE_COLUMNS.map(col => (
                <View
                  key={col.key}
                  style={[
                    styles.tableCell,
                    styles.tableCellHeader,
                    { width: col.width, justifyContent: col.align === 'center' ? 'center' : col.align === 'left' ? 'flex-start' : 'flex-end' },
                  ]}
                >
                  <Text style={styles.tableCellHeaderText}>{col.label}</Text>
                </View>
              ))}
            </View>

            {/* Table Rows */}
            {rows.map((row, idx) => (
              <View key={row.id} style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlternate]}>
                {/* Sr. No. */}
                <View style={[styles.tableCell, { width: 60, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={styles.tableCellText}>{row.srNo}</Text>
                </View>

                {/* Description */}
                <View style={[styles.tableCell, { width: 200 }]}>
                  {row.isEditing || row.isNewRow ? (
                    <TextInput
                      style={styles.descriptionInput}
                      value={row.editingDescription !== undefined ? row.editingDescription : row.description}
                      onChangeText={(text) => handleUpdateDescription(row.id, text)}
                      placeholder="Enter description..."
                      editable={!row.isLoading}
                    />
                  ) : (
                    <Text style={styles.tableCellText} numberOfLines={2}>
                      {row.description || '—'}
                    </Text>
                  )}
                </View>

                {/* File Name - Editable for new rows, clickable for saved rows */}
                {row.isEditing || row.isNewRow ? (
                  <TouchableOpacity
                    style={[styles.tableCell, { width: 180 }]}
                    onPress={() => {
                      // Trigger file browse
                      if (Platform.OS === 'web') {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.onchange = async (e: any) => {
                          const file = e.target.files[0];
                          if (file) {
                            // Delegate to central processor (upload + parse)
                            await handleProcessFile(row.id, file);
                          }
                        };
                        input.click();
                      }
                    }}
                  >
                      <View style={styles.fileInputRow}>
                        <TextInput
                          style={[styles.descriptionInput, { flex: 1, marginRight: 8 }]}
                          value={row.editingFileName !== undefined ? row.editingFileName : row.fileName}
                          onChangeText={(text) => handleUpdateFileName(row.id, text)}
                          placeholder="Click Browse or type file name..."
                          editable={!row.isLoading}
                        />
                        <TouchableOpacity
                          style={styles.browseButton}
                          onPress={() => {
                            if (Platform.OS === 'web') {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.onchange = async (e: any) => {
                                const file = e.target.files[0];
                                if (file) {
                                  await handleProcessFile(row.id, file);
                                }
                              };
                              input.click();
                            }
                          }}
                        >
                          <Text style={styles.browseButtonText}>Browse</Text>
                        </TouchableOpacity>
                      </View>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.tableCell, { width: 180 }]}
                    onPress={() => onFileNameClick?.(row)}
                  >
                    <Text style={[styles.tableCellText, { color: '#3B82F6', textDecorationLine: 'underline' }]} numberOfLines={2}>
                      {row.fileName}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* File Size */}
                <View style={[styles.tableCell, { width: 100, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={styles.tableCellText}>{row.fileSize}</Text>
                </View>

                {/* File Last Modified */}
                <View style={[styles.tableCell, { width: 140, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={styles.tableCellText} numberOfLines={1}>
                    {row.fileLastModified}
                  </Text>
                </View>

                {/* Action */}
                <View style={[styles.tableCell, { width: 180 }]}>
                  {row.isLoading ? (
                    <ActivityIndicator size="small" color="#3B82F6" />
                  ) : (
                    <View style={styles.actionCell}>
                      <TouchableOpacity
                        style={styles.actionToggleButton}
                        onPress={() => setExpandedRowId(expandedRowId === row.id ? null : row.id)}
                      >
                        <Text style={styles.actionToggleButtonText}>⋯</Text>
                      </TouchableOpacity>
                      {expandedRowId === row.id && renderActionMenu(row)}
                    </View>
                  )}
                </View>

                {/* Parsed BOQ - Clickable if linked */}
                <TouchableOpacity
                  style={[styles.tableCell, { width: 140, justifyContent: 'center', alignItems: 'center' }]}
                  onPress={() => row.parsedBoqName && onParsedBoqClick?.(row)}
                  disabled={!row.parsedBoqName}
                >
                  <Text style={[styles.tableCellText, { color: row.parsedBoqName ? '#10B981' : '#D1D5DB', textDecorationLine: row.parsedBoqName ? 'underline' : 'none' }]}>
                    {row.parsedBoqName ? '✓ Linked' : '—'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        /* Mobile: Card-based layout */
        <ScrollView style={styles.mobileContainer} showsVerticalScrollIndicator={false}>
          {rows.map((row, idx) => (
            <View key={row.id} style={styles.mobileCard}>
              <View style={styles.mobileCardHeader}>
                <Text style={styles.mobileCardTitle}>File #{row.srNo}</Text>
                <TouchableOpacity
                  style={styles.actionToggleButton}
                  onPress={() => setExpandedRowId(expandedRowId === row.id ? null : row.id)}
                >
                  <Text style={styles.actionToggleButtonText}>⋯</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.mobileCardContent}>
                <TouchableOpacity style={styles.mobileRow} onPress={() => onFileNameClick?.(row)}>
                  <Text style={styles.mobileLabel}>File Name:</Text>
                  <Text style={[styles.mobileValue, { color: '#3B82F6', textDecorationLine: 'underline' }]} numberOfLines={2}>
                    {row.fileName}
                  </Text>
                </TouchableOpacity>

                <View style={styles.mobileRow}>
                  <Text style={styles.mobileLabel}>Size:</Text>
                  <Text style={styles.mobileValue}>{row.fileSize}</Text>
                </View>

                <View style={styles.mobileRow}>
                  <Text style={styles.mobileLabel}>Modified:</Text>
                  <Text style={styles.mobileValue}>{row.fileLastModified}</Text>
                </View>

                {row.isEditing ? (
                  <View style={[styles.mobileRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                    <Text style={styles.mobileLabel}>Description:</Text>
                    <TextInput
                      style={[styles.descriptionInput, { marginTop: 8, width: '100%' }]}
                      value={row.editingDescription || ''}
                      onChangeText={(text) => handleUpdateDescription(row.id, text)}
                      placeholder="Enter description..."
                      editable={!row.isLoading}
                      multiline
                    />
                  </View>
                ) : (
                  <View style={styles.mobileRow}>
                    <Text style={styles.mobileLabel}>Description:</Text>
                    <Text style={styles.mobileValue}>{row.description || '—'}</Text>
                  </View>
                )}

                {row.parsedBoqName && (
                  <TouchableOpacity style={styles.mobileRow} onPress={() => onParsedBoqClick?.(row)}>
                    <Text style={styles.mobileLabel}>Parsed BOQ:</Text>
                    <Text style={[styles.mobileValue, { color: '#10B981', textDecorationLine: 'underline' }]}>✓ {row.parsedBoqName}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {expandedRowId === row.id && (
                <View style={styles.mobileActionSection}>
                  {row.isLoading ? (
                    <ActivityIndicator size="small" color="#3B82F6" />
                  ) : (
                    renderActionMenu(row)
                  )}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  tableTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  addRowButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addRowButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  tableScrollContainer: {
    overflow: 'auto',
    width: '100%',
    minWidth: '100%',
  },
  table: {
    backgroundColor: '#fff',
    minWidth: TABLE_COLUMNS.reduce((sum, col) => sum + col.width, 0),
    width: '100%',
    tableLayout: 'fixed',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    minHeight: 44,
    alignItems: 'center',
  },
  tableRowAlternate: {
    backgroundColor: '#F3F6FD', // More distinct alternate color
  },
  tableCell: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#D1D5DB',
    borderBottomWidth: 0,
    minHeight: 44,
    backgroundColor: 'transparent',
  },
  tableCellHeader: {
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 2,
    borderBottomColor: '#D1D5DB',
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
  },
  tableCellHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  tableCellText: {
    fontSize: 12,
    color: '#374151',
  },
  descriptionInput: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    color: '#111827',
    width: '95%',
    minHeight: 32,
  },
  actionCell: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionToggleButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionToggleButtonText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '700',
  },
  actionMenuContainer: {
    position: 'absolute',
    top: 36,
    right: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 2000,
    minWidth: 100,
    ...Platform.select({
      web: { boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
      },
    }),
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Mobile styles
  mobileContainer: {
    padding: 12,
  },
  mobileCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  mobileCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  mobileCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  mobileCardContent: {
    padding: 12,
  },
  mobileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  mobileLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    width: '35%',
  },
  mobileValue: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
    textAlign: 'right',
  },
  mobileActionSection: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  fileInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  browseButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
