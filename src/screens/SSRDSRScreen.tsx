// src/screens/SSRDSRScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { AppLayout } from '../components/AppLayout';
import { RATE_ANALYSIS_NAV } from '../constants/sidebarMenus';
import { auth, db } from '../services/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';

interface SSRDSRItem {
  id: string;
  scheduleType: 'SSR' | 'DSR';
  scheduleNumber: string;
  itemCode: string;
  description: string;
  unit: string;
  rate: number;
  year: string;
  state: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export const SSRDSRScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [items, setItems] = useState<SSRDSRItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'SSR' | 'DSR'>('ALL');
  const [formData, setFormData] = useState({
    scheduleType: 'SSR' as 'SSR' | 'DSR',
    scheduleNumber: '',
    itemCode: '',
    description: '',
    unit: '',
    rate: '',
    year: new Date().getFullYear().toString(),
    state: '',
  });

  useEffect(() => {
    const q = query(collection(db, 'ssrDsrData'), orderBy('itemCode', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems: SSRDSRItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedItems.push({
          id: doc.id,
          scheduleType: data.scheduleType || 'SSR',
          scheduleNumber: data.scheduleNumber || '',
          itemCode: data.itemCode || '',
          description: data.description || '',
          unit: data.unit || '',
          rate: data.rate || 0,
          year: data.year || '',
          state: data.state || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          createdBy: data.createdBy || '',
        });
      });
      setItems(fetchedItems);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!formData.itemCode || !formData.description || !formData.rate) {
      Alert.alert('Error', 'Please fill in all required fields (Item Code, Description, Rate)');
      return;
    }

    try {
      const user = auth.currentUser;
      const rateValue = parseFloat(formData.rate);

      if (isNaN(rateValue)) {
        Alert.alert('Error', 'Please enter a valid rate');
        return;
      }

      if (editingId) {
        // Update existing
        await updateDoc(doc(db, 'ssrDsrData', editingId), {
          scheduleType: formData.scheduleType,
          scheduleNumber: formData.scheduleNumber,
          itemCode: formData.itemCode,
          description: formData.description,
          unit: formData.unit,
          rate: rateValue,
          year: formData.year,
          state: formData.state,
          updatedAt: Timestamp.now(),
        });
        Alert.alert('Success', 'SSR/DSR item updated successfully');
      } else {
        // Create new
        await addDoc(collection(db, 'ssrDsrData'), {
          scheduleType: formData.scheduleType,
          scheduleNumber: formData.scheduleNumber,
          itemCode: formData.itemCode,
          description: formData.description,
          unit: formData.unit,
          rate: rateValue,
          year: formData.year,
          state: formData.state,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          createdBy: user?.email || 'unknown',
        });
        Alert.alert('Success', 'SSR/DSR item added successfully');
      }

      // Reset form
      setFormData({
        scheduleType: 'SSR',
        scheduleNumber: '',
        itemCode: '',
        description: '',
        unit: '',
        rate: '',
        year: new Date().getFullYear().toString(),
        state: '',
      });
      setEditingId(null);
    } catch (error: any) {
      console.error('[SSRDSR] Save error:', error);
      Alert.alert('Error', 'Failed to save item: ' + error.message);
    }
  };

