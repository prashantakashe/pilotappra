// src/components/dailyWorkStatus/DWSReportTab.tsx
/**
 * Report Tab for Daily Work Status module
 * Generates reports with charts and export functionality
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useResponsive } from '../../hooks/useResponsive';
import { dailyWorkStatusService, getReportData } from '../../services/dailyWorkStatusService';
import type { DWSProject, DWSPersonnel, DWSStatus, DWSDailyEntry, DWSReportFilter } from '../../types/dailyWorkStatus';
import * as XLSX from 'xlsx';

type ReportType = 'daily' | 'project' | 'user' | 'status';

export const DWSReportTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Master data for filters
  const [projects, setProjects] = useState<DWSProject[]>([]);
  const [personnel, setPersonnel] = useState<DWSPersonnel[]>([]);
  const [statuses, setStatuses] = useState<DWSStatus[]>([]);
  
  // Report filters
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Report data
  const [reportData, setReportData] = useState<DWSDailyEntry[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  
  const { isMobile } = useResponsive();

  // Subscribe to master data
  useEffect(() => {
    setLoading(true);
    
    const unsubProjects = dailyWorkStatusService.subscribeToProjects(setProjects);
    const unsubPersonnel = dailyWorkStatusService.subscribeToPersonnel(setPersonnel);
    const unsubStatuses = dailyWorkStatusService.subscribeToStatuses((data) => {
      setStatuses(data);
      setLoading(false);
    });
    
    return () => {
      unsubProjects();
      unsubPersonnel();
      unsubStatuses();
    };
  }, []);

  // Generate report
  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      
      const filter: DWSReportFilter = {
        reportType,
        projectId: selectedProject || undefined,
        userId: selectedUser || undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      };
      
      const data = await getReportData(filter);
      setReportData(data);
      
      // Calculate status counts
      const counts: Record<string, number> = {};
      data.forEach(entry => {
        const status = entry.finalStatus || 'Unknown';
        counts[status] = (counts[status] || 0) + 1;
      });
      setStatusCounts(counts);
      
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setGenerating(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (reportData.length === 0) {
      Alert.alert('No Data', 'Generate a report first before exporting');
      return;
    }
    
    try {
      const wsData = reportData.map(entry => ({
        'Project': entry.projectName,
        'Date': entry.dateTime,
        'Activity': entry.mainActivity,
        'Assigned To': entry.assignedTo,
        'Hours': entry.hours,
        'Status': entry.finalStatus,
        'Status Updates': entry.statusUpdates?.map(u => u.note).join('; ') || ''
      }));
      
      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Daily Work Report');
      
      if (Platform.OS === 'web') {
        XLSX.writeFile(wb, `DWS_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
        Alert.alert('Success', 'Report exported to Excel');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to export: ' + error.message);
    }
  };

  // Export to PDF (simplified - just alert for now)
  const handleExportPDF = () => {
    if (reportData.length === 0) {
      Alert.alert('No Data', 'Generate a report first before exporting');
      return;
    }
    Alert.alert('Export PDF', 'PDF export functionality will be implemented with a PDF library.');
  };

  // Calculate chart data
  const getChartData = () => {
    const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
    return statuses.map(status => ({
      label: status.name,
      count: statusCounts[status.name] || 0,
      percentage: total > 0 ? ((statusCounts[status.name] || 0) / total * 100).toFixed(1) : 0,
      color: status.color || colors.ACTION_BLUE
    }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.ACTION_BLUE} />
        <Text style={styles.loadingText}>Loading report options...</Text>
      </View>
    );
  }

  const chartData = getChartData();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>📊 Report - Daily Work Summary</Text>
      
      {/* Filters */}
      <View style={styles.filterCard}>
        <View style={styles.filterRow}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Report Type:</Text>
            <View style={styles.chipContainer}>
              {(['daily', 'project', 'user', 'status'] as ReportType[]).map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, reportType === type && styles.chipActive]}
                  onPress={() => setReportType(type)}
                >
                  <Text style={[styles.chipText, reportType === type && styles.chipTextActive]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        
        <View style={styles.filterRow}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Project:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.chip, !selectedProject && styles.chipActive]}
                onPress={() => setSelectedProject('')}
              >
                <Text style={[styles.chipText, !selectedProject && styles.chipTextActive]}>All</Text>
              </TouchableOpacity>
              {projects.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.chip, selectedProject === p.id && styles.chipActive]}
                  onPress={() => setSelectedProject(p.id)}
                >
                  <Text style={[styles.chipText, selectedProject === p.id && styles.chipTextActive]}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
        
        <View style={styles.filterRow}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>User:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.chip, !selectedUser && styles.chipActive]}
                onPress={() => setSelectedUser('')}
              >
                <Text style={[styles.chipText, !selectedUser && styles.chipTextActive]}>All</Text>
              </TouchableOpacity>
              {personnel.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.chip, selectedUser === p.name && styles.chipActive]}
                  onPress={() => setSelectedUser(p.name)}
                >
                  <Text style={[styles.chipText, selectedUser === p.name && styles.chipTextActive]}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
        
        <View style={styles.filterRow}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Start Date:</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="Select start date"
              value={startDate}
              onChangeText={setStartDate}
              onFocus={(e) => {
                if (Platform.OS === 'web') {
                  (e.target as any).type = 'date';
                }
              }}
              {...(Platform.OS === 'web' ? { type: 'date' } as any : {})}
            />
          </View>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>End Date:</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="Select end date"
              value={endDate}
              onChangeText={setEndDate}
              onFocus={(e) => {
                if (Platform.OS === 'web') {
                  (e.target as any).type = 'date';
                }
              }}
              {...(Platform.OS === 'web' ? { type: 'date' } as any : {})}
            />
          </View>
        </View>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.generateBtn}
            onPress={handleGenerateReport}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.btnText}>Generate Report</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExportPDF}>
            <Text style={styles.btnText}>Export PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.exportBtn, styles.excelBtn]} onPress={handleExportExcel}>
            <Text style={styles.btnText}>Export Excel</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Chart (Simple Bar Chart) */}
      {reportData.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>📈 Status Distribution</Text>
          <View style={styles.chartContainer}>
            {chartData.map((item, index) => (
              <View key={index} style={styles.chartRow}>
                <Text style={styles.chartLabel}>{item.label}</Text>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        width: `${item.percentage}%` as any,
                        backgroundColor: item.color
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.chartValue}>{item.count} ({item.percentage}%)</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      {/* Report Table */}
      <View style={styles.tableCard}>
        <Text style={styles.tableTitle}>📋 Report Data ({reportData.length} entries)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { width: 150 }]}>Project</Text>
              <Text style={[styles.headerCell, { width: 120 }]}>Date</Text>
              <Text style={[styles.headerCell, { width: 200 }]}>Activity</Text>
              <Text style={[styles.headerCell, { width: 150 }]}>Status Updates</Text>
              <Text style={[styles.headerCell, { width: 80 }]}>Hours</Text>
              <Text style={[styles.headerCell, { width: 100 }]}>Status</Text>
            </View>
            {reportData.map((entry) => (
              <View key={entry.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: 150 }]}>{entry.projectName}</Text>
                <Text style={[styles.tableCell, { width: 120 }]}>{entry.dateTime}</Text>
                <Text style={[styles.tableCell, { width: 200 }]} numberOfLines={2}>{entry.mainActivity}</Text>
                <Text style={[styles.tableCell, { width: 150 }]} numberOfLines={2}>
                  {entry.statusUpdates?.map(u => u.note).join('; ') || '-'}
                </Text>
                <Text style={[styles.tableCell, { width: 80 }]}>{entry.hours}</Text>
                <View style={[styles.tableCell, { width: 100 }]}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: statuses.find(s => s.name === entry.finalStatus)?.color || '#6c757d' }
                  ]}>
                    <Text style={styles.statusBadgeText}>{entry.finalStatus}</Text>
                  </View>
                </View>
              </View>
            ))}
            {reportData.length === 0 && (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>No data. Click "Generate Report" to load data.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  loadingText: {
    marginTop: 12,
    color: colors.TEXT_SECONDARY
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.TEXT_PRIMARY,
    padding: spacing.lg
  },
  filterCard: {
    backgroundColor: '#fff',
    margin: spacing.lg,
    marginTop: 0,
    padding: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: { boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }
    })
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md
  },
  filterGroup: {
    flex: 1,
    minWidth: 150
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY,
    marginBottom: spacing.xs
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: '#E9ECEF',
    borderRadius: 16,
    marginRight: spacing.xs
  },
  chipActive: {
    backgroundColor: colors.ACTION_BLUE
  },
  chipText: {
    fontSize: 12,
    color: colors.TEXT_PRIMARY
  },
  chipTextActive: {
    color: '#fff'
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    backgroundColor: '#fff'
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md
  },
  generateBtn: {
    backgroundColor: colors.ACTION_BLUE,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    minWidth: 140,
    alignItems: 'center'
  },
  exportBtn: {
    backgroundColor: '#6c757d',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 6
  },
  excelBtn: {
    backgroundColor: '#28a745'
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },
  chartCard: {
    backgroundColor: '#fff',
    margin: spacing.lg,
    marginTop: 0,
    padding: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: { boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }
    })
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY,
    marginBottom: spacing.md
  },
  chartContainer: {
    gap: spacing.sm
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  chartLabel: {
    width: 100,
    fontSize: 13,
    color: colors.TEXT_PRIMARY
  },
  barContainer: {
    flex: 1,
    height: 24,
    backgroundColor: '#E9ECEF',
    borderRadius: 4,
    overflow: 'hidden'
  },
  bar: {
    height: '100%',
    borderRadius: 4
  },
  chartValue: {
    width: 80,
    fontSize: 12,
    color: colors.TEXT_SECONDARY,
    textAlign: 'right'
  },
  tableCard: {
    backgroundColor: '#fff',
    margin: spacing.lg,
    marginTop: 0,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }
    })
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY,
    padding: spacing.md
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.ACTION_BLUE,
    paddingVertical: spacing.md
  },
  headerCell: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
    paddingHorizontal: spacing.sm
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: spacing.sm,
    alignItems: 'center'
  },
  tableCell: {
    fontSize: 13,
    color: colors.TEXT_PRIMARY,
    paddingHorizontal: spacing.sm
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500'
  },
  emptyRow: {
    padding: spacing.xl,
    alignItems: 'center'
  },
  emptyText: {
    color: colors.TEXT_SECONDARY,
    fontStyle: 'italic'
  }
});
