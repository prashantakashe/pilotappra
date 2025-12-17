import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { auth, db } from '../services/firebase';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { dateUtils } from '../utils/dateUtils';
import { formatUtils } from '../utils/formatUtils';

type LeadRow = {
  id: string;
  material: string;
  source: string;
  leadKm?: number | string;
  totalCharges?: number | string;
  initialCharges?: number | string;
  unit?: string;
};

type MainRow = {
  id: string;
  description?: string;
  fileName?: string;
  leadData?: LeadRow[];
  updatedAt?: any;
};

function uid() { return 'id_' + Math.random().toString(36).slice(2,9); }

export const LeadChartTab: React.FC<{ tenderId: string }> = ({ tenderId }) => {
  const [mainRows, setMainRows] = useState<MainRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeMainId, setActiveMainId] = useState<string | null>(null);
  const [leadRows, setLeadRows] = useState<LeadRow[]>([]);
  const [metaDept, setMetaDept] = useState<string>('[will link later]');
  const [metaWork, setMetaWork] = useState<string>('[will link later]');
  const [isSaving, setIsSaving] = useState(false);
  const autosaveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load existing leadCharts from Firestore
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const ref = doc(db, 'tenders', tenderId);
        const snap = await getDoc(ref);
        if (!mounted) return;
        if (snap.exists()) {
          const data = snap.data() as any;
          const saved: MainRow[] = Array.isArray(data.leadCharts) ? data.leadCharts : [];
          setMainRows(saved.map(m => ({ ...m, id: m.id || uid() })));
        } else {
          setMainRows([]);
        }
      } catch (err) {
        console.warn('LeadChartTab load error', err);
      } finally { setLoading(false); }
    };
    load();
    return () => { mounted = false; };
  }, [tenderId]);

  const addMainRow = () => {
    const r: MainRow = { id: uid(), description: '', fileName: '', leadData: [] };
    setMainRows(prev => [...prev, r]);
  };

  const openLead = (mainId: string) => {
    const main = mainRows.find(m => m.id === mainId);
    setActiveMainId(mainId);
    setMetaWork(main?.description || main?.fileName || '[will link later]');
    setLeadRows((main?.leadData && Array.isArray(main.leadData)) ? main!.leadData.map(r => ({ ...r })) : []);
  };


  const addLeadRow = () => {
    const r: LeadRow = { id: uid(), material: '', source: '', leadKm: '', totalCharges: '', initialCharges: '', unit: '' };
    setLeadRows(prev => [...prev, r]);
  };

  const updateLeadField = (rowId: string, field: keyof LeadRow, value: any) => {
    setLeadRows(prev => prev.map(r => r.id === rowId ? ({ ...r, [field]: value }) : r));
    // Debounce autosave: clear existing timer and set new one
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      if (activeMainId) saveLeadForMain();
    }, 1500);
  };

  const calcNet = (total: any, initial: any) => {
    const t = Number(total) || 0;
    const i = Number(initial) || 0;
    return +(t - i).toFixed(4);
  };

  const saveLeadForMain = async () => {
    if (!activeMainId) return;
    setIsSaving(true);
    try {
      const ref = doc(db, 'tenders', tenderId);
      const snap = await getDoc(ref);
      const data = snap.exists() ? snap.data() as any : {};
      const existing: MainRow[] = Array.isArray(data.leadCharts) ? data.leadCharts : [];
      const updatedEntry: MainRow = {
        id: activeMainId,
        description: mainRows.find(m => m.id === activeMainId)?.description || '',
        fileName: mainRows.find(m => m.id === activeMainId)?.fileName || '',
        leadData: leadRows,
        updatedAt: Timestamp.now()
      };
      const idx = existing.findIndex(x => x.id === activeMainId);
      let updated: MainRow[];
      if (idx >= 0) { updated = [...existing]; updated[idx] = updatedEntry; }
      else { updated = [...existing, updatedEntry]; }
      await updateDoc(ref, { leadCharts: updated });
      // update local
      setMainRows(prev => prev.map(m => m.id === activeMainId ? updatedEntry : m));
      setActiveMainId(null);
      Alert.alert('✅ Saved', 'Lead Chart row saved to Firestore successfully');
    } catch (err) {
      console.error('Failed to save lead chart', err);
      Alert.alert('❌ Error', 'Failed to save Lead Chart: ' + (err as any).message);
    } finally {
      setIsSaving(false);
    }
  };

  const saveAllRows = async () => {
    setIsSaving(true);
    try {
      const ref = doc(db, 'tenders', tenderId);
      const leadChartsToSave = mainRows.map(m => ({
        id: m.id,
        description: m.description || '',
        fileName: m.fileName || '',
        leadData: m.leadData || [],
        updatedAt: Timestamp.now()
      }));
      await updateDoc(ref, { leadCharts: leadChartsToSave });
      Alert.alert('✅ Saved All', `${mainRows.length} row(s) saved to Firestore successfully`);
    } catch (err) {
      console.error('Failed to save all lead charts', err);
      Alert.alert('❌ Error', 'Failed to save all rows: ' + (err as any).message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteLeadRow = (rowId: string) => {
    setLeadRows(prev => prev.filter(r => r.id !== rowId));
  };

  const updateMainField = (id: string, field: keyof MainRow, value: any) => {
    setMainRows(prev => prev.map(r => r.id===id ? ({ ...r, [field]: value }) : r));
  };

  // Render
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Lead Chart</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={[styles.btn, styles.primary, isSaving && styles.disabled]} disabled={isSaving} onPress={saveAllRows}><Text style={styles.btnPrimaryText}>{isSaving ? '⏳ Saving...' : '💾 Save All'}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={addMainRow}><Text style={styles.btnText}>+ Add Row</Text></TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal style={styles.tableWrap}>
        <View>
          <View style={styles.rowHead}>
            <Text style={[styles.cell, styles.sr]}>Sr. No.</Text>
            <Text style={[styles.cell, styles.desc]}>Description</Text>
            <Text style={[styles.cell, styles.fname]}>File Name</Text>
            <Text style={[styles.cell, styles.action]}>Lead Chart</Text>
          </View>
          {mainRows.map((r, idx) => (
            <View key={r.id} style={[styles.rowBody, idx % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
              <Text style={[styles.cell, styles.sr]}>{idx+1}</Text>
              <TextInput style={[styles.cell, styles.desc, styles.input]} value={r.description} onChangeText={(t)=>updateMainField(r.id,'description',t)} />
              <TextInput style={[styles.cell, styles.fname, styles.input]} value={r.fileName} onChangeText={(t)=>updateMainField(r.id,'fileName',t)} />
              <View style={[styles.cell, styles.action]}>
                <TouchableOpacity style={styles.smallBtn} onPress={() => openLead(r.id)}>
                  <Text style={styles.smallBtnText}>Open Lead</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Inline Lead Details (shown directly below Table 1) */}
      {activeMainId && (
        <View style={styles.inlineDetailContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Lead Chart Details</Text>
            <TouchableOpacity onPress={() => setActiveMainId(null)}><Text style={styles.link}>Close</Text></TouchableOpacity>
          </View>

          <View style={styles.metaRow}><Text style={styles.metaLabel}>NAME OF THE DEPARTMENT: </Text><Text>{metaDept}</Text></View>
          <View style={[styles.metaRow, styles.center]}><Text style={styles.metaLabel}>NAME OF WORK: </Text><Text>{metaWork}</Text></View>
          <View style={[styles.metaRow, styles.center]}><Text style={{fontWeight:'700'}}>Lead Chart</Text></View>

          <ScrollView horizontal>
            <View style={styles.leadTableWrap}>
              <View style={styles.leadHeadRow}>
                <Text style={[styles.leadCell, styles.lSr]}>Sr.No.</Text>
                <Text style={[styles.leadCell, styles.lMaterial]}>Materials</Text>
                <Text style={[styles.leadCell, styles.lSource]}>Source</Text>
                <Text style={[styles.leadCell, styles.lNum]}>Lead in Km.</Text>
                <Text style={[styles.leadCell, styles.lNum]}>Total Lead Charges</Text>
                <Text style={[styles.leadCell, styles.lNum]}>Initial Lead Charges</Text>
                <Text style={[styles.leadCell, styles.lNum]}>Net Lead Charges</Text>
                <Text style={[styles.leadCell, styles.lUnit]}>Unit</Text>
                <Text style={[styles.leadCell, styles.lAction]}>Action</Text>
              </View>

              {leadRows.map((lr, i) => (
                <View key={lr.id} style={[styles.leadRow, i % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
                  <Text style={[styles.leadCell, styles.lSr]}>{i+1}</Text>
                  <TextInput style={[styles.leadCell, styles.lMaterial, styles.input]} value={String(lr.material||'')} onChangeText={(t)=>updateLeadField(lr.id,'material',t)} />
                  <TextInput style={[styles.leadCell, styles.lSource, styles.input]} value={String(lr.source||'')} onChangeText={(t)=>updateLeadField(lr.id,'source',t)} />
                  <TextInput style={[styles.leadCell, styles.lNum, styles.input]} keyboardType="numeric" value={lr.leadKm==null? '': String(lr.leadKm)} onChangeText={(t)=>updateLeadField(lr.id,'leadKm',t)} />
                  <TextInput style={[styles.leadCell, styles.lNum, styles.input]} keyboardType="numeric" value={lr.totalCharges==null? '': String(lr.totalCharges)} onChangeText={(t)=>{ updateLeadField(lr.id,'totalCharges',t); }} />
                  <TextInput style={[styles.leadCell, styles.lNum, styles.input]} keyboardType="numeric" value={lr.initialCharges==null? '': String(lr.initialCharges)} onChangeText={(t)=>{ updateLeadField(lr.id,'initialCharges',t); }} />
                  <Text style={[styles.leadCell, styles.lNum]}>{calcNet(lr.totalCharges, lr.initialCharges)}</Text>
                  <TextInput style={[styles.leadCell, styles.lUnit, styles.input]} value={String(lr.unit||'')} onChangeText={(t)=>updateLeadField(lr.id,'unit',t)} />
                  <View style={[styles.leadCell, styles.lAction]}>
                    <TouchableOpacity style={styles.smallDanger} onPress={()=>deleteLeadRow(lr.id)}><Text style={{color:'#dc2626'}}>Delete</Text></TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={[styles.btn, styles.ghost]} onPress={addLeadRow}><Text>+ Add Row</Text></TouchableOpacity>
            <View style={{flex:1}} />
            <TouchableOpacity style={[styles.btn, styles.primary, isSaving && styles.disabled]} disabled={isSaving} onPress={saveLeadForMain}><Text style={styles.btnPrimaryText}>{isSaving ? '⏳ Saving...' : '💾 Save'}</Text></TouchableOpacity>
          </View>
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container:{ padding:16, backgroundColor:'#fff', borderRadius:8 },
  headerRow:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:16 },
  headerButtons:{ flexDirection:'row', gap:8, alignItems:'center' },
  title:{ fontSize:18, fontWeight:'700', color:'#111827' },
  btn:{ paddingHorizontal:12, paddingVertical:10, backgroundColor:'#f3f4f6', borderRadius:6, justifyContent:'center', alignItems:'center' },
  btnText:{ color:'#111827', fontWeight:'600', fontSize:14 },
  btnPrimaryText:{ color:'#fff', fontWeight:'600', fontSize:14 },
  primary:{ backgroundColor:'#1E90FF' },
  ghost:{ backgroundColor:'#f3f4f6' },
  disabled:{ opacity:0.6 },
  
  tableWrap:{ borderWidth:1, borderColor:'#e5e7eb', borderRadius:8, backgroundColor:'#fff', marginBottom:16 },
  rowHead:{ flexDirection:'row', backgroundColor:'#f9fafb', borderBottomWidth:2, borderBottomColor:'#e5e7eb', paddingVertical:2 },
  rowBody:{ flexDirection:'row', borderBottomWidth:1, borderBottomColor:'#f3f4f6', alignItems:'center' },
  
  cell:{ padding:12, justifyContent:'center' },
  sr:{ width:60, textAlign:'center', fontWeight:'600' },
  desc:{ flex:0.5, minWidth:280 },
  fname:{ flex:0.5, minWidth:240 },
  action:{ width:150, alignItems:'center', justifyContent:'center' },
  
  input:{ borderWidth:1, borderColor:'#d1d5db', padding:10, borderRadius:6, fontSize:13, backgroundColor:'#fff' },
  smallBtn:{ paddingHorizontal:12, paddingVertical:8, backgroundColor:'#dbeafe', borderRadius:6, borderWidth:1, borderColor:'#93c5fd' },
  smallBtnText:{ color:'#1e40af', fontWeight:'700', fontSize:13 },

  inlineDetailContainer:{ borderTopWidth:2, borderTopColor:'#e5e7eb', marginTop:16, paddingTop:16, backgroundColor:'#fafafa', borderRadius:8, padding:12 },
  modalHeader:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12 },
  modalTitle:{ fontSize:16, fontWeight:'700', color:'#111827' },
  link:{ color:'#1e90ff', fontWeight:'600', fontSize:14 },
  metaRow:{ marginBottom:8, flexDirection:'row', alignItems:'center', paddingHorizontal:8 },
  metaLabel:{ fontWeight:'600', marginRight:8, color:'#374151', fontSize:13 },
  center:{ justifyContent:'center', alignItems:'center' },

  leadTableWrap:{ minWidth:1200, borderWidth:1, borderColor:'#e5e7eb', borderRadius:8, overflow:'hidden', backgroundColor:'#fff', marginVertical:12 },
  leadHeadRow:{ flexDirection:'row', backgroundColor:'#f3f4f6', borderBottomWidth:2, borderBottomColor:'#e5e7eb', paddingVertical:2 },
  leadRow:{ flexDirection:'row', alignItems:'center' },
  rowEven: { backgroundColor: '#ffffff' },
  rowOdd: { backgroundColor: '#fafafa' },
  
  leadCell:{ padding:12, justifyContent:'center', borderRightWidth:1, borderRightColor:'#e5e7eb', fontSize:13 },
  lSr:{ width:60, textAlign:'center', fontWeight:'600' },
  lMaterial:{ width:200, minWidth:200 },
  lSource:{ width:140, minWidth:140 },
  lNum:{ width:130, textAlign:'right', fontWeight:'500' },
  lUnit:{ width:90, textAlign:'center' },
  lAction:{ width:120, alignItems:'center', justifyContent:'center' },

  modalFooter:{ flexDirection:'row', alignItems:'center', marginTop:16, paddingTop:12, borderTopWidth:1, borderTopColor:'#e5e7eb' },
  smallDanger:{ padding:8, borderRadius:6, backgroundColor:'#fee2e2', borderWidth:1, borderColor:'#fca5a5' }
});

export default LeadChartTab;
