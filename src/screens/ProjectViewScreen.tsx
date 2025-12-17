import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TextInput, TouchableOpacity, Alert } from 'react-native';
import { IconButton, Card } from 'react-native-paper';
import { AppLayout } from '../components/AppLayout';
import { useNavigation } from '@react-navigation/native';
import { PROJECTS_NAV } from '../constants/sidebarMenus';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

const initialLayout = { width: Dimensions.get('window').width };


import ProjectDetailsTab from '../components/ProjectDetailsTab';
import InsuranceTable from '../components/InsuranceTable';
import BillsTable from '../components/BillsTable';
import SecurityDepositTable from '../components/SecurityDepositTable';
const InsurancesTab = () => {
  // @ts-ignore
  const projectId = require('@react-navigation/native').useRoute()?.params?.projectId;
  return (
    <View style={[styles.scene, { flex: 1, backgroundColor: '#f4f8fb' }]}> 
      <InsuranceTable projectId={projectId} />
    </View>
  );
};
const BillsTab = () => {
  // @ts-ignore
  const projectId = require('@react-navigation/native').useRoute()?.params?.projectId;
  return (
    <View style={[styles.scene, { flex: 1, backgroundColor: '#f4f8fb' }]}> 
      <BillsTable projectId={projectId} />
    </View>
  );
};
const SecurityDepositTab = () => {
  // @ts-ignore
  const projectId = require('@react-navigation/native').useRoute()?.params?.projectId;
  return (
    <View style={[styles.scene, { flex: 1, backgroundColor: '#f4f8fb' }]}> 
      <SecurityDepositTable projectId={projectId} />
    </View>
  );
};

const renderScene = ({ route }) => {
  switch (route.key) {
    case 'details':
      // @ts-ignore
      const projectId = require('@react-navigation/native').useRoute()?.params?.projectId;
      return <ProjectDetailsTab projectId={projectId} />;
    case 'insurances':
      return <InsurancesTab />;
    case 'bills':
      return <BillsTab />;
    case 'security':
      return <SecurityDepositTab />;
    default:
      return null;
  }
};

const ProjectViewScreen: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'details', title: 'Project Details' },
    { key: 'insurances', title: 'Insurances' },
    { key: 'bills', title: 'Bills' },
    { key: 'security', title: 'Security Deposit' },
  ]);

  const navigation = useNavigation();
  const handleBack = () => {
    navigation.goBack();
  };
  return (
    <AppLayout
      title="Project View"
      activeRoute="Projects"
      sidebarItems={PROJECTS_NAV}
      showBackButton={true}
      onBackPress={handleBack}
    >
      <View style={{ flex: 1, backgroundColor: 'transparent', padding: 16 }}>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={initialLayout}
          renderTabBar={props => (
            <TabBar
              {...props}
              style={{ backgroundColor: '#fff', borderBottomWidth: 2, borderBottomColor: '#e0e0e0', elevation: 0 }}
              labelStyle={{ fontWeight: 'bold', fontSize: 16 }}
              indicatorStyle={{ backgroundColor: '#1976d2', height: 3 }}
              tabStyle={{ width: 'auto', paddingHorizontal: 24 }}
              activeColor="#1976d2"
              inactiveColor="#888"
              renderLabel={({ route, focused, color }) => (
                <Text style={{ color: focused ? '#1976d2' : '#888', fontWeight: 'bold', fontSize: 16 }}>
                  {route.title}
                </Text>
              )}
              scrollEnabled
            />
          )}
        />
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  scene: {
    flex: 1,
    backgroundColor: '#f4f8fb',
    padding: 0,
    width: '100%',
    height: '100%',
    alignSelf: 'stretch',
  },
  label: {
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 8,
    color: '#333',
  },
  value: {
    fontSize: 15,
    marginBottom: 4,
    color: '#444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    fontSize: 15,
    marginBottom: 4,
    backgroundColor: '#fff',
  },
});

export default ProjectViewScreen;
