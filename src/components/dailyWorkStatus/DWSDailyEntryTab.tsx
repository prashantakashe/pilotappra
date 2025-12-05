// src/components/dailyWorkStatus/DWSDailyEntryTab.tsx
/**
 * Daily Entry Tab for Daily Work Status module
 * Allows creating/editing daily work entries with sub-activities
 */

import React, { useState, useEffect, useRef } from 'react';
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
import {
  dailyWorkStatusService,
  addEntry,
  updateEntry,
  deleteEntry,
  addStatusUpdateToEntry
} from '../../services/dailyWorkStatusService';
import type { DWSProject, DWSPersonnel, DWSStatus, DWSDailyEntry, DWSSubActivity } from '../../types/dailyWorkStatus';

// Dropdown Component
interface DropdownOption {
  value: string;
  label: string;
  color?: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  width?: number;
  showColorBadge?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({ 
  options, 
  value, 
  onSelect, 
  placeholder = 'Select...', 
  width = 140,
  showColorBadge = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const selectedOption = options.find(o => o.value === value);
  
  // Filter options based on search text
  const filteredOptions = searchText
    ? options.filter(opt => opt.label.toLowerCase().includes(searchText.toLowerCase()))
    : options;
  
  return (
    <View style={[dropdownStyles.container, { width }]}>
      <TouchableOpacity 
        style={[
          dropdownStyles.trigger,
          showColorBadge && selectedOption?.color && { borderColor: selectedOption.color, borderWidth: 2 }
        ]}
        onPress={() => setIsOpen(true)}
      >
        {showColorBadge && selectedOption?.color && (
          <View style={[dropdownStyles.colorDot, { backgroundColor: selectedOption.color }]} />
        )}
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
            
            {/* Search Input */}
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
                    {showColorBadge && option.color && (
                      <View style={[dropdownStyles.optionColorDot, { backgroundColor: option.color }]} />
                    )}
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 36
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6
  },
  triggerText: {
    flex: 1,
    fontSize: 13,
    color: colors.TEXT_PRIMARY
  },
  arrow: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 4
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
    width: 280,
    maxHeight: 400,
    ...Platform.select({
      web: { boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }
    })
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 12,
    fontSize: 14,
    backgroundColor: '#F9FAFB'
  },
  optionsList: {
    maxHeight: 300
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  optionSelected: {
    backgroundColor: '#EBF5FF'
  },
  optionColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: colors.TEXT_PRIMARY
  },
  optionTextSelected: {
    fontWeight: '600',
    color: colors.ACTION_BLUE
  },
  checkmark: {
    fontSize: 16,
    color: colors.ACTION_BLUE,
    fontWeight: '700'
  },
  emptyState: {
    padding: 24,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: colors.TEXT_SECONDARY,
    fontStyle: 'italic'
  }
});

interface DWSDailyEntryTabProps {
  initialFilter?: string;
}

