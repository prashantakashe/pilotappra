// src/screens/RateAnalysisList.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Platform } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { tenderService } from '../services/tenderService';
import type { Tender } from '../types/tender';
import { RateAnalysisTenderCard } from '../components/RateAnalysisTenderCard';
import { TopBarRateAnalysis } from '../components/TopBarRateAnalysis';
import { AppLayout } from '../components/AppLayout';
import { RATE_ANALYSIS_NAV } from '../constants/sidebarMenus';
import { auth } from '../services/firebase';

interface RateAnalysisListProps {
  navigation: any;
}

export const RateAnalysisList: React.FC<RateAnalysisListProps> = ({ navigation }) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenderId, setSelectedTenderId] = useState<string>('');

  // Load tenders from existing app data source
  useEffect(() => {
    console.log('[RateAnalysisList] Subscribing to tenders');
    const unsubscribe = tenderService.subscribeTenders(
      (updatedTenders) => {
        console.log(`[RateAnalysisList] Received ${updatedTenders.length} tenders`);
        setTenders(updatedTenders);
        setLoading(false);
        if (updatedTenders.length > 0 && !selectedTenderId) {
          setSelectedTenderId(updatedTenders[0].tenderId);
        }
      },
      {
        status: undefined, // Get all statuses
        sortField: 'submissionDeadline',
        sortOrder: 'asc'
      }
    );

    return () => {
      console.log('[RateAnalysisList] Cleaning up listener');
      unsubscribe();
    };
  }, []);

  const handleCardPress = (tender: Tender) => {
    console.log('[RateAnalysisList] Opening tender:', tender.tenderId);
    navigation.navigate('RateAnalysisTenderDetail', { tenderId: tender.tenderId });
  };

  const handleNewTender = () => {
    console.log('[RateAnalysisList] Opening New Tender form');
    navigation.navigate('AddTenderForm');
  };

  const renderTenderCard = ({ item }: { item: Tender }) => (
    <RateAnalysisTenderCard 
      tender={item} 
      onPress={() => handleCardPress(item)}
      onPressMarket={() => navigation.navigate('RateAnalysisTenderDetail', { tenderId: item.tenderId, mode: 'market' })}
      onPressSSR={() => navigation.navigate('RateAnalysisTenderDetail', { tenderId: item.tenderId, mode: 'ssr' })}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📊</Text>
      <Text style={styles.emptyTitle}>No Tenders Available</Text>
      <Text style={styles.emptyText}>
        Create a new tender to get started with rate analysis
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleNewTender}>
        <Text style={styles.emptyButtonText}>+ Create New Tender</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <AppLayout
      title="Rate Analysis"
      activeRoute="RateAnalysis"
      sidebarItems={RATE_ANALYSIS_NAV}
    >
      <View style={styles.mainContent}>
        {/* Module Info Banner */}
        {loading && (
          <View style={styles.moduleInfoBanner}>
            <Text style={styles.moduleInfoTitle}>📊 Rate Analysis Module</Text>
            <Text style={styles.moduleInfoText}>
              Analyze and manage Bill of Quantities (BOQ) for your tenders:
            </Text>
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>• Upload BOQ files (.xlsx, .xls, .csv)</Text>
              <Text style={styles.featureItem}>• Automatic parsing with 19 scenario support</Text>
              <Text style={styles.featureItem}>• Edit quantities, rates, and amounts inline</Text>
              <Text style={styles.featureItem}>• Validate data with smart warnings</Text>
              <Text style={styles.featureItem}>• Export to Excel, CSV, or JSON</Text>
              <Text style={styles.featureItem}>• Track revisions and changes</Text>
            </View>
          </View>
        )}
        
        {/* Internal TopBar with Tender Selector */}
        <TopBarRateAnalysis
          tenders={tenders}
          selectedTenderId={selectedTenderId}
          onTenderChange={setSelectedTenderId}
          onNewTender={handleNewTender}
        />

        {/* Tender Cards Grid/List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E90FF" />
            <Text style={styles.loadingText}>Loading tenders...</Text>
          </View>
        ) : (
          <FlatList
            data={tenders}
            keyExtractor={(item) => item.tenderId}
            renderItem={renderTenderCard}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={renderEmptyState}
            numColumns={isMobile ? 1 : isTablet ? 2 : 3}
            key={isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'}
          />
        )}
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280'
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20
  },
  emptyButton: {
    backgroundColor: '#1E90FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  moduleInfoBanner: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8
  },
  moduleInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 8
  },
  moduleInfoText: {
    fontSize: 14,
    color: '#047857',
    marginBottom: 12,
    lineHeight: 20
  },
  featureList: {
    marginLeft: 8
  },
  featureItem: {
    fontSize: 13,
    color: '#059669',
    marginBottom: 6,
    lineHeight: 18
  }
});
