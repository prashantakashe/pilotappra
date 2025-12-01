// src/screens/MasterRateDataScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { AppLayout } from '../components/AppLayout';
import { RATE_ANALYSIS_NAV } from '../constants/sidebarMenus';
import { auth, db } from '../services/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';

interface RateItem {
  id: string;
  itemCode: string;
  description: string;
  unit: string;
  rate: number;
  category: string;
  subCategory: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export const MasterRateDataScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [rateItems, setRateItems] = useState<RateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    itemCode: '',
    description: '',
    unit: '',
    rate: '',
    category: '',
    subCategory: '',
  });

  useEffect(() => {
    const q = query(collection(db, 'masterRateData'), orderBy('itemCode', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: RateItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        items.push({
          id: doc.id,
          itemCode: data.itemCode || '',
          description: data.description || '',
          unit: data.unit || '',
          rate: data.rate || 0,
          category: data.category || '',
          subCategory: data.subCategory || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          createdBy: data.createdBy || '',
        });
      });
      setRateItems(items);
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
        await updateDoc(doc(db, 'masterRateData', editingId), {
          itemCode: formData.itemCode,
          description: formData.description,
          unit: formData.unit,
          rate: rateValue,
          category: formData.category,
          subCategory: formData.subCategory,
          updatedAt: Timestamp.now(),
        });
        Alert.alert('Success', 'Rate item updated successfully');
      } else {
        // Create new
        await addDoc(collection(db, 'masterRateData'), {
          itemCode: formData.itemCode,
          description: formData.description,
          unit: formData.unit,
          rate: rateValue,
          category: formData.category,
          subCategory: formData.subCategory,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          createdBy: user?.email || 'unknown',
        });
        Alert.alert('Success', 'Rate item added successfully');
      }

      // Reset form
      setFormData({
        itemCode: '',
        description: '',
        unit: '',
        rate: '',
        category: '',
        subCategory: '',
      });
      setEditingId(null);
    } catch (error: any) {
      console.error('[MasterRateData] Save error:', error);
      Alert.alert('Error', 'Failed to save rate item: ' + error.message);
    }
  };

  const handleEdit = (item: RateItem) => {
    setFormData({
      itemCode: item.itemCode,
      description: item.description,
      unit: item.unit,
      rate: item.rate.toString(),
      category: item.category,
      subCategory: item.subCategory,
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rate item?')) return;

    try {
      await deleteDoc(doc(db, 'masterRateData', id));
      Alert.alert('Success', 'Rate item deleted successfully');
    } catch (error: any) {
      console.error('[MasterRateData] Delete error:', error);
      Alert.alert('Error', 'Failed to delete rate item: ' + error.message);
    }
  };

  const handleCancel = () => {
    setFormData({
      itemCode: '',
      description: '',
      unit: '',
      rate: '',
      category: '',
      subCategory: '',
    });
    setEditingId(null);
  };

  return (
    <AppLayout
      title="Master Rate Data"
      activeRoute="MasterRateData"
      sidebarItems={RATE_ANALYSIS_NAV}
    >
      <View style={styles.container}>
        {/* Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.formTitle}>
            {editingId ? 'Edit Rate Item' : 'Add New Rate Item'}
          </Text>
          
          <View style={styles.formRow}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Item Code *</Text>
              <TextInput
                style={styles.input}
                value={formData.itemCode}
                onChangeText={(text) => setFormData({ ...formData, itemCode: text })}
                placeholder="e.g., ITEM-001"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Unit</Text>
              <TextInput
                style={styles.input}
                value={formData.unit}
                onChangeText={(text) => setFormData({ ...formData, unit: text })}
                placeholder="e.g., m3, m2, nos"
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
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                value={formData.category}
                onChangeText={(text) => setFormData({ ...formData, category: text })}
                placeholder="e.g., Earthwork"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Sub-Category</Text>
              <TextInput
                style={styles.input}
                value={formData.subCategory}
                onChangeText={(text) => setFormData({ ...formData, subCategory: text })}
                placeholder="e.g., Excavation"
              />
            </View>
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
          <Text style={styles.listTitle}>Rate Items ({rateItems.length})</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.loadingText}>Loading rate items...</Text>
            </View>
          ) : rateItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyText}>No rate items found</Text>
              <Text style={styles.emptySubtext}>Add your first rate item using the form above</Text>
            </View>
          ) : (
            <ScrollView style={styles.tableContainer}>
              <View style={styles.table}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { width: 100 }]}>Item Code</Text>
                  <Text style={[styles.tableHeaderCell, { width: 300 }]}>Description</Text>
                  <Text style={[styles.tableHeaderCell, { width: 80 }]}>Unit</Text>
                  <Text style={[styles.tableHeaderCell, { width: 100 }]}>Rate</Text>
                  <Text style={[styles.tableHeaderCell, { width: 120 }]}>Category</Text>
                  <Text style={[styles.tableHeaderCell, { width: 120 }]}>Sub-Category</Text>
                  <Text style={[styles.tableHeaderCell, { width: 120 }]}>Actions</Text>
                </View>

                {/* Table Rows */}
                {rateItems.map((item) => (
                  <View key={item.id} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { width: 100 }]}>{item.itemCode}</Text>
                    <Text style={[styles.tableCell, { width: 300 }]}>{item.description}</Text>
                    <Text style={[styles.tableCell, { width: 80 }]}>{item.unit}</Text>
                    <Text style={[styles.tableCell, { width: 100 }]}>₹{item.rate.toFixed(2)}</Text>
                    <Text style={[styles.tableCell, { width: 120 }]}>{item.category}</Text>
                    <Text style={[styles.tableCell, { width: 120 }]}>{item.subCategory}</Text>
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
  listTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
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
