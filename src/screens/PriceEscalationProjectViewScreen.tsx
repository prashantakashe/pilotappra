import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { AppLayout } from '../components/AppLayout';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PRICE_ESCALATION_PROJECT_NAV } from '../constants/sidebarMenus';
import ProjectDetailsTab from '../components/ProjectDetailsTab';
import MasterIndexCard from '../components/MasterIndexCard';
import MasterIndexDatabaseGrid from '../components/MasterIndexDatabaseGrid';
import ProjectBaselineConstantsTab from '../components/ProjectBaselineConstantsTab';

const initialLayout = { width: Dimensions.get('window').width };

const INDICES_SUBTABS = [
  { key: 'masterHistory', label: 'Master Indices History' },
  { key: 'baselineConstants', label: 'Project Baseline & Constants' },
  { key: 'documentLibrary', label: 'Document Library' },
];

const IndicesTab = ({ projectId }: { projectId?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState(INDICES_SUBTABS[0].key);
  
  // Debug logging
  useEffect(() => {
    console.log('IndicesTab - projectId:', projectId);
    console.log('IndicesTab - activeSubTab:', activeSubTab);
  }, [projectId, activeSubTab]);
  const cards: Array<{
    label: string;
    value: string;
    trend?: string;
    trendType?: 'up' | 'down' | 'neutral';
    accentColor: string;
    isDarkTheme?: boolean;
  }> = [
    {
      label: 'LABOUR INDEX',
      value: '168.45',
      trend: '1.2%',
      trendType: 'up',
      accentColor: '#3b82f6',
    },
    {
      label: 'STEEL INDEX',
      value: '212.10',
      trend: '0.4%',
      trendType: 'down',
      accentColor: '#ef4444',
    },
    {
      label: 'CEMENT INDEX',
      value: '196.20',
      trend: '0.0%',
      trendType: 'neutral',
      accentColor: '#10b981',
    },
    {
      label: 'POL INDEX',
      value: '144.30',
      trend: '0.8%',
      trendType: 'up',
      accentColor: '#f59e42',
    },
    {
      label: 'AVG. INFLATION',
      value: '4.82%',
      accentColor: '#facc15',
      isDarkTheme: true,
    },
    {
      label: 'ENTRIES',
      value: '180',
      accentColor: '#64748b',
    },
  ];
  return (
    <View style={[styles.scene, { padding: 0 }]}>
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', backgroundColor: '#fff' }}>
        {INDICES_SUBTABS.map(subTab => (
          <TouchableOpacity
            key={subTab.key}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderBottomWidth: 3,
              borderBottomColor: activeSubTab === subTab.key ? '#1976d2' : 'transparent',
              backgroundColor: activeSubTab === subTab.key ? '#f3f4f6' : '#fff',
            }}
            onPress={() => setActiveSubTab(subTab.key)}
          >
            <Text style={{
              color: activeSubTab === subTab.key ? '#1976d2' : '#888',
              fontWeight: activeSubTab === subTab.key ? 'bold' : 'normal',
              fontSize: 15,
            }}>{subTab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {activeSubTab === 'masterHistory' && (
        <ScrollView 
          style={{ flex: 1, backgroundColor: '#f9fafb' }}
          showsVerticalScrollIndicator={true}
          scrollEventThrottle={16}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'nowrap', padding: 24, gap: 8, backgroundColor: '#f9fafb', borderRadius: 8, marginHorizontal: 24, marginTop: 24, justifyContent: 'flex-start', alignItems: 'stretch' }}>
            {cards.map((card, idx) => (
              <MasterIndexCard key={idx} {...card} cardWidth={160} valueFontSize={18} labelFontSize={9} />
            ))}
          </View>
          <View style={{ marginHorizontal: 24, marginBottom: 24, marginTop: 16 }}>
            <MasterIndexDatabaseGrid hideTitle showAddButton projectId={projectId} />
          </View>
        </ScrollView>
      )}
      {activeSubTab === 'baselineConstants' && (
        <>
          {projectId ? (
            <ProjectBaselineConstantsTab projectId={projectId} />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 32, backgroundColor: '#f9fafb' }}>
              <Text style={{ fontSize: 16, color: '#6B7280' }}>Loading project data...</Text>
            </View>
          )}
        </>
      )}
      {activeSubTab !== 'masterHistory' && activeSubTab !== 'baselineConstants' && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', borderRadius: 8, margin: 24 }}>
          <Text style={{ fontSize: 16, color: '#6B7280' }}>
            Content for "{INDICES_SUBTABS.find(s => s.key === activeSubTab)?.label}" will be added soon.
          </Text>
        </View>
      )}
    </View>
  );
};

const RABillDetailsTab = () => <View style={styles.scene}><Text>R A Bill Details content coming soon.</Text></View>;
const CalculationTab = () => <View style={styles.scene}><Text>Escalation Calculation content coming soon.</Text></View>;
const DocumentsTab = () => <View style={styles.scene}><Text>Documents content coming soon.</Text></View>;
const ReportsTab = () => <View style={styles.scene}><Text>Reports content coming soon.</Text></View>;

const renderScene = ({ route }: any) => {
  switch (route.key) {
    case 'details':
      const projectId = route.params?.projectId;
      return <ProjectDetailsTab projectId={projectId} />;
    case 'indices':
      return <IndicesTab projectId={route.params?.projectId} />;
    case 'rabill':
      return <RABillDetailsTab />;
    case 'escalation':
      return <CalculationTab />;
    case 'documents':
      return <DocumentsTab />;
    case 'reports':
      return <ReportsTab />;
    default:
      return null;
  }
};

interface PriceEscalationProjectViewScreenProps {
  navigation: any;
}

/**
 * Price Escalation Project View Screen
 * Dedicated screen for viewing and managing Price Escalation Bill project details
 * Shows price indices, escalation calculations, and related documents
 */
const PriceEscalationProjectViewScreen: React.FC<PriceEscalationProjectViewScreenProps> = ({ navigation }) => {
  const route = useRoute<any>();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'details', title: 'Project Details', params: { projectId: route.params?.projectId } },
    { key: 'indices', title: 'Indices', params: { projectId: route.params?.projectId } },
    { key: 'rabill', title: 'R A Bill Details' },
    { key: 'escalation', title: 'Price Escalation' },
    { key: 'documents', title: 'Documents' },
    { key: 'reports', title: 'Reports' },
  ]);

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <AppLayout
      title="Price Escalation Bill"
      activeRoute="PriceEscalationBillProject"
      sidebarItems={PRICE_ESCALATION_PROJECT_NAV}
      showBackButton={true}
      onBackPress={handleBack}
    >
      <View style={styles.screenContainer}>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={initialLayout}
          renderTabBar={(props) => (
            <TabBar
              {...props}
              style={styles.tabBar}
              indicatorStyle={styles.tabIndicator}
              activeColor="#1976d2"
              inactiveColor="#999"
            />
          )}
        />
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  tabBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 0,
  },
  tabIndicator: {
    backgroundColor: '#1976d2',
    height: 3,
  },
  scene: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
});

export default PriceEscalationProjectViewScreen;
