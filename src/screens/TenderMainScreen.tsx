// src/screens/TenderMainScreen.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  RefreshControl,
  Alert
} from 'react-native';
import { TenderCard } from '../components/TenderCard';
import { tenderService, TenderStatus, SortField } from '../services/tenderService';
import { auth } from '../services/firebase';
import type { Tender } from '../types/tender';
import { useRoute } from '@react-navigation/native';
import { AppLayout } from '../components/AppLayout';
import { TENDER_MODULE_NAV } from '../constants/sidebarMenus';
import { useResponsive } from '../hooks/useResponsive';

const STATUS_FILTERS: { label: string; value: TenderStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Active', value: 'active' },
  { label: 'To Submit', value: 'to_submit' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
  { label: 'Archived', value: 'archived' }
];

const SORT_OPTIONS: { label: string; field: SortField; order: 'asc' | 'desc' }[] = [
  { label: 'Latest First', field: 'createdAt', order: 'desc' },
  { label: 'Oldest First', field: 'createdAt', order: 'asc' },
  { label: 'Deadline (Urgent)', field: 'submissionDeadline', order: 'asc' },
  { label: 'Deadline (Distant)', field: 'submissionDeadline', order: 'desc' },
  { label: 'Value (High-Low)', field: 'estimatedValue', order: 'desc' },
  { label: 'Value (Low-High)', field: 'estimatedValue', order: 'asc' },
  { label: 'Recently Updated', field: 'lastUpdated', order: 'desc' }
];

export const TenderMainScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const route = useRoute<any>();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<TenderStatus | 'all'>('all');
  const [sortOption, setSortOption] = useState(SORT_OPTIONS[0]);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const listRef = useRef<FlatList<Tender>>(null);
  const [highlightTenderId, setHighlightTenderId] = useState<string | null>(null);



  // Apply initial params if provided (e.g., after creating a tender)
  useEffect(() => {
    if (route?.params?.selectedStatus) {
      setSelectedStatus(route.params.selectedStatus);
    }
    if (route?.params?.highlightTenderId) {
      setHighlightTenderId(route.params.highlightTenderId);
      // Clear highlight after 3 seconds
      setTimeout(() => setHighlightTenderId(null), 3000);
    }
  }, [route?.params?.selectedStatus, route?.params?.highlightTenderId]);

  // Real-time subscription to tenders
  useEffect(() => {
    console.log('[TenderMainScreen] Setting up real-time listener...');
    console.log('[TenderMainScreen] Current user:', auth.currentUser?.email || 'NOT LOGGED IN');
    console.log('[TenderMainScreen] User UID:', auth.currentUser?.uid || 'NO UID');
    
    const unsubscribe = tenderService.subscribeTenders(
      (updatedTenders) => {
        console.log(`[TenderMainScreen] Received ${updatedTenders.length} tenders`);
        if (updatedTenders.length > 0) {
          console.log('[TenderMainScreen] First tender:', updatedTenders[0]);
        }
        setTenders(updatedTenders);
        setLoading(false);
        setRefreshing(false);

        // If returning from create, scroll to top to show latest
        if (route?.params?.highlightTenderId && updatedTenders.length > 0) {
          setTimeout(() => {
            try { listRef.current?.scrollToOffset({ offset: 0, animated: true }); } catch {}
          }, 50);
        }
      },
      {
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        sortField: sortOption.field,
        sortOrder: sortOption.order
      }
    );

    return () => {
      console.log('[TenderMainScreen] Cleaning up listener');
      unsubscribe();
    };
  }, [selectedStatus, sortOption]);

  // Filter tenders by search query (client-side)
  const filteredTenders = useMemo(() => {
    if (!searchQuery.trim()) {
      return tenders;
    }
    return tenderService.filterTendersBySearch(tenders, searchQuery);
  }, [tenders, searchQuery]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Real-time listener will automatically update
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Navigation handlers
  const handleCardPress = (tender: Tender) => {
    navigation.navigate('TenderDetail', { tenderId: tender.tenderId });
  };

  const handleStagePress = (tender: Tender) => {
    // Deep-link to Stages tab in TenderDetailScreen
    navigation.navigate('TenderDetail', { 
      tenderId: tender.tenderId,
      initialTab: 'Stages' 
    });
  };

  const handleRateAnalysis = (tender: Tender) => {
    console.log('[TenderMainScreen] Rate Analysis:', tender.tenderId);
    // TODO: Navigate to Rate Analysis screen
  };

  const handleUploadDocument = (tender: Tender) => {
    console.log('[TenderMainScreen] Upload Document:', tender.tenderId);
    // TODO: Open document upload modal
  };

  const handleMore = (tender: Tender) => {
    console.log('[TenderMainScreen] More actions:', tender.tenderId);
    // TODO: Show action sheet with more options
  };

  const handleAddNew = () => {
    navigation.navigate('AddTenderForm');
  };

  // Dev helper: long-press FAB to create sample tender quickly
  const handleCreateSampleTender = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Login required', 'Please log in to create a tender.');
        return;
      }

      const tenderData = {
        title: 'Karad Project',
        shortName: 'Karad',
        workType: 'Sports',
        tenderSource: 'GEM',
        tenderSourceOther: '',
        estimatedValue: '78000000',
        currency: 'INR',
        description: 'Sports facility project in Karad',
        client: 'Municipal Corporation Karad',
        department: 'Sports & Youth Affairs',
        tenderUID: 'KARAD-SPORTS-2025',
        externalLink: '',
        country: 'India',
        state: 'Maharashtra',
        city: 'Karad',
        siteAddress: 'Karad, Maharashtra',
        prebidMeetingAddress: '',
        publishDate: '2025-11-10T00:00:00.000Z',
        prebidMeetingDate: null,
        queryDeadline: null,
        documentPurchaseDeadline: null,
        submissionDeadline: '2025-11-25T23:59:59.000Z',
        technicalOpeningDate: null,
        financialOpeningDate: null,
        reminderEnabled: true,
        reminderLeadDays: 3,
        boqFileUrl: '',
        boqItemCount: 0,
        tenderValue: '78000000',
        paymentTerms: '',
        tenderManager: 'Prashant',
        engineeringLead: '',
        estimationEngineer: '',
        documentController: '',
        additionalMembers: [],
        status: 'active',
        submissionMode: 'Online',
        internalNotes: 'Quick-create via FAB long-press',
        emdAmount: '',
        prebidQueryInstructions: '',
        extraReminders: '',
        bidProbabilityScore: null,
        draftId: 'quick-create-' + Date.now(),
        documents: []
      } as any;

      console.log('[TenderMainScreen] Quick create tender payload:', tenderData);
      const tenderId = await (await import('../services/tenderService')).tenderService.finalizeTenderCreate(tenderData);
      console.log('[TenderMainScreen] Quick create success:', tenderId);
      Alert.alert('Success', `Tender created: ${tenderId}`);
      navigation.navigate('TenderDetail', { tenderId });
    } catch (e: any) {
      console.error('[TenderMainScreen] Quick create error:', e);
      Alert.alert('Error', e?.message || 'Failed to create tender');
    }
  };

  // Render status filter tabs
  const renderStatusFilters = () => (
    <View style={styles.filterRow}>
      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(item) => item.value}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterTab,
              selectedStatus === item.value && styles.filterTabActive
            ]}
            onPress={() => setSelectedStatus(item.value)}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedStatus === item.value && styles.filterTabTextActive
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  // Render search and sort bar
  const renderSearchBar = () => (
    <View style={styles.searchRow}>
      <View style={styles.searchInputContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, client, or tender no..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={styles.sortButton}
        onPress={() => setShowSortMenu(!showSortMenu)}
      >
        <Text style={styles.sortIcon}>⇅</Text>
      </TouchableOpacity>
    </View>
  );

  // Render sort menu
  const renderSortMenu = () => {
    if (!showSortMenu) return null;

    return (
      <View style={styles.sortMenu}>
        {SORT_OPTIONS.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.sortMenuItem,
              sortOption.label === option.label && styles.sortMenuItemActive
            ]}
            onPress={() => {
              setSortOption(option);
              setShowSortMenu(false);
            }}
          >
            <Text
              style={[
                styles.sortMenuItemText,
                sortOption.label === option.label && styles.sortMenuItemTextActive
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>No tenders found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? 'Try adjusting your search or filters'
          : 'Create your first tender to get started'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
          <Text style={styles.addButtonText}>+ Add New Tender</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render tender card
  const renderTenderCard = ({ item }: { item: Tender }) => {
    const isHighlighted = item.tenderId === highlightTenderId;
    return (
      <View style={isHighlighted && styles.highlightWrapper}>
        <TenderCard
          tender={item}
          onPress={() => handleCardPress(item)}
          onStagePress={() => handleStagePress(item)}
          onRateAnalysis={() => handleRateAnalysis(item)}
          onUploadDocument={() => handleUploadDocument(item)}
          onMore={() => handleMore(item)}
        />
      </View>
    );
  };

  return (
    <AppLayout
      title="Tenders"
      activeRoute="Tender"
      sidebarItems={TENDER_MODULE_NAV}
    >
      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Module Info Banner - Visible before loading */}
        {loading && (
          <View style={styles.moduleInfoBanner}>
            <Text style={styles.moduleInfoTitle}>📋 Tender Management Module</Text>
            <Text style={styles.moduleInfoText}>
              This module helps you manage all aspects of tender processes including:
            </Text>
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>• Create and track tender opportunities</Text>
              <Text style={styles.featureItem}>• Monitor submission deadlines and milestones</Text>
              <Text style={styles.featureItem}>• Upload and organize tender documents</Text>
              <Text style={styles.featureItem}>• Assign team members and track progress</Text>
              <Text style={styles.featureItem}>• Filter by status: Draft, Active, Submitted, Won, Lost</Text>
              <Text style={styles.featureItem}>• Sort by deadline, value, or update date</Text>
            </View>
          </View>
        )}
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tenders</Text>
          <TouchableOpacity style={styles.headerButton} onPress={handleAddNew}>
            <Text style={styles.headerButtonText}>+ New</Text>
          </TouchableOpacity>
        </View>

      {/* Status Filters */}
      {renderStatusFilters()}

      {/* Search & Sort */}
      {renderSearchBar()}
      {renderSortMenu()}

      {/* Tender List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E90FF" />
          <Text style={styles.loadingText}>Loading tenders...</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={filteredTenders}
          keyExtractor={(item) => item.tenderId}
          renderItem={renderTenderCard}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddNew} onLongPress={handleCreateSampleTender}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
      </View>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  highlightWrapper: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 2,
    marginBottom: -2,
    ...Platform.select({
      web: {
        animation: 'fadeOut 3s ease-out forwards',
        '@keyframes fadeOut': {
          '0%': { backgroundColor: '#FEF3C7' },
          '100%': { backgroundColor: 'transparent' }
        }
      }
    })
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827'
  },
  headerButton: {
    backgroundColor: '#1E90FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  filterRow: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingLeft: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  filterTabActive: {
    backgroundColor: '#1E90FF',
    borderColor: '#1E90FF'
  },
  filterTabText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500'
  },
  filterTabTextActive: {
    color: '#fff',
    fontWeight: '600'
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8
  },
  searchIcon: {
    fontSize: 16
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827'
  },
  clearIcon: {
    fontSize: 16,
    color: '#9CA3AF'
  },
  sortButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sortIcon: {
    fontSize: 20,
    color: '#6B7280'
  },
  sortMenu: {
    position: 'absolute',
    top: 120,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    zIndex: 1000,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5
      }
    })
  },
  sortMenuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  sortMenuItemActive: {
    backgroundColor: '#EFF6FF'
  },
  sortMenuItemText: {
    fontSize: 14,
    color: '#374151'
  },
  sortMenuItemTextActive: {
    color: '#1E90FF',
    fontWeight: '600'
  },
  listContainer: {
    padding: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280'
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24
  },
  addButton: {
    backgroundColor: '#1E90FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E90FF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(30,144,255,0.4)'
      },
      default: {
        shadowColor: '#1E90FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8
      }
    })
  },
  fabIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300'
  },
  moduleInfoBanner: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#1E90FF',
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8
  },
  moduleInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 8
  },
  moduleInfoText: {
    fontSize: 14,
    color: '#1E40AF',
    marginBottom: 12,
    lineHeight: 20
  },
  featureList: {
    marginLeft: 8
  },
  featureItem: {
    fontSize: 13,
    color: '#3B82F6',
    marginBottom: 6,
    lineHeight: 18
  }
});
