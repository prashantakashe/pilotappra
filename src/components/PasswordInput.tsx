// src/components/PasswordInput.tsx
import React, { useState } from 'react';
import { TextInput, View, TouchableOpacity, StyleSheet, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface PasswordInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  testID?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Password',
  label,
  error,
  containerStyle,
  testID,
}) => {
  const [hidden, setHidden] = useState(true);

  return (
    <View style={[styles.outerContainer, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.container, error && styles.containerError]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={hidden}
          style={styles.input}
          autoCapitalize="none"
          textContentType="password"
          placeholderTextColor={colors.TEXT_SECONDARY}
          testID={testID}
        />
        <TouchableOpacity onPress={() => setHidden(!hidden)} style={styles.icon}>
          <Ionicons
            name={hidden ? 'eye-off' : 'eye'}
            size={20}
            color={colors.TEXT_SECONDARY}
          />
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY,
    marginBottom: spacing.sm,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.BORDER_LIGHT,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.WHITE,
  },
  containerError: {
    borderColor: colors.ERROR_RED,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.TEXT_PRIMARY,
    paddingRight: spacing.lg,
  },
  icon: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  errorText: {
    fontSize: 12,
    color: colors.ERROR_RED,
    marginTop: spacing.xs,
  },
});

export default PasswordInput;
