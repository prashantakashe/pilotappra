// SSR/DSR form removed
// Placeholder kept so existing imports don't break. Implement the form in
// the new module location when ready.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const AddEditProjectForm: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.message}>SSR/DSR form removed — implement in new module.</Text>
  </View>
);

export default AddEditProjectForm;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  message: { color: '#666' },
});

            {/* Short Name - Required */}
            <FormInput
              label="Short Name *"
              placeholder="e.g., RD-2024-001"
              value={formData.nameOfWorkShort}
              onChangeText={(text) =>
                setFormData({ ...formData, nameOfWorkShort: text })
              }
              error={errors.nameOfWorkShort}
              editable={!isLoading}
            />

            {/* Department - Required */}
            <FormInput
              label="Department *"
              placeholder="Enter department"
              value={formData.department}
              onChangeText={(text) =>
                setFormData({ ...formData, department: text })
              }
              error={errors.department}
              editable={!isLoading}
            />
