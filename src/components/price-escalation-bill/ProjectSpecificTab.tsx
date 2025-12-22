import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

/**
 * Project Specific Tab
 * Displays project-specific escalation parameters and configuration
 */
const ProjectSpecificTab: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Project Specific Parameters</Text>
        <Text style={styles.description}>
          Configure project-specific escalation parameters and baseline values
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
});

export default ProjectSpecificTab;
