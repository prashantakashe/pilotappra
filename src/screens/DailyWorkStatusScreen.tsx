// src/screens/DailyWorkStatusScreen.tsx
import React, { useContext, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { DAILY_WORK_STATUS_NAV } from '../constants/sidebarMenus';
import { userService } from '../services/userService';
import {
  DWSMasterDataTab,
  DWSDailyEntryTab,
  DWSReportTab,
  DWSDashboardTab,
  DWSUserManagementTab,
  DWSReminderSettingsTab
} from '../components/dailyWorkStatus';

type DWSTab = 'DWSMaster' | 'DWSDaily' | 'DWSReport' | 'DWSDashboard' | 'DWSUsers' | 'DWSReminders';

interface DailyWorkStatusScreenProps {
  navigation: any;
}

/**
 * DailyWorkStatusScreen - Daily Work Status module main screen
 * Contains all sub-modules: Master Data, Daily Entry, Report, Dashboard, User Management
 */
const DailyWorkStatusScreen: React.FC<DailyWorkStatusScreenProps> = ({ navigation }) => {
  const [userName, setUserName] = useState('User');
  const [activeTab, setActiveTab] = useState<DWSTab>('DWSDashboard');
  const [statusFilter, setStatusFilter] = useState<string>('');
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

  // Handle sidebar navigation
  const handleSidebarPress = (key: string) => {
    if (key === 'Dashboard') {
      navigation.navigate('MainNew');
    } else if (key.startsWith('DWS')) {
      setActiveTab(key as DWSTab);
      // Clear status filter when manually navigating
      if (key === 'DWSDaily') {
        setStatusFilter('');
      }
    }
  };

  // Get title based on active tab
  const getTitle = () => {
    switch (activeTab) {
      case 'DWSMaster': return 'Daily Work Status - Master Data';
      case 'DWSDaily': return 'Daily Work Status - Daily Entry';
      case 'DWSReport': return 'Daily Work Status - Report';
      case 'DWSDashboard': return 'Daily Work Status - Dashboard';
      case 'DWSUsers': return 'Daily Work Status - User Management';
      case 'DWSReminders': return 'Daily Work Status - Reminder Settings';
      default: return 'Daily Work Status';
    }
  };

  // Render active tab content
  const renderContent = () => {
    switch (activeTab) {
      case 'DWSMaster':
        return <DWSMasterDataTab />;
      case 'DWSDaily':
        return <DWSDailyEntryTab key={statusFilter} initialFilter={statusFilter} />;
      case 'DWSReport':
        return <DWSReportTab />;
      case 'DWSDashboard':
        return <DWSDashboardTab onNavigate={(tab: DWSTab, filter?: string) => {
          setActiveTab(tab);
          setStatusFilter(filter || '');
        }} />;
      case 'DWSUsers':
        return <DWSUserManagementTab />;
      case 'DWSReminders':
        return <DWSReminderSettingsTab />;
      default:
        return <DWSMasterDataTab />;
    }
  };

  return (
    <AppLayout 
      title={getTitle()}
      activeRoute={activeTab}
      sidebarItems={DAILY_WORK_STATUS_NAV}
      onSidebarItemPress={handleSidebarPress}
    >
      <View style={styles.container}>
        {renderContent()}
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  }
});

export default DailyWorkStatusScreen;
