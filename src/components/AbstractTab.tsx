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
  abstract: string;
}

interface DetailRow {
  id: string;
  section: string; // 'A', 'B', 'C', etc.
  srNo: string;
  ssrNo: string;
  itemDesc: string;
  quantity: string;
  unit: string;
  rate: string;
  amount: string;
  remark: string;
}

const DEFAULT_MAIN_ROW = () => ({ id: 'id_' + Math.random().toString(36).slice(2,9), srNo: '', description: '', fileName: '', abstract: '' });
const DEFAULT_DETAIL_ROW = (section: string) => ({ id: 'id_' + Math.random().toString(36).slice(2,9), section, srNo: '', ssrNo: '', itemDesc: '', quantity: '', unit: '', rate: '', amount: '', remark: '' });

const AbstractTab: React.FC<{ tenderId: string }> = ({ tenderId }) => {
  // Main table state
  const [mainRows, setMainRows] = useState<MainRow[]>([DEFAULT_MAIN_ROW()]);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  // Detail table state
  const [detailRows, setDetailRows] = useState<DetailRow[]>([]);
  // Project details
  const [projectDetails, setProjectDetails] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Subtotals
  const [subtotals, setSubtotals] = useState<{[section:string]:string}>({});

  // SSR auto-suggest (stub, to be implemented)
  const [ssrSuggestions, setSsrSuggestions] = useState<string[]>([]);

  // Load from Firestore
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const ref = doc(db, 'tenders', tenderId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setMainRows(Array.isArray(data.abstractMainRows) ? data.abstractMainRows : [DEFAULT_MAIN_ROW()]);
          setDetailRows(Array.isArray(data.abstractDetailRows) ? data.abstractDetailRows : []);
          setSubtotals(data.abstractSubtotals || {});
          setProjectDetails({
            nameOfWorkFull: data.nameOfWorkFull || '',
            department: data.department || '',
          });
          setSsrSuggestions(Array.isArray(data.ssrItems) ? data.ssrItems : []);
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to load abstract data');
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
        abstractMainRows: mainRows,
        abstractDetailRows: detailRows,
        abstractSubtotals: subtotals,
        abstractUpdatedAt: new Date().toISOString(),
      });
      Alert.alert('Saved', 'Abstract data saved to Firestore!');
    } catch (err) {
      Alert.alert('Error', 'Failed to save abstract data');
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

  // Subtotal calculation for each section
  const calculateSubtotal = (section: string) => {
    const rows = detailRows.filter(r => r.section === section && r.srNo);
    return rows.reduce((sum, r) => sum + (parseFloat(r.amount.replace(/,/g, '')) || 0), 0);
  };

  // Sections to show (A, B, C, ...)
  const sections = ['A','B','C']; // Can be extended

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
            <Text style={[styles.cell, styles.abstract]}>Abstract</Text>
            <Text style={[styles.cell, styles.action]}></Text>
          </View>
          {mainRows.map((row, idx) => (
            <View key={row.id} style={[styles.rowBody, idx % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
              <Text style={[styles.cell, styles.sr]}>{idx+1}</Text>
              <TextInput style={[styles.cell, styles.desc, styles.input]} value={row.description} onChangeText={t => updateMainField(row.id, 'description', t)} />
              <TextInput style={[styles.cell, styles.fname, styles.input]} value={row.fileName} onChangeText={t => updateMainField(row.id, 'fileName', t)} />
              <TextInput style={[styles.cell, styles.abstract, styles.input]} value={row.abstract} onChangeText={t => updateMainField(row.id, 'abstract', t)} />
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
          <View style={[styles.metaRow, styles.center]}><Text style={{fontWeight:'700'}}>ABSTRACT SHEET</Text></View>
          <ScrollView horizontal style={styles.tableWrap}>
            <View>
              <View style={styles.rowHead}>
                <Text style={[styles.cell, styles.sr]}>Sr.No.</Text>
                <Text style={[styles.cell, styles.ssrNo]}>SSR No.</Text>
                <Text style={[styles.cell, styles.itemDesc]}>Description of Item</Text>
                <Text style={[styles.cell, styles.qty]}>Qty</Text>
                <Text style={[styles.cell, styles.unit]}>Unit</Text>
                <Text style={[styles.cell, styles.rate]}>Rate</Text>
                <Text style={[styles.cell, styles.amount]}>Amount</Text>
                <Text style={[styles.cell, styles.remark]}>Remark</Text>
              </View>
              {sections.map(section => (
                <View key={section}>
                  {/* Section header */}
                  <View style={[styles.rowBody, styles.sectionHeader]}>
                    <Text style={[styles.cell, styles.sr]}></Text>
                    <Text style={[styles.cell, styles.ssrNo]}></Text>
                    <Text style={[styles.cell, styles.itemDesc, {fontWeight:'700'}]}>{section === 'A' ? 'Excavation' : section === 'B' ? 'Pile Foundation Building' : section === 'C' ? 'Structural Steel Work' : ''}</Text>
                    <Text style={[styles.cell, styles.qty]}></Text>
                    <Text style={[styles.cell, styles.unit]}></Text>
                    <Text style={[styles.cell, styles.rate]}></Text>
                    <Text style={[styles.cell, styles.amount]}></Text>
                    <Text style={[styles.cell, styles.remark]}></Text>
                  </View>
                  {/* Section rows: show all rows for this section, even if srNo is empty */}
                  {detailRows.filter(r => r.section === section).map((row, idx) => {
                    // Auto-calculate amount
                    const qty = parseFloat(row.quantity) || 0;
                    const rate = parseFloat(row.rate) || 0;
                    const autoAmount = qty && rate ? (qty * rate).toString() : '';
                    return (
                      <View key={row.id} style={[styles.rowBody, idx % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
                        <TextInput style={[styles.cell, styles.sr, styles.input]} value={row.srNo} onChangeText={t => updateDetailField(row.id, 'srNo', t)} placeholder="" />
                        <TextInput style={[styles.cell, styles.ssrNo, styles.input]} value={row.ssrNo} onChangeText={t => updateDetailField(row.id, 'ssrNo', t)} placeholder="" />
                        <TextInput style={[styles.cell, styles.itemDesc, styles.input]} value={row.itemDesc} onChangeText={t => updateDetailField(row.id, 'itemDesc', t)} placeholder="" />
                        <TextInput style={[styles.cell, styles.qty, styles.input]} value={row.quantity} onChangeText={t => updateDetailField(row.id, 'quantity', t)} keyboardType="numeric" placeholder="" />
                        <TextInput style={[styles.cell, styles.unit, styles.input]} value={row.unit} onChangeText={t => updateDetailField(row.id, 'unit', t)} placeholder="" />
                        <TextInput style={[styles.cell, styles.rate, styles.input]} value={row.rate} onChangeText={t => updateDetailField(row.id, 'rate', t)} keyboardType="numeric" placeholder="" />
                        <TextInput style={[styles.cell, styles.amount, styles.input]} value={autoAmount} editable={false} placeholder="" />
                        <TextInput style={[styles.cell, styles.remark, styles.input]} value={row.remark} onChangeText={t => updateDetailField(row.id, 'remark', t)} placeholder="" />
                      </View>
                    );
                  })}
                  <TouchableOpacity style={styles.addRowBtn} onPress={() => addDetailRow(section)}><Text style={styles.addRowBtnText}>+ Add Row</Text></TouchableOpacity>
                  {/* Subtotal row */}
                  <View style={[styles.rowBody, styles.subtotalRow]}>
                    <Text style={[styles.cell, styles.sr]}></Text>
                    <Text style={[styles.cell, styles.ssrNo]}></Text>
                    <Text style={[styles.cell, styles.itemDesc, {fontWeight:'700'}]}>Subtotal {section}</Text>
                    <Text style={[styles.cell, styles.qty]}></Text>
                    <Text style={[styles.cell, styles.unit]}></Text>
                    <Text style={[styles.cell, styles.rate]}></Text>
                    <TextInput style={[styles.cell, styles.amount, styles.input, {fontWeight:'700'}]} value={subtotals[section] ?? calculateSubtotal(section).toLocaleString(undefined, {maximumFractionDigits:2})} onChangeText={t => setSubtotals(s => ({...s, [section]: t}))} keyboardType="numeric" />
                    <Text style={[styles.cell, styles.remark]}></Text>
                  </View>
                </View>
              ))}
                {/* Repeat for more sections if needed */}
            </View>
          </ScrollView>
        </View>
      )}

      <TouchableOpacity
        style={[styles.saveIconBtn, saving && styles.disabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <GlassIcon name="save" size={24} color="#1E90FF" />
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
  cell: { paddingVertical: 8, paddingHorizontal: 6, justifyContent: 'center', minWidth: 80, textAlign: 'center', borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  sr: { width: 60, minWidth: 60, maxWidth: 60 },
  ssrNo: { width: 80, minWidth: 80, maxWidth: 80 },
  itemDesc: { width: 180, minWidth: 180, maxWidth: 220 },
  qty: { width: 60, minWidth: 60, maxWidth: 60 },
  unit: { width: 60, minWidth: 60, maxWidth: 60 },
  rate: { width: 80, minWidth: 80, maxWidth: 80 },
  amount: { width: 100, minWidth: 100, maxWidth: 100 },
  remark: { width: 120, minWidth: 120, maxWidth: 120 },
  action: { width: 40, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 0, padding: 8, borderRadius: 6, fontSize: 13, backgroundColor: '#fff', minWidth: 60 },
  addRowBtn: { padding: 6, alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 6, marginTop: 4 },
  addRowBtnText: { color: '#1e90ff', fontWeight: '600', fontSize: 13 },
  detailContainer: { borderTopWidth: 2, borderTopColor: '#e5e7eb', marginTop: 16, paddingTop: 16, backgroundColor: '#fafafa', borderRadius: 8, padding: 12 },
  metaRow: { marginBottom: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  metaLabel: { fontWeight: '600', marginRight: 8, color: '#374151', fontSize: 13 },
  metaValue: { fontWeight: '400', color: '#222', fontSize: 13 },
  center: { justifyContent: 'center', alignItems: 'center' },
  ssrNo: { width: 80 },
  itemDesc: { minWidth: 120, maxWidth: 200, flex: 1 },
  qty: { width: 60 },
  unit: { width: 60 },
  rate: { width: 80 },
  amount: { width: 80 },
  remark: { minWidth: 80, maxWidth: 120 },
  sectionHeader: { backgroundColor: '#fef9c3' },
  subtotalRow: { backgroundColor: '#fde68a' },
  saveIconBtn: { marginTop: 18, alignSelf: 'flex-end', backgroundColor: 'transparent', padding: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 0 },
  saveBtnText: { color: '#1E90FF', fontWeight: '700', fontSize: 15, marginLeft: 8 },
  disabled: { opacity: 0.6 },
});

export default AbstractTab;
