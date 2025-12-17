import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { AppLayout } from '../components/AppLayout';
import { PROJECTS_NAV } from '../constants/sidebarMenus';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

const ReportsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newReport, setNewReport] = useState('');

  // Example: Fetch reports from Firestore
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'reports'));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReports(data);
      } catch (e) {
        Alert.alert('Error', 'Failed to fetch reports');
      }
      setLoading(false);
    };
    fetchReports();
  }, []);

  // Example: Add a new report to Firestore
  const handleAddReport = async () => {
    if (!newReport.trim()) return;
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'reports'), { title: newReport });
      setReports(prev => [...prev, { id: docRef.id, title: newReport }]);
      setNewReport('');
    } catch (e) {
      Alert.alert('Error', 'Failed to add report');
    }
    setLoading(false);
  };

  return (
    <AppLayout
      title="Reports"
      activeRoute="Reports"
      sidebarItems={PROJECTS_NAV}
      showBackButton={true}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Reports</Text>
        <Text style={styles.subheading}>Various reports will be available here.</Text>
        {/* Example: Add new report */}
        <View style={styles.addReportRow}>
          <input
            style={styles.input}
            value={newReport}
            onChange={e => setNewReport(e.target.value)}
            placeholder="Enter report title"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddReport} disabled={loading}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        {/* Example: List reports */}
        <View style={styles.reportList}>
          {reports.map(report => (
            <View key={report.id} style={styles.reportCard}>
              <Text style={styles.reportTitle}>{report.title}</Text>
            </View>
          ))}
          {reports.length === 0 && !loading && (
            <Text style={styles.emptyText}>No reports found.</Text>
          )}
        </View>
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.ACTION_BLUE,
    marginTop: 16,
  },
  subheading: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    marginTop: 8,
  },
  addReportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.BORDER_LIGHT,
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    minWidth: 220,
    backgroundColor: colors.WHITE,
    outline: 'none',
  },
  addButton: {
    backgroundColor: colors.ACTION_BLUE,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginLeft: 8,
  },
  addButtonText: {
    color: colors.WHITE,
    fontWeight: '700',
    fontSize: 16,
  },
  reportList: {
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
  },
  reportCard: {
    width: '100%',
    backgroundColor: colors.WHITE,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#1976d2',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  reportTitle: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.textSecondary,
    marginTop: 32,
    fontSize: 16,
  },
});

export default ReportsScreen;