  const handleEdit = (item: SSRDSRItem) => {
    setFormData({
      scheduleType: item.scheduleType,
      scheduleNumber: item.scheduleNumber,
      itemCode: item.itemCode,
      description: item.description,
      unit: item.unit,
      rate: item.rate.toString(),
      year: item.year,
      state: item.state,
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await deleteDoc(doc(db, 'ssrDsrData', id));
      Alert.alert('Success', 'Item deleted successfully');
    } catch (error: any) {
      console.error('[SSRDSR] Delete error:', error);
      Alert.alert('Error', 'Failed to delete item: ' + error.message);
    }
  };

  const handleCancel = () => {
    setFormData({
      scheduleType: 'SSR',
      scheduleNumber: '',
      itemCode: '',
      description: '',
      unit: '',
      rate: '',
      year: new Date().getFullYear().toString(),
      state: '',
    });
    setEditingId(null);
  };

  const filteredItems = filterType === 'ALL' 
    ? items 
    : items.filter(item => item.scheduleType === filterType);

  return (
    <AppLayout
      title="SSR/DSR"
      activeRoute="SSRDSR"
      sidebarItems={RATE_ANALYSIS_NAV}
    >
      <View style={styles.container}>
        {/* Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.formTitle}>
            {editingId ? 'Edit SSR/DSR Item' : 'Add New SSR/DSR Item'}
          </Text>
          
          <View style={styles.formRow}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Schedule Type *</Text>
              <View style={styles.pickerContainer}>
                <select
                  value={formData.scheduleType}
                  onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value as 'SSR' | 'DSR' })}
                  style={styles.picker as any}
                >
                  <option value="SSR">SSR (Standard Schedule of Rates)</option>
                  <option value="DSR">DSR (District Schedule of Rates)</option>
                </select>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Schedule Number</Text>
              <TextInput
                style={styles.input}
                value={formData.scheduleNumber}
                onChangeText={(text) => setFormData({ ...formData, scheduleNumber: text })}
                placeholder="e.g., SSR-2024-001"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Item Code *</Text>
              <TextInput
                style={styles.input}
                value={formData.itemCode}
                onChangeText={(text) => setFormData({ ...formData, itemCode: text })}
                placeholder="e.g., 1.1.1"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 2 }]}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={styles.input}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Enter description"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Unit</Text>
              <TextInput
                style={styles.input}
                value={formData.unit}
                onChangeText={(text) => setFormData({ ...formData, unit: text })}
                placeholder="e.g., m3, m2"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Rate *</Text>
              <TextInput
                style={styles.input}
                value={formData.rate}
                onChangeText={(text) => setFormData({ ...formData, rate: text })}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Year</Text>
              <TextInput
                style={styles.input}
                value={formData.year}
                onChangeText={(text) => setFormData({ ...formData, year: text })}
                placeholder="2025"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>State/Region</Text>
              <TextInput
                style={styles.input}
                value={formData.state}
                onChangeText={(text) => setFormData({ ...formData, state: text })}
                placeholder="e.g., Maharashtra"
              />
            </View>

            <View style={styles.formGroup} />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                {editingId ? '💾 Update' : '➕ Add'}
              </Text>
            </TouchableOpacity>
            {editingId && (
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>✕ Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* List Section */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Items ({filteredItems.length})</Text>
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[styles.filterButton, filterType === 'ALL' && styles.filterButtonActive]}
                onPress={() => setFilterType('ALL')}
              >
                <Text style={[styles.filterButtonText, filterType === 'ALL' && styles.filterButtonTextActive]}>
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filterType === 'SSR' && styles.filterButtonActive]}
                onPress={() => setFilterType('SSR')}
              >
                <Text style={[styles.filterButtonText, filterType === 'SSR' && styles.filterButtonTextActive]}>
                  SSR
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filterType === 'DSR' && styles.filterButtonActive]}
                onPress={() => setFilterType('DSR')}
              >
                <Text style={[styles.filterButtonText, filterType === 'DSR' && styles.filterButtonTextActive]}>
                  DSR
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.loadingText}>Loading items...</Text>
            </View>
          ) : filteredItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No items found</Text>
              <Text style={styles.emptySubtext}>Add your first SSR/DSR item using the form above</Text>
            </View>
          ) : (
            <ScrollView style={styles.tableContainer} horizontal>
              <View style={styles.table}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { width: 80 }]}>Type</Text>
                  <Text style={[styles.tableHeaderCell, { width: 120 }]}>Schedule No.</Text>
                  <Text style={[styles.tableHeaderCell, { width: 100 }]}>Item Code</Text>
                  <Text style={[styles.tableHeaderCell, { width: 300 }]}>Description</Text>
                  <Text style={[styles.tableHeaderCell, { width: 80 }]}>Unit</Text>
                  <Text style={[styles.tableHeaderCell, { width: 100 }]}>Rate</Text>
                  <Text style={[styles.tableHeaderCell, { width: 80 }]}>Year</Text>
                  <Text style={[styles.tableHeaderCell, { width: 120 }]}>State</Text>
                  <Text style={[styles.tableHeaderCell, { width: 120 }]}>Actions</Text>
                </View>

                {/* Table Rows */}
                {filteredItems.map((item) => (
                  <View key={item.id} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { width: 80 }]}>
                      <View style={[styles.badge, item.scheduleType === 'SSR' ? styles.badgeSSR : styles.badgeDSR]}>
                        <Text style={styles.badgeText}>{item.scheduleType}</Text>
                      </View>
                    </Text>
                    <Text style={[styles.tableCell, { width: 120 }]}>{item.scheduleNumber}</Text>
                    <Text style={[styles.tableCell, { width: 100 }]}>{item.itemCode}</Text>
                    <Text style={[styles.tableCell, { width: 300 }]}>{item.description}</Text>
                    <Text style={[styles.tableCell, { width: 80 }]}>{item.unit}</Text>
                    <Text style={[styles.tableCell, { width: 100 }]}>₹{item.rate.toFixed(2)}</Text>
                    <Text style={[styles.tableCell, { width: 80 }]}>{item.year}</Text>
                    <Text style={[styles.tableCell, { width: 120 }]}>{item.state}</Text>
                    <Text style={[styles.tableCell, { width: 120 }]}>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEdit(item)}
                      >
                        <Text style={styles.actionButtonText}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDelete(item.id)}
                      >
                        <Text style={styles.actionButtonText}>🗑️</Text>
                      </TouchableOpacity>
                      </View>
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  formGroup: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 4,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  picker: {
    width: '100%',
    padding: 10,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 4,
    backgroundColor: '#e9ecef',
  },
  filterButtonActive: {
    backgroundColor: '#007bff',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  tableContainer: {
    flex: 1,
  },
  table: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 2,
    borderBottomColor: '#dee2e6',
    padding: 10,
  },
  tableHeaderCell: {
    fontWeight: '700',
    fontSize: 14,
    color: '#333',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    padding: 10,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 13,
    color: '#555',
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeSSR: {
    backgroundColor: '#28a745',
  },
  badgeDSR: {
    backgroundColor: '#17a2b8',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#ffc107',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 3,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 3,
  },
  actionButtonText: {
    fontSize: 16,
  },
});
