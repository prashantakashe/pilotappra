// src/screens/SettingsScreen.tsx
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { MAIN_NAV } from '../constants/sidebarMenus';
import Card from '../components/Card';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { userService } from '../services/userService';

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const [userName, setUserName] = useState('User');
  const { user } = useContext(AuthContext)!;

  useEffect(() => {
    if (user?.displayName) {
      setUserName(user.displayName.split(' ')[0]);
    } else if (user?.email) {
      setUserName(user.email.split('@')[0]);
    }

    if (user?.uid) {
      userService
        .getUserProfile(user.uid)
        .then((profile) => {
          if (profile?.name) {
            const firstName = profile.name.split(' ')[0];
            setUserName(firstName);
          }
        })
        .catch(console.error);
    }
  }, [user]);

  return (
    <AppLayout title="Settings" activeRoute="Settings" sidebarItems={MAIN_NAV}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Card title="Settings Module">
          <Text style={styles.comingSoon}>Coming Soon</Text>
          <Text style={styles.description}>
            Application settings, user preferences, and system configuration
            will be available here.
          </Text>
        </Card>
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  comingSoon: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.ACTION_BLUE,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: colors.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SettingsScreen;
