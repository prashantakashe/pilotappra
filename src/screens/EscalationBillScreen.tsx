// src/screens/EscalationBillScreen.tsx
import React, { useContext, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { AppLayout } from '../components/AppLayout';
import { ENGINEERING_NAV } from '../constants/sidebarMenus';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import type { EscalationMaster } from '../types/escalation';
import { getAllMasters } from '../services/escalationService';

// Tab imports (to be created)
import MasterSetupTab from '../components/escalation/MasterSetupTab';
import IndicesGraphsTab from '../components/escalation/IndicesGraphsTab';
import CreateBillTab from '../components/escalation/CreateBillTab';
import CalculationTab from '../components/escalation/CalculationTab';
import DocumentsTab from '../components/escalation/DocumentsTab';
import HistoryTab from '../components/escalation/HistoryTab';

type TabType = 'master' | 'indices' | 'create' | 'calculation' | 'documents' | 'history';

interface Tab {
  id: TabType;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'master', label: 'Master Setup', icon: '⚙️' },
  { id: 'indices', label: 'Indices & Graphs', icon: '📊' },
  { id: 'create', label: 'Create Bill', icon: '📝' },
  { id: 'calculation', label: 'Calculation', icon: '🧮' },
  { id: 'documents', label: 'Documents', icon: '📁' },
  { id: 'history', label: 'History', icon: '📜' },
];

interface EscalationBillScreenProps {
  navigation: any;
}

const EscalationBillScreen: React.FC<EscalationBillScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<TabType>('master');
  const [masters, setMasters] = useState<EscalationMaster[]>([]);
  const [selectedMaster, setSelectedMaster] = useState<EscalationMaster | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMasters();
  }, []);

  // Debug: Monitor selectedMaster changes
  useEffect(() => {
    console.log('[EscalationBillScreen] selectedMaster changed:', selectedMaster ? `${selectedMaster.contractName} (ID: ${selectedMaster.id})` : 'null');
    console.log('[EscalationBillScreen] Indices & Graphs should be accessible:', !!selectedMaster);
  }, [selectedMaster]);

  const loadMasters = async () => {
    try {
      setLoading(true);
      console.log('[EscalationBillScreen] Loading masters from Firestore...');
      const data = await getAllMasters();
      console.log('[EscalationBillScreen] Loaded', data.length, 'masters:', data);
      setMasters(data);
      
      // Auto-select first master if available and no master currently selected
      if (data.length > 0 && !selectedMaster) {
        console.log('[EscalationBillScreen] Auto-selecting first master:', data[0].contractName);
        setSelectedMaster(data[0]);
      }
    } catch (error: any) {
      console.error('[EscalationBillScreen] Error loading masters:', error);
      Alert.alert('Error', 'Failed to load master data');
    } finally {
      setLoading(false);
    }
  };

  const handleMasterCreated = async (master: EscalationMaster) => {
    console.log('[EscalationBillScreen] handleMasterCreated called with:', master);
    
    // Reload the entire masters list from Firestore to get the saved data with proper ID
    await loadMasters();
    
    // Set the newly created master as selected
    setSelectedMaster(master);
    
    Alert.alert('✅ Success', 'Master data saved successfully! You can now access Indices & Graphs.');
  };

  const handleMasterUpdated = async (master: EscalationMaster) => {
    console.log('[EscalationBillScreen] handleMasterUpdated called with:', master);
    
    // Reload the entire masters list from Firestore
    await loadMasters();
    
    // Update the selected master
    setSelectedMaster(master);
    
    Alert.alert('✅ Success', 'Master data updated successfully!');
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.ACTION_BLUE} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'master':
        return (
          <MasterSetupTab
            masters={masters}
            selectedMaster={selectedMaster}
            onMasterSelect={setSelectedMaster}
            onMasterCreated={handleMasterCreated}
            onMasterUpdated={handleMasterUpdated}
          />
        );
      case 'indices':
        return (
          <IndicesGraphsTab
            masterId={selectedMaster?.id}
          />
        );
      case 'create':
        return (
          <CreateBillTab
            master={selectedMaster}
            onBillCreated={() => setActiveTab('history')}
          />
        );
      case 'calculation':
        return (
          <CalculationTab
            master={selectedMaster}
          />
        );
      case 'documents':
        return (
          <DocumentsTab
            masterId={selectedMaster?.id}
          />
        );
      case 'history':
        return (
          <HistoryTab
            masterId={selectedMaster?.id}
            onBillSelect={(bill) => {
              // Navigate to calculation view
              setActiveTab('calculation');
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AppLayout 
      title="Escalation Bill" 
      activeRoute="EscalationBill" 
      sidebarItems={ENGINEERING_NAV}
      showBackButton={true}
      onBackPress={() => navigation.navigate('Engineering')}
    >
      <View style={styles.container}>
        {/* Tab Header */}
        <View style={styles.tabHeader}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tab,
                  activeTab === tab.id && styles.activeTab,
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === tab.id && styles.activeTabLabel,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {!selectedMaster && activeTab !== 'master' ? (
            <View style={styles.noMasterContainer}>
              <Text style={styles.noMasterIcon}>⚠️</Text>
              <Text style={styles.noMasterText}>
                Please create or select a Master Setup first
              </Text>
              <TouchableOpacity
                style={styles.goToMasterButton}
                onPress={() => setActiveTab('master')}
              >
                <Text style={styles.goToMasterButtonText}>
                  Go to Master Setup
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            renderTabContent()
          )}
        </View>
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabsContainer: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  activeTab: {
    backgroundColor: colors.ACTION_BLUE,
  },
  tabIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  noMasterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noMasterIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noMasterText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  goToMasterButton: {
    backgroundColor: colors.ACTION_BLUE,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  goToMasterButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EscalationBillScreen;
