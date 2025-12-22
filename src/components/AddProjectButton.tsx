import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface AddProjectButtonProps {
  onPress: () => void;
}

export const AddProjectButton: React.FC<AddProjectButtonProps> = ({ onPress }) => (
  <TouchableOpacity style={styles.button} onPress={onPress}>
    <Text style={styles.buttonText}>+ Add New Project</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 18,
    alignSelf: 'flex-end',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
