// src/screens/TenderDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AppLayout } from '../components/AppLayout';
import { TENDER_MODULE_NAV } from '../constants/sidebarMenus';
import { spacing } from '../theme/spacing';
import { colors } from '../theme/colors';
import { tenderService } from '../services/tenderService';
import type { Tender } from '../types/tender';
import { rateAnalysisService } from '../services/rateAnalysisService';
import type { RateAnalysisDoc } from '../types/tender';
import RateAnalysisEditor from '../components/RateAnalysisEditor';
import { StagesTab } from '../components/StagesTab';
import { auth } from '../services/firebase';

const tabDefs = [
  'Overview',
  'Stages', // New tab for 16-stage tracking
  'Key Dates',
  'Client Details',
  'Tender Documents',
  'BOQ / Financials',
  'Technical / Qualification',
  'Notes / Follow-up',
  'Team Assignment',
  'Status History',
  'Attachments',
  'Rate Analysis',
] as const;

type TabKey = typeof tabDefs[number];

const TenderDetailScreen: React.FC<any> = ({ route, navigation }) => {
  const { tenderId, initialTab } = route.params as { tenderId: string; initialTab?: string };
  const [activeTab, setActiveTab] = useState<TabKey>((initialTab as TabKey) || 'Overview');
  const [tender, setTender] = useState<Tender | null>(null);

  // Rate Analysis state
  const [raList, setRaList] = useState<RateAnalysisDoc[]>([]);
  const [selected, setSelected] = useState<RateAnalysisDoc | null>(null);

  // Get current user role for stage permissions
  const currentUser = auth.currentUser;
  const userRole = tender?.membersMap?.[currentUser?.uid || ''] || 'viewer';

  useEffect(() => {
    const unsubTender = tenderService.subscribeTender(tenderId, setTender);
    const unsubRA = rateAnalysisService.subscribeList(tenderId, (list) => {
      setRaList(list);
      if (selected) {
        const next = list.find((x) => x.id === selected.id) || null;
        setSelected(next);
      }
    });
    return () => { unsubTender(); unsubRA(); };
  }, [tenderId]);

  const handleTenderUpdate = (updatedTender: Tender) => {
    setTender(updatedTender);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'Stages':
        return tender ? (
          <StagesTab
            tender={tender}
            userRole={userRole}
            onTenderUpdate={handleTenderUpdate}
          />
        ) : (
          <Text style={{ color: colors.TEXT_SECONDARY }}>Loading tender data...</Text>
        );
      case 'Rate Analysis':
        return (
          <View>
            <View style={styles.raHeader}>
              <Text style={styles.sectionTitle}>Rate Analysis</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => setSelected(null)}>
                <Text style={styles.primaryBtnText}>New</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.raLayout}>
              <View style={styles.raList}>
                {raList.map((ra) => (
                  <TouchableOpacity key={ra.id} style={[styles.raItem, selected?.id===ra.id && styles.raItemActive]} onPress={() => setSelected(ra)}>
                    <Text style={styles.raTitle}>{ra.description || 'Untitled'}</Text>
                    <Text style={styles.raMeta}>Qty {ra.quantity} {ra.unit} • v{ra.version}</Text>
                  </TouchableOpacity>
                ))}
                {raList.length === 0 && <Text style={{ color: colors.TEXT_SECONDARY }}>No rate analysis yet.</Text>}
              </View>
              <View style={styles.raEditor}>
                <RateAnalysisEditor tenderId={tenderId} ra={selected} onCreate={(id)=>{ /* allow list subscription to pick up */ }} />
              </View>
            </View>
          </View>
        );
      default:
        return <Text style={{ color: colors.TEXT_SECONDARY }}>Section coming soon.</Text>;
    }
  };

  return (
    <AppLayout
      title={tender?.title || 'Tender Detail'}
      activeRoute="Tender"
      showBackButton={true}
      sidebarItems={TENDER_MODULE_NAV}
      onBackPress={() => navigation.goBack()}
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabsRow}>
            {tabDefs.map((t) => (
              <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={[styles.tab, activeTab===t && styles.tabActive]}>
                <Text style={[styles.tabText, activeTab===t && styles.tabTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={{ marginTop: spacing.md }}>{renderTab()}</View>
      </ScrollView>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: { padding: spacing.lg, maxWidth: 1200, alignSelf: 'center', width: '100%' },
  tabsRow: { flexDirection: 'row' },
  tab: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E0E0E0', marginRight: spacing.sm },
  tabActive: { backgroundColor: colors.PRIMARY_LIGHT, borderColor: colors.ACTION_BLUE },
  tabText: { color: colors.TEXT_PRIMARY },
  tabTextActive: { color: colors.ACTION_BLUE, fontWeight: '700' },
  primaryBtn: { backgroundColor: colors.ACTION_BLUE, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 8 },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  sectionTitle: { fontWeight: '700', color: colors.TEXT_PRIMARY, fontSize: 16 },
  raHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  raLayout: { marginTop: spacing.md, flexDirection: 'row' },
  raList: { width: 320, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', padding: spacing.sm, marginRight: spacing.md },
  raItem: { padding: spacing.sm, borderRadius: 6 },
  raItemActive: { backgroundColor: '#F0F7FF' },
  raTitle: { fontWeight: '600', color: colors.TEXT_PRIMARY },
  raMeta: { fontSize: 12, color: colors.TEXT_SECONDARY },
  raEditor: { flex: 1, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', padding: spacing.md },
});

export default TenderDetailScreen;
