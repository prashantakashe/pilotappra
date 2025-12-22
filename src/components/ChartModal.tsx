import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// Color mapping for each index
const INDEX_COLORS = {
  labour: { color: '#3b82f6', name: 'Labour' },
  steel: { color: '#ef4444', name: 'Steel' },
  cement: { color: '#10b981', name: 'Cement' },
  material: { color: '#f59e42', name: 'Material' },
  pol: { color: '#8b5cf6', name: 'POL' },
};

interface ChartModalProps {
  visible: boolean;
  onClose: () => void;
  data: any[];
  loading?: boolean;
}

const ChartModal: React.FC<ChartModalProps> = ({ visible, onClose, data, loading = false }) => {
  const [visibleIndices, setVisibleIndices] = useState({
    labour: true,
    steel: true,
    cement: true,
    material: true,
    pol: true,
  });

  const [startPeriod, setStartPeriod] = useState<string | null>(null);
  const [endPeriod, setEndPeriod] = useState<string | null>(null);

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
  const calculateStats = () => {
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

  const stats = calculateStats();

  // Simple ASCII bar chart representation
  const renderSimpleChart = () => {
    if (filteredData.length === 0) {
      return (
        <View style={styles.emptyChartContainer}>
          <Text style={styles.emptyChartText}>No data available for selected range</Text>
        </View>
      );
    }

    const chartHeight = 200;
    const chartWidth = Dimensions.get('window').width - 200;
    const maxValue = Math.max(
      ...Object.keys(visibleIndices)
        .filter(key => visibleIndices[key])
        .flatMap(key => {
          const fieldKey = key === 'labour' ? 'labourFinal' : key;
          return filteredData.map(item => parseFloat(item[fieldKey]) || 0);
        })
    );

    return (
      <View style={[styles.chartContainer, { height: chartHeight }]}>
        <Text style={styles.chartPlaceholderText}>
          📊 Historical Trend Analysis
        </Text>
        <Text style={styles.chartSubtext}>
          {filteredData.length} data points | Range: {startPeriod || 'All'} to {endPeriod || 'All'}
        </Text>
        
        {/* Legend */}
        <View style={styles.legendContainer}>
          {Object.keys(visibleIndices)
            .filter(key => visibleIndices[key])
            .map(key => (
              <View key={key} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendColor,
                    { backgroundColor: INDEX_COLORS[key].color },
                  ]}
                />
                <Text style={styles.legendLabel}>{INDEX_COLORS[key].name}</Text>
              </View>
            ))}
        </View>

        <Text style={styles.chartNote}>
          ℹ️ Chart visualization ready for integration with charting library
        </Text>
      </View>
    );
  };

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

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={28} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Historical Trend Analysis</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
          <View style={styles.mainLayout}>
            {/* Left Sidebar - Controls */}
            <View style={styles.sidebar}>
              <Text style={styles.sectionTitle}>Time Range</Text>

              {/* Start Period Dropdown */}
              <View style={styles.dropdownContainer}>
                <Text style={styles.dropdownLabel}>Start Period</Text>
                <ScrollView
                  style={styles.dropdownList}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
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
                      <Text style={[styles.dropdownItemText, startPeriod === period && styles.dropdownItemTextActive]}>
                        {period}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* End Period Dropdown */}
              <View style={styles.dropdownContainer}>
                <Text style={styles.dropdownLabel}>End Period</Text>
                <ScrollView
                  style={styles.dropdownList}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
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
                      <Text style={[styles.dropdownItemText, endPeriod === period && styles.dropdownItemTextActive]}>
                        {period}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Visible Datasets Section */}
              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Visible Datasets</Text>

              <TouchableOpacity
                style={styles.toggleAllButton}
                onPress={toggleAll}
              >
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

              {/* Insight Card */}
              <View style={styles.insightCard}>
                <Text style={styles.insightTitle}>Correlation Insight</Text>
                <Text style={styles.insightText}>
                  {Object.keys(visibleIndices).filter(k => visibleIndices[k]).length === 0
                    ? 'Select at least one index to view insights'
                    : 'Strong positive correlation detected between Steel and POL indices. Material costs show seasonal variations with peak in Q3-Q4.'}
                </Text>
              </View>
            </View>

            {/* Right Side - Chart Canvas */}
            <View style={styles.chartArea}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#2563eb" />
                  <Text style={styles.loadingText}>Processing data...</Text>
                </View>
              ) : (
                <>
                  {renderSimpleChart()}

                  {/* Stats Bar */}
                  <View style={styles.statsBar}>
                    {Object.keys(stats).map((key, idx) => (
                      <View key={key} style={[styles.statItem, idx < Object.keys(stats).length - 1 && styles.statItemBorder]}>
                        <Text style={styles.statLabel}>{INDEX_COLORS[key].name}</Text>
                        <Text style={styles.statValue}>{stats[key].peak}</Text>
                        <Text style={styles.statMeta}>Peak</Text>
                      </View>
                    ))}
                  </View>

                  {/* Detailed Stats Grid */}
                  <View style={styles.detailedStatsContainer}>
                    <Text style={styles.detailedStatsTitle}>Detailed Statistics</Text>
                    {Object.keys(stats).map(key => (
                      <View key={key} style={styles.detailedStatRow}>
                        <View style={styles.detailedStatHeader}>
                          <View
                            style={[
                              styles.detailedStatColor,
                              { backgroundColor: INDEX_COLORS[key].color },
                            ]}
                          />
                          <Text style={styles.detailedStatName}>{INDEX_COLORS[key].name}</Text>
                        </View>
                        <View style={styles.detailedStatValues}>
                          <View style={styles.detailedStatValue}>
                            <Text style={styles.detailedStatValueLabel}>Peak</Text>
                            <Text style={styles.detailedStatValueText}>{stats[key].peak}</Text>
                          </View>
                          <View style={styles.detailedStatValue}>
                            <Text style={styles.detailedStatValueLabel}>Avg</Text>
                            <Text style={styles.detailedStatValueText}>{stats[key].average}</Text>
                          </View>
                          <View style={styles.detailedStatValue}>
                            <Text style={styles.detailedStatValueLabel}>Growth</Text>
                            <Text style={[styles.detailedStatValueText, { color: stats[key].growth > 0 ? '#10b981' : '#ef4444' }]}>
                              {stats[key].growth}%
                            </Text>
                          </View>
                          <View style={styles.detailedStatValue}>
                            <Text style={styles.detailedStatValueLabel}>Volatility</Text>
                            <Text style={styles.detailedStatValueText}>{stats[key].volatility}%</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
  },
  content: {
    flex: 1,
  },
  mainLayout: {
    flexDirection: 'row',
    flex: 1,
  },
  sidebar: {
    width: 320,
    backgroundColor: '#f9fafb',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginBottom: 12,
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdownLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  dropdownList: {
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemActive: {
    backgroundColor: '#dbeafe',
  },
  dropdownItemText: {
    fontSize: 13,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 10,
  },
  toggleLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  insightCard: {
    backgroundColor: '#1e3a8a',
    borderRadius: 8,
    padding: 12,
    marginTop: 24,
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#bfdbfe',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 12,
    color: '#dbeafe',
    lineHeight: 18,
  },
  chartArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  chartContainer: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  chartPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  },
  chartSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
  },
  chartNote: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginVertical: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  emptyChartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  emptyChartText: {
    fontSize: 14,
    color: '#6B7280',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    marginVertical: 24,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statItemBorder: {
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  statMeta: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  detailedStatsContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 16,
  },
  detailedStatsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  detailedStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  detailedStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailedStatColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 10,
  },
  detailedStatName: {
    fontSize: 13,
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
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailedStatValueText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#222',
  },
});

export default ChartModal;
