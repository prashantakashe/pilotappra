import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { db } from '../services/firebaseConfig';
import { collection, query, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { saveProjectBaseline, getProjectBaseline } from '../services/escalationService';

interface ProjectBaselineConstantsTabProps {
  projectId: string;
}

interface Weightage {
  key: string;
  label: string;
  percentage: number;
  isActual?: boolean;
}

const ProjectBaselineConstantsTab: React.FC<ProjectBaselineConstantsTabProps> = ({ projectId }) => {
  // Date states
  const [tenderDate, setTenderDate] = useState<Date | null>(null);
  const [projectStartDate, setProjectStartDate] = useState<Date | null>(null);
  const [showTenderPicker, setShowTenderPicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);

  // Weightage states
  const [weightages, setWeightages] = useState<Weightage[]>([
    { key: 'labour', label: 'Labour', percentage: 22, isActual: false },
    { key: 'steel', label: 'Steel', percentage: 0, isActual: true },
    { key: 'cement', label: 'Cement', percentage: 0, isActual: true },
    { key: 'material', label: 'Other Material', percentage: 75, isActual: false },
    { key: 'pol', label: 'POL', percentage: 3, isActual: false },
  ]);

  // Period selection states
  const [selectedPeriods, setSelectedPeriods] = useState<[string, string, string]>(['Dec-2024', 'Jan-2025', 'Feb-2025']);
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
  const [showPeriodPicker, setShowPeriodPicker] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Save states
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Index values for selected periods
  const [indexValues, setIndexValues] = useState<Record<string, [number, number, number]>>({
    labour: [176.5, 177.5, 177.75],
    steel: [207.5, 206, 206.5],
    cement: [196.9, 195, 195.4],
    material: [149.3, 148, 148.3],
    pol: [133, 129.2, 129.8],
  });

  // Fetch available periods from Firestore
  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        setLoading(true);
        // Fetch all periods from global price_indices collection
        const q = query(collection(db, 'price_indices'), orderBy('month', 'desc'));
        const querySnapshot = await getDocs(q);
        const periods: string[] = [];
        querySnapshot.forEach(doc => {
          periods.push(doc.id); // Document ID is the period (e.g., "Dec-2025")
        });
        setAvailablePeriods(periods);
        
        // Set default selections to first 3 periods
        if (periods.length >= 3) {
          setSelectedPeriods([periods[0], periods[1], periods[2]] as [string, string, string]);
        } else if (periods.length > 0) {
          setSelectedPeriods([periods[0], periods.length > 1 ? periods[1] : periods[0], periods.length > 2 ? periods[2] : periods[0]] as [string, string, string]);
        }
      } catch (error) {
        console.error('Error fetching periods:', error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchPeriods();
    }
  }, [projectId]);

  // Load existing baseline data
  useEffect(() => {
    const loadExistingData = async () => {
      if (!projectId) return;
      try {
        const baseline = await getProjectBaseline(projectId);
        if (baseline) {
          // Load dates
          if (baseline.tenderDate) setTenderDate(new Date(baseline.tenderDate));
          if (baseline.projectStartDate) setProjectStartDate(new Date(baseline.projectStartDate));
          
          // Load selected periods
          setSelectedPeriods(baseline.selectedPeriods);
          
          // Load weightages
          setWeightages(prev =>
            prev.map(w => ({
              ...w,
              percentage: baseline.weightages[w.key as keyof typeof baseline.weightages] || w.percentage,
            }))
          );
        }
      } catch (error) {
        console.error('Error loading baseline data:', error);
      }
    };

    loadExistingData();
  }, [projectId]);

  // Fetch index values for selected periods
  useEffect(() => {
    const fetchIndexValuesForPeriods = async () => {
      try {
        const newIndexValues: Record<string, [number, number, number]> = {
          labour: [0, 0, 0],
          steel: [0, 0, 0],
          cement: [0, 0, 0],
          material: [0, 0, 0],
          pol: [0, 0, 0],
        };

        // Fetch data for each selected period
        for (let idx = 0; idx < 3; idx++) {
          const period = selectedPeriods[idx];
          if (!period || !availablePeriods.includes(period)) continue;

          try {
            const docRef = doc(db, 'price_indices', period);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
              const data = docSnap.data();
              // Fetch values: prioritize labourFinal if exists, fall back to labour, then lBase
              newIndexValues.labour[idx] = data.labourFinal || data.labour || data.lBase || 0;
              newIndexValues.steel[idx] = data.steel || 0;
              newIndexValues.cement[idx] = data.cement || 0;
              newIndexValues.material[idx] = data.material || data.other || 0; // 'material' or 'other' field
              newIndexValues.pol[idx] = data.pol || 0;
            }
          } catch (error) {
            console.error(`Error fetching period ${period}:`, error);
          }
        }

        setIndexValues(newIndexValues);
      } catch (error) {
        console.error('Error fetching index values:', error);
      }
    };

    if (availablePeriods.length > 0 && selectedPeriods.some(p => p)) {
      fetchIndexValuesForPeriods();
    }
  }, [selectedPeriods, availablePeriods]);

  // Handle save constants
  const handleSaveConstants = async () => {
    if (!isValidWeightage || !projectId) {
      setSaveMessage({
        text: 'Total weightage must equal 100%',
        type: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      const weightageObj: Record<string, number> = {};
      weightages.forEach(w => {
        weightageObj[w.key] = w.percentage;
      });

      await saveProjectBaseline(projectId, {
        tenderDate: tenderDate ? tenderDate.toISOString() : '',
        projectStartDate: projectStartDate ? projectStartDate.toISOString() : '',
        selectedPeriods,
        weightages: weightageObj as any,
      });

      setSaveMessage({
        text: '✅ Constants saved successfully!',
        type: 'success',
      });

      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      console.error('Error saving constants:', error);
      setSaveMessage({
        text: `❌ Error: ${error.message}`,
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };
  const handleTenderDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTenderPicker(false);
    }
    if (date) {
      setTenderDate(date);
    }
  };

  // Handle project start date selection
  const handleStartDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
    }
    if (date) {
      setProjectStartDate(date);
    }
  };

  // Handle weightage change
  const handleWeightageChange = (key: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setWeightages(prev =>
      prev.map(w => (w.key === key ? { ...w, percentage: numValue } : w))
    );
  };

  // Handle period selection
  const handlePeriodSelect = (index: number, period: string) => {
    const newPeriods = [...selectedPeriods] as [string, string, string];
    newPeriods[index] = period;
    setSelectedPeriods(newPeriods);
    setShowPeriodPicker(null);
  };

  // Calculate total weightage
  const totalWeightage = useMemo(
    () => weightages.reduce((sum, w) => sum + w.percentage, 0),
    [weightages]
  );

  // Calculate base averages for each index
  const baseAverages = useMemo(() => {
    const averages: Record<string, number> = {};
    Object.keys(indexValues).forEach(key => {
      const values = indexValues[key];
      const avg = (values[0] + values[1] + values[2]) / 3;
      averages[key] = parseFloat(avg.toFixed(2));
    });
    return averages;
  }, [indexValues]);

  // Calculate total impact value
  const totalImpactValue = useMemo(() => {
    let total = 0;
    weightages.forEach(w => {
      const baseAvg = baseAverages[w.key] || 0;
      const weight = w.percentage / 100;
      total += baseAvg * weight;
    });
    return total.toFixed(2);
  }, [weightages, baseAverages]);

  // Color mapping function
  const getColorForIndex = (key: string): string => {
    const colors: Record<string, string> = {
      labour: '#3b82f6',
      steel: '#6b7280',
      cement: '#10b981',
      material: '#f59e0b',
      pol: '#1f2937',
    };
    return colors[key] || '#ccc';
  };

  // Weightage distribution data for chart
  const chartData = useMemo(() => {
    return weightages.map(w => ({
      label: w.label,
      value: w.percentage,
      color: getColorForIndex(w.key),
    }));
  }, [weightages]);

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Select Date';
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const isValidWeightage = totalWeightage === 100;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
      <View style={styles.contentWrapper}>
        {/* Left Column - Parameters & Constants */}
        <View style={styles.leftColumn}>
          {/* Date Inputs */}
          <View style={styles.section}>
            <View style={styles.dateCard}>
              <Text style={styles.dateLabel}>TENDER SUBMISSION DATE</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowTenderPicker(true)}
              >
                <Text style={styles.dateText}>{formatDate(tenderDate)}</Text>
                <MaterialIcons name="calendar-today" size={20} color="#2563eb" />
              </TouchableOpacity>
            </View>

            <View style={styles.dateCard}>
              <Text style={styles.dateLabel}>PROJECT START DATE</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowStartPicker(true)}
              >
                <Text style={styles.dateText}>{formatDate(projectStartDate)}</Text>
                <MaterialIcons name="calendar-today" size={20} color="#2563eb" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Weightage Constants */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>WEIGHTAGE CONSTANTS (%)</Text>

            {weightages.map(item => (
              <View key={item.key} style={styles.weightageRow}>
                <Text style={styles.weightageLabel}>{item.label}</Text>
                {item.isActual ? (
                  <Text style={styles.actualTag}>AT ACTUAL</Text>
                ) : (
                  <TextInput
                    style={styles.percentageInput}
                    value={item.percentage.toString()}
                    onChangeText={value => handleWeightageChange(item.key, value)}
                    keyboardType="decimal-pad"
                    editable={true}
                  />
                )}
                {!item.isActual && <Text style={styles.percentSign}>%</Text>}
              </View>
            ))}

            {/* Total Weightage Footer */}
            <View style={[styles.totalWeightageRow, !isValidWeightage && styles.totalWeightageInvalid]}>
              <Text style={styles.totalWeightageLabel}>TOTAL WEIGHTAGE</Text>
              <View style={styles.totalWeightageValue}>
                <Text style={[styles.totalWeightageText, !isValidWeightage && styles.totalWeightageTextInvalid]}>
                  {totalWeightage}%
                </Text>
              </View>
            </View>
          </View>

          {/* Save Constants Button */}
          <TouchableOpacity
            style={[styles.saveButton, (!isValidWeightage || saving) && styles.saveButtonDisabled]}
            disabled={!isValidWeightage || saving}
            onPress={handleSaveConstants}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Constants'}
            </Text>
          </TouchableOpacity>

          {!isValidWeightage && (
            <Text style={styles.validationWarning}>
              ⚠️ Total weightage must equal 100% to save
            </Text>
          )}

          {saveMessage && (
            <Text style={[styles.saveMessage, { color: saveMessage.type === 'success' ? '#10b981' : '#ef4444' }]}>
              {saveMessage.text}
            </Text>
          )}
        </View>

        {/* Right Column - Calculation Breakdown */}
        <View style={styles.rightColumn}>
          {loading ? (
            <ActivityIndicator size="large" color="#2563eb" />
          ) : (
            <>
              {/* Period Selectors */}
              <View style={styles.periodSelectorsContainer}>
                <Text style={styles.categoryLabel}>Category</Text>
                {[0, 1, 2].map(idx => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.periodSelector}
                    onPress={() => setShowPeriodPicker(idx)}
                  >
                    <Text style={styles.periodSelectorText}>{selectedPeriods[idx]}</Text>
                    <MaterialIcons name="expand-more" size={16} color="#2563eb" />
                  </TouchableOpacity>
                ))}
                <View style={styles.baseAverageHeader}>
                  <Text style={styles.baseAverageHeaderText}>Base Average</Text>
                </View>
              </View>

              {/* Index Values Table */}
              <ScrollView style={styles.tableContainer} showsVerticalScrollIndicator={true}>
                {weightages.map(w => (
                  <View key={w.key} style={styles.tableRow}>
                    <Text style={styles.tableLabel}>{w.label}</Text>
                    <View style={styles.periodValues}>
                      {[0, 1, 2].map(idx => (
                        <TextInput
                          key={idx}
                          style={styles.periodValue}
                          value={indexValues[w.key]?.[idx]?.toString() || '0'}
                          onChangeText={value => {
                            const vals = [...indexValues[w.key]] as [number, number, number];
                            vals[idx] = parseFloat(value) || 0;
                            setIndexValues(prev => ({ ...prev, [w.key]: vals }));
                          }}
                          keyboardType="decimal-pad"
                          editable={true}
                        />
                      ))}
                    </View>
                    <View style={styles.baseAverageValue}>
                      <Text style={styles.baseAverageValueText}>{baseAverages[w.key]}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* Charts and Impact Card */}
              <View style={styles.chartsContainer}>
                {/* Weightage Distribution Chart */}
                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>WEIGHTAGE DISTRIBUTION</Text>
                  <View style={styles.doughnutChartPlaceholder}>
                    <View style={styles.doughnutRing}>
                      {chartData.map((item, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.doughnutSegment,
                            {
                              backgroundColor: item.color,
                              flex: item.value,
                            },
                          ]}
                        />
                      ))}
                    </View>
                    <View style={styles.chartLegend}>
                      {chartData.map((item, idx) => (
                        <View key={idx} style={styles.legendItem}>
                          <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                          <Text style={styles.legendText}>{item.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Impact Card */}
                <View style={styles.impactCard}>
                  <Text style={styles.impactTitle}>CALCULATED IMPACT</Text>
                  <Text style={styles.impactSubtitle}>Cumulative Base Indices Value</Text>
                  <Text style={styles.impactValue}>{totalImpactValue}</Text>
                  <TouchableOpacity style={styles.generateButton}>
                    <Text style={styles.generateButtonText}>Generate Calculation Sheet</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Period Picker Modal */}
      {showPeriodPicker !== null && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPeriodPicker(null)}
        >
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerModal}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Period</Text>
                <TouchableOpacity onPress={() => setShowPeriodPicker(null)}>
                  <MaterialIcons name="close" size={24} color="#1f2937" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={availablePeriods}
                keyExtractor={item => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      selectedPeriods[showPeriodPicker!] === item && styles.pickerItemActive,
                    ]}
                    onPress={() => handlePeriodSelect(showPeriodPicker!, item)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        selectedPeriods[showPeriodPicker!] === item && styles.pickerItemTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Date Pickers */}
      {showTenderPicker && (
        <DateTimePicker
          value={tenderDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTenderDateChange}
        />
      )}

      {showStartPicker && (
        <DateTimePicker
          value={projectStartDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartDateChange}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    width: '100%',
  },
  contentWrapper: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    gap: 16,
    width: '100%',
  },
  leftColumn: {
    flex: 1,
    minWidth: 300,
    gap: 16,
  },
  rightColumn: {
    flex: 2,
    minWidth: 500,
    gap: 16,
  },
  section: {
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  dateCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  dateText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  weightageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  weightageLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  percentageInput: {
    width: 60,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#f0f9ff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
    textAlign: 'center',
  },
  percentSign: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  actualTag: {
    fontSize: 11,
    color: '#9ca3af',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  totalWeightageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#2563eb',
    borderRadius: 6,
    marginTop: 8,
  },
  totalWeightageInvalid: {
    backgroundColor: '#fca5a5',
  },
  totalWeightageLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  totalWeightageValue: {
    alignItems: 'center',
  },
  totalWeightageText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  totalWeightageTextInvalid: {
    color: '#7f1d1d',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#d1d5db',
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  validationWarning: {
    fontSize: 12,
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  saveMessage: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#f0fdf4',
  },
  periodSelectorsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
    minHeight: 50,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    minWidth: 100,
    justifyContent: 'space-between',
  },
  periodSelectorText: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: '600',
  },
  baseAverageHeader: {
    flex: 0.8,
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  baseAverageHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  tableContainer: {
    maxHeight: 400,
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
  },
  tableLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    flex: 1.2,
  },
  periodValues: {
    flexDirection: 'row',
    gap: 8,
    flex: 2,
  },
  periodValue: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#f0f9ff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    fontSize: 12,
    color: '#1f2937',
    fontWeight: '600',
    textAlign: 'center',
  },
  baseAverageValue: {
    flex: 0.8,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  baseAverageValueText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e40af',
  },
  chartsContainer: {
    flexDirection: 'row',
    gap: 12,
    minHeight: 300,
  },
  chartCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 300,
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 12,
  },
  doughnutChartPlaceholder: {
    alignItems: 'center',
    width: '100%',
  },
  doughnutRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 30,
    borderColor: '#f3f4f6',
    flexDirection: 'row',
    marginBottom: 12,
  },
  doughnutSegment: {
    flex: 1,
  },
  chartLegend: {
    gap: 6,
    alignItems: 'flex-start',
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  impactCard: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  impactTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#bfdbfe',
    marginBottom: 4,
  },
  impactSubtitle: {
    fontSize: 12,
    color: '#dbeafe',
    marginBottom: 8,
    fontWeight: '500',
  },
  impactValue: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '50%',
    paddingTop: 12,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerItemActive: {
    backgroundColor: '#eff6ff',
  },
  pickerItemText: {
    fontSize: 14,
    color: '#374151',
  },
  pickerItemTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
});

export default ProjectBaselineConstantsTab;
