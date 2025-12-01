// src/components/DatePickerModal.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';

interface DatePickerModalProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  required?: boolean;
  error?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  containerStyle?: any;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  label,
  value,
  onChange,
  required = false,
  error,
  minimumDate,
  maximumDate,
  containerStyle,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // For web, use native date input
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, containerStyle]}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.required}>*</Text>}
        </View>
        <input
          type="date"
          value={value ? value.toISOString().split('T')[0] : ''}
          onChange={(e: any) => {
            const dateStr = e.target.value;
            onChange(dateStr ? new Date(dateStr) : null);
          }}
          min={minimumDate?.toISOString().split('T')[0]}
          max={maximumDate?.toISOString().split('T')[0]}
          style={{
            borderWidth: 1,
            borderColor: error ? '#EF4444' : '#D1D5DB',
            borderRadius: 6,
            padding: 12,
            fontSize: 14,
            color: '#111827',
            backgroundColor: '#fff',
            minHeight: 44,
            width: '100%',
          }}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }

  // For mobile, use simple text-based date picker (would integrate with a date picker lib in production)
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.required}>*</Text>}
      </View>
      <TouchableOpacity
        style={[styles.selector, error && styles.selectorError]}
        onPress={() => setShowPicker(true)}
      >
        <Text style={value ? styles.selectedText : styles.placeholderText}>
          {value ? formatDate(value) : 'Select date'}
        </Text>
        <Text style={styles.icon}>📅</Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      {showPicker && (
        <Modal
          visible={showPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowPicker(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select {label}</Text>
              <Text style={styles.modalInfo}>
                Use web version for full date picker support
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  onChange(new Date());
                  setShowPicker(false);
                }}
              >
                <Text style={styles.modalButtonText}>Select Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowPicker(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  required: {
    fontSize: 16,
    color: '#EF4444',
    marginLeft: 4,
  },
  selector: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  selectorError: {
    borderColor: '#EF4444',
  },
  selectedText: {
    fontSize: 14,
    color: '#111827',
  },
  placeholderText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  icon: {
    fontSize: 18,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  modalInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#1E90FF',
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonSecondary: {
    backgroundColor: '#F3F4F6',
  },
  modalButtonTextSecondary: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});
