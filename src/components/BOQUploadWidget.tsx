// src/components/BOQUploadWidget.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert, ActivityIndicator } from 'react-native';
import { parseBoqFile, type ParseResult } from '../services/boqParser';

interface BOQUploadWidgetProps {
  tenderId: string;
  uploadedFileName: string | null;
  onFileUpload: (fileName: string, parseResult?: ParseResult, fileMetadata?: { size: number; lastModified: number }) => Promise<void>;
}

export const BOQUploadWidget: React.FC<BOQUploadWidgetProps> = ({
  tenderId,
  uploadedFileName,
  onFileUpload
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = () => {
    console.log('[BOQUploadWidget] handleFileSelect called');
    console.log('[BOQUploadWidget] Platform.OS:', Platform.OS);
    // Phase 2: Parse Excel/CSV BOQ file and populate BOQ items
    
    if (Platform.OS === 'web') {
      console.log('[BOQUploadWidget] Creating file input...');
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.xlsx,.xls,.csv';
      input.multiple = true;
      
      input.onchange = async (e: any) => {
        const files: FileList = e.target?.files;
        if (files && files.length > 0) {
          setIsUploading(true);
          try {
            for (let i = 0; i < files.length; i++) {
              const file = files[i];
              console.log('[BOQUploadWidget] File selected:', file.name, 'Size:', file.size, 'LastModified:', file.lastModified);
              const arrayBuffer = await file.arrayBuffer();
              console.log('[BOQUploadWidget] Starting parse...');
              const parseResult = await parseBoqFile(arrayBuffer, file.name);
              console.log('[BOQUploadWidget] Parse complete for', file.name);
              await onFileUpload(file.name, parseResult, {
                size: file.size,
                lastModified: file.lastModified,
              });
              console.log('[BOQUploadWidget] Uploaded parsed BOQ for', file.name);
            }
          } catch (error: any) {
            console.error('[BOQUploadWidget] Parse error:', error);
            Alert.alert(
              'Parse Error',
              `Failed to parse BOQ file: ${error.message}`,
              [{ text: 'OK' }]
            );
          } finally {
            setIsUploading(false);
          }
        }
      };
      
      input.click();
    } else {
      // Mobile: Show alert
      Alert.alert(
        'BOQ Upload',
        'File upload functionality is available on web. Mobile support coming soon.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* BOQ Upload title with folder icon */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>BOQ Upload</Text>
        <TouchableOpacity
          onPress={handleFileSelect}
          disabled={isUploading}
          style={styles.folderIconButton}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#1E90FF" />
          ) : (
            <Text style={styles.folderIcon}>📁</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827'
  },
  folderIconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  folderIcon: {
    fontSize: 24
  }
});

