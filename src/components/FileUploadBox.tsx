// src/components/FileUploadBox.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import type { TenderDocument, DocumentCategory } from '../types/tender';

interface FileUploadBoxProps {
  documents: TenderDocument[];
  onAddFiles: () => void;
  onRemoveFile: (docId: string) => void;
  uploading?: boolean;
  containerStyle?: any;
}

export const FileUploadBox: React.FC<FileUploadBoxProps> = ({
  documents,
  onAddFiles,
  onRemoveFile,
  uploading = false,
  containerStyle,
}) => {
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const mandatoryCategories: DocumentCategory[] = [
    'Tender Notice',
    'Technical Bid',
    'BOQ',
    'Financial Bid',
  ];

  const getMandatoryStatus = () => {
    const uploaded = documents
      .filter((d) => d.isMandatory)
      .map((d) => d.category);
    const missing = mandatoryCategories.filter((c) => !uploaded.includes(c));
    return { uploaded: uploaded.length, total: mandatoryCategories.length, missing };
  };

  const status = getMandatoryStatus();

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.header}>
        <Text style={styles.title}>Documents & Attachments</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {status.uploaded}/{status.total} Mandatory
          </Text>
        </View>
      </View>

      {status.missing.length > 0 && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            Missing: {status.missing.join(', ')}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={onAddFiles}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#1E90FF" />
        ) : (
          <>
            <Text style={styles.uploadIcon}>📁</Text>
            <Text style={styles.uploadText}>Upload Files</Text>
            <Text style={styles.uploadHint}>
              PDF, DOCX, XLSX, DWG, JPG, PNG (max 20MB each)
            </Text>
          </>
        )}
      </TouchableOpacity>

      {documents.length > 0 && (
        <ScrollView style={styles.fileList}>
          {documents.map((doc) => (
            <View key={doc.id} style={styles.fileItem}>
              <View style={styles.fileInfo}>
                <Text style={styles.fileIcon}>{getFileIcon(doc.fileType)}</Text>
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {doc.fileName}
                  </Text>
                  <View style={styles.fileMeta}>
                    <Text style={styles.fileSize}>{formatFileSize(doc.fileSize)}</Text>
                    <Text style={styles.fileDot}>•</Text>
                    <Text style={styles.fileCategory}>{doc.category}</Text>
                    {doc.isMandatory && (
                      <>
                        <Text style={styles.fileDot}>•</Text>
                        <Text style={styles.fileMandatory}>Mandatory</Text>
                      </>
                    )}
                  </View>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => onRemoveFile(doc.id)}
                style={styles.removeButton}
              >
                <Text style={styles.removeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#1E90FF',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E90FF',
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 12,
    color: '#6B7280',
  },
  fileList: {
    marginTop: 16,
    maxHeight: 300,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    marginBottom: 8,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  fileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileSize: {
    fontSize: 12,
    color: '#6B7280',
  },
  fileDot: {
    fontSize: 12,
    color: '#9CA3AF',
    marginHorizontal: 6,
  },
  fileCategory: {
    fontSize: 12,
    color: '#6B7280',
  },
  fileMandatory: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
  removeIcon: {
    fontSize: 18,
    color: '#EF4444',
  },
});
