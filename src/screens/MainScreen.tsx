// src/screens/MainScreen.tsx
import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  StyleSheet,
  useWindowDimensions,
  SafeAreaView,
} from 'react-native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import TopBar from '../components/TopBar';
import SideBar, { SideBarItem } from '../components/SideBar';
import { AuthContext } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface MainScreenProps {
  navigation: DrawerNavigationProp<any>;
  children: React.ReactNode;
}

const MainScreen: React.FC<MainScreenProps> = ({ navigation, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useContext(AuthContext)!;
  const { width } = useWindowDimensions();
  const isDesktop = width > 900;

  useEffect(() => {
    // Close sidebar on desktop by default
    if (isDesktop) {
      setSidebarOpen(false);
    }
  }, [isDesktop]);

  const sidebarItems: SideBarItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'grid',
      onPress: () => {
        navigation.navigate('Dashboard');
        setSidebarOpen(false);
      },
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: 'person',
      onPress: () => {
        navigation.navigate('Profile');
        setSidebarOpen(false);
      },
    },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      navigation.replace('Auth');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar
        title="Dashboard"
        onBurgerPress={() => setSidebarOpen(!sidebarOpen)}
        onAvatarPress={() => navigation.navigate('Profile')}
        userName={user?.email || 'User'}
      />

      <View style={styles.mainContent}>
        {isDesktop && (
          <SideBar
            items={sidebarItems}
            onLogout={handleLogout}
            userName={user?.email}
            isOpen={true}
          />
        )}

        {!isDesktop && sidebarOpen && (
          <View style={styles.overlay}>
            <SideBar
              items={sidebarItems}
              onLogout={handleLogout}
              userName={user?.email}
              isOpen={sidebarOpen}
            />
          </View>
        )}

        <View style={styles.content}>{children}</View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.WHITE,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 260,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.WHITE,
  },
});

export default MainScreen;
