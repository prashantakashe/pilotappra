import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

/**
 * Master Indices Tab
 * Displays master index data and historical trends
 */
const MasterIndicesTab: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Master Indices</Text>
        <Text style={styles.description}>
          View and manage master price indices for escalation calculations
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

export default MasterIndicesTab;
