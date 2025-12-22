import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface DocumentCardProps {
  title: string;
  fileName: string;
  uploadedDate: string;
}

/**
 * Document Card Component
 * Displays a single document in card format
 */
const DocumentCard: React.FC<DocumentCardProps> = ({ title, fileName, uploadedDate }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.fileName}>{fileName}</Text>
      <Text style={styles.date}>{uploadedDate}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#0d6efd',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  fileName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  date: {
    fontSize: 11,
    color: '#999',
  },
});

export default DocumentCard;
