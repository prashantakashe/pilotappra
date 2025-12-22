import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export type TrendType = 'up' | 'down' | 'neutral';

interface MasterIndexCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendType?: TrendType;
  accentColor: string;
  isDarkTheme?: boolean;
  cardWidth?: number;
  valueFontSize?: number;
  labelFontSize?: number;
}

const getTrendColor = (trendType?: TrendType) => {
  switch (trendType) {
    case 'up':
      return '#22c55e'; // green
    case 'down':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // grey
  }
};

const MasterIndexCard: React.FC<MasterIndexCardProps> = ({
  label,
  value,
  trend,
  trendType = 'neutral',
  accentColor,
  isDarkTheme = false,
  cardWidth = 180,
  valueFontSize = 22,
  labelFontSize = 11,
}) => {
  return (
    <View
      style={[
        styles.card,
        { borderLeftColor: accentColor, minWidth: cardWidth, maxWidth: cardWidth },
        isDarkTheme && styles.darkCard,
      ]}
    >
      <Text style={[styles.label, isDarkTheme && styles.darkLabel, { fontSize: labelFontSize }]}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, isDarkTheme && styles.darkValue, { fontSize: valueFontSize }]}>{value}</Text>
        {trend !== undefined && (
          <View style={styles.trendRow}>
            {trendType === 'up' && (
              <MaterialIcons name="arrow-upward" size={14} color={getTrendColor(trendType)} />
            )}
            {trendType === 'down' && (
              <MaterialIcons name="arrow-downward" size={14} color={getTrendColor(trendType)} />
            )}
            <Text style={{ color: getTrendColor(trendType), fontWeight: 'bold', marginLeft: 2, fontSize: 12 }}>
              {trend}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderLeftWidth: 4,
    padding: 18,
    marginRight: 18,
    minWidth: 140,
    minHeight: 80,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    justifyContent: 'center',
  },
  darkCard: {
    backgroundColor: '#1e293b',
    borderLeftColor: '#facc15', // yellow/amber
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  darkLabel: {
    color: '#f1f5f9',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  darkValue: {
    color: '#fff',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default MasterIndexCard;
