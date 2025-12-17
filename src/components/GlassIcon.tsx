import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GlassIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
  children?: React.ReactNode;
}

const GlassIcon: React.FC<GlassIconProps> = ({ name, size = 32, color = '#1E90FF', style, children }) => {
  return (
    <View style={[styles.glass, style]}> 
      {/* For web, use backdropFilter for blur. For mobile, use overlay. */}
      {Platform.OS === 'web' && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 20,
          backdropFilter: 'blur(12px)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(30,144,255,0.18) 100%)',
          boxShadow: '0 4px 24px 0 rgba(30,144,255,0.12)',
          zIndex: 0,
        }} />
      )}
      <Ionicons name={name} size={size} color={color} style={{zIndex:1}} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  glass: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    padding: 12,
    backgroundColor: Platform.OS === 'web' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.25)',
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
    overflow: Platform.OS === 'web' ? 'visible' : 'hidden',
  },
});

export default GlassIcon;
