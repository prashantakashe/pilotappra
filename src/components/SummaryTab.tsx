import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import GlassIcon from './GlassIcon';

interface MainRow {
  id: string;
  srNo: string;
  description: string;
  fileName: string;
  summary: string;
}

interface DetailRow {
  id: string;
  srNo: string;
  particular: string;
  amount: string;
  section: string; // 'A', 'B', 'C', etc.
}

const DEFAULT_MAIN_ROW = () => ({ id: 'id_' + Math.random().toString(36).slice(2,9), srNo: '', description: '', fileName: '', summary: '' });
const DEFAULT_DETAIL_ROW = (section: string) => ({ id: 'id_' + Math.random().toString(36).slice(2,9), srNo: '', particular: '', amount: '', section });

const SummaryTab: React.FC<{ tenderId: string }> = ({ tenderId }) => {
  // Main table state
  const [mainRows, setMainRows] = useState<MainRow[]>([DEFAULT_MAIN_ROW()]);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  // Detail table state
  const [detailRows, setDetailRows] = useState<DetailRow[]>([]);
  // Project details
  const [projectDetails, setProjectDetails] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load from Firestore
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const ref = doc(db, 'tenders', tenderId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setMainRows(Array.isArray(data.summaryMainRows) ? data.summaryMainRows : [DEFAULT_MAIN_ROW()]);
          setDetailRows(Array.isArray(data.summaryDetailRows) ? data.summaryDetailRows : []);
          setProjectDetails({
            nameOfWorkFull: data.nameOfWorkFull || '',
            nameOfWorkShort: data.nameOfWorkShort || '',
            department: data.department || '',
          });
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to load summary data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tenderId]);

  // Save to Firestore
  const handleSave = async () => {
    setSaving(true);
    try {
      const ref = doc(db, 'tenders', tenderId);
      await updateDoc(ref, {
        summaryMainRows: mainRows,
        summaryDetailRows: detailRows,
        summaryUpdatedAt: new Date().toISOString(),
      });
      Alert.alert('Saved', 'Summary data saved to Firestore!');
    } catch (err) {
      Alert.alert('Error', 'Failed to save summary data');
    } finally {
      setSaving(false);
    }
  };

  // Main table handlers
  const addMainRow = () => setMainRows(r => [...r, DEFAULT_MAIN_ROW()]);
  const updateMainField = (id: string, field: keyof MainRow, value: string) => setMainRows(r => r.map(row => row.id === id ? { ...row, [field]: value } : row));

  // Detail table handlers
  const addDetailRow = (section: string) => setDetailRows(r => [...r, DEFAULT_DETAIL_ROW(section)]);
  const updateDetailField = (id: string, field: keyof DetailRow, value: string) => setDetailRows(r => r.map(row => row.id === id ? { ...row, [field]: value } : row));

  // Calculate totals for A, D, etc.
  const totalA = detailRows.filter(r => r.section === 'A' && r.srNo).reduce((sum, r) => sum + (parseFloat(r.amount.replace(/,/g, '')) || 0), 0);
  const totalB = detailRows.find(r => r.section === 'B')?.amount || '';
  const totalC = detailRows.find(r => r.section === 'C')?.amount || '';
  const totalD = [totalA, parseFloat(totalB.replace(/,/g, '') || '0'), parseFloat(totalC.replace(/,/g, '') || '0')].reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);

  if (loading) return <View style={{padding:32,alignItems:'center'}}><Text>Loading...</Text></View>;

  return (
    <View style={styles.container}>
      {/* Main Table */}
      <ScrollView horizontal style={styles.tableWrap}>
        <View>
          <View style={styles.rowHead}>
            <Text style={[styles.cell, styles.sr]}>Sr. No.</Text>
            <Text style={[styles.cell, styles.desc]}>Description</Text>
            <Text style={[styles.cell, styles.fname]}>File Name</Text>
            <Text style={[styles.cell, styles.summary]}>Summery</Text>
            <Text style={[styles.cell, styles.action]}></Text>
          </View>
          {mainRows.map((row, idx) => (
            <View key={row.id} style={[styles.rowBody, idx % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
              <Text style={[styles.cell, styles.sr]}>{idx+1}</Text>
              <TextInput style={[styles.cell, styles.desc, styles.input]} value={row.description} onChangeText={t => updateMainField(row.id, 'description', t)} />
              <TextInput style={[styles.cell, styles.fname, styles.input]} value={row.fileName} onChangeText={t => updateMainField(row.id, 'fileName', t)} />
              <TextInput style={[styles.cell, styles.summary, styles.input]} value={row.summary} onChangeText={t => updateMainField(row.id, 'summary', t)} />
              <TouchableOpacity style={styles.action} onPress={() => setExpandedRowId(expandedRowId === row.id ? null : row.id)}>
                <GlassIcon name={expandedRowId === row.id ? 'chevron-up' : 'chevron-down'} size={20} color="#1E90FF" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addRowBtn} onPress={addMainRow}><Text style={styles.addRowBtnText}>+ Add Row</Text></TouchableOpacity>
        </View>
      </ScrollView>

      {/* Detail Table (expand below selected row) */}
      {expandedRowId && (
        <View style={styles.detailContainer}>
          <View style={styles.metaRow}><Text style={styles.metaLabel}>NAME OF THE DEPARTMENT:</Text> <Text style={styles.metaValue}>{projectDetails.department}</Text></View>
          <View style={[styles.metaRow, styles.center]}><Text style={styles.metaLabel}>NAME OF WORK:</Text> <Text style={styles.metaValue}>{projectDetails.nameOfWorkFull}</Text></View>
          <View style={[styles.metaRow, styles.center]}><Text style={{fontWeight:'700'}}>SUMMARY SHEET</Text></View>
          <ScrollView horizontal style={styles.tableWrap}>
            <View>
              <View style={styles.rowHead}>
                <Text style={[styles.cell, styles.sr]}>Sr.No.</Text>
                <Text style={[styles.cell, styles.particulars]}>Particular</Text>
                <Text style={[styles.cell, styles.amount]}>Amount</Text>
              </View>
              {/* Section A header */}
              <View style={[styles.rowBody, {backgroundColor:'#fef9c3'}]}>
                <Text style={[styles.cell, styles.sr]}>A</Text>
                <Text style={[styles.cell, styles.particulars]}>Civil Work</Text>
                <Text style={[styles.cell, styles.amount]}></Text>
              </View>
              {/* Section A rows (a-k) */}
              {detailRows.filter(r => r.section === 'A' && r.srNo).map((row, idx) => (
                <View key={row.id} style={[styles.rowBody, idx % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
                  <TextInput style={[styles.cell, styles.sr, styles.input]} value={row.srNo} onChangeText={t => updateDetailField(row.id, 'srNo', t)} />
                  <TextInput style={[styles.cell, styles.particulars, styles.input]} value={row.particular} onChangeText={t => updateDetailField(row.id, 'particular', t)} />
                  <TextInput style={[styles.cell, styles.amount, styles.input]} value={row.amount} onChangeText={t => updateDetailField(row.id, 'amount', t)} keyboardType="numeric" />
                </View>
              ))}
              <TouchableOpacity style={styles.addRowBtn} onPress={() => addDetailRow('A')}><Text style={styles.addRowBtnText}>+ Add Row</Text></TouchableOpacity>
              {/* Section A total */}
              <View style={[styles.rowBody, {backgroundColor:'#fef9c3'}]}>
                <Text style={[styles.cell, styles.sr]}>A</Text>
                <Text style={[styles.cell, styles.particulars, {fontWeight:'700'}]}>Total Amount of A = (a+b+...)</Text>
                <Text style={[styles.cell, styles.amount, {fontWeight:'700'}]}>{totalA.toLocaleString(undefined, {maximumFractionDigits:2})}</Text>
              </View>
              {/* Section B */}
              <View style={[styles.rowBody, {backgroundColor:'#fef9c3'}]}>
                <Text style={[styles.cell, styles.sr]}>B</Text>
                <Text style={[styles.cell, styles.particulars]}>Material Testing Charges</Text>
                <TextInput style={[styles.cell, styles.amount, styles.input]} value={totalB} onChangeText={t => updateDetailField(detailRows.find(r => r.section === 'B')?.id || '', 'amount', t)} keyboardType="numeric" />
              </View>
              {/* Section C */}
              <View style={[styles.rowBody, {backgroundColor:'#fef9c3'}]}>
                <Text style={[styles.cell, styles.sr]}>C</Text>
                <Text style={[styles.cell, styles.particulars]}>Royalty Charges</Text>
                <TextInput style={[styles.cell, styles.amount, styles.input]} value={totalC} onChangeText={t => updateDetailField(detailRows.find(r => r.section === 'C')?.id || '', 'amount', t)} keyboardType="numeric" />
              </View>
              <TouchableOpacity style={styles.addRowBtn} onPress={() => addDetailRow('C')}><Text style={styles.addRowBtnText}>+ Add Row</Text></TouchableOpacity>
              {/* Section D total */}
              <View style={[styles.rowBody, {backgroundColor:'#fde68a'}]}>
                <Text style={[styles.cell, styles.sr]}>D</Text>
                <Text style={[styles.cell, styles.particulars, {fontWeight:'700'}]}>Total Amount = A + B + C =</Text>
                <Text style={[styles.cell, styles.amount, {fontWeight:'700'}]}>{totalD.toLocaleString(undefined, {maximumFractionDigits:2})}</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      <TouchableOpacity style={[styles.saveBtn, saving && styles.disabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', borderRadius: 8, margin: 16 },
  tableWrap: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, backgroundColor: '#fff', marginBottom: 16 },
  rowHead: { flexDirection: 'row', backgroundColor: '#f9fafb', borderBottomWidth: 2, borderBottomColor: '#e5e7eb', paddingVertical: 2 },
  rowBody: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6', alignItems: 'center' },
  rowEven: { backgroundColor: '#ffffff' },
  rowOdd: { backgroundColor: '#fafafa' },
  cell: { padding: 12, justifyContent: 'center' },
  sr: { width: 60, textAlign: 'center', fontWeight: '600' },
  desc: { minWidth: 200, flex: 1 },
  fname: { minWidth: 180, flex: 1 },
  summary: { minWidth: 180, flex: 1 },
  action: { width: 60, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1, borderColor: '#d1d5db', padding: 10, borderRadius: 6, fontSize: 13, backgroundColor: '#fff' },
  addRowBtn: { padding: 10, alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 6, marginTop: 4 },
  addRowBtnText: { color: '#1e90ff', fontWeight: '600' },
  detailContainer: { borderTopWidth: 2, borderTopColor: '#e5e7eb', marginTop: 16, paddingTop: 16, backgroundColor: '#fafafa', borderRadius: 8, padding: 12 },
  metaRow: { marginBottom: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  metaLabel: { fontWeight: '600', marginRight: 8, color: '#374151', fontSize: 13 },
  metaValue: { fontWeight: '400', color: '#222', fontSize: 13 },
  center: { justifyContent: 'center', alignItems: 'center' },
  particulars: { minWidth: 200, flex: 1 },
  amount: { width: 160 },
  saveBtn: { marginTop: 24, backgroundColor: '#1E90FF', padding: 14, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  disabled: { opacity: 0.6 },
});

export default SummaryTab;
