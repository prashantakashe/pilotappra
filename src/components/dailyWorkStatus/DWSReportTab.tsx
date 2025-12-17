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
  ActivityIndicator,
  Modal,
  Pressable
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useResponsive } from '../../hooks/useResponsive';
import { dailyWorkStatusService, getReportData } from '../../services/dailyWorkStatusService';
import type { DWSProject, DWSPersonnel, DWSStatus, DWSDailyEntry, DWSReportFilter } from '../../types/dailyWorkStatus';
import * as XLSX from 'xlsx';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../services/firebase';

type ReportType = 'daily' | 'project' | 'user' | 'status' | 'delay' | 'workload' | 'target' | 'statusConversion' | 'contribution';

// Dropdown Component with Search
interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  width?: number | string;
}

const Dropdown: React.FC<DropdownProps> = ({ 
  options, 
  value, 
  onSelect, 
  placeholder = 'Select...', 
  width = 200
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const selectedOption = options.find(o => o.value === value);
  
  const filteredOptions = searchText
    ? options.filter(opt => opt.label.toLowerCase().includes(searchText.toLowerCase()))
    : options;
  
  return (
    <View style={[dropdownStyles.container, { width }]}>
      <TouchableOpacity 
        style={dropdownStyles.trigger}
        onPress={() => setIsOpen(true)}
      >
        <Text style={dropdownStyles.triggerText} numberOfLines={1}>
          {selectedOption?.label || placeholder}
        </Text>
        <Text style={dropdownStyles.arrow}>▼</Text>
      </TouchableOpacity>
      
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setIsOpen(false);
          setSearchText('');
        }}
      >
        <Pressable style={dropdownStyles.overlay} onPress={() => {
          setIsOpen(false);
          setSearchText('');
        }}>
          <View style={dropdownStyles.modal}>
            <Text style={dropdownStyles.modalTitle}>{placeholder}</Text>
            <TextInput
              style={dropdownStyles.searchInput}
              placeholder="Search..."
              value={searchText}
              onChangeText={setSearchText}
              autoFocus
            />
            <ScrollView style={dropdownStyles.optionsList}>
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      dropdownStyles.option,
                      value === option.value && dropdownStyles.optionSelected
                    ]}
                    onPress={() => {
                      onSelect(option.value);
                      setIsOpen(false);
                      setSearchText('');
                    }}
                  >
                    <Text style={[
                      dropdownStyles.optionText,
                      value === option.value && dropdownStyles.optionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                    {value === option.value && (
                      <Text style={dropdownStyles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={dropdownStyles.emptyState}>
                  <Text style={dropdownStyles.emptyText}>No matches found</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const dropdownStyles = StyleSheet.create({
  container: {
    position: 'relative'
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    minHeight: 40
  },
  triggerText: {
    flex: 1,
    fontSize: 14,
    color: '#374151'
  },
  arrow: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 8
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    ...Platform.select({
      web: { boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }
    })
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    marginBottom: 12
  },
  optionsList: {
    maxHeight: 300
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 6
  },
  optionSelected: {
    backgroundColor: '#EEF2FF'
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151'
  },
  optionTextSelected: {
    color: '#2563EB',
    fontWeight: '600'
  },
  checkmark: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: 'bold'
  },
  emptyState: {
    padding: 20,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF'
  }
});

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
  const [filterByDateType, setFilterByDateType] = useState<'entryDate' | 'statusUpdateDate'>('entryDate');
  
  // Report data
  const [reportData, setReportData] = useState<DWSDailyEntry[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  
  // Delay analysis specific data
  const [delayAnalysisData, setDelayAnalysisData] = useState<{
    delayedTasks: any[];
    dueTodayTasks: any[];
    upcomingTasks: any[];
  } | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  
  // Workload distribution data
  const [workloadData, setWorkloadData] = useState<{
    personnelWorkload: any[];
    totalTasks: number;
    totalHours: number;
  } | null>(null);
  
  // Target achievement data
  const [targetAchievementData, setTargetAchievementData] = useState<any[] | null>(null);
  
  // Status conversion data
  const [statusConversionData, setStatusConversionData] = useState<{
    conversions: any[];
    conversionMatrix: Record<string, Record<string, number>>;
    totalConversions: number;
  } | null>(null);
  
  // Contribution report data
  const [contributionData, setContributionData] = useState<any[] | null>(null);
  
  const { isMobile } = useResponsive();

  // Inject tooltip CSS for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.innerHTML = `
        [title] {
          position: relative;
          cursor: pointer;
        }
        [title]:hover::after {
          content: attr(title);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.85);
          color: white;
          padding: 6px 10px;
          border-radius: 4px;
          white-space: nowrap;
          font-size: 12px;
          z-index: 10000;
          pointer-events: none;
          margin-bottom: 5px;
        }
        [title]:hover::before {
          content: '';
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 5px solid transparent;
          border-top-color: rgba(0, 0, 0, 0.85);
          z-index: 10000;
          pointer-events: none;
        }
      `;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

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
      
      // Handle delay analysis separately
      if (reportType === 'delay') {
        await handleGenerateDelayAnalysis();
        return;
      }
      
      // Handle workload distribution separately
      if (reportType === 'workload') {
        await handleGenerateWorkloadDistribution();
        return;
      }
      
      // Handle target achievement separately
      if (reportType === 'target') {
        await handleGenerateTargetAchievement();
        return;
      }
      
      // Handle status conversion separately
      if (reportType === 'statusConversion') {
        await handleGenerateStatusConversion();
        return;
      }
      
      // Handle contribution report separately
      if (reportType === 'contribution') {
        await handleGenerateContribution();
        return;
      }
      
      const filter: DWSReportFilter = {
        reportType,
        projectId: selectedProject || undefined,
        userId: selectedUser || undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        filterBy: filterByDateType
      };
      
      const data = await getReportData(filter);
      setReportData(data);
      setDelayAnalysisData(null); // Clear delay analysis data
      
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

  // Generate Delay Analysis Report
  const handleGenerateDelayAnalysis = async () => {
    try {
      const entries = await dailyWorkStatusService.getAllEntries();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const delayedTasks: any[] = [];
      const dueTodayTasks: any[] = [];
      const upcomingTasks: any[] = [];
      
      entries.forEach(entry => {
        if (!entry.targetDate) return;
        
        const targetDate = new Date(entry.targetDate);
        targetDate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const pendingSinceDays = Math.abs(daysDiff);
        
        const taskData = {
          ...entry,
          daysDiff,
          pendingSinceDays,
          targetDateFormatted: targetDate.toLocaleDateString('en-IN')
        };
        
        if (daysDiff < 0 && entry.finalStatus !== 'Completed') {
          delayedTasks.push(taskData);
        } else if (daysDiff === 0 && entry.finalStatus !== 'Completed') {
          dueTodayTasks.push(taskData);
        } else if (daysDiff > 0 && daysDiff <= 7 && entry.finalStatus !== 'Completed') {
          upcomingTasks.push(taskData);
        }
      });
      
      delayedTasks.sort((a, b) => a.daysDiff - b.daysDiff);
      upcomingTasks.sort((a, b) => a.daysDiff - b.daysDiff);
      
      setDelayAnalysisData({ delayedTasks, dueTodayTasks, upcomingTasks });
      setReportData([]); // Clear regular report data
      setStatusCounts({});
      
    } catch (error: any) {
      Alert.alert('Error', 'Failed to generate delay analysis: ' + error.message);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (reportType === 'delay' && delayAnalysisData) {
      exportDelayAnalysisExcel();
      return;
    }
    
    if (reportType === 'workload' && workloadData) {
      exportWorkloadDistributionExcel();
      return;
    }
    
    if (reportType === 'target' && targetAchievementData) {
      exportTargetAchievementExcel();
      return;
    }
    
    if (reportType === 'statusConversion' && statusConversionData) {
      exportStatusConversionExcel();
      return;
    }
    
    if (reportType === 'contribution' && contributionData) {
      exportContributionExcel();
      return;
    }
    
    if (reportData.length === 0) {
      Alert.alert('No Data', 'Generate a report first before exporting');
      return;
    }
    
    try {
      // Create header rows
      const reportTitle = [['Daily Work Status Report']];
      const reportInfo = [[
        `Report Type: ${reportType}`,
        `Date Range: ${startDate || 'All'} to ${endDate || 'All'}`,
        `Generated: ${new Date().toLocaleString()}`
      ]];
      const emptyRow = [[]];
      
      // Create data rows
      const wsData = reportData.map(entry => ({
        'Project': entry.projectName,
        'Date & Time': entry.dateTime,
        'Main Activity': entry.mainActivity,
        'Assigned To': entry.assignedTo,
        'Hours': entry.hours,
        'Final Status': entry.finalStatus,
        'Status Updates': entry.statusUpdates?.map(u => u.note).join('; ') || '',
        'Sub Activities': entry.subActivities?.length || 0
      }));
      
      // Create summary row
      const totalHours = reportData.reduce((sum, entry) => sum + (entry.hours || 0), 0);
      const summaryRow = [[
        'Total Entries:', reportData.length,
        'Total Hours:', totalHours,
        'Completed:', reportData.filter(e => e.finalStatus === 'Completed').length
      ]];
      
      // Build worksheet from arrays
      const ws = XLSX.utils.aoa_to_sheet(reportTitle);
      XLSX.utils.sheet_add_aoa(ws, reportInfo, { origin: 'A2' });
      XLSX.utils.sheet_add_aoa(ws, emptyRow, { origin: 'A3' });
      XLSX.utils.sheet_add_json(ws, wsData, { origin: 'A5', skipHeader: false });
      XLSX.utils.sheet_add_aoa(ws, emptyRow, { origin: `A${6 + wsData.length}` });
      XLSX.utils.sheet_add_aoa(ws, summaryRow, { origin: `A${7 + wsData.length}` });
      
      // Set column widths
      ws['!cols'] = [
        { wch: 20 }, // Project
        { wch: 18 }, // Date & Time
        { wch: 30 }, // Main Activity
        { wch: 15 }, // Assigned To
        { wch: 8 },  // Hours
        { wch: 12 }, // Final Status
        { wch: 40 }, // Status Updates
        { wch: 12 }  // Sub Activities
      ];
      
      // Create workbook and add worksheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Daily Work Report');
      
      if (Platform.OS === 'web') {
        XLSX.writeFile(wb, `DWS_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
        Alert.alert('Success', 'Report exported to Excel successfully!');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to export: ' + error.message);
    }
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (reportType === 'delay' && delayAnalysisData) {
      exportDelayAnalysisPDF();
      return;
    }
    
    if (reportType === 'workload' && workloadData) {
      exportWorkloadDistributionPDF();
      return;
    }
    
    if (reportType === 'target' && targetAchievementData) {
      exportTargetAchievementPDF();
      return;
    }
    
    if (reportType === 'statusConversion' && statusConversionData) {
      exportStatusConversionPDF();
      return;
    }
    
    if (reportType === 'contribution' && contributionData) {
      exportContributionPDF();
      return;
    }
    
    if (reportData.length === 0) {
      Alert.alert('No Data', 'Generate a report first before exporting');
      return;
    }
    
    try {
      if (Platform.OS === 'web') {
        // Calculate summary statistics
        const totalHours = reportData.reduce((sum, entry) => sum + (entry.hours || 0), 0);
        const completedCount = reportData.filter(e => e.finalStatus === 'Completed').length;
        const ongoingCount = reportData.filter(e => e.finalStatus === 'Ongoing').length;
        const notStartedCount = reportData.filter(e => e.finalStatus === 'Not Started').length;
        
        // Create HTML content for PDF
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Daily Work Status Report</title>
            <style>
              @page {
                size: A4 landscape;
                margin: 15mm;
              }
              body {
                font-family: Arial, sans-serif;
                font-size: 11px;
                line-height: 1.4;
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
                border-bottom: 2px solid #333;
                padding-bottom: 10px;
              }
              .header h1 {
                margin: 0;
                color: #2563EB;
                font-size: 20px;
              }
              .report-info {
                margin: 10px 0;
                font-size: 10px;
                color: #666;
              }
              .summary-box {
                background: #F3F4F6;
                padding: 10px;
                margin: 15px 0;
                border-radius: 5px;
                display: flex;
                justify-content: space-around;
              }
              .summary-item {
                text-align: center;
              }
              .summary-item .label {
                font-size: 9px;
                color: #666;
              }
              .summary-item .value {
                font-size: 16px;
                font-weight: bold;
                color: #2563EB;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
              }
              th {
                background: #2563EB;
                color: white;
                padding: 8px;
                text-align: left;
                font-size: 10px;
                font-weight: 600;
              }
              td {
                padding: 6px 8px;
                border-bottom: 1px solid #E5E7EB;
                font-size: 9px;
              }
              tr:nth-child(even) {
                background: #F9FAFB;
              }
              .status-badge {
                padding: 2px 8px;
                border-radius: 3px;
                font-size: 8px;
                font-weight: 600;
                display: inline-block;
              }
              .status-completed { background: #D1FAE5; color: #065F46; }
              .status-ongoing { background: #FEF3C7; color: #92400E; }
              .status-not-started { background: #FEE2E2; color: #991B1B; }
              .footer {
                margin-top: 20px;
                padding-top: 10px;
                border-top: 1px solid #E5E7EB;
                text-align: center;
                font-size: 9px;
                color: #666;
              }
              @media print {
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>📊 Daily Work Status Report</h1>
              <div class="report-info">
                <strong>Report Type:</strong> ${reportType.toUpperCase()} |
                <strong>Date Range:</strong> ${startDate || 'All'} to ${endDate || 'All'} |
                <strong>Generated:</strong> ${new Date().toLocaleString()}
              </div>
            </div>
            
            <div class="summary-box">
              <div class="summary-item">
                <div class="label">Total Entries</div>
                <div class="value">${reportData.length}</div>
              </div>
              <div class="summary-item">
                <div class="label">Total Hours</div>
                <div class="value">${totalHours.toFixed(1)}</div>
              </div>
              <div class="summary-item">
                <div class="label">Completed</div>
                <div class="value" style="color: #059669;">${completedCount}</div>
              </div>
              <div class="summary-item">
                <div class="label">Ongoing</div>
                <div class="value" style="color: #D97706;">${ongoingCount}</div>
              </div>
              <div class="summary-item">
                <div class="label">Not Started</div>
                <div class="value" style="color: #DC2626;">${notStartedCount}</div>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th style="width: 15%;">Project</th>
                  <th style="width: 12%;">Date & Time</th>
                  <th style="width: 25%;">Main Activity</th>
                  <th style="width: 10%;">Assigned To</th>
                  <th style="width: 6%;">Hours</th>
                  <th style="width: 10%;">Status</th>
                  <th style="width: 22%;">Status Updates</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.map(entry => `
                  <tr>
                    <td>${entry.projectName || '-'}</td>
                    <td>${entry.dateTime || '-'}</td>
                    <td>${entry.mainActivity || '-'}</td>
                    <td>${entry.assignedTo || '-'}</td>
                    <td>${entry.hours || 0}</td>
                    <td>
                      <span class="status-badge status-${(entry.finalStatus || '').toLowerCase().replace(' ', '-')}">
                        ${entry.finalStatus || '-'}
                      </span>
                    </td>
                    <td style="font-size: 8px;">${entry.statusUpdates?.map(u => u.note).join('; ') || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="footer">
              <p><strong>Daily Work Status Management System</strong></p>
              <p>Report generated on ${new Date().toLocaleString()} | Page 1 of 1</p>
              <p style="margin-top: 5px; font-size: 8px;">© ${new Date().getFullYear()} - Confidential & Proprietary</p>
            </div>
          </body>
          </html>
        `;
        
        // Open print dialog
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();
          
          // Wait for content to load then print
          setTimeout(() => {
            printWindow.print();
          }, 250);
        }
      } else {
        Alert.alert('Info', 'PDF export is only available on web platform');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to export PDF: ' + error.message);
    }
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

  // Export Delay Analysis to Excel
  const exportDelayAnalysisExcel = () => {
    if (!delayAnalysisData) return;
    
    try {
      const { delayedTasks, dueTodayTasks, upcomingTasks } = delayAnalysisData;
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Summary sheet
      const summaryData = [
        ['Delay Analysis Report'],
        ['Generated:', new Date().toLocaleString()],
        [],
        ['Summary'],
        ['Overdue Tasks:', delayedTasks.length],
        ['Due Today:', dueTodayTasks.length],
        ['Upcoming (Next 7 Days):', upcomingTasks.length],
        ['Total:', delayedTasks.length + dueTodayTasks.length + upcomingTasks.length]
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
      
      // Overdue Tasks sheet
      if (delayedTasks.length > 0) {
        const overdueData = delayedTasks.map(task => ({
          'Project': task.projectName,
          'Activity': task.mainActivity,
          'Assigned To': task.assignedTo,
          'Target Date': task.targetDateFormatted,
          'Delay (Days)': task.pendingSinceDays,
          'Status': task.finalStatus,
          'Hours': task.hours,
          'Sub Activities': task.subActivities?.length || 0,
          'Last Update': task.statusUpdates?.[task.statusUpdates.length - 1]?.note || 'No updates'
        }));
        const wsOverdue = XLSX.utils.json_to_sheet(overdueData);
        XLSX.utils.book_append_sheet(wb, wsOverdue, 'Overdue Tasks');
      }
      
      // Due Today sheet
      if (dueTodayTasks.length > 0) {
        const dueTodayData = dueTodayTasks.map(task => ({
          'Project': task.projectName,
          'Activity': task.mainActivity,
          'Assigned To': task.assignedTo,
          'Target Date': task.targetDateFormatted,
          'Status': task.finalStatus,
          'Hours': task.hours,
          'Sub Activities': task.subActivities?.length || 0
        }));
        const wsDueToday = XLSX.utils.json_to_sheet(dueTodayData);
        XLSX.utils.book_append_sheet(wb, wsDueToday, 'Due Today');
      }
      
      // Upcoming Tasks sheet
      if (upcomingTasks.length > 0) {
        const upcomingData = upcomingTasks.map(task => ({
          'Project': task.projectName,
          'Activity': task.mainActivity,
          'Assigned To': task.assignedTo,
          'Target Date': task.targetDateFormatted,
          'Days Left': task.daysDiff,
          'Status': task.finalStatus,
          'Hours': task.hours
        }));
        const wsUpcoming = XLSX.utils.json_to_sheet(upcomingData);
        XLSX.utils.book_append_sheet(wb, wsUpcoming, 'Upcoming Tasks');
      }
      
      if (Platform.OS === 'web') {
        XLSX.writeFile(wb, `Delay_Analysis_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
        Alert.alert('Success', 'Delay Analysis Report exported to Excel successfully!');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to export: ' + error.message);
    }
  };

  // Export Delay Analysis to PDF
  const exportDelayAnalysisPDF = () => {
    if (!delayAnalysisData) return;
    
    try {
      if (Platform.OS === 'web') {
        const { delayedTasks, dueTodayTasks, upcomingTasks } = delayAnalysisData;
        
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Delay Analysis Report</title>
            <style>
              @page { size: A4 landscape; margin: 15mm; }
              body { font-family: Arial, sans-serif; font-size: 10px; }
              .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #dc3545; padding-bottom: 10px; }
              .header h1 { margin: 0; color: #dc3545; font-size: 22px; }
              .summary-box { background: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 5px; display: flex; justify-content: space-around; }
              .summary-item { text-align: center; }
              .summary-item .label { font-size: 9px; color: #666; }
              .summary-item .value { font-size: 18px; font-weight: bold; }
              .section-title { background: #dc3545; color: white; padding: 8px; margin-top: 20px; font-size: 12px; font-weight: bold; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              th { background: #343a40; color: white; padding: 6px; text-align: left; font-size: 9px; }
              td { padding: 5px 6px; border-bottom: 1px solid #dee2e6; font-size: 8px; }
              tr:nth-child(even) { background: #f8f9fa; }
              .delay-badge { background: #dc3545; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold; }
              .footer { margin-top: 30px; border-top: 1px solid #dee2e6; padding-top: 10px; text-align: center; font-size: 8px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>⚠️ Delay Analysis Report</h1>
              <p style="margin: 5px 0; font-size: 11px;">${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            
            <div class="summary-box">
              <div class="summary-item">
                <div class="label">Overdue Tasks</div>
                <div class="value" style="color: #dc3545;">${delayedTasks.length}</div>
              </div>
              <div class="summary-item">
                <div class="label">Due Today</div>
                <div class="value" style="color: #ffc107;">${dueTodayTasks.length}</div>
              </div>
              <div class="summary-item">
                <div class="label">Upcoming (7 Days)</div>
                <div class="value" style="color: #28a745;">${upcomingTasks.length}</div>
              </div>
            </div>
            
            ${delayedTasks.length > 0 ? `
              <div class="section-title">🔴 OVERDUE TASKS (${delayedTasks.length})</div>
              <table>
                <thead>
                  <tr>
                    <th style="width: 15%;">Project</th>
                    <th style="width: 25%;">Activity</th>
                    <th style="width: 12%;">Assigned To</th>
                    <th style="width: 10%;">Target Date</th>
                    <th style="width: 8%;">Delay</th>
                    <th style="width: 10%;">Status</th>
                    <th style="width: 20%;">Last Update</th>
                  </tr>
                </thead>
                <tbody>
                  ${delayedTasks.map(task => `
                    <tr>
                      <td>${task.projectName || '-'}</td>
                      <td><strong>${task.mainActivity || '-'}</strong></td>
                      <td>${task.assignedTo || '-'}</td>
                      <td>${task.targetDateFormatted}</td>
                      <td><span class="delay-badge">${task.pendingSinceDays} days</span></td>
                      <td>${task.finalStatus || '-'}</td>
                      <td style="font-size: 7px;">${task.statusUpdates?.[task.statusUpdates.length - 1]?.note?.substring(0, 60) || 'No updates'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : ''}
            
            ${dueTodayTasks.length > 0 ? `
              <div class="section-title" style="background: #ffc107; color: #000;">🟡 DUE TODAY (${dueTodayTasks.length})</div>
              <table>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Activity</th>
                    <th>Assigned To</th>
                    <th>Status</th>
                    <th>Hours</th>
                  </tr>
                </thead>
                <tbody>
                  ${dueTodayTasks.map(task => `
                    <tr>
                      <td>${task.projectName || '-'}</td>
                      <td><strong>${task.mainActivity || '-'}</strong></td>
                      <td>${task.assignedTo || '-'}</td>
                      <td>${task.finalStatus || '-'}</td>
                      <td>${task.hours || 0}h</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : ''}
            
            ${upcomingTasks.length > 0 ? `
              <div class="section-title" style="background: #28a745;">🟢 UPCOMING (Next 7 Days) - ${upcomingTasks.length} Tasks</div>
              <table>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Activity</th>
                    <th>Assigned To</th>
                    <th>Target Date</th>
                    <th>Days Left</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${upcomingTasks.map(task => `
                    <tr>
                      <td>${task.projectName || '-'}</td>
                      <td>${task.mainActivity || '-'}</td>
                      <td>${task.assignedTo || '-'}</td>
                      <td>${task.targetDateFormatted}</td>
                      <td style="font-weight: bold; color: #28a745;">${task.daysDiff} days</td>
                      <td>${task.finalStatus || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : ''}
            
            <div class="footer">
              <p><strong>Daily Work Status - Delay Analysis Report</strong></p>
              <p>Generated on ${new Date().toLocaleString()} | © ${new Date().getFullYear()}</p>
            </div>
          </body>
          </html>
        `;
        
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => printWindow.print(), 250);
        }
      } else {
        Alert.alert('Info', 'PDF export is only available on web platform');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to export PDF: ' + error.message);
    }
  };

  // Export Workload Distribution to Excel
  const exportWorkloadDistributionExcel = () => {
    if (!workloadData || !workloadData.personnelWorkload || workloadData.personnelWorkload.length === 0) return;
    
    try {
      const workbook = XLSX.utils.book_new();
      
      // Summary Sheet
      const summaryData = [
        ['WORKLOAD DISTRIBUTION REPORT'],
        ['Generated on:', new Date().toLocaleString()],
        [''],
        ['SUMMARY'],
        ['Total Personnel', workloadData.length],
        ['Total Tasks', workloadData.reduce((sum, p) => sum + p.totalTasks, 0)],
        ['Total Hours', workloadData.reduce((sum, p) => sum + p.totalHours, 0)],
        ['Completed Tasks', workloadData.reduce((sum, p) => sum + p.completedTasks, 0)],
        ['Ongoing Tasks', workloadData.reduce((sum, p) => sum + p.ongoingTasks, 0)],
        ['Not Started Tasks', workloadData.reduce((sum, p) => sum + p.notStartedTasks, 0)],
        ['Overdue Tasks', workloadData.reduce((sum, p) => sum + p.overdueTasks, 0)],
        [''],
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWs, 'Summary');
      
      // Personnel Details Sheet
      const personnelData = [
        ['Personnel Name', 'Total Tasks', 'Total Hours', 'Completed', 'Ongoing', 'Not Started', 'Overdue', 'Upcoming Deadlines', 'Top Projects']
      ];
      
      workloadData.personnelWorkload.forEach(person => {
        const topProjects = Object.entries(person.tasksByProject || {})
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 3)
          .map(([project, count]) => `${project} (${count})`)
          .join(', ');
        
        personnelData.push([
          person.name,
          person.totalTasks,
          person.totalHours,
          person.completedTasks,
          person.ongoingTasks,
          person.notStartedTasks,
          person.overdueTasks,
          person.upcomingDeadlines,
          topProjects
        ]);
      });
      
      const personnelWs = XLSX.utils.aoa_to_sheet(personnelData);
      XLSX.utils.book_append_sheet(workbook, personnelWs, 'Personnel Details');
      
      // Recent Activities Sheet
      const activitiesData = [['Personnel', 'Activity', 'Project', 'Date']];
      
      workloadData.personnelWorkload.forEach(person => {
        (person.recentActivities || []).forEach(activity => {
          activitiesData.push([
            person.name,
            activity.activity,
            activity.project,
            activity.date
          ]);
        });
      });
      
      const activitiesWs = XLSX.utils.aoa_to_sheet(activitiesData);
      XLSX.utils.book_append_sheet(workbook, activitiesWs, 'Recent Activities');
      
      // Write file
      if (Platform.OS === 'web') {
        XLSX.writeFile(workbook, `Workload_Distribution_${new Date().toISOString().split('T')[0]}.xlsx`);
        Alert.alert('Success', 'Workload Distribution exported to Excel successfully');
      } else {
        Alert.alert('Info', 'Excel export is only available on web platform');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to export: ' + error.message);
    }
  };

  // Export Workload Distribution to PDF
  const exportWorkloadDistributionPDF = () => {
    if (!workloadData || !workloadData.personnelWorkload || workloadData.personnelWorkload.length === 0) return;
    
    try {
      if (Platform.OS === 'web') {
        const totalTasks = workloadData.totalTasks;
        const totalHours = workloadData.totalHours;
        const completedTasks = workloadData.personnelWorkload.reduce((sum, p) => sum + (p.completedTasks || 0), 0);
        const overdueTasks = workloadData.personnelWorkload.reduce((sum, p) => sum + (p.overdueTasks || 0), 0);
        
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Workload Distribution Report</title>
            <style>
              @page { size: A4 landscape; margin: 15mm; }
              body { font-family: Arial, sans-serif; font-size: 10px; }
              .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #007bff; padding-bottom: 10px; }
              .header h1 { margin: 0; color: #007bff; font-size: 22px; }
              .summary-box { background: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 5px; display: flex; justify-content: space-around; }
              .summary-item { text-align: center; }
              .summary-item .label { font-size: 9px; color: #666; }
              .summary-item .value { font-size: 18px; font-weight: bold; }
              .section-title { background: #007bff; color: white; padding: 8px; margin-top: 20px; font-size: 12px; font-weight: bold; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              th { background: #343a40; color: white; padding: 6px; text-align: left; font-size: 9px; }
              td { padding: 5px 6px; border-bottom: 1px solid #dee2e6; font-size: 8px; }
              tr:nth-child(even) { background: #f8f9fa; }
              .overdue { color: #dc3545; font-weight: bold; }
              .footer { margin-top: 20px; text-align: center; font-size: 8px; color: #666; border-top: 1px solid #dee2e6; padding-top: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>👥 WORKLOAD DISTRIBUTION REPORT</h1>
              <div style="font-size: 10px; color: #666;">Generated on ${new Date().toLocaleString()}</div>
            </div>
            
            <div class="summary-box">
              <div class="summary-item">
                <div class="label">Total Personnel</div>
                <div class="value">${workloadData.length}</div>
              </div>
              <div class="summary-item">
                <div class="label">Total Tasks</div>
                <div class="value">${totalTasks}</div>
              </div>
              <div class="summary-item">
                <div class="label">Total Hours</div>
                <div class="value">${totalHours}h</div>
              </div>
              <div class="summary-item">
                <div class="label">Completed</div>
                <div class="value" style="color: #28a745;">${completedTasks}</div>
              </div>
              <div class="summary-item">
                <div class="label">Overdue</div>
                <div class="value" style="color: #dc3545;">${overdueTasks}</div>
              </div>
            </div>
            
            <div class="section-title">👥 PERSONNEL WORKLOAD BREAKDOWN</div>
            <table>
              <thead>
                <tr>
                  <th>Personnel</th>
                  <th>Total Tasks</th>
                  <th>Hours</th>
                  <th>Completed</th>
                  <th>Ongoing</th>
                  <th>Not Started</th>
                  <th>Overdue</th>
                  <th>Upcoming</th>
                  <th>Top Projects</th>
                </tr>
              </thead>
              <tbody>
                ${workloadData.map(person => {
                  const topProjects = Object.entries(person.tasksByProject)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 2)
                    .map(([project, count]) => `${project} (${count})`)
                    .join(', ');
                  
                  return `
                    <tr>
                      <td><strong>${person.name}</strong></td>
                      <td>${person.totalTasks}</td>
                      <td>${person.totalHours}h</td>
                      <td style="color: #28a745;">${person.completedTasks}</td>
                      <td style="color: #ffc107;">${person.ongoingTasks}</td>
                      <td>${person.notStartedTasks}</td>
                      <td class="overdue">${person.overdueTasks}</td>
                      <td style="color: #17a2b8;">${person.upcomingDeadlines}</td>
                      <td style="font-size: 7px;">${topProjects}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            
            <div class="footer">
              App Pilot - Daily Work Status System | Workload Distribution Report
            </div>
          </body>
          </html>
        `;
        
        const printWindow = window.open('', '', 'width=1200,height=800');
        if (!printWindow) {
          Alert.alert('Error', 'Please allow popups for this website');
          return;
        }
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 250);
      } else {
        Alert.alert('Info', 'PDF export is only available on web platform');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to export PDF: ' + error.message);
    }
  };

  // Export Target Achievement to Excel
  const exportTargetAchievementExcel = () => {
    if (!targetAchievementData || targetAchievementData.length === 0) return;
    
    try {
      const workbook = XLSX.utils.book_new();
      
      // Summary Sheet
      const totalTasks = targetAchievementData.reduce((sum, p) => sum + p.totalTasks, 0);
      const completedTasks = targetAchievementData.reduce((sum, p) => sum + p.completedTasks, 0);
      const overallRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      const summaryData = [
        ['TARGET ACHIEVEMENT REPORT'],
        ['Generated on:', new Date().toLocaleString()],
        [''],
        ['OVERALL SUMMARY'],
        ['Total Projects', targetAchievementData.length],
        ['Total Tasks', totalTasks],
        ['Completed Tasks', completedTasks],
        ['Overall Achievement Rate', `${overallRate}%`],
        ['']
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWs, 'Summary');
      
      // Project Details Sheet
      const projectData = [
        ['Project Name', 'Total Tasks', 'Completed', 'Ongoing', 'Not Started', 'Total Hours', 'Completed Hours', 'Achievement Rate', 'Tasks with Target', 'On Target', 'Delayed']
      ];
      
      targetAchievementData.forEach(project => {
        projectData.push([
          project.name,
          project.totalTasks,
          project.completedTasks,
          project.ongoingTasks,
          project.notStartedTasks,
          project.totalHours,
          project.completedHours,
          `${project.achievementRate}%`,
          project.tasksWithTarget,
          project.tasksOnTarget,
          project.tasksDelayed
        ]);
      });
      
      const projectWs = XLSX.utils.aoa_to_sheet(projectData);
      XLSX.utils.book_append_sheet(workbook, projectWs, 'Project Details');
      
      if (Platform.OS === 'web') {
        XLSX.writeFile(workbook, `Target_Achievement_${new Date().toISOString().split('T')[0]}.xlsx`);
        Alert.alert('Success', 'Target Achievement report exported to Excel successfully');
      } else {
        Alert.alert('Info', 'Excel export is only available on web platform');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to export: ' + error.message);
    }
  };

  // Export Target Achievement to PDF
  const exportTargetAchievementPDF = () => {
    if (!targetAchievementData || targetAchievementData.length === 0) return;
    
    try {
      if (Platform.OS === 'web') {
        const totalTasks = targetAchievementData.reduce((sum, p) => sum + p.totalTasks, 0);
        const completedTasks = targetAchievementData.reduce((sum, p) => sum + p.completedTasks, 0);
        const overallRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Target Achievement Report</title>
            <style>
              @page { size: A4 landscape; margin: 15mm; }
              body { font-family: Arial, sans-serif; font-size: 10px; }
              .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #28a745; padding-bottom: 10px; }
              .header h1 { margin: 0; color: #28a745; font-size: 22px; }
              .summary-box { background: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 5px; display: flex; justify-content: space-around; }
              .summary-item { text-align: center; }
              .summary-item .label { font-size: 9px; color: #666; }
              .summary-item .value { font-size: 18px; font-weight: bold; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              th { background: #343a40; color: white; padding: 6px; text-align: left; font-size: 9px; }
              td { padding: 5px 6px; border-bottom: 1px solid #dee2e6; font-size: 8px; }
              tr:nth-child(even) { background: #f8f9fa; }
              .high-rate { color: #28a745; font-weight: bold; }
              .low-rate { color: #dc3545; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎯 TARGET ACHIEVEMENT REPORT</h1>
              <div style="font-size: 10px; color: #666;">Generated on ${new Date().toLocaleString()}</div>
            </div>
            
            <div class="summary-box">
              <div class="summary-item">
                <div class="label">Total Projects</div>
                <div class="value">${targetAchievementData.length}</div>
              </div>
              <div class="summary-item">
                <div class="label">Total Tasks</div>
                <div class="value">${totalTasks}</div>
              </div>
              <div class="summary-item">
                <div class="label">Completed</div>
                <div class="value" style="color: #28a745;">${completedTasks}</div>
              </div>
              <div class="summary-item">
                <div class="label">Overall Achievement</div>
                <div class="value" style="color: #007bff;">${overallRate}%</div>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Total</th>
                  <th>Completed</th>
                  <th>Ongoing</th>
                  <th>Not Started</th>
                  <th>Hours</th>
                  <th>Achievement</th>
                  <th>With Target</th>
                  <th>On Target</th>
                  <th>Delayed</th>
                </tr>
              </thead>
              <tbody>
                ${targetAchievementData.map(project => `
                  <tr>
                    <td><strong>${project.name}</strong></td>
                    <td>${project.totalTasks}</td>
                    <td style="color: #28a745;">${project.completedTasks}</td>
                    <td style="color: #ffc107;">${project.ongoingTasks}</td>
                    <td>${project.notStartedTasks}</td>
                    <td>${project.totalHours}h</td>
                    <td class="${project.achievementRate >= 70 ? 'high-rate' : project.achievementRate < 40 ? 'low-rate' : ''}">${project.achievementRate}%</td>
                    <td>${project.tasksWithTarget}</td>
                    <td style="color: #28a745;">${project.tasksOnTarget}</td>
                    <td style="color: #dc3545;">${project.tasksDelayed}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
          </html>
        `;
        
        const printWindow = window.open('', '', 'width=1200,height=800');
        if (!printWindow) {
          Alert.alert('Error', 'Please allow popups for this website');
          return;
        }
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 250);
      } else {
        Alert.alert('Info', 'PDF export is only available on web platform');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to export PDF: ' + error.message);
    }
  };

  // Export Status Conversion to Excel
  const exportStatusConversionExcel = () => {
    if (!statusConversionData) return;
    
    try {
      const workbook = XLSX.utils.book_new();
      
      // Summary Sheet
      const summaryData = [
        ['STATUS CONVERSION REPORT'],
        ['Generated on:', new Date().toLocaleString()],
        [''],
        ['SUMMARY'],
        ['Total Conversions', statusConversionData.totalConversions],
        ['Recent Conversions Shown', statusConversionData.conversions.length],
        ['']
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWs, 'Summary');
      
      // Conversion Matrix Sheet
      const matrixData = [['FROM \\ TO', ...Object.keys(statusConversionData.conversionMatrix)]];
      Object.entries(statusConversionData.conversionMatrix).forEach(([fromStatus, toStatuses]) => {
        const row = [fromStatus];
        Object.keys(statusConversionData.conversionMatrix).forEach(toStatus => {
          row.push((toStatuses as any)[toStatus] || 0);
        });
        matrixData.push(row);
      });
      
      const matrixWs = XLSX.utils.aoa_to_sheet(matrixData);
      XLSX.utils.book_append_sheet(workbook, matrixWs, 'Conversion Matrix');
      
      // Recent Conversions Sheet
      const conversionsData = [['Project', 'Activity', 'Assigned To', 'From Status', 'To Status', 'Date', 'Hours']];
      statusConversionData.conversions.forEach(conv => {
        conversionsData.push([
          conv.projectName,
          conv.activity,
          conv.assignedTo,
          conv.fromStatus,
          conv.toStatus,
          conv.date,
          conv.hours
        ]);
      });
      
      const conversionsWs = XLSX.utils.aoa_to_sheet(conversionsData);
      XLSX.utils.book_append_sheet(workbook, conversionsWs, 'Recent Conversions');
      
      if (Platform.OS === 'web') {
        XLSX.writeFile(workbook, `Status_Conversion_${new Date().toISOString().split('T')[0]}.xlsx`);
        Alert.alert('Success', 'Status Conversion report exported to Excel successfully');
      } else {
        Alert.alert('Info', 'Excel export is only available on web platform');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to export: ' + error.message);
    }
  };

  // Export Status Conversion to PDF
  const exportStatusConversionPDF = () => {
    if (!statusConversionData) return;
    
    try {
      if (Platform.OS === 'web') {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Status Conversion Report</title>
            <style>
              @page { size: A4 landscape; margin: 15mm; }
              body { font-family: Arial, sans-serif; font-size: 10px; }
              .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #6c757d; padding-bottom: 10px; }
              .header h1 { margin: 0; color: #6c757d; font-size: 22px; }
              .summary-box { background: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 5px; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              th { background: #343a40; color: white; padding: 6px; text-align: left; font-size: 9px; }
              td { padding: 5px 6px; border-bottom: 1px solid #dee2e6; font-size: 8px; }
              tr:nth-child(even) { background: #f8f9fa; }
              .matrix-table td, .matrix-table th { text-align: center; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🔄 STATUS CONVERSION REPORT</h1>
              <div style="font-size: 10px; color: #666;">Generated on ${new Date().toLocaleString()}</div>
            </div>
            
            <div class="summary-box">
              <div style="font-size: 14px; font-weight: bold;">Total Status Conversions: ${statusConversionData.totalConversions}</div>
              <div style="font-size: 10px; color: #666; margin-top: 5px;">Showing last ${statusConversionData.conversions.length} conversions</div>
            </div>
            
            <h3>Conversion Matrix</h3>
            <table class="matrix-table">
              <thead>
                <tr>
                  <th>FROM \\ TO</th>
                  ${Object.keys(statusConversionData.conversionMatrix).map(status => `<th>${status}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${Object.entries(statusConversionData.conversionMatrix).map(([fromStatus, toStatuses]) => `
                  <tr>
                    <td><strong>${fromStatus}</strong></td>
                    ${Object.keys(statusConversionData.conversionMatrix).map(toStatus => 
                      `<td>${(toStatuses as any)[toStatus] || 0}</td>`
                    ).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <h3 style="margin-top: 20px;">Recent Conversions</h3>
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Activity</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${statusConversionData.conversions.slice(0, 50).map(conv => `
                  <tr>
                    <td>${conv.projectName}</td>
                    <td>${conv.activity}</td>
                    <td>${conv.fromStatus}</td>
                    <td><strong>${conv.toStatus}</strong></td>
                    <td>${conv.date}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
          </html>
        `;
        
        const printWindow = window.open('', '', 'width=1200,height=800');
        if (!printWindow) {
          Alert.alert('Error', 'Please allow popups for this website');
          return;
        }
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 250);
      } else {
        Alert.alert('Info', 'PDF export is only available on web platform');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to export PDF: ' + error.message);
    }
  };

  // Export Contribution to Excel
  const exportContributionExcel = () => {
    if (!contributionData || contributionData.length === 0) return;
    
    try {
      const workbook = XLSX.utils.book_new();
      
      // Summary Sheet
      const totalContributions = contributionData.reduce((sum, p) => sum + p.contributionScore, 0);
      const totalTasks = contributionData.reduce((sum, p) => sum + p.totalTasks, 0);
      const totalHours = contributionData.reduce((sum, p) => sum + p.totalHours, 0);
      
      const summaryData = [
        ['CONTRIBUTION REPORT'],
        ['Generated on:', new Date().toLocaleString()],
        [''],
        ['OVERALL SUMMARY'],
        ['Total Personnel', contributionData.length],
        ['Total Tasks', totalTasks],
        ['Total Hours', totalHours],
        ['Total Contribution Score', totalContributions],
        ['']
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWs, 'Summary');
      
      // Personnel Contributions Sheet
      const contributionSheetData = [
        ['Personnel', 'Total Tasks', 'Completed Tasks', 'Total Hours', 'Completed Hours', 'Projects Count', 'Avg Hours/Task', 'Contribution Score', 'Recent Projects']
      ];
      
      contributionData.forEach(person => {
        contributionSheetData.push([
          person.name,
          person.totalTasks,
          person.completedTasks,
          person.totalHours,
          person.completedHours,
          person.projectsCount,
          person.averageHoursPerTask,
          person.contributionScore,
          person.recentProjects.join(', ')
        ]);
      });
      
      const contributionWs = XLSX.utils.aoa_to_sheet(contributionSheetData);
      XLSX.utils.book_append_sheet(workbook, contributionWs, 'Personnel Contributions');
      
      if (Platform.OS === 'web') {
        XLSX.writeFile(workbook, `Contribution_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
        Alert.alert('Success', 'Contribution report exported to Excel successfully');
      } else {
        Alert.alert('Info', 'Excel export is only available on web platform');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to export: ' + error.message);
    }
  };

  // Export Contribution to PDF
  const exportContributionPDF = () => {
    if (!contributionData || contributionData.length === 0) return;
    
    try {
      if (Platform.OS === 'web') {
        const totalScore = contributionData.reduce((sum, p) => sum + p.contributionScore, 0);
        const totalTasks = contributionData.reduce((sum, p) => sum + p.totalTasks, 0);
        const totalHours = contributionData.reduce((sum, p) => sum + p.totalHours, 0);
        
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Contribution Report</title>
            <style>
              @page { size: A4 landscape; margin: 15mm; }
              body { font-family: Arial, sans-serif; font-size: 10px; }
              .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #ffc107; padding-bottom: 10px; }
              .header h1 { margin: 0; color: #ffc107; font-size: 22px; }
              .summary-box { background: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 5px; display: flex; justify-content: space-around; }
              .summary-item { text-align: center; }
              .summary-item .label { font-size: 9px; color: #666; }
              .summary-item .value { font-size: 18px; font-weight: bold; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              th { background: #343a40; color: white; padding: 6px; text-align: left; font-size: 9px; }
              td { padding: 5px 6px; border-bottom: 1px solid #dee2e6; font-size: 8px; }
              tr:nth-child(even) { background: #f8f9fa; }
              .top-contributor { background: #fff3cd !important; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>⭐ CONTRIBUTION REPORT</h1>
              <div style="font-size: 10px; color: #666;">Generated on ${new Date().toLocaleString()}</div>
            </div>
            
            <div class="summary-box">
              <div class="summary-item">
                <div class="label">Total Personnel</div>
                <div class="value">${contributionData.length}</div>
              </div>
              <div class="summary-item">
                <div class="label">Total Tasks</div>
                <div class="value">${totalTasks}</div>
              </div>
              <div class="summary-item">
                <div class="label">Total Hours</div>
                <div class="value">${totalHours}h</div>
              </div>
              <div class="summary-item">
                <div class="label">Total Score</div>
                <div class="value" style="color: #ffc107;">${totalScore}</div>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Personnel</th>
                  <th>Total Tasks</th>
                  <th>Completed</th>
                  <th>Total Hours</th>
                  <th>Completed Hours</th>
                  <th>Projects</th>
                  <th>Avg Hrs/Task</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                ${contributionData.map((person, idx) => `
                  <tr class="${idx < 3 ? 'top-contributor' : ''}">
                    <td><strong>${idx + 1}</strong></td>
                    <td><strong>${person.name}</strong></td>
                    <td>${person.totalTasks}</td>
                    <td style="color: #28a745;">${person.completedTasks}</td>
                    <td>${person.totalHours}h</td>
                    <td style="color: #28a745;">${person.completedHours}h</td>
                    <td>${person.projectsCount}</td>
                    <td>${person.averageHoursPerTask}h</td>
                    <td style="color: #ffc107; font-weight: bold;">${person.contributionScore}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
          </html>
        `;
        
        const printWindow = window.open('', '', 'width=1200,height=800');
        if (!printWindow) {
          Alert.alert('Error', 'Please allow popups for this website');
          return;
        }
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 250);
      } else {
        Alert.alert('Info', 'PDF export is only available on web platform');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to export PDF: ' + error.message);
    }
  };

  // Send Report via Email
  const handleSendEmail = async () => {
    if (!delayAnalysisData) {
      Alert.alert('Error', 'Please generate the Delay Analysis report first');
      return;
    }
    
    try {
      setSendingEmail(true);
      
      console.log('[Send Email] Triggering delay analysis report via Cloud Function...');
      const triggerReport = httpsCallable(functions, 'triggerDelayAnalysisReport');
      const result = await triggerReport();
      
      console.log('[Send Email] Result:', result.data);
      
      Alert.alert(
        'Success', 
        `Delay Analysis Report sent via email!\n\nOverdue: ${(result.data as any).delayedCount}\nDue Today: ${(result.data as any).dueTodayCount}\nUpcoming: ${(result.data as any).upcomingCount}`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('[Send Email] Error:', error);
      Alert.alert('Error', 'Failed to send email: ' + (error.message || 'Unknown error'));
    } finally {
      setSendingEmail(false);
    }
  };

  // Generate Workload Distribution Report
  const handleGenerateWorkloadDistribution = async () => {
    try {
      const entries = await dailyWorkStatusService.getAllEntries();
      const today = new Date();
      
      // Group by personnel
      const personnelMap: Record<string, any> = {};
      
      entries.forEach(entry => {
        const person = entry.assignedTo || 'Unassigned';
        
        if (!personnelMap[person]) {
          personnelMap[person] = {
            name: person,
            totalTasks: 0,
            totalHours: 0,
            completedTasks: 0,
            ongoingTasks: 0,
            notStartedTasks: 0,
            overdueTasks: 0,
            upcomingDeadlines: 0,
            tasksByProject: {} as Record<string, number>,
            recentActivities: [] as any[]
          };
        }
        
        const personData = personnelMap[person];
        personData.totalTasks++;
        personData.totalHours += entry.hours || 0;
        
        // Count by status
        if (entry.finalStatus === 'Completed') personData.completedTasks++;
        else if (entry.finalStatus === 'Ongoing') personData.ongoingTasks++;
        else if (entry.finalStatus === 'Not Started') personData.notStartedTasks++;
        
        // Check for overdue
        if (entry.targetDate) {
          const targetDate = new Date(entry.targetDate);
          targetDate.setHours(0, 0, 0, 0);
          const todayDate = new Date(today);
          todayDate.setHours(0, 0, 0, 0);
          
          if (targetDate < todayDate && entry.finalStatus !== 'Completed') {
            personData.overdueTasks++;
          } else if (targetDate >= todayDate && targetDate <= new Date(todayDate.getTime() + 7 * 24 * 60 * 60 * 1000)) {
            personData.upcomingDeadlines++;
          }
        }
        
        // Count by project
        const project = entry.projectName || 'Unknown';
        personData.tasksByProject[project] = (personData.tasksByProject[project] || 0) + 1;
        
        // Add to recent activities (last 5)
        if (personData.recentActivities.length < 5) {
          personData.recentActivities.push({
            activity: entry.mainActivity,
            project: entry.projectName,
            status: entry.finalStatus,
            hours: entry.hours,
            date: entry.date
          });
        }
      });
      
      // Convert to array and sort by total tasks
      const personnelWorkload = Object.values(personnelMap).sort((a: any, b: any) => b.totalTasks - a.totalTasks);
      
      const totalTasks = entries.length;
      const totalHours = entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);
      
      setWorkloadData({ personnelWorkload, totalTasks, totalHours });
      setReportData([]); // Clear regular report data
      setDelayAnalysisData(null); // Clear delay analysis data
      setStatusCounts({});
      
    } catch (error: any) {
      Alert.alert('Error', 'Failed to generate workload distribution: ' + error.message);
    }
  };

  // Generate Target Achievement Report
  const handleGenerateTargetAchievement = async () => {
    try {
      const entries = await dailyWorkStatusService.getAllEntries();
      const projects = await dailyWorkStatusService.getAllProjects();
      
      const projectMap: Record<string, any> = {};
      
      // Initialize projects
      projects.forEach(project => {
        projectMap[project.id] = {
          id: project.id,
          name: project.name,
          totalTasks: 0,
          completedTasks: 0,
          ongoingTasks: 0,
          notStartedTasks: 0,
          totalHours: 0,
          completedHours: 0,
          achievementRate: 0,
          tasksWithTarget: 0,
          tasksOnTarget: 0,
          tasksDelayed: 0
        };
      });
      
      entries.forEach(entry => {
        const projectId = entry.projectId || 'Unknown';
        if (!projectMap[projectId]) {
          projectMap[projectId] = {
            id: projectId,
            name: entry.projectName || 'Unknown',
            totalTasks: 0,
            completedTasks: 0,
            ongoingTasks: 0,
            notStartedTasks: 0,
            totalHours: 0,
            completedHours: 0,
            achievementRate: 0,
            tasksWithTarget: 0,
            tasksOnTarget: 0,
            tasksDelayed: 0
          };
        }
        
        const projectData = projectMap[projectId];
        projectData.totalTasks++;
        projectData.totalHours += entry.hours || 0;
        
        if (entry.finalStatus === 'Completed') {
          projectData.completedTasks++;
          projectData.completedHours += entry.hours || 0;
        } else if (entry.finalStatus === 'Ongoing') {
          projectData.ongoingTasks++;
        } else if (entry.finalStatus === 'Not Started') {
          projectData.notStartedTasks++;
        }
        
        // Check target date compliance
        if (entry.targetDate) {
          projectData.tasksWithTarget++;
          const targetDate = new Date(entry.targetDate);
          const today = new Date();
          targetDate.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
          
          if (entry.finalStatus === 'Completed') {
            projectData.tasksOnTarget++;
          } else if (targetDate < today) {
            projectData.tasksDelayed++;
          }
        }
      });
      
      // Calculate achievement rates
      const achievementArray = Object.values(projectMap).map((project: any) => {
        project.achievementRate = project.totalTasks > 0 
          ? Math.round((project.completedTasks / project.totalTasks) * 100)
          : 0;
        return project;
      }).sort((a: any, b: any) => b.achievementRate - a.achievementRate);
      
      setTargetAchievementData(achievementArray);
      setReportData([]);
      setDelayAnalysisData(null);
      setWorkloadData(null);
      setStatusConversionData(null);
      setContributionData(null);
      setStatusCounts({});
      
    } catch (error: any) {
      Alert.alert('Error', 'Failed to generate target achievement report: ' + error.message);
    }
  };

  // Generate Status Conversion Report
  const handleGenerateStatusConversion = async () => {
    try {
      const entries = await dailyWorkStatusService.getAllEntries();
      
      const conversions: any[] = [];
      const conversionMatrix: Record<string, Record<string, number>> = {};
      
      entries.forEach(entry => {
        if (entry.statusUpdates && entry.statusUpdates.length > 1) {
          for (let i = 1; i < entry.statusUpdates.length; i++) {
            // Note: statusUpdates contains note, timestamp, updatedBy
            // For status tracking, we need to use entry.status instead
            const fromNote = entry.statusUpdates[i - 1].note || '';
            const toNote = entry.statusUpdates[i].note || '';
            const date = entry.statusUpdates[i].timestamp;
            
            conversions.push({
              projectName: entry.projectName,
              activity: entry.mainActivity,
              assignedTo: entry.assignedTo,
              fromStatus: fromNote,
              toStatus: toNote,
              date,
              hours: entry.hours
            });
            
            // Build conversion matrix
            if (!conversionMatrix[fromNote]) {
              conversionMatrix[fromNote] = {};
            }
            conversionMatrix[fromNote][toNote] = (conversionMatrix[fromNote][toNote] || 0) + 1;
          }
        }
      });
      
      setStatusConversionData({
        conversions: conversions.slice(-100), // Last 100 conversions
        conversionMatrix,
        totalConversions: conversions.length
      });
      setReportData([]);
      setDelayAnalysisData(null);
      setWorkloadData(null);
      setTargetAchievementData(null);
      setContributionData(null);
      setStatusCounts({});
      
    } catch (error: any) {
      Alert.alert('Error', 'Failed to generate status conversion report: ' + error.message);
    }
  };

  // Generate Contribution Report
  const handleGenerateContribution = async () => {
    try {
      const entries = await dailyWorkStatusService.getAllEntries();
      
      const personnelMap: Record<string, any> = {};
      
      entries.forEach(entry => {
        const person = entry.assignedTo || 'Unassigned';
        
        if (!personnelMap[person]) {
          personnelMap[person] = {
            name: person,
            totalTasks: 0,
            completedTasks: 0,
            totalHours: 0,
            completedHours: 0,
            projectsCount: new Set(),
            averageHoursPerTask: 0,
            contributionScore: 0,
            recentProjects: [] as string[]
          };
        }
        
        const personData = personnelMap[person];
        personData.totalTasks++;
        personData.totalHours += entry.hours || 0;
        personData.projectsCount.add(entry.projectName);
        
        if (entry.finalStatus === 'Completed') {
          personData.completedTasks++;
          personData.completedHours += entry.hours || 0;
        }
        
        // Track recent projects
        if (!personData.recentProjects.includes(entry.projectName) && personData.recentProjects.length < 5) {
          personData.recentProjects.push(entry.projectName);
        }
      });
      
      // Calculate metrics and contribution score
      const contributionArray = Object.values(personnelMap).map((person: any) => {
        person.projectsCount = person.projectsCount.size;
        person.averageHoursPerTask = person.totalTasks > 0 
          ? Math.round((person.totalHours / person.totalTasks) * 10) / 10
          : 0;
        
        // Contribution score: weighted formula
        person.contributionScore = Math.round(
          (person.completedTasks * 10) + 
          (person.completedHours * 2) + 
          (person.projectsCount * 5)
        );
        
        return person;
      }).sort((a: any, b: any) => b.contributionScore - a.contributionScore);
      
      setContributionData(contributionArray);
      setReportData([]);
      setDelayAnalysisData(null);
      setWorkloadData(null);
      setTargetAchievementData(null);
      setStatusConversionData(null);
      setStatusCounts({});
      
    } catch (error: any) {
      Alert.alert('Error', 'Failed to generate contribution report: ' + error.message);
    }
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
        {/* Filter By Date Type Toggle */}
        <View style={styles.filterByRow}>
          <Text style={styles.filterLabel}>Filter By:</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity 
              style={styles.radioButton}
              onPress={() => setFilterByDateType('entryDate')}
            >
              <View style={[styles.radioOuter, filterByDateType === 'entryDate' && styles.radioOuterSelected]}>
                {filterByDateType === 'entryDate' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>Entry Date</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.radioButton}
              onPress={() => setFilterByDateType('statusUpdateDate')}
            >
              <View style={[styles.radioOuter, filterByDateType === 'statusUpdateDate' && styles.radioOuterSelected]}>
                {filterByDateType === 'statusUpdateDate' && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>Status Update Date</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Single Row: Report Type, Project, User, Start Date, End Date */}
        <View style={styles.filtersRow}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Report Type:</Text>
            <Dropdown
              options={[
                { value: 'daily', label: 'Daily' },
                { value: 'project', label: 'Project' },
                { value: 'user', label: 'User' },
                { value: 'status', label: 'Status' },
                { value: 'delay', label: '⚠️ Delay Analysis' },
                { value: 'workload', label: '👥 Workload Distribution' },
                { value: 'target', label: '🎯 Target Achievement' },
                { value: 'statusConversion', label: '🔄 Status Conversion' },
                { value: 'contribution', label: '⭐ Contribution Report' }
              ]}
              value={reportType}
              onSelect={(value) => setReportType(value as ReportType)}
              placeholder="Select Type"
              width={200}
            />
          </View>
          
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Project:</Text>
            <Dropdown
              options={[
                { value: '', label: 'All' },
                ...projects.sort((a, b) => a.name.localeCompare(b.name)).map(p => ({ value: p.id, label: p.name }))
              ]}
              value={selectedProject}
              onSelect={setSelectedProject}
              placeholder="Select Project"
              width={200}
            />
          </View>
          
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>User:</Text>
            <Dropdown
              options={[
                { value: '', label: 'All' },
                ...personnel.sort((a, b) => a.name.localeCompare(b.name)).map(p => ({ value: p.name, label: p.name }))
              ]}
              value={selectedUser}
              onSelect={setSelectedUser}
              placeholder="Select User"
              width={180}
            />
          </View>
          
          <View style={styles.filterItem}>
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
          
          <View style={styles.filterItem}>
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
          
          {/* Compact Status Distribution with % bars */}
          {reportData.length > 0 && chartData.length > 0 && (
            <View style={styles.compactChartItem}>
              <Text style={styles.compactChartTitle}>📈 Status Distribution</Text>
              <View style={styles.compactChartContainer}>
                {chartData.map((item, index) => (
                  <View key={index} style={styles.compactStatusRow}>
                    <Text style={styles.compactStatusLabel}>{item.label}</Text>
                    <View style={styles.compactBarContainer}>
                      <View 
                        style={[
                          styles.compactBarFill, 
                          { 
                            width: `${item.percentage}%` as any,
                            backgroundColor: item.color
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.compactStatusValue}>{item.count} ({item.percentage}%)</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.generateBtn}
            onPress={handleGenerateReport}
            disabled={generating}
            {...(Platform.OS === 'web' && { title: 'Generate Report' })}
          >
            {generating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.btnText}>Generate Report</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.exportBtn} 
            onPress={handleExportPDF}
            {...(Platform.OS === 'web' && { title: 'Export as PDF' })}
          >
            <Text style={styles.btnText}>Export PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.exportBtn, styles.excelBtn]} 
            onPress={handleExportExcel}
            {...(Platform.OS === 'web' && { title: 'Export as Excel' })}
          >
            <Text style={styles.btnText}>Export Excel</Text>
          </TouchableOpacity>
          {reportType === 'delay' && (
            <TouchableOpacity 
              style={[styles.exportBtn, styles.emailBtn]} 
              onPress={handleSendEmail}
              disabled={sendingEmail}
              {...(Platform.OS === 'web' && { title: 'Send Report via Email' })}
            >
              {sendingEmail ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnText}>📧 Send Email</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Delay Analysis Display */}
      {delayAnalysisData && (
        <View style={styles.delayAnalysisContainer}>
          {/* Summary Cards */}
          <View style={styles.delaySummaryRow}>
            <View style={[styles.delaySummaryCard, { borderLeftColor: '#dc3545' }]}>
              <Text style={styles.delaySummaryLabel}>🔴 Overdue</Text>
              <Text style={[styles.delaySummaryValue, { color: '#dc3545' }]}>
                {delayAnalysisData.delayedTasks.length}
              </Text>
            </View>
            <View style={[styles.delaySummaryCard, { borderLeftColor: '#ffc107' }]}>
              <Text style={styles.delaySummaryLabel}>🟡 Due Today</Text>
              <Text style={[styles.delaySummaryValue, { color: '#ffc107' }]}>
                {delayAnalysisData.dueTodayTasks.length}
              </Text>
            </View>
            <View style={[styles.delaySummaryCard, { borderLeftColor: '#28a745' }]}>
              <Text style={styles.delaySummaryLabel}>🟢 Upcoming (7 Days)</Text>
              <Text style={[styles.delaySummaryValue, { color: '#28a745' }]}>
                {delayAnalysisData.upcomingTasks.length}
              </Text>
            </View>
          </View>
          
          {/* Overdue Tasks */}
          {delayAnalysisData.delayedTasks.length > 0 && (
            <View style={styles.delaySection}>
              <Text style={[styles.delaySectionTitle, { backgroundColor: '#dc3545' }]}>
                🔴 OVERDUE TASKS ({delayAnalysisData.delayedTasks.length})
              </Text>
              <ScrollView horizontal>
                <View>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.headerCell, { width: 150 }]}>Project</Text>
                    <Text style={[styles.headerCell, { width: 220 }]}>Activity</Text>
                    <Text style={[styles.headerCell, { width: 120 }]}>Assigned To</Text>
                    <Text style={[styles.headerCell, { width: 100 }]}>Target Date</Text>
                    <Text style={[styles.headerCell, { width: 100 }]}>Delay (Days)</Text>
                    <Text style={[styles.headerCell, { width: 100 }]}>Status</Text>
                    <Text style={[styles.headerCell, { width: 200 }]}>Last Update</Text>
                  </View>
                  {delayAnalysisData.delayedTasks.map((task, idx) => (
                    <View key={task.id || idx} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { width: 150 }]}>{task.projectName}</Text>
                      <Text style={[styles.tableCell, { width: 220 }]} numberOfLines={2}>{task.mainActivity}</Text>
                      <Text style={[styles.tableCell, { width: 120 }]}>{task.assignedTo}</Text>
                      <Text style={[styles.tableCell, { width: 100 }]}>{task.targetDateFormatted}</Text>
                      <Text style={[styles.tableCell, { width: 100, fontWeight: 'bold', color: '#dc3545' }]}>
                        {task.pendingSinceDays} days
                      </Text>
                      <Text style={[styles.tableCell, { width: 100 }]}>{task.finalStatus}</Text>
                      <Text style={[styles.tableCell, { width: 200 }]} numberOfLines={2}>
                        {task.statusUpdates?.[task.statusUpdates.length - 1]?.note || 'No updates'}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
          
          {/* Due Today Tasks */}
          {delayAnalysisData.dueTodayTasks.length > 0 && (
            <View style={styles.delaySection}>
              <Text style={[styles.delaySectionTitle, { backgroundColor: '#ffc107', color: '#000' }]}>
                🟡 DUE TODAY ({delayAnalysisData.dueTodayTasks.length})
              </Text>
              <ScrollView horizontal>
                <View>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.headerCell, { width: 150 }]}>Project</Text>
                    <Text style={[styles.headerCell, { width: 250 }]}>Activity</Text>
                    <Text style={[styles.headerCell, { width: 120 }]}>Assigned To</Text>
                    <Text style={[styles.headerCell, { width: 100 }]}>Status</Text>
                    <Text style={[styles.headerCell, { width: 80 }]}>Hours</Text>
                  </View>
                  {delayAnalysisData.dueTodayTasks.map((task, idx) => (
                    <View key={task.id || idx} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { width: 150 }]}>{task.projectName}</Text>
                      <Text style={[styles.tableCell, { width: 250 }]} numberOfLines={2}>{task.mainActivity}</Text>
                      <Text style={[styles.tableCell, { width: 120 }]}>{task.assignedTo}</Text>
                      <Text style={[styles.tableCell, { width: 100 }]}>{task.finalStatus}</Text>
                      <Text style={[styles.tableCell, { width: 80 }]}>{task.hours}h</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
          
          {/* Upcoming Tasks */}
          {delayAnalysisData.upcomingTasks.length > 0 && (
            <View style={styles.delaySection}>
              <Text style={[styles.delaySectionTitle, { backgroundColor: '#28a745' }]}>
                🟢 UPCOMING (Next 7 Days) - {delayAnalysisData.upcomingTasks.length} Tasks
              </Text>
              <ScrollView horizontal>
                <View>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.headerCell, { width: 150 }]}>Project</Text>
                    <Text style={[styles.headerCell, { width: 250 }]}>Activity</Text>
                    <Text style={[styles.headerCell, { width: 120 }]}>Assigned To</Text>
                    <Text style={[styles.headerCell, { width: 100 }]}>Target Date</Text>
                    <Text style={[styles.headerCell, { width: 100 }]}>Days Left</Text>
                    <Text style={[styles.headerCell, { width: 100 }]}>Status</Text>
                  </View>
                  {delayAnalysisData.upcomingTasks.map((task, idx) => (
                    <View key={task.id || idx} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { width: 150 }]}>{task.projectName}</Text>
                      <Text style={[styles.tableCell, { width: 250 }]} numberOfLines={2}>{task.mainActivity}</Text>
                      <Text style={[styles.tableCell, { width: 120 }]}>{task.assignedTo}</Text>
                      <Text style={[styles.tableCell, { width: 100 }]}>{task.targetDateFormatted}</Text>
                      <Text style={[styles.tableCell, { width: 100, fontWeight: 'bold', color: '#28a745' }]}>
                        {task.daysDiff} days
                      </Text>
                      <Text style={[styles.tableCell, { width: 100 }]}>{task.finalStatus}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      )}
      
      {/* Workload Distribution Display */}
      {workloadData && workloadData.personnelWorkload && workloadData.personnelWorkload.length > 0 && (
        <View style={styles.workloadContainer}>
          {/* Summary Cards */}
          <View style={styles.delaySummaryRow}>
            <View style={[styles.delaySummaryCard, { borderLeftColor: '#007bff' }]}>
              <Text style={styles.delaySummaryLabel}>👥 Total Personnel</Text>
              <Text style={[styles.delaySummaryValue, { color: '#007bff' }]}>
                {workloadData.personnelWorkload.length}
              </Text>
            </View>
            <View style={[styles.delaySummaryCard, { borderLeftColor: '#6c757d' }]}>
              <Text style={styles.delaySummaryLabel}>📋 Total Tasks</Text>
              <Text style={[styles.delaySummaryValue, { color: '#6c757d' }]}>
                {workloadData.totalTasks}
              </Text>
            </View>
            <View style={[styles.delaySummaryCard, { borderLeftColor: '#17a2b8' }]}>
              <Text style={styles.delaySummaryLabel}>⏱️ Total Hours</Text>
              <Text style={[styles.delaySummaryValue, { color: '#17a2b8' }]}>
                {workloadData.totalHours}h
              </Text>
            </View>
            <View style={[styles.delaySummaryCard, { borderLeftColor: '#28a745' }]}>
              <Text style={styles.delaySummaryLabel}>✅ Completed</Text>
              <Text style={[styles.delaySummaryValue, { color: '#28a745' }]}>
                {workloadData.personnelWorkload.reduce((sum, p) => sum + (p.completedTasks || 0), 0)}
              </Text>
            </View>
            <View style={[styles.delaySummaryCard, { borderLeftColor: '#dc3545' }]}>
              <Text style={styles.delaySummaryLabel}>⚠️ Overdue</Text>
              <Text style={[styles.delaySummaryValue, { color: '#dc3545' }]}>
                {workloadData.personnelWorkload.reduce((sum, p) => sum + (p.overdueTasks || 0), 0)}
              </Text>
            </View>
          </View>
          
          {/* Personnel Workload Table */}
          <View style={styles.delaySection}>
            <Text style={[styles.delaySectionTitle, { backgroundColor: '#007bff' }]}>
              👥 PERSONNEL WORKLOAD BREAKDOWN
            </Text>
            <ScrollView horizontal>
              <View>
                <View style={styles.tableHeader}>
                  <Text style={[styles.headerCell, { width: 150 }]}>Personnel</Text>
                  <Text style={[styles.headerCell, { width: 80 }]}>Total Tasks</Text>
                  <Text style={[styles.headerCell, { width: 80 }]}>Hours</Text>
                  <Text style={[styles.headerCell, { width: 80 }]}>Completed</Text>
                  <Text style={[styles.headerCell, { width: 80 }]}>Ongoing</Text>
                  <Text style={[styles.headerCell, { width: 90 }]}>Not Started</Text>
                  <Text style={[styles.headerCell, { width: 80 }]}>Overdue</Text>
                  <Text style={[styles.headerCell, { width: 100 }]}>Upcoming</Text>
                  <Text style={[styles.headerCell, { width: 200 }]}>Top Projects</Text>
                </View>
                {workloadData.personnelWorkload.map((person, idx) => {
                  const topProjects = Object.entries(person.tasksByProject || {})
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 3)
                    .map(([project, count]) => `${project} (${count})`)
                    .join(', ');
                  
                  return (
                    <View key={idx} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { width: 150, fontWeight: 'bold' }]}>{person.name}</Text>
                      <Text style={[styles.tableCell, { width: 80, textAlign: 'center', fontWeight: 'bold' }]}>
                        {person.totalTasks}
                      </Text>
                      <Text style={[styles.tableCell, { width: 80, textAlign: 'center' }]}>
                        {person.totalHours}h
                      </Text>
                      <Text style={[styles.tableCell, { width: 80, textAlign: 'center', color: '#28a745', fontWeight: 'bold' }]}>
                        {person.completedTasks}
                      </Text>
                      <Text style={[styles.tableCell, { width: 80, textAlign: 'center', color: '#ffc107', fontWeight: 'bold' }]}>
                        {person.ongoingTasks}
                      </Text>
                      <Text style={[styles.tableCell, { width: 90, textAlign: 'center' }]}>
                        {person.notStartedTasks}
                      </Text>
                      <Text style={[styles.tableCell, { width: 80, textAlign: 'center', color: '#dc3545', fontWeight: 'bold' }]}>
                        {person.overdueTasks}
                      </Text>
                      <Text style={[styles.tableCell, { width: 100, textAlign: 'center', color: '#17a2b8' }]}>
                        {person.upcomingDeadlines}
                      </Text>
                      <Text style={[styles.tableCell, { width: 200, fontSize: 11 }]} numberOfLines={2}>
                        {topProjects || 'No projects'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
          
          {/* Recent Activities by Personnel */}
          {workloadData.personnelWorkload.some(p => (p.recentActivities || []).length > 0) && (
            <View style={styles.delaySection}>
              <Text style={[styles.delaySectionTitle, { backgroundColor: '#6c757d' }]}>
                📝 RECENT ACTIVITIES
              </Text>
              <ScrollView horizontal>
                <View>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.headerCell, { width: 150 }]}>Personnel</Text>
                    <Text style={[styles.headerCell, { width: 200 }]}>Activity</Text>
                    <Text style={[styles.headerCell, { width: 150 }]}>Project</Text>
                    <Text style={[styles.headerCell, { width: 120 }]}>Date</Text>
                  </View>
                  {workloadData.personnelWorkload.flatMap(person => 
                    (person.recentActivities || []).map((activity, actIdx) => (
                      <View key={`${person.name}-${actIdx}`} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { width: 150 }]}>{person.name}</Text>
                        <Text style={[styles.tableCell, { width: 200 }]} numberOfLines={2}>{activity.activity}</Text>
                        <Text style={[styles.tableCell, { width: 150 }]}>{activity.project}</Text>
                        <Text style={[styles.tableCell, { width: 120 }]}>{activity.date}</Text>
                      </View>
                    ))
                  )}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      )}
      
      {/* Target Achievement Display */}
      {targetAchievementData && targetAchievementData.length > 0 && (
        <View style={styles.workloadContainer}>
          {/* Summary Cards */}
          <View style={styles.delaySummaryRow}>
            <View style={[styles.delaySummaryCard, { borderLeftColor: '#28a745' }]}>
              <Text style={styles.delaySummaryLabel}>🎯 Total Projects</Text>
              <Text style={[styles.delaySummaryValue, { color: '#28a745' }]}>
                {targetAchievementData.length}
              </Text>
            </View>
            <View style={[styles.delaySummaryCard, { borderLeftColor: '#6c757d' }]}>
              <Text style={styles.delaySummaryLabel}>📋 Total Tasks</Text>
              <Text style={[styles.delaySummaryValue, { color: '#6c757d' }]}>
                {targetAchievementData.reduce((sum, p) => sum + p.totalTasks, 0)}
              </Text>
            </View>
            <View style={[styles.delaySummaryCard, { borderLeftColor: '#28a745' }]}>
              <Text style={styles.delaySummaryLabel}>✅ Completed</Text>
              <Text style={[styles.delaySummaryValue, { color: '#28a745' }]}>
                {targetAchievementData.reduce((sum, p) => sum + p.completedTasks, 0)}
              </Text>
            </View>
            <View style={[styles.delaySummaryCard, { borderLeftColor: '#007bff' }]}>
              <Text style={styles.delaySummaryLabel}>📊 Overall Rate</Text>
              <Text style={[styles.delaySummaryValue, { color: '#007bff' }]}>
                {targetAchievementData.reduce((sum, p) => sum + p.totalTasks, 0) > 0
                  ? Math.round((targetAchievementData.reduce((sum, p) => sum + p.completedTasks, 0) / targetAchievementData.reduce((sum, p) => sum + p.totalTasks, 0)) * 100)
                  : 0}%
              </Text>
            </View>
          </View>
          
          {/* Project Achievement Table */}
          <View style={styles.delaySection}>
            <Text style={[styles.delaySectionTitle, { backgroundColor: '#28a745' }]}>
              🎯 PROJECT ACHIEVEMENT BREAKDOWN
            </Text>
            <ScrollView horizontal>
              <View>
                <View style={styles.tableHeader}>
                  <Text style={[styles.headerCell, { width: 180 }]}>Project</Text>
                  <Text style={[styles.headerCell, { width: 80 }]}>Total</Text>
                  <Text style={[styles.headerCell, { width: 90 }]}>Completed</Text>
                  <Text style={[styles.headerCell, { width: 80 }]}>Ongoing</Text>
                  <Text style={[styles.headerCell, { width: 100 }]}>Not Started</Text>
                  <Text style={[styles.headerCell, { width: 100 }]}>Total Hours</Text>
                  <Text style={[styles.headerCell, { width: 120 }]}>Achievement %</Text>
                  <Text style={[styles.headerCell, { width: 110 }]}>With Target</Text>
                  <Text style={[styles.headerCell, { width: 90 }]}>On Target</Text>
                  <Text style={[styles.headerCell, { width: 80 }]}>Delayed</Text>
                </View>
                {targetAchievementData.map((project, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { width: 180, fontWeight: 'bold' }]}>{project.name}</Text>
                    <Text style={[styles.tableCell, { width: 80, textAlign: 'center' }]}>{project.totalTasks}</Text>
                    <Text style={[styles.tableCell, { width: 90, textAlign: 'center', color: '#28a745', fontWeight: 'bold' }]}>{project.completedTasks}</Text>
                    <Text style={[styles.tableCell, { width: 80, textAlign: 'center', color: '#ffc107' }]}>{project.ongoingTasks}</Text>
                    <Text style={[styles.tableCell, { width: 100, textAlign: 'center' }]}>{project.notStartedTasks}</Text>
                    <Text style={[styles.tableCell, { width: 100, textAlign: 'center' }]}>{project.totalHours}h</Text>
                    <Text style={[styles.tableCell, { width: 120, textAlign: 'center', fontWeight: 'bold', color: project.achievementRate >= 70 ? '#28a745' : project.achievementRate < 40 ? '#dc3545' : '#ffc107' }]}>
                      {project.achievementRate}%
                    </Text>
                    <Text style={[styles.tableCell, { width: 110, textAlign: 'center' }]}>{project.tasksWithTarget}</Text>
                    <Text style={[styles.tableCell, { width: 90, textAlign: 'center', color: '#28a745' }]}>{project.tasksOnTarget}</Text>
                    <Text style={[styles.tableCell, { width: 80, textAlign: 'center', color: '#dc3545', fontWeight: 'bold' }]}>{project.tasksDelayed}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      )}
      
      {/* Status Conversion Display */}
      {statusConversionData && (
        <View style={styles.workloadContainer}>
          {/* Summary Card */}
          <View style={styles.delaySummaryRow}>
            <View style={[styles.delaySummaryCard, { borderLeftColor: '#6c757d', flex: 2 }]}>
              <Text style={styles.delaySummaryLabel}>🔄 Total Status Conversions</Text>
              <Text style={[styles.delaySummaryValue, { color: '#6c757d' }]}>
                {statusConversionData.totalConversions}
              </Text>
              <Text style={{ fontSize: 12, color: colors.TEXT_SECONDARY, marginTop: 8 }}>
                Showing last {statusConversionData.conversions.length} conversions
              </Text>
            </View>
          </View>
          
          {/* Conversion Matrix */}
          <View style={styles.delaySection}>
            <Text style={[styles.delaySectionTitle, { backgroundColor: '#6c757d' }]}>
              📊 CONVERSION MATRIX (FROM → TO)
            </Text>
            <ScrollView horizontal>
              <View>
                <View style={styles.tableHeader}>
                  <Text style={[styles.headerCell, { width: 150 }]}>FROM \ TO</Text>
                  {Object.keys(statusConversionData.conversionMatrix).map((status, idx) => (
                    <Text key={idx} style={[styles.headerCell, { width: 100 }]}>{status}</Text>
                  ))}
                </View>
                {Object.entries(statusConversionData.conversionMatrix).map(([fromStatus, toStatuses], idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { width: 150, fontWeight: 'bold' }]}>{fromStatus}</Text>
                    {Object.keys(statusConversionData.conversionMatrix).map((toStatus, idx2) => (
                      <Text key={idx2} style={[styles.tableCell, { width: 100, textAlign: 'center', fontWeight: (toStatuses as any)[toStatus] > 0 ? 'bold' : 'normal', color: (toStatuses as any)[toStatus] > 0 ? '#007bff' : '#999' }]}>
                        {(toStatuses as any)[toStatus] || 0}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
          
          {/* Recent Conversions */}
          <View style={styles.delaySection}>
            <Text style={[styles.delaySectionTitle, { backgroundColor: '#17a2b8' }]}>
              📝 RECENT STATUS CONVERSIONS
            </Text>
            <ScrollView horizontal>
              <View>
                <View style={styles.tableHeader}>
                  <Text style={[styles.headerCell, { width: 150 }]}>Project</Text>
                  <Text style={[styles.headerCell, { width: 200 }]}>Activity</Text>
                  <Text style={[styles.headerCell, { width: 120 }]}>Assigned To</Text>
                  <Text style={[styles.headerCell, { width: 120 }]}>From Status</Text>
                  <Text style={[styles.headerCell, { width: 120 }]}>To Status</Text>
                  <Text style={[styles.headerCell, { width: 120 }]}>Date</Text>
                </View>
                {statusConversionData.conversions.map((conv, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { width: 150 }]}>{conv.projectName}</Text>
                    <Text style={[styles.tableCell, { width: 200 }]} numberOfLines={2}>{conv.activity}</Text>
                    <Text style={[styles.tableCell, { width: 120 }]}>{conv.assignedTo}</Text>
                    <Text style={[styles.tableCell, { width: 120 }]}>{conv.fromStatus}</Text>
                    <Text style={[styles.tableCell, { width: 120, fontWeight: 'bold', color: '#007bff' }]}>{conv.toStatus}</Text>
                    <Text style={[styles.tableCell, { width: 120 }]}>{conv.date}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      )}
      
      {/* Contribution Report Display */}
      {contributionData && contributionData.length > 0 && (
        <View style={styles.workloadContainer}>
          {/* Summary Cards */}
          <View style={styles.delaySummaryRow}>
            <View style={[styles.delaySummaryCard, { borderLeftColor: '#ffc107' }]}>
              <Text style={styles.delaySummaryLabel}>⭐ Total Personnel</Text>
              <Text style={[styles.delaySummaryValue, { color: '#ffc107' }]}>
                {contributionData.length}
              </Text>
            </View>
            <View style={[styles.delaySummaryCard, { borderLeftColor: '#6c757d' }]}>
              <Text style={styles.delaySummaryLabel}>📋 Total Tasks</Text>
              <Text style={[styles.delaySummaryValue, { color: '#6c757d' }]}>
                {contributionData.reduce((sum, p) => sum + p.totalTasks, 0)}
              </Text>
            </View>
            <View style={[styles.delaySummaryCard, { borderLeftColor: '#17a2b8' }]}>
              <Text style={styles.delaySummaryLabel}>⏱️ Total Hours</Text>
              <Text style={[styles.delaySummaryValue, { color: '#17a2b8' }]}>
                {contributionData.reduce((sum, p) => sum + p.totalHours, 0)}h
              </Text>
            </View>
            <View style={[styles.delaySummaryCard, { borderLeftColor: '#ffc107' }]}>
              <Text style={styles.delaySummaryLabel}>🏆 Total Score</Text>
              <Text style={[styles.delaySummaryValue, { color: '#ffc107' }]}>
                {contributionData.reduce((sum, p) => sum + p.contributionScore, 0)}
              </Text>
            </View>
          </View>
          
          {/* Contribution Table */}
          <View style={styles.delaySection}>
            <Text style={[styles.delaySectionTitle, { backgroundColor: '#ffc107', color: '#000' }]}>
              ⭐ PERSONNEL CONTRIBUTION RANKING
            </Text>
            <ScrollView horizontal>
              <View>
                <View style={styles.tableHeader}>
                  <Text style={[styles.headerCell, { width: 60 }]}>Rank</Text>
                  <Text style={[styles.headerCell, { width: 150 }]}>Personnel</Text>
                  <Text style={[styles.headerCell, { width: 80 }]}>Total Tasks</Text>
                  <Text style={[styles.headerCell, { width: 90 }]}>Completed</Text>
                  <Text style={[styles.headerCell, { width: 90 }]}>Total Hours</Text>
                  <Text style={[styles.headerCell, { width: 110 }]}>Completed Hrs</Text>
                  <Text style={[styles.headerCell, { width: 80 }]}>Projects</Text>
                  <Text style={[styles.headerCell, { width: 100 }]}>Avg Hrs/Task</Text>
                  <Text style={[styles.headerCell, { width: 120 }]}>Score 🏆</Text>
                  <Text style={[styles.headerCell, { width: 200 }]}>Recent Projects</Text>
                </View>
                {contributionData.map((person, idx) => (
                  <View key={idx} style={[styles.tableRow, idx < 3 ? { backgroundColor: '#fff3cd' } : {}]}>
                    <Text style={[styles.tableCell, { width: 60, textAlign: 'center', fontWeight: 'bold', fontSize: 14 }]}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </Text>
                    <Text style={[styles.tableCell, { width: 150, fontWeight: 'bold' }]}>{person.name}</Text>
                    <Text style={[styles.tableCell, { width: 80, textAlign: 'center' }]}>{person.totalTasks}</Text>
                    <Text style={[styles.tableCell, { width: 90, textAlign: 'center', color: '#28a745', fontWeight: 'bold' }]}>{person.completedTasks}</Text>
                    <Text style={[styles.tableCell, { width: 90, textAlign: 'center' }]}>{person.totalHours}h</Text>
                    <Text style={[styles.tableCell, { width: 110, textAlign: 'center', color: '#28a745' }]}>{person.completedHours}h</Text>
                    <Text style={[styles.tableCell, { width: 80, textAlign: 'center', color: '#007bff' }]}>{person.projectsCount}</Text>
                    <Text style={[styles.tableCell, { width: 100, textAlign: 'center' }]}>{person.averageHoursPerTask}h</Text>
                    <Text style={[styles.tableCell, { width: 120, textAlign: 'center', fontWeight: 'bold', color: '#ffc107', fontSize: 14 }]}>
                      {person.contributionScore}
                    </Text>
                    <Text style={[styles.tableCell, { width: 200, fontSize: 10 }]} numberOfLines={2}>
                      {person.recentProjects.join(', ')}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      )}
      
      {/* Report Table */}
      {reportData.length > 0 && (
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
            </View>
          </ScrollView>
        </View>
      )}
      
      {!delayAnalysisData && !workloadData && !targetAchievementData && !statusConversionData && !contributionData && reportData.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No data. Click "Generate Report" to load data.</Text>
        </View>
      )}
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
  filterByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  radioGroup: {
    flexDirection: 'row',
    gap: spacing.lg
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center'
  },
  radioOuterSelected: {
    borderColor: colors.ACTION_BLUE
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.ACTION_BLUE
  },
  radioLabel: {
    fontSize: 14,
    color: colors.TEXT_PRIMARY,
    fontWeight: '500'
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'flex-end'
  },
  filterItem: {
    minWidth: 150
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
  compactChartItem: {
    minWidth: 280,
    maxWidth: 320,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  compactChartTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY,
    marginBottom: spacing.xs
  },
  compactChartContainer: {
    gap: 6
  },
  compactStatusRow: {
    gap: 4
  },
  compactStatusLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.TEXT_SECONDARY,
    marginBottom: 2
  },
  compactBarContainer: {
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 2
  },
  compactBarFill: {
    height: '100%',
    borderRadius: 3
  },
  compactStatusValue: {
    fontSize: 10,
    color: colors.TEXT_SECONDARY,
    textAlign: 'right'
  },
  compactChartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  compactBar: {
    width: 12,
    height: 12,
    borderRadius: 2
  },
  compactChartText: {
    fontSize: 11,
    color: colors.TEXT_SECONDARY,
    flex: 1
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
  emailBtn: {
    backgroundColor: '#0066cc'
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
  },
  emptyState: {
    backgroundColor: '#fff',
    margin: spacing.lg,
    padding: spacing.xl * 2,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed'
  },
  // Delay Analysis Styles
  delayAnalysisContainer: {
    margin: spacing.lg,
    marginTop: 0
  },
  workloadContainer: {
    margin: spacing.lg,
    marginTop: 0
  },
  delaySummaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg
  },
  delaySummaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderRadius: 8,
    borderLeftWidth: 4,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
    })
  },
  delaySummaryLabel: {
    fontSize: 12,
    color: colors.TEXT_SECONDARY,
    marginBottom: spacing.xs
  },
  delaySummaryValue: {
    fontSize: 28,
    fontWeight: 'bold'
  },
  delaySection: {
    backgroundColor: '#fff',
    marginBottom: spacing.lg,
    borderRadius: 8,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
    })
  },
  delaySectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    padding: spacing.md,
    paddingHorizontal: spacing.lg
  }
});
