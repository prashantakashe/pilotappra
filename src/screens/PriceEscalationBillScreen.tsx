import React from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { AppLayout } from '../components/AppLayout';
import { ENGINEERING_NAV } from '../constants/sidebarMenus';
import { PriceEscalationTabs } from '../components/PriceEscalationTabs';

interface PriceEscalationBillScreenProps {
  navigation: any;
}

/**
 * Price Escalation Bill Screen
 * Main screen for the Price Escalation Bill module
 * Manages indices, graphs, and escalation calculations
 */
const PriceEscalationBillScreen: React.FC<PriceEscalationBillScreenProps> = ({ navigation }) => {
  return (
    <AppLayout 
      title="Price Escalation Bill" 
      activeRoute="PriceEscalationBill" 
      sidebarItems={ENGINEERING_NAV}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentWrapper}>
          <PriceEscalationTabs />
        </View>
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
  },
});

export default PriceEscalationBillScreen;