export const DWSDailyEntryTab: React.FC<DWSDailyEntryTabProps> = ({ initialFilter }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Master data
  const [projects, setProjects] = useState<DWSProject[]>([]);
  const [personnel, setPersonnel] = useState<DWSPersonnel[]>([]);
  const [statuses, setStatuses] = useState<DWSStatus[]>([]);
  
  // Entries
  const [entries, setEntries] = useState<DWSDailyEntry[]>([]);
  
  // Filters
  const [filterProject, setFilterProject] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterActivity, setFilterActivity] = useState('');
  const [filterAssigned, setFilterAssigned] = useState('');
  const [filterStatus, setFilterStatus] = useState(initialFilter || '');
  
  // Actions menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
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

  // Subscribe to data
  useEffect(() => {
    setLoading(true);
    
    const unsubProjects = dailyWorkStatusService.subscribeToProjects(setProjects);
    const unsubPersonnel = dailyWorkStatusService.subscribeToPersonnel(setPersonnel);
    const unsubStatuses = dailyWorkStatusService.subscribeToStatuses(setStatuses);
    const unsubEntries = dailyWorkStatusService.subscribeToEntries((data) => {
      setEntries(data);
      setLoading(false);
    });
    
    return () => {
      unsubProjects();
      unsubPersonnel();
      unsubStatuses();
      unsubEntries();
    };
  }, []);

  // Update filter when initialFilter changes
  useEffect(() => {
    if (initialFilter) {
      setFilterStatus(initialFilter);
    }
  }, [initialFilter]);

  // Add new entry row
  const handleAddNewRow = async () => {
    if (projects.length === 0) {
      Alert.alert('Error', 'Please add at least one project in Master Data first');
      return;
    }
    if (personnel.length === 0) {
      Alert.alert('Error', 'Please add at least one person in Master Data first');
      return;
    }
    if (statuses.length === 0) {
      Alert.alert('Error', 'Please add at least one status in Master Data first');
      return;
    }
    
    try {
      setSaving(true);
      const now = new Date();
      const newEntry: Omit<DWSDailyEntry, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
        projectId: projects[0].id,
        projectName: projects[0].name,
        date: now,
        dateTime: now.toLocaleString(),
        mainActivity: '',
        assignedTo: personnel[0].name,
        hours: 0,
        finalStatus: statuses[0].name,
        statusUpdates: [],
        subActivities: []
      };
      
      await addEntry(newEntry);
      
      // Scroll to top to show the new entry
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 100);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  // Update entry field
  const handleUpdateEntry = async (id: string, field: string, value: any) => {
    try {
      const updates: any = { [field]: value };
      
      // If updating project, also update projectName
      if (field === 'projectId') {
        const project = projects.find(p => p.id === value);
        if (project) {
          updates.projectName = project.name;
        }
      }
      
      await updateEntry(id, updates);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  // Delete entry
  const handleDeleteEntry = async (id: string) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this entry? This action cannot be undone.');
      if (confirmed) {
        try {
          await deleteEntry(id);
        } catch (error: any) {
          window.alert('Error: ' + error.message);
        }
      }
    } else {
      Alert.alert(
        'Delete Entry',
        'Are you sure you want to delete this entry?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteEntry(id);
              } catch (error: any) {
                Alert.alert('Error', error.message);
              }
            }
          }
        ]
      );
    }
  };

  // Add status update
  const handleAddStatusUpdate = async (entryId: string) => {
    if (Platform.OS === 'web') {
      const note = window.prompt('Enter status update:');
      if (note) {
        try {
          await addStatusUpdateToEntry(entryId, note);
          // Auto-update Final Status to Ongoing if it was Not Started
          const entry = entries.find(e => e.id === entryId);
          if (entry && entry.finalStatus === 'Not Started') {
            await updateEntry(entryId, { finalStatus: 'Ongoing' });
          }
        } catch (error: any) {
          Alert.alert('Error', error.message);
        }
      }
    } else {
      Alert.prompt(
        'Status Update',
        'Enter status update:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add',
            onPress: async (note) => {
              if (note) {
                try {
                  await addStatusUpdateToEntry(entryId, note);
                  // Auto-update Final Status to Ongoing if it was Not Started
                  const entry = entries.find(e => e.id === entryId);
                  if (entry && entry.finalStatus === 'Not Started') {
                    await updateEntry(entryId, { finalStatus: 'Ongoing' });
                  }
                } catch (error: any) {
                  Alert.alert('Error', error.message);
                }
              }
            }
          }
        ],
        'plain-text'
      );
    }
  };

  // Add sub-activity status update
  const handleAddSubActivityStatusUpdate = async (entryId: string, subId: string) => {
    if (Platform.OS === 'web') {
      const note = window.prompt('Enter status update for sub-activity:');
      if (note) {
        try {
          const entry = entries.find(e => e.id === entryId);
          if (!entry) return;
          
          const currentUserId = require('../../services/firebase').auth.currentUser?.uid || 'unknown';
          
          const updatedSubActivities = (entry.subActivities || []).map(sub => {
            if (sub.id === subId) {
              const newUpdate = {
                id: Date.now().toString(),
                timestamp: new Date(),
                note: note,
                updatedBy: currentUserId
              };
              return { 
                ...sub, 
                statusUpdates: [...(sub.statusUpdates || []), newUpdate]
              };
            }
            return sub;
          });
          
          // Auto-update sub-activity status to Ongoing if it was Not Started
          const updatedSubActivitiesWithStatus = updatedSubActivities.map(sub => {
            if (sub.id === subId && sub.status === 'Not Started') {
              return { ...sub, status: 'Ongoing' };
            }
            return sub;
          });
          
          await updateEntry(entryId, { subActivities: updatedSubActivitiesWithStatus });
          
          // Auto-update Final Status to Ongoing if it was Not Started
          if (entry.finalStatus === 'Not Started') {
            await updateEntry(entryId, { finalStatus: 'Ongoing' });
          }
        } catch (error: any) {
          Alert.alert('Error', error.message);
        }
      }
    }
  };

  // Add sub-activity
  const handleAddSubActivity = async (entryId: string) => {
    console.log('[DWS] handleAddSubActivity called for entry:', entryId);
    try {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) {
        console.log('[DWS] Entry not found:', entryId);
        return;
      }
      
      console.log('[DWS] Adding sub-activity to entry:', entry.projectName);
      
      const newSubActivity: any = {
        id: Date.now().toString(),
        description: '',
        assignedTo: personnel[0]?.name || '',
        hours: 0,
        status: statuses[0]?.name || '',
        statusUpdates: []
      };
      
      // Don't include targetDate if it's undefined - Firestore doesn't support undefined
      // It will be added when user sets a date
      
      const updatedSubActivities = [...(entry.subActivities || []), newSubActivity];
      console.log('[DWS] Updated sub-activities count:', updatedSubActivities.length);
      await updateEntry(entryId, { subActivities: updatedSubActivities });
      console.log('[DWS] Sub-activity added successfully');
    } catch (error: any) {
      console.error('[DWS] Error adding sub-activity:', error);
      Alert.alert('Error', error.message);
    }
  };

  // Update sub-activity
  const handleUpdateSubActivity = async (entryId: string, subId: string, field: string, value: any) => {
    try {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) return;
      
      const updatedSubActivities = (entry.subActivities || []).map(sub => {
        if (sub.id === subId) {
          return { ...sub, [field]: value };
        }
        return sub;
      });
      
      await updateEntry(entryId, { subActivities: updatedSubActivities });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  // Delete sub-activity
  const handleDeleteSubActivity = async (entryId: string, subId: string) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this sub-activity?');
      if (!confirmed) return;
    } else {
      // For native platforms, we'll delete directly for now (can add Alert.alert if needed)
    }
    
    try {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) return;
      
      const updatedSubActivities = (entry.subActivities || []).filter(sub => sub.id !== subId);
      await updateEntry(entryId, { subActivities: updatedSubActivities });
    } catch (error: any) {
      if (Platform.OS === 'web') {
        window.alert('Error: ' + error.message);
      } else {
        Alert.alert('Error', error.message);
      }
    }
  };

  // Helper to format status update timestamp
  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleString();
    } catch {
      return '';
    }
  };

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    if (filterProject && !entry.projectName.toLowerCase().includes(filterProject.toLowerCase())) return false;
    if (filterDate && !entry.dateTime.toLowerCase().includes(filterDate.toLowerCase())) return false;
    if (filterActivity && !entry.mainActivity.toLowerCase().includes(filterActivity.toLowerCase())) return false;
    if (filterAssigned && !entry.assignedTo.toLowerCase().includes(filterAssigned.toLowerCase())) return false;
    if (filterStatus && entry.finalStatus !== filterStatus) return false;
    return true;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.ACTION_BLUE} />
        <Text style={styles.loadingText}>Loading entries...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>📝 Daily Entry - Log Activities</Text>
      
      {/* Filters */}
      <View style={styles.filterRow}>
        <TextInput
          style={styles.filterInput}
          placeholder="Filter Project"
          value={filterProject}
          onChangeText={setFilterProject}
        />
        <TextInput
          style={styles.filterInput}
          placeholder="Filter Date/Time"
          value={filterDate}
          onChangeText={setFilterDate}
        />
        <TextInput
          style={styles.filterInput}
          placeholder="Filter Activity"
          value={filterActivity}
          onChangeText={setFilterActivity}
        />
        <TextInput
          style={styles.filterInput}
          placeholder="Filter Assigned"
          value={filterAssigned}
          onChangeText={setFilterAssigned}
        />
        <View style={styles.filterPickerContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterChip, !filterStatus && styles.filterChipActive]}
              onPress={() => setFilterStatus('')}
            >
              <Text style={[styles.filterChipText, !filterStatus && styles.filterChipTextActive]}>All</Text>
            </TouchableOpacity>
            {statuses.map(status => (
              <TouchableOpacity
                key={status.id}
                style={[styles.filterChip, filterStatus === status.name && styles.filterChipActive]}
                onPress={() => setFilterStatus(status.name)}
              >
                <Text style={[styles.filterChipText, filterStatus === status.name && styles.filterChipTextActive]}>
                  {status.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
      
      {/* Entries Table */}
      <ScrollView ref={scrollViewRef} style={styles.tableScroll}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={styles.tableContainer}>
            {/* Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { width: 150 }]}>Project</Text>
              <Text style={[styles.headerCell, { width: 100 }]}>Date & Time</Text>
              <Text style={[styles.headerCell, { width: 250 }]}>Main Activity</Text>
              <Text style={[styles.headerCell, { width: 120 }]}>Target Date</Text>
              <Text style={[styles.headerCell, { width: 130 }]}>Assigned To</Text>
              <Text style={[styles.headerCell, { width: 80 }]}>Actions</Text>
              <Text style={[styles.headerCell, { width: 60 }]}>Hours</Text>
              <Text style={[styles.headerCell, { width: 120 }]}>Final Status</Text>
            </View>
            
            {/* Entry Rows */}
            {filteredEntries.map((entry, index) => (
              <View key={entry.id} style={[index % 2 === 1 && styles.alternateRow]}>
                {/* Main Entry Row */}
                <View style={styles.tableRow}>
                  {/* Project Dropdown */}
                  <View style={[styles.cell, { width: 150 }]}>
                    <Dropdown
                      options={projects
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(p => ({ value: p.id, label: p.name }))}
                      value={entry.projectId}
                      onSelect={(value) => handleUpdateEntry(entry.id, 'projectId', value)}
                      placeholder="Select Project"
                      width={140}
                    />
                  </View>
                  
                  {/* Date/Time */}
                  <Text style={[styles.cell, { width: 100 }]}>{entry.dateTime}</Text>
                  
                  {/* Main Activity */}
                  <View style={[styles.cell, { width: 250 }]}>
                    {Platform.OS === 'web' ? (
                      <textarea
                        style={{
                          width: '100%',
                          minHeight: '36px',
                          padding: '6px 8px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontFamily: 'inherit',
                          resize: 'vertical'
                        }}
                        placeholder="Enter main activity..."
                        defaultValue={entry.mainActivity}
                        onBlur={(e: any) => {
                          if (e.target.value !== entry.mainActivity) {
                            handleUpdateEntry(entry.id, 'mainActivity', e.target.value);
                          }
                        }}
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                      />
                    ) : (
                      <TextInput
                        style={styles.cellInput}
                        placeholder="Enter main activity..."
                        value={entry.mainActivity}
                        onChangeText={(text) => handleUpdateEntry(entry.id, 'mainActivity', text)}
                        multiline
                        autoCorrect={false}
                        autoCapitalize="none"
                        spellCheck={false}
                      />
                    )}
                    {/* Status Updates */}
                    <View style={styles.statusUpdatesContainer}>
                      {entry.statusUpdates?.filter(u => u.note).map((update, idx) => {
                        const timestamp = formatTimestamp(update.timestamp);
                        return (
                          <View key={idx} style={styles.statusUpdate}>
                            <Text style={styles.statusTimestamp}>
                              {timestamp || 'Status Update'}
                            </Text>
                            <Text style={styles.statusUpdateNote}>{update.note}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                  
                  {/* Target Date */}
                  <View style={[styles.cell, { width: 120 }]}>
                    {Platform.OS === 'web' ? (
                      <input
                        type="date"
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontFamily: 'inherit',
                          cursor: 'pointer'
                        }}
                        value={entry.targetDate ? (() => {
                          try {
                            const date = new Date(entry.targetDate);
                            return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
                          } catch {
                            return '';
                          }
                        })() : ''}
                        onClick={(e: any) => e.stopPropagation()}
                        onChange={(e: any) => {
                          e.stopPropagation();
                          const dateValue = e.target.value;
                          if (dateValue) {
                            const date = new Date(dateValue);
                            handleUpdateEntry(entry.id, 'targetDate', date);
                          } else {
                            handleUpdateEntry(entry.id, 'targetDate', null);
                          }
                        }}
                      />
                    ) : (
                      <TextInput
                        style={styles.cellInput}
                        placeholder="DD/MM/YYYY"
                        value={entry.targetDate ? (() => {
                          try {
                            const date = new Date(entry.targetDate);
                            return !isNaN(date.getTime()) ? date.toLocaleDateString('en-GB') : '';
                          } catch {
                            return '';
                          }
                        })() : ''}
                        onChangeText={(text) => {
                          const parts = text.split('/');
                          if (parts.length === 3) {
                            const day = parseInt(parts[0], 10);
                            const month = parseInt(parts[1], 10) - 1;
                            const year = parseInt(parts[2], 10);
                            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                              const date = new Date(year, month, day);
                              handleUpdateEntry(entry.id, 'targetDate', date);
                            }
                          }
                        }}
                      />
                    )}
                  </View>
                  
                  {/* Assigned To */}
                  <View style={[styles.cell, { width: 130 }]}>
                    <Dropdown
                      options={personnel.map(p => ({ value: p.name, label: p.name }))}
                      value={entry.assignedTo}
                      onSelect={(value) => handleUpdateEntry(entry.id, 'assignedTo', value)}
                      placeholder="Select Person"
                      width={120}
                    />
                  </View>
                  
                  {/* Actions */}
                  <View style={[styles.cell, styles.actionsCell, { width: 80 }]}>
                    {Platform.OS === 'web' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        <button 
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#2563EB',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                          onClick={(e: any) => {
                            e.stopPropagation();
                            handleAddStatusUpdate(entry.id);
                          }}
                          title="Add Status Update"
                        >
                          + Status
                        </button>
                        <button 
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#10B981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                          onClick={(e: any) => {
                            console.log('[DWS] + Sub button clicked for entry:', entry.id);
                            e.stopPropagation();
                            handleAddSubActivity(entry.id);
                          }}
                          title="Add Sub Activity"
                        >
                          + Sub
                        </button>
                        <button 
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#EF4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                          onClick={(e: any) => {
                            e.stopPropagation();
                            handleDeleteEntry(entry.id);
                          }}
                          title="Delete Entry"
                        >
                          🗑️
                        </button>
                      </div>
                    ) : (
                      <>
                        <TouchableOpacity 
                          style={styles.actionBtn}
                          onPress={() => handleAddStatusUpdate(entry.id)}
                        >
                          <Text style={styles.actionBtnText}>+ Status</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.actionBtn, styles.actionBtnSuccess]}
                          onPress={() => handleAddSubActivity(entry.id)}
                        >
                          <Text style={styles.actionBtnText}>+ Sub</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.actionBtn, styles.actionBtnDanger]}
                          onPress={() => handleDeleteEntry(entry.id)}
                        >
                          <Text style={styles.actionBtnText}>🗑️</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                  
                  {/* Hours */}
                  <View style={[styles.cell, { width: 60 }]}>
                    {Platform.OS === 'web' ? (
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        placeholder="0"
                        value={entry.hours !== undefined && entry.hours !== null ? entry.hours : ''}
                        onChange={(e: any) => {
                          const value = e.target.value;
                          if (value === '') {
                            handleUpdateEntry(entry.id, 'hours', 0);
                          } else {
                            let numValue = parseFloat(value);
                            if (!isNaN(numValue)) {
                              // Convert 0.60 minutes to 1.0 hour, 0.65 to 1.05, etc.
                              const hours = Math.floor(numValue);
                              const minutes = Math.round((numValue - hours) * 100);
                              if (minutes >= 60) {
                                numValue = hours + 1 + (minutes - 60) / 100;
                              }
                              handleUpdateEntry(entry.id, 'hours', Math.round(numValue * 100) / 100);
                            }
                          }
                        }}
                        onKeyDown={(e: any) => {
                          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                            e.preventDefault();
                            const currentValue = entry.hours || 0;
                            const step = e.key === 'ArrowUp' ? 0.05 : -0.05;
                            let newValue = Math.round((currentValue + step) * 100) / 100;
                            
                            // Convert minutes to hours when reaching 0.60
                            const hours = Math.floor(newValue);
                            const minutes = Math.round((newValue - hours) * 100);
                            if (minutes >= 60) {
                              newValue = hours + 1;
                            } else if (minutes < 0 && hours > 0) {
                              newValue = hours - 1 + 0.55;
                            }
                            
                            if (newValue >= 0) {
                              handleUpdateEntry(entry.id, 'hours', newValue);
                            }
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          fontSize: '13px',
                          border: '1px solid #E5E7EB',
                          borderRadius: '4px',
                          textAlign: 'center',
                          fontFamily: 'inherit'
                        }}
                      />
                    ) : (
                      <TextInput
                        style={[styles.cellInput, { textAlign: 'center' }]}
                        placeholder="0"
                        value={entry.hours !== undefined && entry.hours !== null ? String(entry.hours) : ''}
                        onChangeText={(text) => {
                          if (text === '') {
                            handleUpdateEntry(entry.id, 'hours', 0);
                            return;
                          }
                          const cleaned = text.replace(/[^0-9.]/g, '');
                          const parts = cleaned.split('.');
                          if (parts.length > 2) return;
                          const numValue = parseFloat(cleaned);
                          if (!isNaN(numValue)) {
                            handleUpdateEntry(entry.id, 'hours', numValue);
                          }
                        }}
                        keyboardType="decimal-pad"
                      />
                    )}
                  </View>
                  
                  {/* Final Status */}
                  <View style={[styles.cell, { width: 120 }]}>
                    <Dropdown
                      options={statuses.map(s => ({ value: s.name, label: s.name, color: s.color }))}
                      value={entry.finalStatus}
                      onSelect={(value) => handleUpdateEntry(entry.id, 'finalStatus', value)}
                      placeholder="Select Status"
                      width={110}
                      showColorBadge={true}
                    />
                  </View>
                </View>
                
                {/* Sub-Activity Rows */}
                {entry.subActivities?.map((sub) => (
                  <View key={sub.id} style={[styles.tableRow, styles.subRow]}>
                    <View style={[styles.cell, { width: 150 }]} />
                    <View style={[styles.cell, { width: 100 }]} />
                    
                    {/* Sub Activity Description */}
                    <View style={[styles.cell, { width: 250 }]}>
                      {Platform.OS === 'web' ? (
                        <textarea
                          style={{
                            width: '100%',
                            minHeight: '36px',
                            padding: '6px 8px',
                            border: '1px solid #E5E7EB',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontFamily: 'inherit',
                            resize: 'vertical'
                          }}
                          placeholder="Enter sub activity..."
                          defaultValue={sub.description}
                          onBlur={(e: any) => {
                            if (e.target.value !== sub.description) {
                              handleUpdateSubActivity(entry.id, sub.id, 'description', e.target.value);
                            }
                          }}
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck={false}
                        />
                      ) : (
                        <TextInput
                          style={styles.cellInput}
                          placeholder="Enter sub activity..."
                          value={sub.description}
                          onChangeText={(text) => handleUpdateSubActivity(entry.id, sub.id, 'description', text)}
                          multiline
                        />
                      )}
                      {/* Sub-Activity Status Updates */}
                      <View style={styles.statusUpdatesContainer}>
                        {sub.statusUpdates?.filter(u => u.note).map((update, idx) => {
                          const timestamp = formatTimestamp(update.timestamp);
                          return (
                            <View key={idx} style={styles.statusUpdate}>
                              <Text style={styles.statusTimestamp}>
                                {timestamp || 'Status Update'}
                              </Text>
                              <Text style={styles.statusUpdateNote}>{update.note}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                    
                    {/* Target Date */}
                    <View style={[styles.cell, { width: 120 }]}>
                      {Platform.OS === 'web' ? (
                        <input
                          type="date"
                          value={sub.targetDate ? (() => {
                            try {
                              const date = new Date(sub.targetDate);
                              return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';
                            } catch {
                              return '';
                            }
                          })() : ''}
                          onClick={(e: any) => {
                            e.stopPropagation();
                          }}
                          onChange={(e: any) => {
                            const dateValue = e.target.value;
                            if (dateValue) {
                              const date = new Date(dateValue);
                              handleUpdateSubActivity(entry.id, sub.id, 'targetDate', date);
                            } else {
                              handleUpdateSubActivity(entry.id, sub.id, 'targetDate', undefined);
                            }
                          }}
                          onFocus={(e: any) => {
                            e.stopPropagation();
                          }}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            fontSize: '13px',
                            border: '1px solid #E5E7EB',
                            borderRadius: '4px',
                            fontFamily: 'inherit',
                            cursor: 'pointer'
                          }}
                        />
                      ) : (
                        <TextInput
                          style={styles.cellInput}
                          placeholder="DD/MM/YYYY"
                          value={sub.targetDate ? (() => {
                            try {
                              const date = new Date(sub.targetDate);
                              return !isNaN(date.getTime()) ? date.toLocaleDateString('en-GB') : '';
                            } catch {
                              return '';
                            }
                          })() : ''}
                          onChangeText={(text) => {
                            const parts = text.split('/');
                            if (parts.length === 3) {
                              const day = parseInt(parts[0], 10);
                              const month = parseInt(parts[1], 10) - 1;
                              const year = parseInt(parts[2], 10);
                              if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                                const date = new Date(year, month, day);
                                handleUpdateSubActivity(entry.id, sub.id, 'targetDate', date);
                              }
                            }
                          }}
                        />
                      )}
                    </View>
                    
                    {/* Assigned To */}
                    <View style={[styles.cell, { width: 130 }]}>
                      <Dropdown
                        options={personnel.map(p => ({ value: p.name, label: p.name }))}
                        value={sub.assignedTo}
                        onSelect={(value) => handleUpdateSubActivity(entry.id, sub.id, 'assignedTo', value)}
                        placeholder="Select Person"
                        width={120}
                      />
                    </View>
                    
                    {/* Actions */}
                    <View style={[styles.cell, styles.actionsCell, { width: 80 }]}>
                      {Platform.OS === 'web' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                          <button 
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#2563EB',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                            onClick={(e: any) => {
                              e.stopPropagation();
                              handleAddSubActivityStatusUpdate(entry.id, sub.id);
                            }}
                            title="Add Status Update"
                          >
                            + Status
                          </button>
                          <button 
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#EF4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                            onClick={(e: any) => {
                              e.stopPropagation();
                              handleDeleteSubActivity(entry.id, sub.id);
                            }}
                            title="Delete Sub Activity"
                          >
                            🗑️
                          </button>
                        </div>
                      ) : (
                        <>
                          <TouchableOpacity 
                            style={styles.actionBtn}
                            onPress={() => handleAddSubActivityStatusUpdate(entry.id, sub.id)}
                          >
                            <Text style={styles.actionBtnText}>+ Status</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.actionBtn, styles.actionBtnDanger]}
                            onPress={() => handleDeleteSubActivity(entry.id, sub.id)}
                          >
                            <Text style={styles.actionBtnText}>🗑️</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                    
                    {/* Hours */}
                    <View style={[styles.cell, { width: 60 }]}>
                      {Platform.OS === 'web' ? (
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          placeholder="0"
                          value={sub.hours !== undefined && sub.hours !== null ? sub.hours : ''}
                          onChange={(e: any) => {
                            const value = e.target.value;
                            if (value === '') {
                              handleUpdateSubActivity(entry.id, sub.id, 'hours', 0);
                            } else {
                              let numValue = parseFloat(value);
                              if (!isNaN(numValue)) {
                                // Convert 0.60 minutes to 1.0 hour, 0.65 to 1.05, etc.
                                const hours = Math.floor(numValue);
                                const minutes = Math.round((numValue - hours) * 100);
                                if (minutes >= 60) {
                                  numValue = hours + 1 + (minutes - 60) / 100;
                                }
                                handleUpdateSubActivity(entry.id, sub.id, 'hours', Math.round(numValue * 100) / 100);
                              }
                            }
                          }}
                          onKeyDown={(e: any) => {
                            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                              e.preventDefault();
                              const currentValue = sub.hours || 0;
                              const step = e.key === 'ArrowUp' ? 0.05 : -0.05;
                              let newValue = Math.round((currentValue + step) * 100) / 100;
                              
                              // Convert minutes to hours when reaching 0.60
                              const hours = Math.floor(newValue);
                              const minutes = Math.round((newValue - hours) * 100);
                              if (minutes >= 60) {
                                newValue = hours + 1;
                              } else if (minutes < 0 && hours > 0) {
                                newValue = hours - 1 + 0.55;
                              }
                              
                              if (newValue >= 0) {
                                handleUpdateSubActivity(entry.id, sub.id, 'hours', newValue);
                              }
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '6px 8px',
                            fontSize: '13px',
                            border: '1px solid #E5E7EB',
                            borderRadius: '4px',
                            textAlign: 'center',
                            fontFamily: 'inherit'
                          }}
                        />
                      ) : (
                        <TextInput
                          style={[styles.cellInput, { textAlign: 'center' }]}
                          placeholder="0"
                          value={sub.hours !== undefined && sub.hours !== null ? String(sub.hours) : ''}
                          onChangeText={(text) => {
                            if (text === '') {
                              handleUpdateSubActivity(entry.id, sub.id, 'hours', 0);
                              return;
                            }
                            const cleaned = text.replace(/[^0-9.]/g, '');
                            const parts = cleaned.split('.');
                            if (parts.length > 2) return;
                            const numValue = parseFloat(cleaned);
                            if (!isNaN(numValue)) {
                              handleUpdateSubActivity(entry.id, sub.id, 'hours', numValue);
                            }
                          }}
                          keyboardType="decimal-pad"
                        />
                      )}
                    </View>
                    
                    {/* Status */}
                    <View style={[styles.cell, { width: 120 }]}>
                      <Dropdown
                        options={statuses.map(s => ({ value: s.name, label: s.name, color: s.color }))}
                        value={sub.status}
                        onSelect={(value) => handleUpdateSubActivity(entry.id, sub.id, 'status', value)}
                        placeholder="Select Status"
                        width={110}
                        showColorBadge={true}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ))}
            
            {filteredEntries.length === 0 && (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>No entries found. Click + to add a new entry.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </ScrollView>
      
      {/* Add Button */}
      {Platform.OS === 'web' ? (
        <button
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '60px',
            height: '60px',
            borderRadius: '30px',
            backgroundColor: '#28a745',
            color: '#fff',
            fontSize: '30px',
            fontWeight: '300',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={handleAddNewRow}
          disabled={saving}
          title="Add New Entry"
        >
          {saving ? '...' : '+'}
        </button>
      ) : (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddNewRow}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>+</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
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
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md
  },
  filterInput: {
    flex: 1,
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 13,
    backgroundColor: '#fff'
  },
  filterPickerContainer: {
    minWidth: 150
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: '#E9ECEF',
    borderRadius: 16,
    marginRight: spacing.xs
  },
  filterChipActive: {
    backgroundColor: colors.ACTION_BLUE
  },
  filterChipText: {
    fontSize: 12,
    color: colors.TEXT_PRIMARY
  },
  filterChipTextActive: {
    color: '#fff'
  },
  tableScroll: {
    flex: 1
  },
  tableContainer: {
    backgroundColor: '#fff',
    margin: spacing.lg,
    marginTop: 0,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: { boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }
    })
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
    paddingHorizontal: spacing.sm,
    textAlign: 'left'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    minHeight: 60,
    alignItems: 'flex-start',
    paddingVertical: spacing.sm
  },
  alternateRow: {
    backgroundColor: '#F9FAFB'
  },
  subRow: {
    backgroundColor: '#F8F9FA'
  },
  cell: {
    paddingHorizontal: spacing.sm,
    justifyContent: 'center'
  },
  cellInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 13,
    backgroundColor: '#fff',
    minHeight: 36
  },
  actionsCell: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4
  },
  actionBtn: {
    backgroundColor: colors.ACTION_BLUE,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4
  },
  actionBtnSuccess: {
    backgroundColor: '#28a745'
  },
  actionBtnDanger: {
    backgroundColor: '#dc3545'
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500'
  },
  selectChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginRight: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB'
  },
  selectChipActive: {
    backgroundColor: colors.ACTION_BLUE,
    borderColor: colors.ACTION_BLUE
  },
  selectChipText: {
    fontSize: 11,
    color: colors.TEXT_PRIMARY
  },
  selectChipTextActive: {
    color: '#fff'
  },
  statusChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: '#fff',
    borderRadius: 4,
    marginRight: 4,
    borderWidth: 2
  },
  statusChipText: {
    fontSize: 11,
    color: colors.TEXT_PRIMARY
  },
  statusUpdatesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs
  },
  statusUpdate: {
    backgroundColor: '#FFF3CD',
    padding: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
    borderRadius: 4,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    width: 230
  },
  statusTimestamp: {
    fontSize: 12,
    color: colors.TEXT_PRIMARY,
    fontWeight: '600',
    marginBottom: 2
  },
  statusUpdateNote: {
    fontSize: 12,
    color: colors.TEXT_PRIMARY,
    fontWeight: '400'
  },
  statusUpdateText: {
    fontSize: 11,
    color: colors.TEXT_PRIMARY
  },
  emptyRow: {
    padding: spacing.xl,
    alignItems: 'center'
  },
  emptyText: {
    color: colors.TEXT_SECONDARY,
    fontStyle: 'italic'
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.3)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8
      }
    })
  },
  addButtonText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '300',
    marginTop: -2
  }
});
