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
  DWSUserManagementTab
} from '../components/dailyWorkStatus';

type DWSTab = 'DWSMaster' | 'DWSDaily' | 'DWSReport' | 'DWSDashboard' | 'DWSUsers';

interface DailyWorkStatusScreenProps {
  navigation: any;
}

/**
 * DailyWorkStatusScreen - Daily Work Status module main screen
 * Contains all sub-modules: Master Data, Daily Entry, Report, Dashboard, User Management
 */
const DailyWorkStatusScreen: React.FC<DailyWorkStatusScreenProps> = ({ navigation }) => {
  const [userName, setUserName] = useState('User');
  const [activeTab, setActiveTab] = useState<DWSTab>('DWSMaster');
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
      default: return 'Daily Work Status';
    }
  };

  // Render active tab content
  const renderContent = () => {
    switch (activeTab) {
      case 'DWSMaster':
        return <DWSMasterDataTab />;
      case 'DWSDaily':
        return <DWSDailyEntryTab />;
      case 'DWSReport':
        return <DWSReportTab />;
      case 'DWSDashboard':
        return <DWSDashboardTab />;
      case 'DWSUsers':
        return <DWSUserManagementTab />;
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
