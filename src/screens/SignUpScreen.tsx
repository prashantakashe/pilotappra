// src/screens/SignUpScreen.tsx
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import InputText from '../components/InputText';
import PasswordInput from '../components/PasswordInput';
import ButtonPrimary from '../components/ButtonPrimary';
import { authService } from '../services/authService';
import { validateEmail, validatePassword, validateFullName } from '../utils/validators';
import { mapFirebaseError } from '../utils/mapFirebaseError';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface SignUpScreenProps {
  navigation: any;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const { user } = useContext(AuthContext)!;
  const { width } = useWindowDimensions();
  const isMobile = width <= 480;

  React.useEffect(() => {
    if (user) {
      navigation.replace('MainApp');
    }
  }, [user, navigation]);

  const validateForm = () => {
    const newErrors = {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    };

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (!validateFullName(fullName)) {
      newErrors.fullName = 'Please enter a valid full name (at least 2 characters)';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        newErrors.password = passwordValidation.message;
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((err) => err);
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await authService.signUp(email.trim(), password, fullName.trim());
      Alert.alert(
        'Account Created',
        'Please check your email to verify your account.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      const friendlyError = mapFirebaseError(error.code);
      Alert.alert('Sign Up Failed', friendlyError);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    fullName && email && password && confirmPassword && !Object.values(errors).some((err) => err);

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <View style={[styles.content, !isMobile && styles.contentDesktop]}>
        <Text style={styles.logo}>✨</Text>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join us today</Text>

        <InputText
          label="Full Name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your full name"
          error={errors.fullName}
          testID="fullname-input"
          editable={!loading}
        />

        <InputText
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          autoCapitalize="none"
          keyboardType="email-address"
          error={errors.email}
          testID="email-input"
          editable={!loading}
        />

        <PasswordInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Create a password"
          error={errors.password}
          testID="password-input"
        />

        <PasswordInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm your password"
          error={errors.confirmPassword}
          testID="confirm-password-input"
        />

        <Text style={styles.passwordHint}>
          Password must contain: uppercase, number, and special character (!@#$%^&*)
        </Text>

        <ButtonPrimary
          title="Create Account"
          onPress={handleSignUp}
          disabled={!isFormValid || loading}
          loading={loading}
          testID="signup-button"
          style={styles.button}
        />

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
          >
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
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
  },
  passwordHint: {
    fontSize: 12,
    color: colors.TEXT_SECONDARY,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  loginText: {
    fontSize: 14,
    color: colors.TEXT_SECONDARY,
  },
  loginLink: {
    fontSize: 14,
    color: colors.ACTION_BLUE,
    fontWeight: '700',
  },
});

export default SignUpScreen;
