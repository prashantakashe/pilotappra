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
  const selectedOption = options.find(o => o.value === value);
  
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
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={dropdownStyles.overlay} onPress={() => setIsOpen(false)}>
          <View style={dropdownStyles.modal}>
            <Text style={dropdownStyles.modalTitle}>{placeholder}</Text>
            <ScrollView style={dropdownStyles.optionsList}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    dropdownStyles.option,
                    value === option.value && dropdownStyles.optionSelected
                  ]}
                  onPress={() => {
                    onSelect(option.value);
                    setIsOpen(false);
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
              ))}
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
  }
});

export const DWSDailyEntryTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
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
  const [filterStatus, setFilterStatus] = useState('');
  
  const { isMobile } = useResponsive();

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
  };

  // Add status update
  const handleAddStatusUpdate = (entryId: string) => {
    if (Platform.OS === 'web') {
      const note = window.prompt('Enter status update:');
      if (note) {
        addStatusUpdateToEntry(entryId, note).catch(error => {
          Alert.alert('Error', error.message);
        });
      }
    } else {
      Alert.prompt(
        'Status Update',
        'Enter status update:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add',
            onPress: (note) => {
              if (note) {
                addStatusUpdateToEntry(entryId, note).catch(error => {
                  Alert.alert('Error', error.message);
                });
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
          
          await updateEntry(entryId, { subActivities: updatedSubActivities });
        } catch (error: any) {
          Alert.alert('Error', error.message);
        }
      }
    }
  };

  // Add sub-activity
  const handleAddSubActivity = async (entryId: string) => {
    try {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) return;
      
      const newSubActivity: DWSSubActivity = {
        id: Date.now().toString(),
        description: '',
        assignedTo: personnel[0]?.name || '',
        hours: 0,
        status: statuses[0]?.name || '',
        statusUpdates: []
      };
      
      const updatedSubActivities = [...(entry.subActivities || []), newSubActivity];
      await updateEntry(entryId, { subActivities: updatedSubActivities });
    } catch (error: any) {
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
    try {
      const entry = entries.find(e => e.id === entryId);
      if (!entry) return;
      
      const updatedSubActivities = (entry.subActivities || []).filter(sub => sub.id !== subId);
      await updateEntry(entryId, { subActivities: updatedSubActivities });
    } catch (error: any) {
      Alert.alert('Error', error.message);
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
      <ScrollView style={styles.tableScroll}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={styles.tableContainer}>
            {/* Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { width: 150 }]}>Project</Text>
              <Text style={[styles.headerCell, { width: 120 }]}>Date & Time</Text>
              <Text style={[styles.headerCell, { width: 250 }]}>Main Activity</Text>
              <Text style={[styles.headerCell, { width: 130 }]}>Assigned To</Text>
              <Text style={[styles.headerCell, { width: 180 }]}>Actions</Text>
              <Text style={[styles.headerCell, { width: 80 }]}>Hours</Text>
              <Text style={[styles.headerCell, { width: 120 }]}>Final Status</Text>
            </View>
            
            {/* Entry Rows */}
            {filteredEntries.map((entry) => (
              <View key={entry.id}>
                {/* Main Entry Row */}
                <View style={styles.tableRow}>
                  {/* Project Dropdown */}
                  <View style={[styles.cell, { width: 150 }]}>
                    <Dropdown
                      options={projects.map(p => ({ value: p.id, label: p.name }))}
                      value={entry.projectId}
                      onSelect={(value) => handleUpdateEntry(entry.id, 'projectId', value)}
                      placeholder="Select Project"
                      width={140}
                    />
                  </View>
                  
                  {/* Date/Time */}
                  <Text style={[styles.cell, { width: 120 }]}>{entry.dateTime}</Text>
                  
                  {/* Main Activity */}
                  <View style={[styles.cell, { width: 250 }]}>
                    <TextInput
                      style={styles.cellInput}
                      placeholder="Enter main activity..."
                      value={entry.mainActivity}
                      onChangeText={(text) => handleUpdateEntry(entry.id, 'mainActivity', text)}
                      multiline
                    />
                    {/* Status Updates */}
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
                  <View style={[styles.cell, styles.actionsCell, { width: 180 }]}>
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
                  </View>
                  
                  {/* Hours */}
                  <View style={[styles.cell, { width: 80 }]}>
                    <TextInput
                      style={[styles.cellInput, { textAlign: 'center' }]}
                      placeholder="0"
                      value={entry.hours?.toString() || '0'}
                      onChangeText={(text) => handleUpdateEntry(entry.id, 'hours', parseFloat(text) || 0)}
                      keyboardType="numeric"
                    />
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
                    <View style={[styles.cell, { width: 120 }]} />
                    
                    {/* Sub Activity Description */}
                    <View style={[styles.cell, { width: 250 }]}>
                      <TextInput
                        style={styles.cellInput}
                        placeholder="Enter sub activity..."
                        value={sub.description}
                        onChangeText={(text) => handleUpdateSubActivity(entry.id, sub.id, 'description', text)}
                        multiline
                      />
                      {/* Sub-Activity Status Updates */}
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
                    <View style={[styles.cell, styles.actionsCell, { width: 180 }]}>
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
                        <Text style={styles.actionBtnText}>Delete Sub</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Hours */}
                    <View style={[styles.cell, { width: 80 }]}>
                      <TextInput
                        style={[styles.cellInput, { textAlign: 'center' }]}
                        placeholder="0"
                        value={sub.hours?.toString() || '0'}
                        onChangeText={(text) => handleUpdateSubActivity(entry.id, sub.id, 'hours', parseFloat(text) || 0)}
                        keyboardType="numeric"
                      />
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
  statusUpdate: {
    backgroundColor: '#FFF3CD',
    padding: spacing.sm,
    marginTop: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
    borderRadius: 4
  },
  statusTimestamp: {
    fontSize: 12,
    color: colors.TEXT_PRIMARY,
    fontWeight: '400',
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
