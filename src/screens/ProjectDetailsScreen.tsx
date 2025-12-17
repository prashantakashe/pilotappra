import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppLayout } from '../components/AppLayout';
import { PROJECTS_NAV } from '../constants/sidebarMenus';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

const TABS = [
  { key: 'details', label: 'Project Details' },
  { key: 'ra_bill', label: 'RA Bill' },
  { key: 'insurance', label: 'Insurance' },
  // Add more tabs as needed
];

const ProjectDetailsScreen = ({ route }) => {
  const { project } = route.params;
  const [activeTab, setActiveTab] = useState('details');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return <Text>Project Name: {project.name}{'\n'}Category: {project.category}{'\n'}Subcategory: {project.subcategory}</Text>;
      case 'ra_bill':
        return <Text>RA Bill content goes here.</Text>;
      case 'insurance':
        return <Text>Insurance content goes here.</Text>;
      default:
        return null;
    }
  };

  return (
    <AppLayout title={project.name} activeRoute="Projects" sidebarItems={PROJECTS_NAV}>
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.tabContent}>{renderTabContent()}</View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.BACKGROUND,
    borderBottomWidth: 1,
    borderBottomColor: colors.BORDER,
    marginBottom: spacing.md,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.ACTION_BLUE,
  },
  tabText: {
    color: colors.TEXT_SECONDARY,
    fontWeight: '500',
    fontSize: 16,
  },
  activeTabText: {
    color: colors.ACTION_BLUE,
    fontWeight: '700',
  },
  tabContent: {
    padding: spacing.lg,
  },
});

export default ProjectDetailsScreen;
