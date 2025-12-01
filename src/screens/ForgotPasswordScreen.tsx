// src/screens/ForgotPasswordScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
} from 'react-native';
import InputText from '../components/InputText';
import ButtonPrimary from '../components/ButtonPrimary';
import { authService } from '../services/authService';
import { validateEmail } from '../utils/validators';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface ForgotPasswordScreenProps {
  navigation: any;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { width } = useWindowDimensions();
  const isMobile = width <= 480;

  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleSendReset = async () => {
    setEmailError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await authService.sendPasswordReset(email.trim());
      setSubmitted(true);
      Alert.alert(
        'Reset Link Sent',
        "If an account exists with this email, we've sent password reset instructions.",
        [
          {
            text: 'Back to Login',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        "If an account exists with this email, we've sent password reset instructions."
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = email && validateEmail(email) && !emailError;

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <View style={[styles.content, !isMobile && styles.contentDesktop]}>
        <Text style={styles.logo}>🔑</Text>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email and we'll send you a link to reset your password
        </Text>

        <InputText
          label="Email"
          value={email}
          onChangeText={setEmail}
          onBlur={handleEmailBlur}
          placeholder="Enter your email"
          autoCapitalize="none"
          keyboardType="email-address"
          error={emailError}
          testID="email-input"
          editable={!loading}
        />

        <ButtonPrimary
          title="Send Reset Link"
          onPress={handleSendReset}
          disabled={!isFormValid || loading}
          loading={loading}
          testID="send-reset-button"
          style={styles.button}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          disabled={loading}
        >
          <Text style={styles.backLink}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.WHITE,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  contentDesktop: {
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  logo: {
    fontSize: 56,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  button: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  backLink: {
    textAlign: 'center',
    color: colors.ACTION_BLUE,
    fontSize: 14,
    fontWeight: '600',
    marginVertical: spacing.md,
  },
});

export default ForgotPasswordScreen;
