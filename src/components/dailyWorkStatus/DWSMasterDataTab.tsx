// src/components/dailyWorkStatus/DWSMasterDataTab.tsx
/**
 * Master Data Tab for Daily Work Status module
 * Contains sub-tabs for Projects, Personnel, and Statuses
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
import {
  dailyWorkStatusService,
  addProject,
  updateProject,
  deleteProject,
  addPersonnel,
  updatePersonnel,
  deletePersonnel,
  addStatus,
  updateStatus,
  deleteStatus
} from '../../services/dailyWorkStatusService';
import type { DWSProject, DWSPersonnel, DWSStatus } from '../../types/dailyWorkStatus';
import { PROJECT_CATEGORIES } from '../../types/dailyWorkStatus';

type MasterSubTab = 'projects' | 'personnel' | 'statuses';

export const DWSMasterDataTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<MasterSubTab>('projects');
  const [loading, setLoading] = useState(true);
  
  // Projects state
  const [projects, setProjects] = useState<DWSProject[]>([]);
  const [projectForm, setProjectForm] = useState({
    name: '',
    client: '',
    projectManager: '',
    location: '',
    startDate: '',
    endDate: '',
    category: ''
  });
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  
  // Personnel state
  const [personnel, setPersonnel] = useState<DWSPersonnel[]>([]);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonEmail, setNewPersonEmail] = useState('');
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [editingPersonName, setEditingPersonName] = useState('');
  const [editingPersonEmail, setEditingPersonEmail] = useState('');

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
  
  // Statuses state
  const [statuses, setStatuses] = useState<DWSStatus[]>([]);
  const [newStatusName, setNewStatusName] = useState('');
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editingStatusName, setEditingStatusName] = useState('');
  
  const { isMobile } = useResponsive();

  // Subscribe to data
  useEffect(() => {
    setLoading(true);
    
    const unsubProjects = dailyWorkStatusService.subscribeToProjects(setProjects);
    const unsubPersonnel = dailyWorkStatusService.subscribeToPersonnel(setPersonnel);
    const unsubStatuses = dailyWorkStatusService.subscribeToStatuses((data) => {
      setStatuses(data);
      setLoading(false);
    });
    
    // Initialize default statuses if needed
    dailyWorkStatusService.initializeDefaultStatuses();
    
    return () => {
      unsubProjects();
      unsubPersonnel();
      unsubStatuses();
    };
  }, []);

  // ==================== Projects ====================
  
  const handleAddProject = async () => {
    if (!projectForm.name.trim()) {
      Alert.alert('Error', 'Project name is required');
      return;
    }
    
    try {
      // Combine startDate and endDate into timeline
      const timeline = projectForm.startDate && projectForm.endDate 
        ? `${projectForm.startDate} to ${projectForm.endDate}` 
        : '';
      const projectData = { ...projectForm, timeline };
      
      if (editingProjectId) {
        await updateProject(editingProjectId, projectData);
        Alert.alert('Success', 'Project updated successfully');
        setEditingProjectId(null);
      } else {
        await addProject(projectData);
        Alert.alert('Success', 'Project added successfully');
      }
      setProjectForm({ name: '', client: '', projectManager: '', location: '', startDate: '', endDate: '', category: '' });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };
  
  const handleEditProject = (project: DWSProject) => {
    // Parse timeline into startDate and endDate
    let startDate = '';
    let endDate = '';
    if (project.timeline) {
      const parts = project.timeline.split(' to ');
      if (parts.length === 2) {
        startDate = parts[0].trim();
        endDate = parts[1].trim();
      }
    }
    setProjectForm({
      name: project.name,
      client: project.client,
      projectManager: project.projectManager,
      location: project.location,
      startDate,
      endDate,
      category: project.category
    });
    setEditingProjectId(project.id);
  };
  
  const handleDeleteProject = async (id: string) => {
    // Use window.confirm for web, Alert.alert for native
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this project?');
      if (!confirmed) return;
      
      try {
        await deleteProject(id);
        window.alert('Project deleted successfully');
      } catch (error: any) {
        window.alert('Error: ' + error.message);
      }
    } else {
      Alert.alert(
        'Delete Project',
        'Are you sure you want to delete this project?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteProject(id);
                Alert.alert('Success', 'Project deleted');
              } catch (error: any) {
                Alert.alert('Error', error.message);
              }
            }
          }
        ]
      );
    }
  };
  
  const handleCancelEditProject = () => {
    setEditingProjectId(null);
    setProjectForm({ name: '', client: '', projectManager: '', location: '', startDate: '', endDate: '', category: '' });
  };

  // ==================== Personnel ====================
  
  const handleAddPerson = async () => {
    if (!newPersonName.trim()) {
      Alert.alert('Error', 'Person name is required');
      return;
    }
    
    try {
      await addPersonnel({ 
        name: newPersonName.trim(),
        email: newPersonEmail.trim() || undefined
      });
      setNewPersonName('');
      setNewPersonEmail('');
      Alert.alert('Success', 'Person added successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };
  
  const handleUpdatePerson = async (id: string) => {
    if (!editingPersonName.trim()) {
      Alert.alert('Error', 'Person name is required');
      return;
    }
    
    try {
      await updatePersonnel(id, { 
        name: editingPersonName.trim(),
        email: editingPersonEmail.trim() || undefined
      });
      setEditingPersonId(null);
      setEditingPersonName('');
      setEditingPersonEmail('');
      Alert.alert('Success', 'Person updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };
  
  const handleDeletePerson = async (id: string) => {
    // Use window.confirm for web, Alert.alert for native
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this person?');
      if (!confirmed) return;
      
      try {
        await deletePersonnel(id);
        window.alert('Person deleted successfully');
      } catch (error: any) {
        window.alert('Error: ' + error.message);
      }
    } else {
      Alert.alert(
        'Delete Person',
        'Are you sure you want to delete this person?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deletePersonnel(id);
                Alert.alert('Success', 'Person deleted');
              } catch (error: any) {
                Alert.alert('Error', error.message);
              }
            }
          }
        ]
      );
    }
  };

  // ==================== Statuses ====================
  
  const handleAddStatus = async () => {
    if (!newStatusName.trim()) {
      Alert.alert('Error', 'Status name is required');
      return;
    }
    
    try {
      await addStatus({ name: newStatusName.trim(), order: statuses.length });
      setNewStatusName('');
      Alert.alert('Success', 'Status added successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };
  
  const handleUpdateStatus = async (id: string) => {
    if (!editingStatusName.trim()) {
      Alert.alert('Error', 'Status name is required');
      return;
    }
    
    try {
      await updateStatus(id, { name: editingStatusName.trim() });
      setEditingStatusId(null);
      setEditingStatusName('');
      Alert.alert('Success', 'Status updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };
  
  const handleDeleteStatus = async (id: string) => {
    Alert.alert(
      'Delete Status',
      'Are you sure you want to delete this status?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStatus(id);
              Alert.alert('Success', 'Status deleted');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  // ==================== Render ====================

  const renderSubTabs = () => (
    <View style={styles.subTabContainer}>
      <TouchableOpacity
        style={[styles.subTab, activeSubTab === 'projects' && styles.subTabActive]}
        onPress={() => setActiveSubTab('projects')}
        {...(Platform.OS === 'web' && { title: 'Manage Projects' })}
      >
        <Text style={[styles.subTabText, activeSubTab === 'projects' && styles.subTabTextActive]}>
          Manage Projects
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.subTab, activeSubTab === 'personnel' && styles.subTabActive]}
        onPress={() => setActiveSubTab('personnel')}
        {...(Platform.OS === 'web' && { title: 'Manage Personnel' })}
      >
        <Text style={[styles.subTabText, activeSubTab === 'personnel' && styles.subTabTextActive]}>
          Assigned Personnel
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.subTab, activeSubTab === 'statuses' && styles.subTabActive]}
        onPress={() => setActiveSubTab('statuses')}
        {...(Platform.OS === 'web' && { title: 'Manage Statuses' })}
      >
        <Text style={[styles.subTabText, activeSubTab === 'statuses' && styles.subTabTextActive]}>
          Final Status
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderProjectsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>📁 Manage Projects</Text>
      
      {/* Project Form */}
      <View style={styles.formCard}>
        <View style={styles.formRow}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Project Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter project name"
              value={projectForm.name}
              onChangeText={(text) => setProjectForm({ ...projectForm, name: text })}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Client Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter client name"
              value={projectForm.client}
              onChangeText={(text) => setProjectForm({ ...projectForm, client: text })}
            />
          </View>
        </View>
        
        <View style={styles.formRow}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Project Manager</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter PM name"
              value={projectForm.projectManager}
              onChangeText={(text) => setProjectForm({ ...projectForm, projectManager: text })}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter location"
              value={projectForm.location}
              onChangeText={(text) => setProjectForm({ ...projectForm, location: text })}
            />
          </View>
        </View>
        
        <View style={styles.formRow}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Start Date</Text>
            <TextInput
              style={styles.input}
              placeholder="Select start date"
              value={projectForm.startDate}
              onFocus={(e) => {
                if (Platform.OS === 'web') {
                  (e.target as any).type = 'date';
                }
              }}
              onChangeText={(text) => setProjectForm({ ...projectForm, startDate: text })}
              {...(Platform.OS === 'web' ? { type: 'date' } as any : {})}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>End Date</Text>
            <TextInput
              style={styles.input}
              placeholder="Select end date"
              value={projectForm.endDate}
              onFocus={(e) => {
                if (Platform.OS === 'web') {
                  (e.target as any).type = 'date';
                }
              }}
              onChangeText={(text) => setProjectForm({ ...projectForm, endDate: text })}
              {...(Platform.OS === 'web' ? { type: 'date' } as any : {})}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {PROJECT_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryChip,
                      projectForm.category === cat.value && styles.categoryChipActive
                    ]}
                    onPress={() => setProjectForm({ ...projectForm, category: cat.value })}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      projectForm.category === cat.value && styles.categoryChipTextActive
                    ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
        
        <View style={styles.formActions}>
          <TouchableOpacity 
            style={styles.btnSuccess} 
            onPress={handleAddProject}
            {...(Platform.OS === 'web' && { title: editingProjectId ? 'Update Project' : 'Add New Project' })}
          >
            <Text style={styles.btnText}>{editingProjectId ? 'Update Project' : 'Add Project'}</Text>
          </TouchableOpacity>
          {editingProjectId && (
            <TouchableOpacity 
              style={styles.btnCancel} 
              onPress={handleCancelEditProject}
              {...(Platform.OS === 'web' && { title: 'Cancel Editing' })}
            >
              <Text style={styles.btnCancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Projects Table */}
      <View style={styles.tableContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: 150 }]}>Name</Text>
              <Text style={[styles.tableHeaderCell, { width: 120 }]}>Client</Text>
              <Text style={[styles.tableHeaderCell, { width: 120 }]}>PM</Text>
              <Text style={[styles.tableHeaderCell, { width: 100 }]}>Location</Text>
              <Text style={[styles.tableHeaderCell, { width: 180 }]}>Timeline</Text>
              <Text style={[styles.tableHeaderCell, { width: 100 }]}>Category</Text>
              <Text style={[styles.tableHeaderCell, { width: 120 }]}>Actions</Text>
            </View>
            {projects.map((project) => (
              <View key={project.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: 150 }]}>{project.name}</Text>
                <Text style={[styles.tableCell, { width: 120 }]}>{project.client || '-'}</Text>
                <Text style={[styles.tableCell, { width: 120 }]}>{project.projectManager || '-'}</Text>
                <Text style={[styles.tableCell, { width: 100 }]}>{project.location || '-'}</Text>
                <Text style={[styles.tableCell, { width: 180 }]}>{project.timeline || '-'}</Text>
                <Text style={[styles.tableCell, { width: 100 }]}>{project.category || '-'}</Text>
                <View style={[styles.tableCell, styles.actionsCell, { width: 120 }]}>
                  <TouchableOpacity 
                    style={styles.btnEdit} 
                    onPress={() => handleEditProject(project)}
                    {...(Platform.OS === 'web' && { title: 'Edit Project' })}
                  >
                    <Text style={styles.btnSmText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.btnDelete} 
                    onPress={() => handleDeleteProject(project.id)}
                    {...(Platform.OS === 'web' && { title: 'Delete Project' })}
                  >
                    <Text style={styles.btnSmText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {projects.length === 0 && (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>No projects added yet</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );

  const renderPersonnelTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>👥 Assigned Personnel</Text>
      
      {/* Add Person Form */}
      <View style={styles.inlineForm}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Enter person name"
          value={newPersonName}
          onChangeText={setNewPersonName}
        />
        <TextInput
          style={[styles.input, { flex: 1, marginLeft: 8 }]}
          placeholder="Enter email (optional)"
          value={newPersonEmail}
          onChangeText={setNewPersonEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity 
          style={styles.btnSuccess} 
          onPress={handleAddPerson}
          {...(Platform.OS === 'web' && { title: 'Add New Person' })}
        >
          <Text style={styles.btnText}>Add Person</Text>
        </TouchableOpacity>
      </View>
      
      {/* Personnel Table */}
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Name</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Email</Text>
          <Text style={[styles.tableHeaderCell, { width: 150 }]}>Actions</Text>
        </View>
        {personnel.map((person) => (
          <View key={person.id} style={styles.tableRow}>
            {editingPersonId === person.id ? (
              <>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  value={editingPersonName}
                  onChangeText={setEditingPersonName}
                  autoFocus
                />
                <TextInput
                  style={[styles.input, { flex: 1.5, marginRight: 8 }]}
                  value={editingPersonEmail}
                  onChangeText={setEditingPersonEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="Enter email"
                />
              </>
            ) : (
              <>
                <Text style={[styles.tableCell, { flex: 1 }]}>{person.name}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{person.email || '-'}</Text>
              </>
            )}
            <View style={[styles.tableCell, styles.actionsCell, { width: 150 }]}>
              {editingPersonId === person.id ? (
                <>
                  <TouchableOpacity 
                    style={styles.btnEdit} 
                    onPress={() => handleUpdatePerson(person.id)}
                    {...(Platform.OS === 'web' && { title: 'Save Changes' })}
                  >
                    <Text style={styles.btnSmText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.btnCancel} 
                    onPress={() => setEditingPersonId(null)}
                    {...(Platform.OS === 'web' && { title: 'Cancel Editing' })}
                  >
                    <Text style={styles.btnSmText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity 
                    style={styles.btnEdit} 
                    onPress={() => {
                      setEditingPersonId(person.id);
                      setEditingPersonName(person.name);
                      setEditingPersonEmail(person.email || '');
                    }}
                    {...(Platform.OS === 'web' && { title: 'Edit Person' })}
                  >
                    <Text style={styles.btnSmText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.btnDelete} 
                    onPress={() => handleDeletePerson(person.id)}
                    {...(Platform.OS === 'web' && { title: 'Delete Person' })}
                  >
                    <Text style={styles.btnSmText}>Delete</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        ))}
        {personnel.length === 0 && (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No personnel added yet</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderStatusesTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>🏷️ Final Status Options</Text>
      
      {/* Add Status Form */}
      <View style={styles.inlineForm}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="e.g., On Hold"
          value={newStatusName}
          onChangeText={setNewStatusName}
        />
        <TouchableOpacity 
          style={styles.btnSuccess} 
          onPress={handleAddStatus}
          {...(Platform.OS === 'web' && { title: 'Add New Status' })}
        >
          <Text style={styles.btnText}>Add Status</Text>
        </TouchableOpacity>
      </View>
      
      {/* Statuses Table */}
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Status</Text>
          <Text style={[styles.tableHeaderCell, { width: 150 }]}>Actions</Text>
        </View>
        {statuses.map((status) => (
          <View key={status.id} style={styles.tableRow}>
            {editingStatusId === status.id ? (
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                value={editingStatusName}
                onChangeText={setEditingStatusName}
                autoFocus
              />
            ) : (
              <View style={[styles.tableCell, { flex: 1, flexDirection: 'row', alignItems: 'center' }]}>
                {status.color && (
                  <View style={[styles.colorDot, { backgroundColor: status.color }]} />
                )}
                <Text>{status.name}</Text>
              </View>
            )}
            <View style={[styles.tableCell, styles.actionsCell, { width: 150 }]}>
              {editingStatusId === status.id ? (
                <>
                  <TouchableOpacity 
                    style={styles.btnEdit} 
                    onPress={() => handleUpdateStatus(status.id)}
                    {...(Platform.OS === 'web' && { title: 'Save Changes' })}
                  >
                    <Text style={styles.btnSmText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.btnCancel} 
                    onPress={() => setEditingStatusId(null)}
                    {...(Platform.OS === 'web' && { title: 'Cancel Editing' })}
                  >
                    <Text style={styles.btnSmText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity 
                    style={styles.btnEdit} 
                    onPress={() => {
                      setEditingStatusId(status.id);
                      setEditingStatusName(status.name);
                    }}
                    {...(Platform.OS === 'web' && { title: 'Edit Status' })}
                  >
                    <Text style={styles.btnSmText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.btnDelete} 
                    onPress={() => handleDeleteStatus(status.id)}
                    {...(Platform.OS === 'web' && { title: 'Delete Status' })}
                  >
                    <Text style={styles.btnSmText}>Delete</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        ))}
        {statuses.length === 0 && (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No statuses added yet</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.ACTION_BLUE} />
        <Text style={styles.loadingText}>Loading master data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {renderSubTabs()}
      {activeSubTab === 'projects' && renderProjectsTab()}
      {activeSubTab === 'personnel' && renderPersonnelTab()}
      {activeSubTab === 'statuses' && renderStatusesTab()}
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
  subTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  subTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: '#E9ECEF',
    borderRadius: 6
  },
  subTabActive: {
    backgroundColor: colors.ACTION_BLUE
  },
  subTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.TEXT_PRIMARY
  },
  subTabTextActive: {
    color: '#fff'
  },
  tabContent: {
    padding: spacing.lg
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.TEXT_PRIMARY,
    marginBottom: spacing.md
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
    })
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    flexWrap: 'wrap'
  },
  formGroup: {
    flex: 1,
    minWidth: 200
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY,
    marginBottom: spacing.xs
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    backgroundColor: '#fff'
  },
  pickerContainer: {
    flexDirection: 'row'
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: '#D1D5DB'
  },
  categoryChipActive: {
    backgroundColor: colors.ACTION_BLUE,
    borderColor: colors.ACTION_BLUE
  },
  categoryChipText: {
    fontSize: 12,
    color: colors.TEXT_SECONDARY
  },
  categoryChipTextActive: {
    color: '#fff'
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md
  },
  inlineForm: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center'
  },
  btnSuccess: {
    backgroundColor: '#28a745',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 6
  },
  btnCancel: {
    backgroundColor: '#6c757d',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 6
  },
  btnCancelText: {
    color: '#fff',
    fontWeight: '600'
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
    })
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.ACTION_BLUE,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm
  },
  tableHeaderCell: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    paddingHorizontal: spacing.sm
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center'
  },
  tableCell: {
    fontSize: 14,
    color: colors.TEXT_PRIMARY,
    paddingHorizontal: spacing.sm
  },
  actionsCell: {
    flexDirection: 'row',
    gap: spacing.xs
  },
  btnEdit: {
    backgroundColor: colors.ACTION_BLUE,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4
  },
  btnDelete: {
    backgroundColor: '#dc3545',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4
  },
  btnSmText: {
    color: '#fff',
    fontSize: 12,
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
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm
  }
});
