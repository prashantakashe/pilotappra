// SSR/DSR form removed
// Placeholder kept so existing imports don't break. Implement the form in
// the new module location when ready.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';


const AddEditProjectForm: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.message}>SSR/DSR form removed — implement in new module.</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  message: { color: '#666' }
});

export default AddEditProjectForm;
