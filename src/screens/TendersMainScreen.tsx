// src/screens/TendersMainScreen.tsx
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import TopBar from '../components/TopBar';
import SideBarNew from '../components/SideBarNew';
import { spacing } from '../theme/spacing';
import { colors } from '../theme/colors';
import { useResponsive } from '../hooks/useResponsive';
import { AuthContext } from '../contexts/AuthContext';
import { tenderService } from '../services/tenderService';
import type { Tender, TenderStatus } from '../types/tender';
import { userService } from '../services/userService';

const tabs: { key: string; label: string; status?: TenderStatus }[] = [
  { key: 'all', label: 'All Tenders' },
  { key: 'active', label: 'Active', status: 'active' },
  { key: 'to_submit', label: 'To be Submitted', status: 'to_submit' },
  { key: 'submitted', label: 'Submitted', status: 'submitted' },
  { key: 'won', label: 'Won', status: 'won' },
  { key: 'lost', label: 'Lost / NQ', status: 'lost' },
  { key: 'archived', label: 'Archived', status: 'archived' },
];

const TenderCard = ({ item, onOpen }: { item: Tender; onOpen: () => void }) => (
  <TouchableOpacity style={styles.card} onPress={onOpen} accessibilityRole="button" accessibilityLabel={`Open tender ${item.title}`}>
    <Text style={styles.cardTitle}>{item.title}</Text>
    <Text style={styles.cardMeta}>{item.client || 'Client N/A'}</Text>
    <Text style={styles.cardMeta}>{item.tenderUID || 'Tender ID: N/A'}</Text>
    <View style={styles.badgesRow}>
      {item.status && <Text style={styles.badge}>{item.status}</Text>}
      {/* Placeholder for docs pending */}
    </View>
  </TouchableOpacity>
);

const TendersMainScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useContext(AuthContext)!;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [userName, setUserName] = useState('User');
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<Tender[]>([]);

  useEffect(() => {
    if (user?.displayName) setUserName(user.displayName.split(' ')[0]);
    else if (user?.email) setUserName(user.email.split('@')[0]);
    if (user?.uid) userService.getUserProfile(user.uid).then(p => p?.name && setUserName(p.name.split(' ')[0])).catch(()=>{});
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    tenderService.listMyTenders().then((list) => { if (!cancelled) setItems(list); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (isMobile || isTablet) setSidebarOpen(false); else setSidebarOpen(true);
  }, [isMobile, isTablet]);

  const filtered = useMemo(() => {
    return items.filter(i =>
      (activeTab === 'all' || i.status === (tabs.find(t=>t.key===activeTab)?.status)) &&
      (search.trim().length === 0 || (i.title||'').toLowerCase().includes(search.toLowerCase()))
    );
  }, [items, activeTab, search]);

  const addTender = async () => {
    navigation.navigate('AddTenderForm');
  };

  const handleNavigate = (routeKey: string) => {
    if (routeKey === 'Dashboard') navigation.navigate('MainNew');
    else if (routeKey === 'RateAnalysis') navigation.navigate('RateAnalysis');
  };

  const contentMargin = isDesktop && sidebarOpen ? (sidebarCollapsed ? 72 : 260) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <TopBar title="Tenders" onBurgerPress={() => setSidebarOpen(!sidebarOpen)} />
      
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <SideBarNew
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNavigate={handleNavigate}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeRoute="Tender"
          userName={userName}
        />

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tabsRow}>
              {tabs.map(t => (
                <TouchableOpacity key={t.key} style={[styles.tab, activeTab===t.key && styles.tabActive]} onPress={()=>setActiveTab(t.key)}>
                  <Text style={[styles.tabText, activeTab===t.key && styles.tabTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
              {/* Submodule: Master Rate Database */}
              <TouchableOpacity style={[styles.tab, styles.tabSpecial]} onPress={()=>navigation.navigate('MasterRateDatabase')}>
                <Text style={[styles.tabText, styles.tabTextSpecial]}>Master Rate Database</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          <View style={styles.actionsRow}>
            <TextInput style={styles.search} placeholder="Search" value={search} onChangeText={setSearch} />
            <TouchableOpacity style={styles.primaryBtn} onPress={addTender}>
              <Text style={styles.primaryBtnText}>Add New Tender</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.grid}>
          {filtered.map((i) => (
            <TenderCard key={i.tenderId} item={i} onOpen={() => navigation.navigate('TenderDetail', { tenderId: i.tenderId })} />
          ))}
          {filtered.length === 0 && <Text style={{ color: colors.TEXT_SECONDARY }}>No tenders yet.</Text>}
        </View>
      </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: spacing.lg, maxWidth: 1200, alignSelf: 'center', width: '100%' },
  headerRow: { marginBottom: spacing.md },
  tabsRow: { flexDirection: 'row' },
  tab: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E0E0E0', marginRight: spacing.sm },
  tabActive: { backgroundColor: colors.PRIMARY_LIGHT, borderColor: colors.ACTION_BLUE },
  tabText: { color: colors.TEXT_PRIMARY },
  tabTextActive: { color: colors.ACTION_BLUE, fontWeight: '700' },
  tabSpecial: { borderColor: colors.ACTION_BLUE },
  tabTextSpecial: { color: colors.ACTION_BLUE, fontWeight: '600' },
  actionsRow: { marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center' },
  search: { 
    flex: 1, 
    minWidth: 200, 
    height: 40,
    borderWidth: 1, 
    borderColor: '#E0E0E0', 
    borderRadius: 8, 
    paddingHorizontal: spacing.sm, 
    paddingVertical: spacing.sm, 
    backgroundColor: '#fff', 
    marginRight: spacing.sm,
    fontSize: 14,
    color: colors.TEXT_PRIMARY,
  },
  primaryBtn: { backgroundColor: colors.ACTION_BLUE, paddingHorizontal: spacing.md, paddingVertical: 12, borderRadius: 8, height: 40, justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  grid: { marginTop: spacing.md, flexDirection: 'row', flexWrap: 'wrap' },
  card: { width: 280, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', padding: spacing.md, marginRight: spacing.md, marginBottom: spacing.md },
  cardTitle: { fontWeight: '700', color: colors.TEXT_PRIMARY, marginBottom: 4 },
  cardMeta: { color: colors.TEXT_SECONDARY, fontSize: 12 },
  badgesRow: { marginTop: spacing.sm, flexDirection: 'row' },
  badge: { backgroundColor: colors.PRIMARY_LIGHT, color: colors.ACTION_BLUE, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, overflow: 'hidden', fontSize: 12, marginRight: spacing.xs },
});

export default TendersMainScreen;
