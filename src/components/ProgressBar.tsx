// src/components/ProgressBar.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  showLabel?: boolean;
  label?: string;
  color?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  showLabel = true,
  label,
  color = '#1E90FF'
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <View style={styles.container}>
      {showLabel && label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${clampedProgress}%`,
              backgroundColor: color,
              height
            }
          ]}
        />
      </View>
      {showLabel && !label && (
        <Text style={styles.percentage}>{Math.round(clampedProgress)}%</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%'
  },
  track: {
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%'
  },
  fill: {
    borderRadius: 4
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4
  },
  percentage: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'right'
  }
});
