import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface IndexRowProps {
  label: string;
  baseValue: number;
  currentValue: number;
  change: number;
}

/**
 * Index Row Component
 * Displays a single price index row with values and changes
 */
const IndexRow: React.FC<IndexRowProps> = ({ label, baseValue, currentValue, change }) => {
  const changePercent = ((change / baseValue) * 100).toFixed(2);
  
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{baseValue.toFixed(2)}</Text>
      <Text style={styles.value}>{currentValue.toFixed(2)}</Text>
      <Text style={[styles.value, { color: change >= 0 ? '#28a745' : '#dc3545' }]}>
        {changePercent}%
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    alignItems: 'center',
  },
  label: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  value: {
    flex: 1,
    fontSize: 12,
    color: '#333',
    textAlign: 'right',
  },
});

export default IndexRow;
