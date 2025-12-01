// src/screens/ProjectsScreen.tsx
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { PROJECTS_NAV } from '../constants/sidebarMenus';
import Card from '../components/Card';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { userService } from '../services/userService';

interface ProjectsScreenProps {
  navigation: any;
}

const ProjectsScreen: React.FC<ProjectsScreenProps> = ({ navigation }) => {
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
    <AppLayout title="Projects" activeRoute="Projects" sidebarItems={PROJECTS_NAV}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Card title="Projects Module">
          <Text style={styles.comingSoon}>📁 Coming Soon</Text>
          <Text style={styles.description}>
            The Projects module will provide comprehensive project management capabilities:
          </Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• Project creation and setup</Text>
            <Text style={styles.featureItem}>• Milestone tracking and Gantt charts</Text>
            <Text style={styles.featureItem}>• Budget management and cost tracking</Text>
            <Text style={styles.featureItem}>• Resource allocation and workload planning</Text>
            <Text style={styles.featureItem}>• Team collaboration and communication</Text>
            <Text style={styles.featureItem}>• Progress reports and dashboards</Text>
            <Text style={styles.featureItem}>• Risk management and issue tracking</Text>
            <Text style={styles.featureItem}>• Document management and version control</Text>
          </View>
          <Text style={[styles.description, { marginTop: spacing.lg, fontStyle: 'italic' }]}>
            This module is under development and will be released soon.
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
  featureList: {
    marginTop: spacing.md,
    marginLeft: spacing.lg,
    alignSelf: 'stretch'
  },
  featureItem: {
    fontSize: 14,
    color: colors.TEXT_SECONDARY,
    marginBottom: spacing.sm,
    lineHeight: 20,
    textAlign: 'left'
  },
});

export default ProjectsScreen;
