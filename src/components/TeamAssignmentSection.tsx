// src/components/TeamAssignmentSection.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FormDropdown } from './FormDropdown';

interface TeamAssignmentSectionProps {
  tenderManager: string;
  engineeringLead: string;
  estimationEngineer: string;
  documentController: string;
  onChangeTenderManager: (value: string) => void;
  onChangeEngineeringLead: (value: string) => void;
  onChangeEstimationEngineer: (value: string) => void;
  onChangeDocumentController: (value: string) => void;
  errors?: Record<string, string>;
  teamMembers?: Array<{ uid: string; name: string }>;
}

export const TeamAssignmentSection: React.FC<TeamAssignmentSectionProps> = ({
  tenderManager,
  engineeringLead,
  estimationEngineer,
  documentController,
  onChangeTenderManager,
  onChangeEngineeringLead,
  onChangeEstimationEngineer,
  onChangeDocumentController,
  errors = {},
  teamMembers = [],
}) => {
  // For now, use placeholder team members
  // In production, fetch from users collection
  const defaultMembers = teamMembers.length > 0 
    ? teamMembers.map(m => m.name)
    : ['PRASHANT', 'User 2', 'User 3', 'User 4'];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Team Assignments</Text>
      <Text style={styles.sectionDesc}>
        Assign roles to team members. Members will receive notifications and access based on their role.
      </Text>

      <FormDropdown
        label="Tender Manager"
        value={tenderManager}
        options={defaultMembers}
        onSelect={onChangeTenderManager}
        required
        error={errors.tenderManager}
      />

      <FormDropdown
        label="Engineering Lead"
        value={engineeringLead}
        options={defaultMembers}
        onSelect={onChangeEngineeringLead}
        error={errors.engineeringLead}
      />

      <FormDropdown
        label="Estimation Engineer"
        value={estimationEngineer}
        options={defaultMembers}
        onSelect={onChangeEstimationEngineer}
        error={errors.estimationEngineer}
      />

      <FormDropdown
        label="Document Controller"
        value={documentController}
        options={defaultMembers}
        onSelect={onChangeDocumentController}
        error={errors.documentController}
      />

      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <Text style={styles.infoText}>
          Tender Manager and Estimation Engineer will have full edit access to Rate Analysis.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    padding: 12,
    marginTop: 8,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
  },
});
