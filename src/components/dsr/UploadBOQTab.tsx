// src/components/dsr/UploadBOQTab.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform
} from 'react-native';
import { MaterialIcons, Entypo } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

// Table row type
type BoqRow = {
  id: string;
  srNo: number;
  description: string;
  fileName: string;
  fileSize: string;
  fileLastModified: string;
  fileObj?: any;
  finalBoq?: string;
};

const initialRows: BoqRow[] = [];

const UploadBOQTab: React.FC = () => {
  const [rows, setRows] = useState<BoqRow[]>(initialRows);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [popoverRow, setPopoverRow] = useState<string | null>(null);

  // Add new row
  const handleAddRow = () => {
    setRows(prev => [
      ...prev,
      {
        id: `row_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        srNo: prev.length + 1,
        description: '',
        fileName: '',
        fileSize: '',
        fileLastModified: '',
        finalBoq: '',
      },
    ]);
  };

// Shared column widths for perfect alignment
const COLUMN_WIDTHS = [70, 180, 160, 110, 160, 60, 110, 60];

  // Handle file upload
  const handleFilePick = async (rowId: string) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/octet-stream'],
      copyToCacheDirectory: false,
      multiple: false,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const file = result.assets[0];
      setRows(prev => prev.map(row =>
        row.id === rowId
          ? {
              ...row,
              fileName: file.name || '',
              fileSize: formatFileSize(file.size || 0),
              fileLastModified: file.lastModified ? new Date(file.lastModified).toLocaleString() : '',
              fileObj: file,
            }
          : row
      ));
    }
  };

  // Format file size
  const formatFileSize = (size: number) => {
    if (!size) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Popover actions
  const handlePopoverAction = (rowId: string, action: string) => {
    if (action === 'delete') {
      setRows(prev => prev.filter(row => row.id !== rowId).map((row, idx) => ({ ...row, srNo: idx + 1 })));
      setPopoverRow(null);
    }
    // Implement view, edit, save as needed
  };

  // Recap preview (placeholder)
  const renderRecap = () => {
    if (!selectedRow) return null;
    const row = rows.find(r => r.id === selectedRow);
    return (
      <View style={styles.recapBox}>
        <Text style={styles.recapTitle}>Recap Sheet for: {row?.fileName || 'N/A'}</Text>
        <Text style={styles.recapContent}>Recap content will be shown here.</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal style={styles.tableScroll}>
        <View>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.headerCell}>Sr. No.</Text>
            <Text style={styles.headerCell}>Description</Text>
            <Text style={styles.headerCell}>File Name</Text>
            <Text style={styles.headerCell}>File Size</Text>
            <Text style={styles.headerCell}>File Last Modified</Text>
            <TouchableOpacity style={styles.headerCell}>
              <MaterialIcons name="folder-open" size={20} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerCell}>Final BOQ</Text>
            <Text style={styles.headerCell}></Text>
          </View>
          {/* Table Rows */}
          <ScrollView style={styles.tableBody}>
            {rows.map((row, idx) => (
              <View key={row.id} style={styles.tableRow}>
                <Text style={styles.cell}>{row.srNo}</Text>
                <TextInput
                  style={styles.cellInput}
                  value={row.description}
                  onChangeText={text => setRows(prev => prev.map(r => r.id === row.id ? { ...r, description: text } : r))}
                  placeholder="Enter description"
                />
                <TouchableOpacity style={styles.cell} onPress={() => handleFilePick(row.id)}>
                  <Text style={{ color: row.fileName ? '#007bff' : '#888' }}>{row.fileName || 'Browse...'}</Text>
                </TouchableOpacity>
                <Text style={styles.cell}>{row.fileSize}</Text>
                <Text style={styles.cell}>{row.fileLastModified}</Text>
                <View style={styles.cell}>
                  <TouchableOpacity onPress={() => handleFilePick(row.id)}>
                    <MaterialIcons name="folder-open" size={20} color="#007bff" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.cell}>{row.finalBoq || '-'}</Text>
                <View style={styles.cell}>
                  <TouchableOpacity onPress={() => setPopoverRow(row.id)}>
                    <Entypo name="dots-three-vertical" size={18} color="#333" />
                  </TouchableOpacity>
                  {popoverRow === row.id && (
                    <View style={styles.popover}>
                      <TouchableOpacity onPress={() => handlePopoverAction(row.id, 'view')}><Text style={styles.popoverItem}>View</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => handlePopoverAction(row.id, 'edit')}><Text style={styles.popoverItem}>Edit</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => handlePopoverAction(row.id, 'save')}><Text style={styles.popoverItem}>Save</Text></TouchableOpacity>
                      <TouchableOpacity onPress={() => handlePopoverAction(row.id, 'delete')}><Text style={[styles.popoverItem, { color: 'red' }]}>Delete</Text></TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))}
            {/* Add Row Button */}
            <TouchableOpacity style={styles.addRowBtn} onPress={handleAddRow}>
              <Text style={styles.addRowText}>+ Add Row</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </ScrollView>
      {/* Recap Preview */}
      {renderRecap()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  tableScroll: { maxHeight: 400 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f0f0f0', paddingVertical: 8 },
  headerCell: { fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 6 },
  tableBody: { maxHeight: 300 },
  tableRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 6 },
  cell: { textAlign: 'center', paddingHorizontal: 6 },
  cellInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 4, textAlign: 'center' },
  addRowBtn: { alignItems: 'center', marginVertical: 10 },
  addRowText: { color: '#007bff', fontWeight: 'bold' },
  popover: { position: 'absolute', top: 24, right: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 6, zIndex: 10, elevation: 4 },
  popoverItem: { padding: 10, fontSize: 14 },
  recapBox: { marginTop: 20, padding: 16, backgroundColor: '#f9f9f9', borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  recapTitle: { fontWeight: 'bold', marginBottom: 8 },
  recapContent: { color: '#555' },
});

export default UploadBOQTab;
