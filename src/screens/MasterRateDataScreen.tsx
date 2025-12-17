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
      <View style={[styles.container, styles.comingContainer]}>
        <View style={styles.comingCard}>
          <Text style={styles.comingTitle}>Master Rate Data</Text>
          <Text style={styles.comingText}>Coming</Text>
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
  comingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
  },
  comingCard: {
    width: '60%',
    minHeight: 200,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  comingTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: '#111827',
  },
  comingText: {
    fontSize: 18,
    color: '#6B7280',
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
