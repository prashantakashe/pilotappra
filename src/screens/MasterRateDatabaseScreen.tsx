// src/screens/MasterRateDatabaseScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, Platform } from 'react-native';
import { AppLayout } from '../components/AppLayout';
import { TENDER_MODULE_NAV } from '../constants/sidebarMenus';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { db, auth } from '../services/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';

interface MasterRateItem {
  id?: string;
  description: string;
  unit: string;
  rate: number;
  category?: string;
  createdBy?: string;
  createdAt?: any;
}

export const MasterRateDatabaseScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [items, setItems] = useState<MasterRateItem[]>([]);
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('');
  const [rate, setRate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'masterRates'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list: MasterRateItem[] = [];
      snap.forEach((doc) => {
        const data = doc.data() as any;
        list.push({ id: doc.id, description: data.description, unit: data.unit, rate: data.rate, category: data.category, createdBy: data.createdBy, createdAt: data.createdAt });
      });
      setItems(list);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (!description.trim() || !unit.trim() || !rate.trim()) {
      Alert.alert('Missing fields', 'Please enter description, unit and rate');
      return;
    }
    try {
      setSaving(true);
      await addDoc(collection(db, 'masterRates'), {
        description: description.trim(),
        unit: unit.trim(),
        rate: Number(rate),
        category: null,
        createdBy: auth.currentUser?.uid || 'unknown',
        createdAt: Timestamp.now(),
      });
      setDescription('');
      setUnit('');
      setRate('');
      Alert.alert('Saved', 'Rate added to Master Rate Database');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }: { item: MasterRateItem }) => (
    <View style={styles.row}>
      <Text style={styles.cellDesc}>{item.description}</Text>
      <Text style={styles.cellUnit}>{item.unit}</Text>
      <Text style={styles.cellRate}>{Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.rate)}</Text>
    </View>
  );

  return (
    <AppLayout
      title="Master Rate Database"
      activeRoute="Tender"
      sidebarItems={TENDER_MODULE_NAV}
    >
      <View style={styles.container}>
        <Text style={styles.heading}>Add New Rate</Text>
        <View style={styles.formRow}>
          <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} />
          <TextInput style={styles.input} placeholder="Unit" value={unit} onChangeText={setUnit} />
          <TextInput style={styles.input} placeholder="Rate" value={rate} keyboardType="decimal-pad" onChangeText={setRate} />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.heading}>Saved Rates</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.cellDesc, styles.headerText]}>Description</Text>
          <Text style={[styles.cellUnit, styles.headerText]}>Unit</Text>
          <Text style={[styles.cellRate, styles.headerText]}>Rate</Text>
        </View>
        <FlatList
          data={items}
          keyExtractor={(it) => it.id!}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  heading: { fontSize: 16, fontWeight: '700', color: colors.TEXT_PRIMARY, marginVertical: spacing.sm },
  formRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  input: { flex: 1, minWidth: 160, height: 40, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: spacing.sm, backgroundColor: colors.WHITE, color: colors.TEXT_PRIMARY },
  saveBtn: { backgroundColor: colors.ACTION_BLUE, paddingHorizontal: spacing.md, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: colors.WHITE, fontWeight: '600' },
  tableHeader: { flexDirection: 'row', backgroundColor: colors.PRIMARY_LIGHT, padding: spacing.sm, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  row: { flexDirection: 'row', backgroundColor: colors.WHITE, padding: spacing.sm, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerText: { fontWeight: '700', color: colors.ACTION_BLUE },
  cellDesc: { flex: 3, color: colors.TEXT_PRIMARY },
  cellUnit: { flex: 1, color: colors.TEXT_PRIMARY },
  cellRate: { flex: 1, textAlign: 'right', color: colors.ACTION_BLUE, fontWeight: '600' },
});

export default MasterRateDatabaseScreen;
