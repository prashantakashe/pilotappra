// src/screens/ProjectsScreen.tsx
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal } from 'react-native';
import ProjectForm, { ProjectFormValues } from '../components/ProjectForm';
import { AuthContext } from '../contexts/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { PROJECTS_NAV } from '../constants/sidebarMenus';
import Card from '../components/Card';
import ProjectCard from '../components/ProjectCard';
import { useNavigation } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { userService } from '../services/userService';
import { dsrService } from '../services/dsrService';
import { Alert } from 'react-native';

const ProjectsScreen: React.FC = () => {
  // navigation is already declared at the top, remove duplicate
  const [userName, setUserName] = useState('User');
  const { user } = useContext(AuthContext)!;

  useEffect(() => {
    if (user?.displayName) {
      setUserName(user.displayName.split(' ')[0]);
    } else if (user?.email) {
      setUserName(user.email.split('@')[0]);
    }

    if (user?.uid) {
      userService
        .getUserProfile(user.uid)
        .then((profile) => {
          if (profile?.name) {
            const firstName = profile.name.split(' ')[0];
            setUserName(firstName);
          }
        })
        .catch(console.error);
    }
  }, [user]);
  // Project data and modal state
  const [projects, setProjects] = useState<any[]>([]);

  const fetchProjects = async () => {
    const data = await dsrService.getProjects();
    console.log('Fetched projects:', data);
    setProjects(
      data.map((p: any) => ({
        id: p.id,
        name: p.nameOfWork,
        category: p.department,
        subcategory: p.projectLocation || p.status || '',
      }))
    );
  };

  useEffect(() => {
    fetchProjects();
  }, []);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [form, setForm] = useState<Partial<ProjectFormValues>>({});

  const openNewProjectModal = () => {
    setEditMode(false);
    setForm({});
    setModalVisible(true);
    setCurrentProject(null);
  };

  const openEditProjectModal = (project: any) => {
    setEditMode(true);
    setForm({
      name: project.name,
      shortName: project.shortName || '',
      type: project.type || '',
      employer: project.employer || '',
      pmc: project.pmc || '',
      address: project.address || '',
      startDate: project.startDate ? new Date(project.startDate) : null,
      duration: project.duration ? new Date(project.duration) : null,
      completionValue: project.completionValue || '',
      completionUnit: project.completionUnit || 'Months',
      extCompletion1: project.extCompletion1 ? new Date(project.extCompletion1) : null,
      extCompletion2: project.extCompletion2 ? new Date(project.extCompletion2) : null,
    });
    setModalVisible(true);
    setCurrentProject(project);
  };

  const handleSave = async (values: ProjectFormValues) => {
    if (editMode && currentProject) {
      setProjects((prev) => prev.map((p) => p.id === currentProject.id ? { ...p, ...values } : p));
      setModalVisible(false);
      return;
    }
    // Map form fields to DSRProject fields, including new fields as top-level fields
    const projectData: any = {
      nameOfWork: values.name,
      nameOfWorkShort: values.shortName,
      department: values.type,
      employer: values.employer,
      pmc: values.pmc,
      projectLocation: values.address,
      startDate: values.startDate,
      durationValue: values.durationValue,
      durationUnit: values.durationUnit,
      completionDate: values.completionDate,
      extCompletion1: values.extCompletion1,
      extCompletion2: values.extCompletion2,
      status: 'draft',
    };
    // Remove undefined fields and targetDateOfSubmission (not set by form)
    Object.keys(projectData).forEach(key => {
      if (projectData[key] === undefined || key === 'targetDateOfSubmission') delete projectData[key];
    });
    try {
      await dsrService.createProject(projectData);
      Alert.alert('Success', 'Project saved to Firestore!');
      setModalVisible(false);
      await fetchProjects();
    } catch (e) {
      Alert.alert('Error', 'Failed to save project to Firestore.');
    }
  };

  const navigation = typeof useNavigation === 'function' ? useNavigation() : { navigate: () => {} };

  const handleViewProject = (projectId: string) => {
    if (navigation && typeof navigation.navigate === 'function') {
      navigation.navigate('ProjectViewScreen', { projectId });
    } else {
      window.location.href = `/project-view/${projectId}`;
    }
  };

  return (
    <AppLayout title="Projects" activeRoute="Projects" sidebarItems={PROJECTS_NAV}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <Text style={styles.projectsTitle}>Projects</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              {/* Filter/Search Row */}
              <View style={styles.filterRow}>
                <View style={styles.filterInputWrapper}>
                  <MaterialIcons name="search" size={20} color="#888" style={{ marginRight: 4 }} />
                  <input type="text" placeholder="Search Project" style={styles.filterInput} />
                </View>
                <select style={styles.filterSelect}>
                  <option>Status</option>
                  <option>Active</option>
                  <option>On Hold</option>
                  <option>Completed</option>
                  <option>Delayed</option>
                </select>
                <select style={styles.filterSelect}>
                  <option>Location</option>
                  {/* Dynamically fill locations if needed */}
                </select>
              </View>
              <TouchableOpacity style={styles.addButton} onPress={openNewProjectModal}>
                <MaterialIcons name="add-circle" size={28} color={colors.ACTION_BLUE} />
                <Text style={styles.addButtonText}>+ New Project</Text>
              </TouchableOpacity>
            </View>
        </View>
        <View style={styles.cardGrid}>
          {projects.length === 0 ? (
            <Text style={{ textAlign: 'center', marginTop: 32, color: '#888' }}>No projects found.</Text>
          ) : (
            // Render two columns of project cards
            Array.from({ length: Math.ceil(projects.length / 2) }).map((_, rowIdx) => (
              <View key={rowIdx} style={styles.cardRow}>
                {[0, 1].map((colIdx) => {
                  const project = projects[rowIdx * 2 + colIdx];
                  if (!project) return <View key={colIdx} style={{ flex: 1, margin: 8 }} />;
                  // Find latest completion date
                  const dateStrings = [project.completionDate, project.extCompletion1, project.extCompletion2].filter(Boolean);
                  const dates = dateStrings.map(d => d ? new Date(d) : null).filter(d => d instanceof Date && !isNaN(d));
                  let latestCompletion = '';
                  if (dates.length > 0) {
                    const latest = dates.reduce((a, b) => (a > b ? a : b));
                    latestCompletion = latest.toLocaleDateString('en-GB');
                  }
                  return (
                    <View key={colIdx} style={{ flex: 1, margin: 8, minWidth: 320 }}>
                      <ProjectCard
                        project={{
                          ...project,
                          startDate: project.startDate ? new Date(project.startDate).toLocaleDateString('en-GB') : '',
                          completionDate: latestCompletion,
                        }}
                        onEdit={() => openEditProjectModal(project)}
                        onDelete={async () => {
                          try {
                            await dsrService.deleteProject(project.id);
                            await fetchProjects();
                          } catch (e) {
                            Alert.alert('Error', 'Failed to delete project.');
                          }
                        }}
                        onView={() => handleViewProject(project.id)}
                      />
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </View>
      </ScrollView>
      {/* ProjectForm modal for creating/editing projects */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, minWidth: 350, maxWidth: 500, width: '95%', maxHeight: '90%', overflow: 'auto' }}>
            <ScrollView style={{ maxHeight: 600 }}>
              <ProjectForm
                initialValues={form}
                onSubmit={handleSave}
                onCancel={() => setModalVisible(false)}
                submitLabel={editMode ? 'Update' : 'Save'}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: '#f4f8fb',
    padding: 0,
  },
  scrollContent: {
    padding: 0,
    minHeight: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 24,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e7ef',
    zIndex: 2,
  },
  projectsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1976d2',
    letterSpacing: 0.2,
    marginRight: 24,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6fafd',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 18,
    gap: 10,
    boxShadow: '0 1px 8px #e0e7ef11',
  },
  filterInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e7ef',
    paddingHorizontal: 8,
    marginRight: 8,
  },
  filterInput: {
    border: 'none',
    outline: 'none',
    fontSize: 14,
    backgroundColor: 'transparent',
    padding: 6,
    minWidth: 120,
  },
  filterSelect: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e7ef',
    padding: 6,
    fontSize: 14,
    marginLeft: 8,
    backgroundColor: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ACTION_BLUE,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginLeft: 16,
    shadowColor: '#1976d2',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 8,
  },
  cardList: {
    marginTop: 12,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  cardGrid: {
    flexDirection: 'column',
    width: '100%',
    paddingHorizontal: 8,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
});

export default ProjectsScreen;
