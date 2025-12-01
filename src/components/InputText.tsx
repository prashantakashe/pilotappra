// src/components/InputText.tsx
import React from 'react';
import { TextInput, View, Text, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface InputTextProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  testID?: string;
}

const InputText: React.FC<InputTextProps> = ({
  label,
  error,
  containerStyle,
  testID,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={colors.TEXT_SECONDARY}
        testID={testID}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY,
    marginBottom: spacing.sm,
  },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.BORDER_LIGHT,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.TEXT_PRIMARY,
    backgroundColor: colors.WHITE,
  },
  inputError: {
    borderColor: colors.ERROR_RED,
  },
  errorText: {
    fontSize: 12,
    color: colors.ERROR_RED,
    marginTop: spacing.xs,
  },
});

export default InputText;
