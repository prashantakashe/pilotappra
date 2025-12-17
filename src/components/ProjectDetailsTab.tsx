


import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform, StyleSheet, ScrollView } from 'react-native';
import GlassIcon from './GlassIcon';
import ProjectForm, { ProjectFormValues } from './ProjectForm';
import { db, Timestamp } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getBills } from '../services/billsService';

const ProjectDetailsTab: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSaveText, setShowSaveText] = useState(false); // Used for web-only hover effect

  // Bill info for Work Status
  const [latestRABill, setLatestRABill] = useState<{ no?: string, grossAmount?: string } | null>(null);
  const [raBillStats, setRaBillStats] = useState<{
    totalGross: number,
    totalGrossWithGst: number,
    progressPercent: number,
    balanceAmount: number
  } | null>(null);

  const [fields, setFields] = useState({
    nameOfWork: '',
    nameOfWorkShort: '',
    type: '',
    employer: '',
    pmc: '',
    projectLocation: '',
    startDate: '',
    durationValue: '',
    durationUnit: '',
    completionDate: '',
    extCompletion1: '',
    extCompletion2: '',
    estimatedCost: '',
    department: '',
    // Add all fields from ProjectForm
    name: '',
    shortName: '',
    address: '',
  });

  // Function to fetch initial project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const ref = doc(db, 'dsr_projects', projectId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setFields({
            nameOfWork: data.nameOfWork || '',
            nameOfWorkShort: data.nameOfWorkShort || '',
            type: data.type || data.department || '',
            employer: data.employer || '',
            pmc: data.pmc || '',
            projectLocation: data.projectLocation || '',
            startDate: data.startDate ? (typeof data.startDate === 'string' ? data.startDate : (data.startDate.toDate ? data.startDate.toDate().toISOString().substring(0, 10) : '')) : '',
            durationValue: data.durationValue || '',
            durationUnit: data.durationUnit || '',
            completionDate: data.completionDate ? (typeof data.completionDate === 'string' ? data.completionDate : (data.completionDate.toDate ? data.completionDate.toDate().toISOString().substring(0, 10) : '')) : '',
            extCompletion1: data.extCompletion1 ? (typeof data.extCompletion1 === 'string' ? data.extCompletion1 : (data.extCompletion1.toDate ? data.extCompletion1.toDate().toISOString().substring(0, 10) : '')) : '',
            extCompletion2: data.extCompletion2 ? (typeof data.extCompletion2 === 'string' ? data.extCompletion2 : (data.extCompletion2.toDate ? data.extCompletion2.toDate().toISOString().substring(0, 10) : '')) : '',
            estimatedCost: data.estimatedCost || '',
            department: data.department || '',
          });
        }
      } catch (err) {
        console.error("Failed to fetch project:", err);
        Alert.alert('Error', 'Failed to load project details.');
      } finally {
        setLoading(false);
      }
    };


    // Fetch bills for Work Status
    const fetchBills = async () => {
      try {
        const bills = await getBills(projectId);
        console.log('[ProjectDetailsTab] Bills fetched:', bills);
        // Filter R A Bill type, sort by submissionDate or no (preferably date)
        const raBills = bills.filter(b => b.billType === 'R A Bill');
        console.log('[ProjectDetailsTab] R A Bills:', raBills);
        if (raBills.length > 0) {
          // Sort by submissionDate descending (latest first)
          raBills.sort((a, b) => {
            const da = a.submissionDate ? new Date(a.submissionDate) : new Date(0);
            const db = b.submissionDate ? new Date(b.submissionDate) : new Date(0);
            return db.getTime() - da.getTime();
          });
          console.log('[ProjectDetailsTab] Latest R A Bill:', raBills[0]);
          setLatestRABill({ no: raBills[0].no, grossAmount: raBills[0].grossAmount });
        } else {
          setLatestRABill(null);
        }
      } catch (err) {
        console.error('[ProjectDetailsTab] Error fetching bills:', err);
        setLatestRABill(null);
      }
    };

    if (projectId) {
      fetchProject();
      fetchBills();
    }
  }, [projectId]);

  // The code block that was previously misplaced belongs here (the ProjectForm onSubmit handler):
  const handleFormSubmit = async (values: ProjectFormValues) => {
    try {
      console.log('Saving project details:', values);
      setSaving(true);
      const ref = doc(db, 'dsr_projects', projectId);
      // Map ProjectForm fields to Firestore fields
      function toTimestamp(val, label) {
        try {
          console.log('Field', label, 'value:', val, 'type:', typeof val, 'instanceof Date:', val instanceof Date);
          if (!val) return '';
          if (typeof Timestamp === 'undefined' || typeof Timestamp.fromDate !== 'function') {
            console.warn('Firestore Timestamp is not available, saving as ISO string');
            if (val instanceof Date) return val.toISOString();
            if (typeof val === 'string') {
              const d = new Date(val);
              if (!isNaN(d.getTime())) return d.toISOString();
            }
            return '';
          }
          if (val instanceof Date) {
            const ts = Timestamp.fromDate(val);
            console.log('Converted', label, 'to Timestamp:', ts);
            return ts;
          }
          if (typeof val === 'string') {
            // Try to parse string as date (from web input)
            const d = new Date(val);
            if (!isNaN(d.getTime())) {
              const ts = Timestamp.fromDate(d);
              console.log('Converted', label, 'string to Timestamp:', ts);
              return ts;
            }
          }
          return '';
        } catch (err) {
          console.error('Error converting', label, val, err);
          return '';
        }
      }
      const updates: Partial<any> = {
        // New field names
        name: values.name,
        shortName: values.shortName,
        address: values.address,
        // Legacy/old field names for backward compatibility
        nameOfWork: values.name,
        nameOfWorkShort: values.shortName,
        projectLocation: values.address,
        // Other fields
        type: values.type,
        employer: values.employer,
        pmc: values.pmc,
        startDate: toTimestamp(values.startDate, 'startDate'),
        durationValue: values.durationValue,
        durationUnit: values.durationUnit,
        completionDate: toTimestamp(values.completionDate, 'completionDate'),
        extCompletion1: toTimestamp(values.extCompletion1, 'extCompletion1'),
        extCompletion2: toTimestamp(values.extCompletion2, 'extCompletion2'),
        updatedAt: (typeof Timestamp !== 'undefined' && typeof Timestamp.now === 'function') ? Timestamp.now() : (new Date()).toISOString(),
      };
      await updateDoc(ref, updates);
      console.log('Project details saved to Firestore:', updates);
      Alert.alert('Saved', 'Project details saved to Firestore!');
      setEditMode(false);
      // Refresh fields after save
      setLoading(true);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setFields({
          nameOfWork: data.nameOfWork || '',
          nameOfWorkShort: data.nameOfWorkShort || '',
          type: data.type || data.department || '',
          employer: data.employer || '',
          pmc: data.pmc || '',
          projectLocation: data.projectLocation || '',
          startDate: data.startDate ? (typeof data.startDate === 'string' ? data.startDate : (data.startDate.toDate ? data.startDate.toDate().toISOString().substring(0, 10) : '')) : '',
          durationValue: data.durationValue || '',
          durationUnit: data.durationUnit || '',
          completionDate: data.completionDate ? (typeof data.completionDate === 'string' ? data.completionDate : (data.completionDate.toDate ? data.completionDate.toDate().toISOString().substring(0, 10) : '')) : '',
          extCompletion1: data.extCompletion1 ? (typeof data.extCompletion1 === 'string' ? data.extCompletion1 : (data.extCompletion1.toDate ? data.extCompletion1.toDate().toISOString().substring(0, 10) : '')) : '',
          extCompletion2: data.extCompletion2 ? (typeof data.extCompletion2 === 'string' ? data.extCompletion2 : (data.extCompletion2.toDate ? data.extCompletion2.toDate().toISOString().substring(0, 10) : '')) : '',
          estimatedCost: data.estimatedCost || '',
          department: data.department || '',
          // Map all ProjectForm fields
          name: data.name || data.nameOfWork || '',
          shortName: data.shortName || data.nameOfWorkShort || '',
          address: data.address || data.projectLocation || '',
        });
      }
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to save project details:', err);
      Alert.alert('Error', 'Failed to save project details: ' + (err?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };


  if (loading) return <View style={{ padding: 32, alignItems: 'center' }}><Text>Loading...</Text></View>;

  if (editMode) {
    return (
      <View style={{ flex: 1 }}>
        <ProjectForm
          initialValues={{
            ...fields,
            startDate: fields.startDate ? (fields.startDate instanceof Date ? fields.startDate : new Date(fields.startDate)) : null,
            completionDate: fields.completionDate ? (fields.completionDate instanceof Date ? fields.completionDate : new Date(fields.completionDate)) : null,
            extCompletion1: fields.extCompletion1 ? (fields.extCompletion1 instanceof Date ? fields.extCompletion1 : new Date(fields.extCompletion1)) : null,
            extCompletion2: fields.extCompletion2 ? (fields.extCompletion2 instanceof Date ? fields.extCompletion2 : new Date(fields.extCompletion2)) : null,
          }}
          onSubmit={handleFormSubmit}
          onCancel={() => setEditMode(false)}
          submitLabel="Save"
        />
        {/* Floating Save Icon (Glass) - Web only */}
        {Platform.OS === 'web' ? (
          <div
            style={{
              position: 'fixed',
              right: 48,
              bottom: 48,
              zIndex: 1000,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
            onClick={() => {
              const saveButton = document.getElementById('project-form-save-button');
              if (saveButton) {
                (saveButton as HTMLButtonElement).click();
              } else {
                console.warn('Could not find save button to trigger submit.');
              }
            }}
            onMouseEnter={() => setShowSaveText(true)}
            onMouseLeave={() => setShowSaveText(false)}
          >
            <GlassIcon name="save" size={38} color="#1E90FF" />
            {showSaveText && <span style={{ color: '#1E90FF', fontWeight: '700', fontSize: 15, marginTop: 8, background: 'rgba(255,255,255,0.8)', borderRadius: 8, padding: '2px 10px', boxShadow: '0 2px 8px rgba(30,144,255,0.08)' }}>Save</span>}
          </div>
        ) : null}
      </View>
    );
  }

  // Helper to format date string or Date object to DD/MM/YYYY
  function formatDate(val) {
    if (!val) return 'N/A';
    let d = val;
    if (typeof val === 'string') {
      d = new Date(val);
    }
    if (!(d instanceof Date) || isNaN(d.getTime())) return 'N/A';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  // Read-only View (2-column, grouped, management-friendly)
  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-start', paddingTop: 0 }}>
        <View style={[styles.cardView, { marginTop: 0, width: '98%', alignSelf: 'center', padding: 24, minWidth: 600, maxWidth: '100%', boxShadow: '0 2px 16px #e0e7ef22' }]}> 
          <Text style={styles.cardTitle}>Project Details</Text>
          {/* Section 1: Basic Info */}
          <View style={styles.sectionGroup}>
            <Text style={styles.sectionTitle}>Basic Info</Text>
            <View style={styles.twoColRow}>
              <View style={styles.colItem}><Text style={styles.cardLabel}>Project Name</Text><Text style={styles.cardValue}>{fields.name || fields.nameOfWork}</Text></View>
              <View style={styles.colItem}><Text style={styles.cardLabel}>Project Type</Text><Text style={styles.cardValue}>{fields.type}</Text></View>
            </View>
            <View style={styles.twoColRow}>
              <View style={styles.colItem}><Text style={styles.cardLabel}>Short Name</Text><Text style={styles.cardValue}>{fields.shortName || fields.nameOfWorkShort}</Text></View>
              <View style={styles.colItem}></View>
            </View>
          </View>
          {/* Section 2: Stakeholders */}
          <View style={styles.sectionGroup}>
            <Text style={styles.sectionTitle}>Stakeholders</Text>
            <View style={styles.twoColRow}>
              <View style={styles.colItem}><Text style={styles.cardLabel}>Employer Name</Text><Text style={styles.cardValue}>{fields.employer}</Text></View>
              <View style={styles.colItem}><Text style={styles.cardLabel}>PMC Name</Text><Text style={styles.cardValue}>{fields.pmc}</Text></View>
            </View>
          </View>
          {/* Section 3: Location & Schedule */}
          <View style={styles.sectionGroup}>
            <Text style={styles.sectionTitle}>Location & Schedule</Text>
            <View style={styles.twoColRow}>
              <View className="colItem"><Text style={styles.cardLabel}>Project Address</Text><Text style={styles.cardValue}>{fields.address || fields.projectLocation}</Text></View>
              <View className="colItem"><Text style={styles.cardLabel}>Start Date</Text><View style={styles.dateValue}><GlassIcon name="calendar" size={16} color="#888" style={{ marginRight: 6 }} /><Text style={styles.cardValue}>{formatDate(fields.startDate)}</Text></View></View>
            </View>
            <View style={styles.twoColRow}>
              <View className="colItem"><Text style={styles.cardLabel}>Project Duration</Text><Text style={styles.cardValue}>{fields.durationValue} {fields.durationUnit}</Text></View>
              <View className="colItem"><Text style={styles.cardLabel}>Completion Date</Text><View style={styles.dateValue}><GlassIcon name="calendar" size={16} color="#888" style={{ marginRight: 6 }} /><Text style={styles.cardValue}>{formatDate(fields.completionDate)}</Text></View></View>
            </View>
            <View style={styles.twoColRow}>
              <View className="colItem"><Text style={styles.cardLabel}>Extended Date 1</Text><View style={styles.dateValue}><GlassIcon name="calendar" size={16} color="#888" style={{ marginRight: 6 }} /><Text style={styles.cardValue}>{formatDate(fields.extCompletion1)}</Text></View></View>
              <View className="colItem"><Text style={styles.cardLabel}>Extended Date 2</Text><View style={styles.dateValue}><GlassIcon name="calendar" size={16} color="#888" style={{ marginRight: 6 }} /><Text style={styles.cardValue}>{formatDate(fields.extCompletion2)}</Text></View></View>
            </View>
          </View>

          {/* Section 4: Work Status (read-only, auto fields) */}
          <View style={styles.sectionGroup}>
            <Text style={styles.sectionTitle}>Work Status</Text>
            <View style={styles.twoColRow}>
              <View style={styles.colItem}>
                <Text style={styles.cardLabel}>R A Bill No.</Text>
                <Text style={styles.cardValue}>
                  {latestRABill ? (latestRABill.no || 'N/A') : 'No R A Bill found'}
                </Text>
              </View>
              <View style={styles.colItem}>
                <Text style={styles.cardLabel}>Gross Bill Amount</Text>
                <Text style={styles.cardValue}>
                  {raBillStats ? `₹ ${raBillStats.totalGross.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : 'N/A'}
                </Text>
              </View>
            </View>
            <View style={styles.twoColRow}>
              <View style={styles.colItem}>
                <Text style={styles.cardLabel}>Gross Bill Amount with GST</Text>
                <Text style={styles.cardValue}>
                  {raBillStats ? `₹ ${raBillStats.totalGrossWithGst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : 'N/A'}
                </Text>
              </View>
              <View style={styles.colItem}>
                <Text style={styles.cardLabel}>Financial Work Progress</Text>
                <Text style={styles.cardValue}>
                  {raBillStats ? `${raBillStats.progressPercent.toFixed(2)} %` : 'N/A'}
                </Text>
              </View>
            </View>
            <View style={styles.twoColRow}>
              <View style={styles.colItem}>
                <Text style={styles.cardLabel}>Balance Amount of Work</Text>
                <Text style={styles.cardValue}>
                  {raBillStats ? `₹ ${raBillStats.balanceAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : 'N/A'}
                </Text>
              </View>
              <View style={styles.colItem}></View>
            </View>
          </View>
        </View>
      </ScrollView>
      {/* Edit button: top-right for desktop, floating for mobile */}
      <View style={{ position: 'absolute', right: 36, top: 24, zIndex: 10 }}>
        <TouchableOpacity
          style={{ backgroundColor: '#fff', borderRadius: 50, padding: 10, shadowColor: '#1E90FF', shadowOpacity: 0.13, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e0e7ef' }}
          onPress={() => setEditMode(true)}
        >
          <GlassIcon name="pencil" size={20} color="#1E90FF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#f4f8fb',
    borderRadius: 18,
    margin: 24,
    borderWidth: 1,
    borderColor: '#e0e7ef',
    shadowColor: '#1E90FF',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  label: { fontWeight: '600', marginTop: 12, marginBottom: 4, color: '#222' },
  required: { color: 'red' },
  input: { borderWidth: 1, borderColor: '#d1d5db', padding: 10, borderRadius: 6, fontSize: 15, backgroundColor: '#f9fafb', marginBottom: 4 },
  dateInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', padding: 10, borderRadius: 6, backgroundColor: '#f9fafb', marginBottom: 4 },
  saveIconBtn: { marginTop: 18, alignSelf: 'flex-end', backgroundColor: 'transparent', padding: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 0 },
  saveBtnText: { color: '#1E90FF', fontWeight: '700', fontSize: 15, marginLeft: 8 },
  disabled: { opacity: 0.6 },
  cardView: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginTop: 0,
    shadowColor: '#1E90FF',
    shadowOpacity: 0.13,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e0e7ef',
    width: '98%',
    alignSelf: 'center',
    minWidth: 600,
    maxWidth: '100%',
  },
  cardTitle: {
    fontWeight: '700',
    fontSize: 22,
    marginBottom: 18,
    color: '#1E90FF',
    letterSpacing: 0.5,
  },
  // 2-column layout helpers
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 24,
  },
  colItem: {
    flex: 1,
    minWidth: 220,
    maxWidth: 400,
    marginRight: 12,
  },
  sectionGroup: {
    backgroundColor: '#f6fafd', // slightly lighter blue-grey
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e0e7ef',
    marginBottom: 12, // reduced gap
    padding: 22, // slightly more padding
    boxShadow: '0 1px 8px #e0e7ef11',
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 17, // increased font size
    color: '#1976d2',
    marginBottom: 14, // more space below title
    letterSpacing: 0.2,
  },
  dateValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLabel: {
    fontWeight: '600',
    color: '#374151',
    fontSize: 17, // increased font size
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  cardValue: {
    fontWeight: '400',
    color: '#222',
    marginLeft: 12,
    fontSize: 17, // increased font size
    backgroundColor: '#fafdff', // lighter, more contrast
    borderRadius: 7,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e0e7ef',
    minHeight: 38,
    display: 'flex',
    alignItems: 'center',
  },
});

export default ProjectDetailsTab;
