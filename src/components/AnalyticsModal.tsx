import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { db } from '../services/firebaseConfig';
import { collection, query, getDocs } from 'firebase/firestore';

interface AnalyticsModalProps {
  visible: boolean;
  projectId: string;
  onClose: () => void;
}

const INDEX_COLORS: Record<string, { name: string; color: string }> = {
  labour: { name: 'Labour', color: '#3b82f6' },
  steel: { name: 'Steel', color: '#ef4444' },
  cement: { name: 'Cement', color: '#10b981' },
  material: { name: 'Material', color: '#f59e0b' },
  pol: { name: 'POL', color: '#1f2937' },
};

const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ visible, projectId, onClose }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleIndices, setVisibleIndices] = useState({
    labour: true,
    steel: true,
    cement: true,
    material: true,
    pol: true,
  });
  const [startPeriod, setStartPeriod] = useState<string | null>(null);
  const [endPeriod, setEndPeriod] = useState<string | null>(null);

  // Fetch data when modal opens
  useEffect(() => {
    if (visible && projectId) {
      fetchData();
    }
  }, [visible, projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, `projects/${projectId}/indices`));
      const querySnapshot = await getDocs(q);
      const indices: any[] = [];
      querySnapshot.forEach(doc => {
        indices.push({ id: doc.id, ...doc.data() });
      });
      setData(indices);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique periods from data
  const uniquePeriods = useMemo(() => {
    const periods = new Set<string>();
    data.forEach(item => {
      if (item.period) periods.add(item.period);
    });
    return Array.from(periods).sort();
  }, [data]);

  // Filter data by period range
  const filteredData = useMemo(() => {
    if (!startPeriod && !endPeriod) return data;

    const startIdx = startPeriod ? uniquePeriods.indexOf(startPeriod) : 0;
    const endIdx = endPeriod ? uniquePeriods.indexOf(endPeriod) : uniquePeriods.length - 1;

    return data.filter(item => {
      const itemIdx = uniquePeriods.indexOf(item.period);
      return itemIdx >= startIdx && itemIdx <= endIdx;
    });
  }, [data, startPeriod, endPeriod, uniquePeriods]);

  // Calculate detailed statistics
  const detailedStats = useMemo(() => {
    const stats: Record<string, { peak: string; average: string; growth: string; volatility: string }> = {};

    Object.keys(visibleIndices).forEach(key => {
      const values = filteredData
        .map((item: any) => {
          const val = item[key];
          return typeof val === 'number' ? val : parseFloat(val);
        })
        .filter((v: number) => !isNaN(v));

      if (values.length > 0) {
        const peak = Math.max(...values);
        const average = (values.reduce((a: number, b: number) => a + b, 0) / values.length).toFixed(2);
        const growth = values.length > 1
          ? (((values[values.length - 1] - values[0]) / values[0]) * 100).toFixed(2)
          : '0.00';
        const variance =
          values.reduce((sum: number, v: number) => sum + Math.pow(v - parseFloat(average), 2), 0) /
          values.length;
        const volatility = Math.sqrt(variance).toFixed(2);

        stats[key] = {
          peak: peak.toFixed(2),
          average,
          growth,
          volatility,
        };
      }
    });

    return stats;
  }, [filteredData, visibleIndices]);

  const handleToggleIndex = (key: string) => {
    setVisibleIndices(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleAll = () => {
    const allSelected = Object.values(visibleIndices).every(v => v);
    const newState: Record<string, boolean> = {};
    Object.keys(visibleIndices).forEach(key => {
      newState[key] = !allSelected;
    });
    setVisibleIndices(newState as typeof visibleIndices);
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainerLarge}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <Text style={styles.modalTitle}>Historical Trend Analysis</Text>
              <Text style={styles.modalSubtitle}>Overlaying all key engineering indices for correlation analysis.</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome name="times" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Modal Content - Two Column Layout */}
          <View style={styles.modalContentLarge}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
              </View>
            ) : (
              <>
                {/* Left Panel - Controls */}
                <ScrollView style={styles.modalLeftPanel} showsVerticalScrollIndicator={true}>
                  {/* Time Range Section */}
                  <View style={styles.controlSection}>
                    <Text style={styles.controlSectionTitle}>TIME RANGE</Text>

                    <View style={styles.dropdownContainer}>
                      <Text style={styles.dropdownLabel}>START PERIOD</Text>
                      <ScrollView style={styles.dropdownList} nestedScrollEnabled={true}>
                        <TouchableOpacity
                          onPress={() => setStartPeriod(null)}
                          style={[styles.dropdownItem, !startPeriod && styles.dropdownItemActive]}
                        >
                          <Text style={[styles.dropdownItemText, !startPeriod && styles.dropdownItemTextActive]}>
                            All
                          </Text>
                        </TouchableOpacity>
                        {uniquePeriods.map(period => (
                          <TouchableOpacity
                            key={period}
                            onPress={() => setStartPeriod(period)}
                            style={[styles.dropdownItem, startPeriod === period && styles.dropdownItemActive]}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                startPeriod === period && styles.dropdownItemTextActive,
                              ]}
                            >
                              {period}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    <View style={styles.dropdownContainer}>
                      <Text style={styles.dropdownLabel}>END PERIOD</Text>
                      <ScrollView style={styles.dropdownList} nestedScrollEnabled={true}>
                        <TouchableOpacity
                          onPress={() => setEndPeriod(null)}
                          style={[styles.dropdownItem, !endPeriod && styles.dropdownItemActive]}
                        >
                          <Text style={[styles.dropdownItemText, !endPeriod && styles.dropdownItemTextActive]}>
                            All
                          </Text>
                        </TouchableOpacity>
                        {uniquePeriods.map(period => (
                          <TouchableOpacity
                            key={period}
                            onPress={() => setEndPeriod(period)}
                            style={[styles.dropdownItem, endPeriod === period && styles.dropdownItemActive]}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                endPeriod === period && styles.dropdownItemTextActive,
                              ]}
                            >
                              {period}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>

                  {/* Visible Datasets Section */}
                  <View style={styles.controlSection}>
                    <Text style={styles.controlSectionTitle}>VISIBLE DATASETS</Text>

                    <TouchableOpacity style={styles.toggleAllButton} onPress={toggleAll}>
                      <Text style={styles.toggleAllText}>
                        {Object.values(visibleIndices).every(v => v) ? 'Deselect All' : 'Select All'}
                      </Text>
                    </TouchableOpacity>

                    {Object.keys(visibleIndices).map(key => (
                      <View key={key} style={styles.toggleItem}>
                        <View style={styles.toggleContent}>
                          <View
                            style={[
                              styles.toggleColor,
                              { backgroundColor: INDEX_COLORS[key].color },
                            ]}
                          />
                          <Text style={styles.toggleLabel}>{INDEX_COLORS[key].name}</Text>
                        </View>
                        <Switch
                          value={visibleIndices[key]}
                          onValueChange={() => handleToggleIndex(key)}
                          trackColor={{ false: '#e5e7eb', true: '#bfdbfe' }}
                          thumbColor={visibleIndices[key] ? '#2563eb' : '#9ca3af'}
                        />
                      </View>
                    ))}
                  </View>

                  {/* Insight Card */}
                  <View style={styles.insightCard}>
                    <Text style={styles.insightTitle}>ANALYSIS INSIGHT</Text>
                    <Text style={styles.insightText}>
                      {Object.keys(visibleIndices).filter(k => visibleIndices[k]).length === 0
                        ? 'Select at least one index to view insights'
                        : 'Correlation between Steel and POL indices has increased by 12% in the last 6 months.'}
                    </Text>
                  </View>
                </ScrollView>

                {/* Right Panel - Chart */}
                <View style={styles.modalRightPanel}>
                  {/* Chart Visualization */}
                  <View style={styles.chartPlaceholder}>
                    <FontAwesome name="line-chart" size={80} color="#2563eb" />
                    <Text style={styles.chartPlaceholderText}>Price Index Trends Visualization</Text>
                    <Text style={styles.chartPlaceholderSubtext}>
                      {filteredData.length} data points | Range: {startPeriod || 'All'} to {endPeriod || 'All'}
                    </Text>
                  </View>

                  {/* Stats Bar - Bottom of Chart */}
                  <View style={styles.statsBarBottom}>
                    <View style={styles.statBottomItem}>
                      <Text style={styles.statBottomLabel}>PEAK VALUE</Text>
                      <Text style={styles.statBottomValue}>
                        {Math.max(...Object.values(detailedStats).map((stat: any) => parseFloat(stat.peak))).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.statBottomItem}>
                      <Text style={styles.statBottomLabel}>AVERAGE GROWTH</Text>
                      <Text style={styles.statBottomValue}>+1.4% / mo</Text>
                    </View>
                    <View style={styles.statBottomItem}>
                      <Text style={styles.statBottomLabel}>VOLATILITY</Text>
                      <Text style={styles.statBottomValueOrange}>Moderate</Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainerLarge: {
    width: '90%',
    maxHeight: '95%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalHeaderLeft: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '400',
  },
  modalContentLarge: {
    flexDirection: 'row',
    flex: 1,
  },
  modalLeftPanel: {
    width: '28%',
    backgroundColor: '#f9fafb',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalRightPanel: {
    width: '72%',
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'column',
  },
  controlSection: {
    marginBottom: 24,
  },
  controlSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4f46e5',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  dropdownContainer: {
    marginBottom: 12,
  },
  dropdownLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    maxHeight: 150,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemActive: {
    backgroundColor: '#eff6ff',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#4b5563',
  },
  dropdownItemTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  toggleAllButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 12,
  },
  toggleAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  toggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  insightCard: {
    backgroundColor: '#1e3a8a',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 24,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#bfdbfe',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 13,
    color: '#e0e7ff',
    lineHeight: 18,
  },
  chartPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 16,
  },
  chartPlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
  },
  chartPlaceholderSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  statsBarBottom: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'space-around',
  },
  statBottomItem: {
    alignItems: 'center',
  },
  statBottomLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 4,
  },
  statBottomValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  statBottomValueOrange: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f59e0b',
  },
});

export default AnalyticsModal;
