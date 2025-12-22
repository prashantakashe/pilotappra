import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AuthContext } from '../contexts/AuthContext';
import { dsrService } from '../services/dsrService';
import { MaterialIcons } from '@expo/vector-icons';
import MasterIndexDatabaseGrid from './MasterIndexDatabaseGrid';
import ProjectBaselineConstantsTab from './ProjectBaselineConstantsTab';

const TABS = [
  'Project Data',
  'Indices',
  'R A Bill Details',
  'Escalation Bill',
  'Documents',
  'Reports',
];

const INDICES_SUBTABS = [
  { key: 'masterHistory', label: 'Master Indices History' },
  { key: 'baselineConstants', label: 'Project Baseline & Constants' },
  { key: 'documentLibrary', label: 'Document Library' },
];

interface Project {
  id: string;
  name: string;
  category?: string;
  subcategory?: string;
  status?: string;
}

interface PriceEscalationTabsProps {
  projectId?: string;
}

export const PriceEscalationTabs: React.FC<PriceEscalationTabsProps> = ({ projectId: propProjectId }) => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useContext(AuthContext)!;
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [activeIndicesSubTab, setActiveIndicesSubTab] = useState(INDICES_SUBTABS[0].key);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  // Get projectId from props or route params
  const projectId = propProjectId || route.params?.projectId;

  useEffect(() => {
    if (activeTab === 'Project Data') {
      fetchProjects();
    }
  }, [activeTab]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await dsrService.getProjects();
      setProjects(
        data.map((p: any) => ({
          id: p.id,
          name: p.nameOfWork,
          category: p.department,
          subcategory: p.projectLocation || p.status || '',
          status: p.status || 'Draft',
        }))
      );
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProject = (projectId: string) => {
    navigation.navigate('PriceEscalationProjectViewScreen', { projectId });
  };

  return (
    <View style={styles.tabsContainer}>
      <View style={styles.tabsRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'Project Data' && (
        <ScrollView style={styles.tabContent}>
          <View style={styles.projectsContainer}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {loading ? (
              <Text style={styles.loadingText}>Loading projects...</Text>
            ) : projects.length === 0 ? (
              <Text style={styles.emptyText}>No projects found</Text>
            ) : (
              projects.map(project => (
                <TouchableOpacity
                  key={project.id}
                  style={styles.projectCard}
                  onPress={() => handleViewProject(project.id)}
                >
                  <View style={styles.projectCardContent}>
                    <Text style={styles.projectName}>{project.name}</Text>
                    {project.category && (
                      <Text style={styles.projectCategory}>{project.category}</Text>
                    )}
                    {project.subcategory && (
                      <Text style={styles.projectSubcategory}>{project.subcategory}</Text>
                    )}
                    <View style={styles.projectStatus}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: project.status === 'Draft' ? '#FEE2E2' : '#DBEAFE' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: project.status === 'Draft' ? '#DC2626' : '#1E40AF' },
                          ]}
                        >
                          {project.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => handleViewProject(project.id)}
                  >
                    <MaterialIcons name="arrow-forward" size={20} color="#2563EB" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      )}

      {activeTab === 'Indices' ? (
        <ScrollView style={{ marginTop: 8, flex: 1 }}>
          <View style={[styles.tabsRow, { marginBottom: 0 }]}>
            {INDICES_SUBTABS.map(subTab => (
              <TouchableOpacity
                key={subTab.key}
                style={[styles.tabButton, activeIndicesSubTab === subTab.key && styles.tabButtonActive]}
                onPress={() => setActiveIndicesSubTab(subTab.key)}
              >
                <Text style={[styles.tabText, activeIndicesSubTab === subTab.key && styles.tabTextActive]}>
                  {subTab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.tabContent}>
            {activeIndicesSubTab === 'masterHistory' && projectId && (
              <MasterIndexDatabaseGrid projectId={projectId} />
            )}
            {activeIndicesSubTab === 'baselineConstants' && projectId && (
              <ProjectBaselineConstantsTab projectId={projectId} />
            )}
            {activeIndicesSubTab === 'documentLibrary' && (
              <View style={styles.tabContentPlaceholder}>
                <Text style={styles.tabContentText}>Document Library coming soon</Text>
              </View>
            )}
          </View>
        </ScrollView>
      ) : activeTab !== 'Project Data' ? (
        <View style={styles.tabContentPlaceholder}>
          <Text style={styles.tabContentText}>
            Content for "{activeTab}" will be added soon.
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  tabsContainer: {
    width: '100%',
    marginTop: 24,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 16,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 8,
  },
  tabButtonActive: {
    borderBottomColor: '#2563EB',
    backgroundColor: '#F3F4F6',
  },
  tabText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    minHeight: 600,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  tabContentPlaceholder: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  tabContentText: {
    fontSize: 16,
    color: '#6B7280',
  },
  projectsContainer: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
  },
  projectCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  projectCardContent: {
    flex: 1,
  },
  projectName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  projectCategory: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  projectSubcategory: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  projectStatus: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  viewButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#F0F9FF',
  },
});
