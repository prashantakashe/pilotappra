
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    category: string;
    subcategory: string;
    status?: string;
    location?: string;
    value?: string;
    progress?: number;
    startDate?: string;
    completionDate?: string;
  };
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}

const statusColors: Record<string, string> = {
  Active: '#43a047',
  'On Hold': '#fbc02d',
  Completed: '#1976d2',
  Delayed: '#e53935',
  Draft: '#888',
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, onDelete, onView }) => {
  const status = project.status || 'Draft';
  return (
    <View style={styles.card}>
      {/* Header row: title + status badge */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>{project.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[status] || '#888' }]}> 
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>
      {/* Meta row: subtext and actions */}
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {project.category} • {project.subcategory}
        </Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={onView} title="View">
            <MaterialIcons name="visibility" size={22} color="#1976d2" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={onEdit} title="Edit">
            <MaterialIcons name="edit" size={22} color="#1976d2" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={onDelete} title="Delete">
            <MaterialIcons name="delete" size={22} color="#e57373" />
          </TouchableOpacity>
        </View>
      </View>
      {/* Info row: start, completion, value, progress */}
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>Start: {project.startDate || '--'}</Text>
        <Text style={styles.infoText}>Completion: {project.completionDate || '--'}</Text>
        <Text style={styles.infoText}>Value: {project.value || '--'}</Text>
        <Text style={styles.infoText}>Progress: {project.progress != null ? `${project.progress}%` : '--'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fafdff',
    borderRadius: 14,
    marginVertical: 12,
    marginHorizontal: 8,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e7ef',
    flexDirection: 'column',
    minWidth: 320,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    flex: 1,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    minWidth: 60,
  },
  statusText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#888',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  actionBtn: {
    marginHorizontal: 2,
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#f4f8fb',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
    flex: 1,
    textAlign: 'left',
  },
});

export default ProjectCard;
