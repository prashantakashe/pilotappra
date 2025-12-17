import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

// Table 1 row type
interface RecapMetaRow {
  id: string;
  description: string;
  fileName: string;
}

// Table 2 row type
interface RecapDetailRow {
  id: string;
  section: string; // e.g. 'A', 'B', ...
  particulars: string;
  area: string;
  rate: string;
  componentWise: string;
  total: string;
  remark: string;
}

function uid() { return 'id_' + Math.random().toString(36).slice(2,9); }

const DEFAULT_META_ROW = () => ({ id: uid(), description: '', fileName: '' });
const DEFAULT_DETAIL_ROW = (section: string) => ({ id: uid(), section, particulars: '', area: '', rate: '', componentWise: '', total: '', remark: '' });

const RecapTab: React.FC<{ tenderId: string }> = ({ tenderId }) => {
  const [metaRows, setMetaRows] = useState<RecapMetaRow[]>([DEFAULT_META_ROW()]);
  const [detailRows, setDetailRows] = useState<RecapDetailRow[]>([DEFAULT_DETAIL_ROW('A')]);
  const [activeMetaId, setActiveMetaId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load from Firestore on mount
  useEffect(() => {
    const load = async () => {
      try {
        const ref = doc(db, 'tenders', tenderId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as any;
          if (Array.isArray(data.recapMeta)) setMetaRows(data.recapMeta);
          if (Array.isArray(data.recapDetails)) setDetailRows(data.recapDetails);
        }
      } catch (err) { console.warn('RecapTab load error', err); }
    };
    load();
  }, [tenderId]);

  // Save to Firestore
  const saveAll = async () => {
    setIsSaving(true);
    try {
      const ref = doc(db, 'tenders', tenderId);
      await updateDoc(ref, {
        recapMeta: metaRows,
        recapDetails: detailRows,
        recapUpdatedAt: Timestamp.now(),
      });
      Alert.alert('Saved', 'Recap data saved to Firestore');
    } catch (err) {
      Alert.alert('Error', 'Failed to save: ' + (err as any).message);
    } finally { setIsSaving(false); }
  };

  // Table 1 handlers
  const addMetaRow = () => setMetaRows(r => [...r, DEFAULT_META_ROW()]);
  const updateMetaField = (id: string, field: keyof RecapMetaRow, value: string) => setMetaRows(r => r.map(row => row.id === id ? { ...row, [field]: value } : row));

  // Table 2 handlers
  const addDetailRow = (section: string) => setDetailRows(r => [...r, DEFAULT_DETAIL_ROW(section)]);
  const updateDetailField = (id: string, field: keyof RecapDetailRow, value: string) => setDetailRows(r => r.map(row => row.id === id ? { ...row, [field]: value } : row));

  // Render
  return (
    <View style={styles.container}>
      {/* Table 1 */}
      <ScrollView horizontal style={styles.tableWrap}>
        <View>
          <View style={styles.rowHead}>
            <Text style={[styles.cell, styles.sr]}>Sr. No.</Text>
            <Text style={[styles.cell, styles.desc]}>Description</Text>
            <Text style={[styles.cell, styles.fname]}>File Name</Text>
            <Text style={[styles.cell, styles.action]}>Recap</Text>
          </View>
          {metaRows.map((row, idx) => (
            <View key={row.id} style={[styles.rowBody, idx % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
              <Text style={[styles.cell, styles.sr]}>{idx+1}</Text>
              <TextInput style={[styles.cell, styles.desc, styles.input]} value={row.description} onChangeText={t => updateMetaField(row.id, 'description', t)} />
              <TextInput style={[styles.cell, styles.fname, styles.input]} value={row.fileName} onChangeText={t => updateMetaField(row.id, 'fileName', t)} />
              <View style={[styles.cell, styles.action]}>
                <TouchableOpacity style={styles.smallBtn} onPress={() => setActiveMetaId(row.id)}>
                  <Text style={styles.smallBtnText}>Recap</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.addRowBtn} onPress={addMetaRow}><Text style={styles.addRowBtnText}>+ Add Row</Text></TouchableOpacity>
        </View>
      </ScrollView>

      {/* Table 2: Recap Details, shown below Table 1 if any meta row is active */}
      {activeMetaId && (
        <View style={styles.detailContainer}>
          <View style={styles.metaRow}><Text style={styles.metaLabel}>NAME OF THE DEPARTMENT:</Text> <Text>[will link later]</Text></View>
          <View style={[styles.metaRow, styles.center]}><Text style={styles.metaLabel}>NAME OF WORK:</Text> <Text>[will link later]</Text></View>
          <View style={[styles.metaRow, styles.center]}><Text style={{fontWeight:'700'}}>RECAPITULATION SHEET</Text></View>
          <ScrollView horizontal style={styles.tableWrap}>
            <View>
              {/* Table 2 Column Headers */}
              <View style={styles.rowHead}>
                <Text style={[styles.cell, styles.sr]}>Sr.No.</Text>
                <Text style={[styles.cell, styles.particulars]}>Particulars of Scope</Text>
                <Text style={[styles.cell, styles.area]}>Area/length</Text>
                <Text style={[styles.cell, styles.rate]}>Rates per Unit</Text>
                <Text style={[styles.cell, styles.compWise]}>Cost Rs. (Component Wise)</Text>
                <Text style={[styles.cell, styles.total]}>Cost Rs. (Total)</Text>
                <Text style={[styles.cell, styles.remark]}>Remark</Text>
              </View>
              {/* Section A Header */}
              <View style={[styles.rowHead, {backgroundColor:'#fef9c3'}]}>
                <Text style={[styles.cell, styles.sr]}>A</Text>
                <Text style={[styles.cell, styles.particulars]}>CIVIL WORKS</Text>
                <Text style={[styles.cell, styles.area]}></Text>
                <Text style={[styles.cell, styles.rate]}></Text>
                <Text style={[styles.cell, styles.compWise]}></Text>
                <Text style={[styles.cell, styles.total]}></Text>
                <Text style={[styles.cell, styles.remark]}></Text>
              </View>
              {/* Section A Rows */}
              {detailRows.filter(r => r.section === 'A').map((row, idx) => (
                <View key={row.id} style={[styles.rowBody, idx % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
                  <Text style={[styles.cell, styles.sr]}>{idx+1}</Text>
                  <TextInput style={[styles.cell, styles.particulars, styles.input, {backgroundColor:'#e0f2fe'}]} value={row.particulars} onChangeText={t => updateDetailField(row.id, 'particulars', t)} />
                  <TextInput style={[styles.cell, styles.area, styles.input, {backgroundColor:'#e0f2fe'}]} value={row.area} onChangeText={t => updateDetailField(row.id, 'area', t)} />
                  <TextInput style={[styles.cell, styles.rate, styles.input, {backgroundColor:'#e0f2fe'}]} value={row.rate} onChangeText={t => updateDetailField(row.id, 'rate', t)} />
                  <TextInput style={[styles.cell, styles.compWise, styles.input, {backgroundColor:'#e0f2fe'}]} value={row.componentWise} onChangeText={t => updateDetailField(row.id, 'componentWise', t)} />
                  <View style={[styles.cell, styles.total, {backgroundColor:'#e0f2fe'}]} />
                  <TextInput style={[styles.cell, styles.remark, styles.input, {backgroundColor:'#e0f2fe'}]} value={row.remark} onChangeText={t => updateDetailField(row.id, 'remark', t)} />
                </View>
              ))}
              <TouchableOpacity style={styles.addRowBtn} onPress={() => addDetailRow('A')}><Text style={styles.addRowBtnText}>+ Add Row (A)</Text></TouchableOpacity>
              {/* Section A Subtotal Row */}
              <View style={[styles.rowBody, {backgroundColor:'#fef9c3'}]}>
                <Text style={[styles.cell, styles.sr]}></Text>
                <Text style={[styles.cell, styles.particulars, {fontWeight:'700'}]}>SUB TOTAL (A)</Text>
                <Text style={[styles.cell, styles.area]}></Text>
                <Text style={[styles.cell, styles.rate]}></Text>
                <Text style={[styles.cell, styles.compWise, {fontWeight:'700'}]}> {
                  detailRows.filter(r => r.section === 'A')
                    .map(r => parseFloat(r.componentWise))
                    .filter(v => !isNaN(v))
                    .reduce((sum, v) => sum + v, 0)
                    .toLocaleString(undefined, {maximumFractionDigits:0})
                } </Text>
                <Text style={[styles.cell, styles.total, {fontWeight:'700'}]}> {
                  detailRows.filter(r => r.section === 'A')
                    .map(r => parseFloat(r.componentWise))
                    .filter(v => !isNaN(v))
                    .reduce((sum, v) => sum + v, 0)
                    .toLocaleString(undefined, {maximumFractionDigits:0})
                } </Text>
                <Text style={[styles.cell, styles.remark]}></Text>
              </View>
              {/* Section B Header */}
              <View style={[styles.rowHead, {backgroundColor:'#fef9c3'}]}>
                <Text style={[styles.cell, styles.sr]}>B</Text>
                <Text style={[styles.cell, styles.particulars]}>ELECTRICAL WORKS</Text>
                <Text style={[styles.cell, styles.area]}></Text>
                <Text style={[styles.cell, styles.rate]}></Text>
                <Text style={[styles.cell, styles.compWise]}></Text>
                <Text style={[styles.cell, styles.total]}></Text>
                <Text style={[styles.cell, styles.remark]}></Text>
              </View>
              {/* Section B Rows */}
              {detailRows.filter(r => r.section === 'B').map((row, idx) => (
                <View key={row.id} style={[styles.rowBody, idx % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
                  <Text style={[styles.cell, styles.sr]}>{idx+1}</Text>
                  <TextInput style={[styles.cell, styles.particulars, styles.input, {backgroundColor:'#e0f2fe'}]} value={row.particulars} onChangeText={t => updateDetailField(row.id, 'particulars', t)} />
                  <TextInput style={[styles.cell, styles.area, styles.input, {backgroundColor:'#e0f2fe'}]} value={row.area} onChangeText={t => updateDetailField(row.id, 'area', t)} />
                  <TextInput style={[styles.cell, styles.rate, styles.input, {backgroundColor:'#e0f2fe'}]} value={row.rate} onChangeText={t => updateDetailField(row.id, 'rate', t)} />
                  <TextInput style={[styles.cell, styles.compWise, styles.input, {backgroundColor:'#e0f2fe'}]} value={row.componentWise} onChangeText={t => updateDetailField(row.id, 'componentWise', t)} />
                  <TextInput style={[styles.cell, styles.total, styles.input, {backgroundColor:'#e0f2fe'}]} value={row.total} onChangeText={t => updateDetailField(row.id, 'total', t)} />
                  <TextInput style={[styles.cell, styles.remark, styles.input, {backgroundColor:'#e0f2fe'}]} value={row.remark} onChangeText={t => updateDetailField(row.id, 'remark', t)} />
                </View>
              ))}
              <TouchableOpacity style={styles.addRowBtn} onPress={() => addDetailRow('B')}><Text style={styles.addRowBtnText}>+ Add Row (B)</Text></TouchableOpacity>
              {/* Section B Subtotal Row */}
              <View style={[styles.rowBody, {backgroundColor:'#fef9c3'}]}>
                <Text style={[styles.cell, styles.sr]}></Text>
                <Text style={[styles.cell, styles.particulars, {fontWeight:'700'}]}>SUB TOTAL (B)</Text>
                <Text style={[styles.cell, styles.area]}></Text>
                <Text style={[styles.cell, styles.rate]}></Text>
                <Text style={[styles.cell, styles.compWise, {fontWeight:'700'}]}> {
                  detailRows.filter(r => r.section === 'B')
                    .map(r => parseFloat(r.componentWise))
                    .filter(v => !isNaN(v))
                    .reduce((sum, v) => sum + v, 0)
                    .toLocaleString(undefined, {maximumFractionDigits:0})
                } </Text>
                <Text style={[styles.cell, styles.total, {fontWeight:'700'}]}> {
                  detailRows.filter(r => r.section === 'B')
                    .map(r => parseFloat(r.total))
                    .filter(v => !isNaN(v))
                    .reduce((sum, v) => sum + v, 0)
                    .toLocaleString(undefined, {maximumFractionDigits:0})
                } </Text>
                <Text style={[styles.cell, styles.remark]}></Text>
              </View>
              {/* Grand Total Row */}
              <View style={[styles.rowBody, {backgroundColor:'#fde68a'}]}>
                <Text style={[styles.cell, styles.sr]}></Text>
                <Text style={[styles.cell, styles.particulars, {fontWeight:'700'}]}>GRAND TOTAL</Text>
                <Text style={[styles.cell, styles.area]}></Text>
                <Text style={[styles.cell, styles.rate]}></Text>
                <Text style={[styles.cell, styles.compWise]}> {
                  (() => {
                    const total = ["A","B"]
                      .map(sec => detailRows.filter(r => r.section === sec)
                        .map(r => parseFloat(r.componentWise))
                        .filter(v => !isNaN(v))
                        .reduce((sum, v) => sum + v, 0))
                      .reduce((a,b)=>a+b,0);
                    return total.toLocaleString(undefined, {maximumFractionDigits:0});
                  })()
                } </Text>
                <Text style={[styles.cell, styles.total, {fontWeight:'700'}]}> {
                  (() => {
                    const total = ["A","B"]
                      .map(sec => detailRows.filter(r => r.section === sec)
                        .map(r => parseFloat(r.total))
                        .filter(v => !isNaN(v))
                        .reduce((sum, v) => sum + v, 0))
                      .reduce((a,b)=>a+b,0);
                    return total.toLocaleString(undefined, {maximumFractionDigits:0});
                  })()
                } </Text>
                <Text style={[styles.cell, styles.remark]}></Text>
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Save Button */}
      <TouchableOpacity style={[styles.saveBtn, isSaving && styles.disabled]} disabled={isSaving} onPress={saveAll}>
        <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save All'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container:{ padding:16, backgroundColor:'#fff', borderRadius:8 },
  tableWrap:{ borderWidth:1, borderColor:'#e5e7eb', borderRadius:8, backgroundColor:'#fff', marginBottom:16 },
  rowHead:{ flexDirection:'row', backgroundColor:'#f9fafb', borderBottomWidth:2, borderBottomColor:'#e5e7eb', paddingVertical:2 },
  rowBody:{ flexDirection:'row', borderBottomWidth:1, borderBottomColor:'#f3f4f6', alignItems:'center' },
  rowEven: { backgroundColor: '#ffffff' },
  rowOdd: { backgroundColor: '#fafafa' },
  cell:{ padding:12, justifyContent:'center' },
  sr:{ width:60, textAlign:'center', fontWeight:'600' },
  desc:{ minWidth:200, flex:1 },
  fname:{ minWidth:180, flex:1 },
  action:{ width:100, alignItems:'center', justifyContent:'center' },
  particulars:{ minWidth:200, flex:1 },
  area:{ width:100 },
  rate:{ width:100 },
  compWise:{ width:140 },
  total:{ width:120 },
  remark:{ minWidth:120, flex:1 },
  input:{ borderWidth:1, borderColor:'#d1d5db', padding:10, borderRadius:6, fontSize:13, backgroundColor:'#fff' },
  smallBtn:{ paddingHorizontal:12, paddingVertical:8, backgroundColor:'#dbeafe', borderRadius:6, borderWidth:1, borderColor:'#93c5fd' },
  smallBtnText:{ color:'#1e40af', fontWeight:'700', fontSize:13 },
  addRowBtn:{ padding:10, alignItems:'center', backgroundColor:'#f3f4f6', borderRadius:6, marginTop:4 },
  addRowBtnText:{ color:'#1e90ff', fontWeight:'600' },
  detailContainer:{ borderTopWidth:2, borderTopColor:'#e5e7eb', marginTop:16, paddingTop:16, backgroundColor:'#fafafa', borderRadius:8, padding:12 },
  metaRow:{ marginBottom:8, flexDirection:'row', alignItems:'center', paddingHorizontal:8 },
  metaLabel:{ fontWeight:'600', marginRight:8, color:'#374151', fontSize:13 },
  center:{ justifyContent:'center', alignItems:'center' },
  saveBtn:{ marginTop:16, backgroundColor:'#1E90FF', padding:14, borderRadius:8, alignItems:'center' },
  saveBtnText:{ color:'#fff', fontWeight:'700', fontSize:16 },
  disabled:{ opacity:0.6 },
});

export default RecapTab;
