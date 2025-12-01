// src/screens/LoginScreen.tsx
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
import { validateEmail } from '../utils/validators';
import { mapFirebaseError } from '../utils/mapFirebaseError';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { user } = useContext(AuthContext)!;
  const { width } = useWindowDimensions();
  const isMobile = width <= 480;

  React.useEffect(() => {
    if (user) {
      navigation.replace('MainApp');
    }
  }, [user, navigation]);

  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleSignIn = async () => {
    setEmailError('');
    setPasswordError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setPasswordError('Password is required');
      return;
    }

    setLoading(true);
    try {
      await authService.signIn(email.trim(), password);
    } catch (error: any) {
      const friendlyError = mapFirebaseError(error.code);
      Alert.alert('Sign In Failed', friendlyError);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = email && password && validateEmail(email) && !emailError && !passwordError;

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <View style={[styles.content, !isMobile && styles.contentDesktop]}>
        <Text style={styles.logo}>🔐</Text>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

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

        <PasswordInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          error={passwordError}
          testID="password-input"
        />

        <ButtonPrimary
          title="Sign In"
          onPress={handleSignIn}
          disabled={!isFormValid || loading}
          loading={loading}
          testID="signin-button"
          style={styles.button}
        />

        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword')}
          disabled={loading}
        >
          <Text style={styles.link}>Forgot Password?</Text>
        </TouchableOpacity>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('SignUp')}
            disabled={loading}
          >
            <Text style={styles.signupLink}>Sign Up</Text>
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
  button: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  link: {
    textAlign: 'center',
    color: colors.ACTION_BLUE,
    fontSize: 14,
    fontWeight: '600',
    marginVertical: spacing.md,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  signupText: {
    fontSize: 14,
    color: colors.TEXT_SECONDARY,
  },
  signupLink: {
    fontSize: 14,
    color: colors.ACTION_BLUE,
    fontWeight: '700',
  },
});

export default LoginScreen;
