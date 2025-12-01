// src/components/escalation/DatePickerField.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface DatePickerFieldProps {
  label: string;
  value: string; // YYYY-MM-DD format
  onChangeDate: (date: string) => void;
  disabled?: boolean;
  required?: boolean;
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({
  label,
  value,
  onChangeDate,
  disabled = false,
  required = false,
}) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [tempDate, setTempDate] = useState(value || '');

  const handleDateChange = (text: string) => {
    // Auto-format as user types: YYYY-MM-DD
    let cleaned = text.replace(/[^0-9]/g, '');
    
    if (cleaned.length >= 4) {
      cleaned = cleaned.slice(0, 4) + '-' + cleaned.slice(4);
    }
    if (cleaned.length >= 7) {
      cleaned = cleaned.slice(0, 7) + '-' + cleaned.slice(7, 9);
    }
    
    setTempDate(cleaned);
    
    // Validate and update if complete
    if (cleaned.length === 10) {
      const parts = cleaned.split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);
      
      if (year >= 2000 && year <= 2099 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        onChangeDate(cleaned);
      }
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr || dateStr.length !== 10) return dateStr;
    const parts = dateStr.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      
      {Platform.OS === 'web' ? (
        // Web: Use native date input
        <input
          type="date"
          value={value}
          onChange={(e) => onChangeDate((e.target as HTMLInputElement).value)}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '14px',
            borderRadius: '6px',
            border: `1px solid ${colors.BORDER_LIGHT}`,
            backgroundColor: disabled ? '#f9f9f9' : '#fff',
            color: disabled ? colors.TEXT_SECONDARY : colors.TEXT_PRIMARY,
          }}
        />
      ) : (
        // Mobile: Use custom picker
        <>
          <TouchableOpacity
            style={[styles.dateButton, disabled && styles.disabledInput]}
            onPress={() => !disabled && setShowCalendar(true)}
            disabled={disabled}
          >
            <Text style={[styles.dateText, !value && styles.placeholder]}>
              {value ? formatDisplayDate(value) : 'DD/MM/YYYY'}
            </Text>
            <Text style={styles.calendarIcon}>📅</Text>
          </TouchableOpacity>

          <Modal
            visible={showCalendar}
            transparent
            animationType="fade"
            onRequestClose={() => setShowCalendar(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowCalendar(false)}
            >
              <View style={styles.calendarModal}>
                <Text style={styles.modalTitle}>Select Date</Text>
                <TextInput
                  style={styles.dateInput}
                  value={tempDate}
                  onChangeText={handleDateChange}
                  placeholder="YYYY-MM-DD"
                  keyboardType="numeric"
                  maxLength={10}
                  autoFocus
                />
                <Text style={styles.hint}>Format: YYYY-MM-DD (e.g., 2025-11-27)</Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setTempDate(value);
                      setShowCalendar(false);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={() => {
                      if (tempDate.length === 10) {
                        onChangeDate(tempDate);
                        setShowCalendar(false);
                      } else {
                        Alert.alert('Invalid Date', 'Please enter a valid date in YYYY-MM-DD format');
                      }
                    }}
                  >
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </Modal>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.TEXT_PRIMARY,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.ERROR_RED,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.BORDER_LIGHT,
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#fff',
  },
  disabledInput: {
    backgroundColor: '#f9f9f9',
  },
  dateText: {
    fontSize: 14,
    color: colors.TEXT_PRIMARY,
    flex: 1,
  },
  placeholder: {
    color: colors.TEXT_SECONDARY,
  },
  calendarIcon: {
    fontSize: 18,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: colors.BORDER_LIGHT,
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: colors.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  hint: {
    fontSize: 12,
    color: colors.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: colors.BORDER_LIGHT,
  },
  cancelButtonText: {
    color: colors.TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: colors.ACTION_BLUE,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DatePickerField;
