// src/screens/RateAnalysisScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import TopBar from '../components/TopBar';
import SideBarNew from '../components/SideBarNew';
import { useResponsive } from '../hooks/useResponsive';
import { spacing } from '../theme/spacing';
import { colors } from '../theme/colors';
import { tenderService } from '../services/tenderService';
import type { Tender } from '../types/tender';
import { rateAnalysisService } from '../services/rateAnalysisService';
import type { RateAnalysisDoc } from '../types/tender';
import RateAnalysisEditor from '../components/RateAnalysisEditor';

const RateAnalysisScreen: React.FC<any> = ({ navigation }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [selectedTenderId, setSelectedTenderId] = useState<string | null>(null);
  const [raList, setRaList] = useState<RateAnalysisDoc[]>([]);
  const [selected, setSelected] = useState<RateAnalysisDoc | null>(null);

  useEffect(() => {
    tenderService.listMyTenders().then((list) => {
      setTenders(list);
      if (list.length && !selectedTenderId) setSelectedTenderId(list[0].tenderId);
    });
  }, []);

  useEffect(() => {
    if (!selectedTenderId) return;
    const unsub = rateAnalysisService.subscribeList(selectedTenderId, (list) => {
      setRaList(list);
      if (selected) {
        const next = list.find((x) => x.id === selected.id) || null;
        setSelected(next);
      }
    });
    return () => { unsub && unsub(); };
  }, [selectedTenderId]);

  useEffect(() => {
    if (isMobile || isTablet) setSidebarOpen(false); else setSidebarOpen(true);
  }, [isMobile, isTablet]);

  const contentMargin = isDesktop && sidebarOpen ? (sidebarCollapsed ? 72 : 260) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <TopBar title="Rate Analysis" onBurgerPress={() => setSidebarOpen(!sidebarOpen)} />
      
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <SideBarNew
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNavigate={(key)=>{ if(key==='Dashboard') navigation.navigate('MainNew'); if(key==='Tender') navigation.navigate('Tender'); }}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeRoute="RateAnalysis"
        />

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.label}>Tender</Text>
          <select
            value={selectedTenderId || ''}
            onChange={(e) => setSelectedTenderId((e.target as HTMLSelectElement).value)}
            style={{ padding: 8, borderRadius: 6, border: '1px solid #E0E0E0', background: '#fff' }}
          >
            {tenders.map((t) => (
              <option key={t.tenderId} value={t.tenderId}>{t.title}</option>
            ))}
          </select>
        </View>

        {!selectedTenderId && <Text style={{ color: colors.TEXT_SECONDARY }}>Select a tender to continue.</Text>}
        {selectedTenderId && (
          <View>
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
                <RateAnalysisEditor tenderId={selectedTenderId} ra={selected} onCreate={()=>{}} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: spacing.lg, maxWidth: 1200, alignSelf: 'center', width: '100%' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  label: { color: colors.TEXT_PRIMARY, marginRight: spacing.sm },
  raLayout: { marginTop: spacing.md, flexDirection: 'row' },
  raList: { width: 320, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', padding: spacing.sm, marginRight: spacing.md },
  raItem: { padding: spacing.sm, borderRadius: 6 },
  raItemActive: { backgroundColor: '#F0F7FF' },
  raTitle: { fontWeight: '600', color: colors.TEXT_PRIMARY },
  raMeta: { fontSize: 12, color: colors.TEXT_SECONDARY },
  raEditor: { flex: 1, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', padding: spacing.md },
});

export default RateAnalysisScreen;
