
// SSR/DSR module removed — component stub
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ProjectDetailsList: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.message}>SSR/DSR module removed — component stub.</Text>
  </View>
);

export default ProjectDetailsList;

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  message: { color: '#666' },
});
