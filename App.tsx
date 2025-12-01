// App.tsx
// App.tsx - Main entry point for the application
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import 'react-native-gesture-handler';

/**
 * Main App Component
 * 
 * Sets up:
 * 1. Navigation container for all navigation stacks
 * 2. Auth provider for global authentication state management
 * 3. Root navigator that conditionally renders:
 *    - AuthNavigator (Login/SignUp/ForgotPassword) if not authenticated
 *    - AppNavigator (Dashboard/Profile) if authenticated
 * 
 * Flow:
 * - AuthContext watches onAuthStateChanged()
 * - When user logs in → user object set → RootNavigator shows AppNavigator
 * - When user logs out → user cleared → RootNavigator shows AuthNavigator
 */
export default function App() {
  return (
    <NavigationContainer>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </NavigationContainer>
  );
}
