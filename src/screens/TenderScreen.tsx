// src/screens/TenderScreen.tsx
import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import TopBar from '../components/TopBar';
import SideBarNew from '../components/SideBarNew';
import Card from '../components/Card';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { useResponsive } from '../hooks/useResponsive';
import { userService } from '../services/userService';

interface TenderScreenProps {
  navigation: any;
}

const TenderScreen: React.FC<TenderScreenProps> = ({ navigation }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userName, setUserName] = useState('User');
  const { user, signOut } = useContext(AuthContext)!;
  const { isMobile, isTablet, isDesktop } = useResponsive();

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

  const handleNavigate = (routeKey: string) => {
    if (routeKey === 'Logout') {
      signOut();
      return;
    }
    if (routeKey === 'Dashboard') {
      navigation.navigate('MainNew');
    } else if (routeKey !== 'Tender') {
      navigation.navigate(routeKey);
    }
  };

  React.useEffect(() => {
    if (isMobile || isTablet) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile, isTablet]);

  const contentMargin = isDesktop && sidebarOpen ? (sidebarCollapsed ? 72 : 260) : 0;

  return (
    <View style={styles.container}>
      <TopBar
        title="Tender Management"
        onBurgerPress={() => setSidebarOpen(!sidebarOpen)}
      />

      <SideBarNew
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeRoute="Tender"
        userName={userName}
      />

      <ScrollView
        style={[styles.content, { marginLeft: contentMargin }]}
        contentContainerStyle={styles.scrollContent}
      >
        <Card title="Tender Module">
          <Text style={styles.comingSoon}>Coming Soon</Text>
          <Text style={styles.description}>
            Tender management features will be available here, including tender submission,
            tracking, and bidding workflows.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
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

export default TenderScreen;
