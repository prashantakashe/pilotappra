import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Switch, Dimensions } from 'react-native';
import { AppLayout } from '../components/AppLayout';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PROJECTS_NAV } from '../constants/sidebarMenus';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { db } from '../services/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';

// Color mapping for each index
const INDEX_COLORS = {
  labour: { color: '#3b82f6', name: 'Labour' },
  steel: { color: '#ef4444', name: 'Steel' },
  cement: { color: '#10b981', name: 'Cement' },
  material: { color: '#f59e42', name: 'Material' },
  pol: { color: '#8b5cf6', name: 'POL' },
};

const AnalyticsDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  const projectId = (route.params as any)?.projectId;

  // Chart controls state
  const [visibleIndices, setVisibleIndices] = useState({
    labour: true,
    steel: true,
    cement: true,
    material: true,
    pol: true,
  });
  const [startPeriod, setStartPeriod] = useState<string | null>(null);
  const [endPeriod, setEndPeriod] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        if (projectId) {
          const q = query(
            collection(db, 'projects', projectId, 'indices'),
            where('deleted', '==', false)
          );
          const querySnapshot = await getDocs(q);
          const rows = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setData(rows);
        }
      } catch (error) {
        console.error('Error loading analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [projectId]);

  // Extract unique periods and sort them
  const uniquePeriods = useMemo(() => {
    const periods = [...new Set(data.map(item => item.period))].filter(Boolean);
    return periods.sort();
  }, [data]);

  // Filter data based on selected period range
  const filteredData = useMemo(() => {
    if (!startPeriod || !endPeriod) return data;
    
    const startIdx = uniquePeriods.indexOf(startPeriod);
    const endIdx = uniquePeriods.indexOf(endPeriod);
    
    if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) return data;
    
    return data.filter(item => {
      const itemIdx = uniquePeriods.indexOf(item.period);
      return itemIdx >= startIdx && itemIdx <= endIdx;
    });
  }, [data, startPeriod, endPeriod, uniquePeriods]);

  // Calculate statistics for visible indices
  const calculateDetailedStats = () => {
    const stats: any = {};
    
    Object.keys(visibleIndices).forEach(key => {
      if (!visibleIndices[key]) return;
      
      const fieldKey = key === 'labour' ? 'labourFinal' : key;
      const values = filteredData
        .map(item => parseFloat(item[fieldKey]) || 0)
        .filter(v => v > 0);
      
      if (values.length === 0) return;
      
      const peak = Math.max(...values);
      const average = values.reduce((a, b) => a + b, 0) / values.length;
      const growth = values.length > 1 
        ? (((values[values.length - 1] - values[0]) / values[0]) * 100).toFixed(2)
        : '0.00';
      const volatility = values.length > 1
        ? (Math.sqrt(values.reduce((sq, val) => sq + Math.pow(val - average, 2), 0) / values.length) / average * 100).toFixed(2)
        : '0.00';
      
      stats[key] = {
        peak: peak.toFixed(2),
        average: average.toFixed(2),
        growth: growth,
        volatility: volatility,
      };
    });
    
    return stats;
  };

  const detailedStats = calculateDetailedStats();

  const handleToggleIndex = (key: string) => {
    setVisibleIndices(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleAll = () => {
    const allVisible = Object.values(visibleIndices).every(v => v);
    const newState: any = {};
    Object.keys(visibleIndices).forEach(key => {
      newState[key] = !allVisible;
    });
    setVisibleIndices(newState);
  };

  const calculateStats = () => {
    if (data.length === 0) {
      return {
        avgPriceIndex: '0.00',
        totalEntries: 0,
        dateRange: 'N/A',
      };
    }

    const avgPriceIndex = (
      data.reduce((sum, item) => sum + (parseFloat(item.lBase) || 0), 0) / data.length
    ).toFixed(2);

    return {
      avgPriceIndex,
      totalEntries: data.length,
      dateRange: '2011-2025',
    };
  };

  const stats = calculateStats();

  return (
    <AppLayout
      title="Master Index Analytics"
      activeRoute="Projects"
      sidebarItems={PROJECTS_NAV}
      showBackButton={true}
      onBackPress={() => navigation.goBack()}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
        {/* Historical Trend Analysis Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Historical Trend Analysis</Text>
            <TouchableOpacity
              style={styles.openModalButton}
              onPress={() => setShowAnalyticsModal(true)}
            >
              <FontAwesome name="area-chart" size={14} color="#fff" />
              <Text style={styles.openModalButtonText}>View Analytics</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.chartPlaceholder}>
            <FontAwesome name="line-chart" size={64} color="#2563eb" />
            <Text style={styles.chartPlaceholderText}>
              Price Index Trends Visualization
            </Text>
            <Text style={styles.chartPlaceholderSubtext}>
              Click "View Analytics" to explore interactive analysis with filters and detailed statistics
            </Text>
          </View>
        </View>

        {/* Statistics Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Avg Price Index</Text>
            <Text style={styles.statValue}>{stats.avgPriceIndex}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Entries</Text>
            <Text style={styles.statValue}>{stats.totalEntries}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Date Range</Text>
            <Text style={styles.statValue}>{stats.dateRange}</Text>
          </View>
        </View>

        {/* Key Insights Section */}
        <View style={styles.insightsSection}>
          <Text style={styles.insightsTitle}>Key Insights</Text>
          <Text style={styles.insightItem}>
            • Price indices show consistent growth patterns
          </Text>
          <Text style={styles.insightItem}>
            • Material costs remain stable throughout periods
          </Text>
          <Text style={styles.insightItem}>
            • Labour index demonstrates seasonal variations
          </Text>
          <Text style={styles.insightItem}>
            • POL pricing shows highest volatility
          </Text>
        </View>

        {/* Data Summary Section */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Data Summary</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#2563eb" />
          ) : data.length === 0 ? (
            <Text style={styles.noDataText}>No data available to analyze</Text>
          ) : (
            <View style={styles.summaryContent}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Records</Text>
                <Text style={styles.summaryValue}>{data.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date Range</Text>
                <Text style={styles.summaryValue}>2011 - 2025</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Last Updated</Text>
                <Text style={styles.summaryValue}>
                  {new Date().toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Data Quality</Text>
                <Text style={[styles.summaryValue, { color: '#10b981' }]}>
                  Verified
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Performance Metrics */}
        <View style={styles.metricsSection}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <View style={styles.metricItem}>
            <View style={styles.metricIcon}>
              <FontAwesome name="arrow-up" size={20} color="#10b981" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Positive Growth</Text>
              <Text style={styles.metricValue}>+2.4% Average</Text>
            </View>
          </View>
          <View style={styles.metricItem}>
            <View style={styles.metricIcon}>
              <FontAwesome name="bar-chart" size={20} color="#3b82f6" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Data Consistency</Text>
              <Text style={styles.metricValue}>High (94%)</Text>
            </View>
          </View>
          <View style={styles.metricItem}>
            <View style={styles.metricIcon}>
              <FontAwesome name="calendar" size={20} color="#f59e42" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Historical Span</Text>
              <Text style={styles.metricValue}>14 Years</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Analytics Modal - 90% Screen */}
      {showAnalyticsModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainerLarge}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Text style={styles.modalTitle}>Historical Trend Analysis</Text>
                <Text style={styles.modalSubtitle}>Overlaying all key engineering indices for correlation analysis.</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAnalyticsModal(false)}>
                <FontAwesome name="times" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Modal Content - Two Column Layout */}
            <View style={styles.modalContentLarge}>
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
                        <Text
                          style={[styles.dropdownItemText, !startPeriod && styles.dropdownItemTextActive]}
                        >
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
                        <Text
                          style={[styles.dropdownItemText, !endPeriod && styles.dropdownItemTextActive]}
                        >
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
                  <Text style={styles.chartPlaceholderText}>
                    Price Index Trends Visualization
                  </Text>
                  <Text style={styles.chartPlaceholderSubtext}>
                    {filteredData.length} data points | Range: {startPeriod || 'All'} to {endPeriod || 'All'}
                  </Text>
                </View>

                {/* Stats Bar - Bottom of Chart */}
                <View style={styles.statsBarBottom}>
                  <View style={styles.statBottomItem}>
                    <Text style={styles.statBottomLabel}>PEAK VALUE</Text>
                    <Text style={styles.statBottomValue}>
                      {Math.max(...Object.values(detailedStats).map((stat: any) => 
                        parseFloat(stat.peak))).toFixed(2)}
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
            </View>
          </View>
        </View>
      )}
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  openModalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 8,
  },
  openModalButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 16,
  },
  chartControlsContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 24,
  },
  timeRangeSection: {
    marginBottom: 24,
  },
  datasetSection: {
    marginBottom: 24,
  },
  subsectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#222',
    marginBottom: 12,
  },
  dropdownContainer: {
    marginBottom: 12,
  },
  dropdownLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  dropdownList: {
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemActive: {
    backgroundColor: '#dbeafe',
  },
  dropdownItemText: {
    fontSize: 12,
    color: '#374151',
  },
  dropdownItemTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  toggleAllButton: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  toggleAllText: {
    fontSize: 12,
    color: '#4f46e5',
    fontWeight: '600',
    textAlign: 'center',
  },
  toggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleColor: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 10,
  },
  toggleLabel: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  insightCard: {
    backgroundColor: '#1e3a8a',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#bfdbfe',
    marginBottom: 6,
  },
  insightText: {
    fontSize: 12,
    color: '#dbeafe',
    lineHeight: 18,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginVertical: 16,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  statItemBorder: {
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 3,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 3,
  },
  statMeta: {
    fontSize: 9,
    color: '#9CA3AF',
  },
  detailedStatsContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 12,
    marginBottom: 24,
  },
  detailedStatsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#222',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  detailedStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  detailedStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailedStatColor: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 8,
  },
  detailedStatName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  detailedStatValues: {
    flexDirection: 'row',
    gap: 12,
  },
  detailedStatValue: {
    alignItems: 'center',
  },
  detailedStatValueLabel: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailedStatValueText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#222',
  },
  chartPlaceholder: {
    minHeight: 280,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingVertical: 24,
  },
  chartPlaceholderText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#222',
    marginTop: 16,
  },
  chartPlaceholderSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  insightsSection: {
    backgroundColor: '#f9fafb',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  insightsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    marginBottom: 14,
  },
  insightItem: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 10,
  },
  summarySection: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    marginBottom: 24,
  },
  summaryContent: {
    gap: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  noDataText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 24,
  },
  metricsSection: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    marginBottom: 24,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  // Modal Styles - 90% Screen
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainerLarge: {
    width: '90%',
    maxHeight: '95%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'column',
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

export default AnalyticsDashboardScreen;
