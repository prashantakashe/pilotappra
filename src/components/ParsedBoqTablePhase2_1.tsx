import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import type { StandardBOQRow } from '../services/boqParser';

interface ParsedBoqTableProps {
  tenderId: string;
  parsedBoq: StandardBOQRow[];
  onOpenRateBuilder: (itemIndex: number, item: StandardBOQRow, revisionKey?: string) => void;
}

export const ParsedBoqTablePhase2_1: React.FC<ParsedBoqTableProps> = ({
  tenderId,
  parsedBoq,
  onOpenRateBuilder,
}) => {
  // Track which revisions to display (R1, R2, R3, etc.)
  const [activeRevisions, setActiveRevisions] = useState<string[]>([]);
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false);
  
  // Refs to synchronize horizontal scrolling between header and body
  const headerScrollRef = React.useRef<ScrollView>(null);
  const bodyScrollRef = React.useRef<ScrollView>(null);

  // Synchronize horizontal scroll from header to body
  const handleHeaderScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    bodyScrollRef.current?.scrollTo({ x: offsetX, animated: false });
  };

  // Synchronize horizontal scroll from body to header
  const handleBodyScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    headerScrollRef.current?.scrollTo({ x: offsetX, animated: false });
  };

  // Calculate total table width based on columns
  const calculateTableWidth = () => {
    const baseWidth = 50 + 80 + 250 + 100 + 100 + 60 + 80 + 90 + 110; // Base columns (added itemNo: 80, increased description: 250)
    const revisionWidth = activeRevisions.length * (100 + 110 + 30); // Each revision: rate + amount + delete button (reduced widths)
    return baseWidth + revisionWidth;
  };

  const tableWidth = calculateTableWidth();

  // Auto-detect and add revisions that exist in the data
  useEffect(() => {
    if (parsedBoq.length === 0) {
      console.log('[ParsedBoqTablePhase2_1] No BOQ data, skipping auto-add');
      return;
    }
    
    // Only run once when data first loads
    if (hasAutoLoaded) {
      console.log('[ParsedBoqTablePhase2_1] Already auto-loaded revisions, skipping');
      return;
    }
    
    // Only auto-add if we don't have any active revisions yet
    if (activeRevisions.length > 0) {
      console.log('[ParsedBoqTablePhase2_1] Already have active revisions:', activeRevisions);
      return;
    }
    
    console.log('[ParsedBoqTablePhase2_1] Checking BOQ items for existing revisions...');
    console.log('[ParsedBoqTablePhase2_1] Total items:', parsedBoq.length);
    console.log('[ParsedBoqTablePhase2_1] First item:', parsedBoq[0]);
    
    // Find all revision keys that exist in the data
    const existingRevisions = new Set<string>();
    let itemsWithRevisions = 0;
    
    parsedBoq.forEach((item, idx) => {
      if (item.revisions && typeof item.revisions === 'object') {
        Object.keys(item.revisions).forEach(key => {
          const rev = (item.revisions as any)[key];
          if (rev && rev.rate) {
            console.log(`[ParsedBoqTablePhase2_1] Item ${idx} has ${key} with rate:`, rev.rate);
            existingRevisions.add(key);
            itemsWithRevisions++;
          }
        });
      }
    });
    
    const revisionsArray = Array.from(existingRevisions).sort();
    console.log('[ParsedBoqTablePhase2_1] Found revisions:', revisionsArray, 'in', itemsWithRevisions, 'items');
    
    // Auto-add ONLY R1 revision if it exists (user must manually add R2, R3, etc.)
    if (revisionsArray.includes('R1')) {
      console.log('[ParsedBoqTablePhase2_1] ✅ Auto-adding R1 to display');
      setActiveRevisions(['R1']);
      setHasAutoLoaded(true);
    } else {
      console.log('[ParsedBoqTablePhase2_1] No R1 revision found in data');
      setHasAutoLoaded(true);
    }
  }, [parsedBoq.length, hasAutoLoaded, activeRevisions.length]);

  // Filter and track original indices
  const itemsToDisplayWithIndex = useMemo(() => {
    return parsedBoq
      .map((row, index) => ({ row, originalIndex: index }))
      .filter(({ row }) => {
        const isMeta = row.category || row.subtotal || row.grandTotal || row.remark;
        const isTextTotal = (row.description || '').trim().toLowerCase() === 'total';
        return !isMeta && !isTextTotal;
      });
  }, [parsedBoq]);

  // Calculate total amount from items
  const calculateTotalAmount = () => {
    return itemsToDisplayWithIndex.reduce((sum, { row }) => {
      return sum + (row.tenderAmount || 0);
    }, 0);
  };

  // Delete revision with confirmation
  const deleteRevision = (revisionKey: string) => {
    if (confirm(`Are you sure you want to delete ${revisionKey}?`)) {
      setActiveRevisions(activeRevisions.filter((r) => r !== revisionKey));
    }
  };

  // Format currency
  const formatCurrency = (value: number | undefined) => {
    if (!value && value !== 0) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Format quantity
  const formatQuantity = (value: number | undefined) => {
    if (!value && value !== 0) return '—';
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Get rate display for a specific revision
  const getRateDisplay = (item: StandardBOQRow, itemIndex: number, revisionKey: string) => {
    const revision = (item.revisions as any)?.[revisionKey];
    console.log(`[ParsedBoqTablePhase2_1] getRateDisplay - actualIndex: ${itemIndex}, revision key: ${revisionKey}, has revision: ${!!revision}`, revision);
    
    // If row has no quantity, rate, or amount, don't show Calculate button
    const hasData = item.quantity !== null || item.tenderRate !== null || item.tenderAmount !== null;
    if (!hasData) {
      return <Text style={styles.cell}>\u2014</Text>;
    }
    
    if (revision && revision.rate) {
      console.log(`[ParsedBoqTablePhase2_1] Displaying rate: ${revision.rate}`);
      // Make existing rate clickable to re-open the builder for re-edit
      return (
        <TouchableOpacity
          style={styles.rateValueTouchable}
          onPress={(e) => {
            if (e && typeof e.stopPropagation === 'function') {
              e.stopPropagation();
            }
            console.log('[ParsedBoqTablePhase2_1] Edit rate clicked for index:', itemIndex);
            onOpenRateBuilder(itemIndex, item, revisionKey);
          }}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Edit Rate for item ${itemIndex + 1}, ${revisionKey}`}
        >
          <Text style={styles.rateValueText}>
            {formatCurrency(revision.rate)}
          </Text>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        style={styles.rateButton}
        onPress={(e) => {
          if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
          }
          console.log('[ParsedBoqTablePhase2_1] Calculate clicked for index:', itemIndex);
          onOpenRateBuilder(itemIndex, item, revisionKey);
        }}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Calculate Rate for item ${itemIndex + 1}, ${revisionKey}`}
      >
        <Text style={styles.rateButtonText}>Calculate</Text>
      </TouchableOpacity>
    );
  };

  // Get amount display for a specific revision (auto-calculated: rate × quantity)
  const getRevisionAmountDisplay = (item: StandardBOQRow, revisionKey: string) => {
    const revision = (item.revisions as any)?.[revisionKey];
    if (revision && revision.rate) {
      const amount = revision.rate * (item.quantity || 0);
      return formatCurrency(amount);
    }
    return '—';
  };

  // Get original tender amount
  const getOriginalAmountDisplay = (item: StandardBOQRow) => {
    if (item.tenderAmount) {
      return formatCurrency(item.tenderAmount);
    }
    return '—';
  };

  return (
    <View style={[styles.container, { width: '100%' }]}> 
      {/* Add Revision Button - Small Size */}
      <View style={styles.buttonBar}>
        <TouchableOpacity
          style={styles.addRevisionButton}
          onPress={() => {
            const nextRevisionNum = activeRevisions.length + 1;
            const revisionKey = `R${nextRevisionNum}`;
            if (!activeRevisions.includes(revisionKey)) {
              setActiveRevisions([...activeRevisions, revisionKey]);
            }
          }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Add new revision"
        >
          <Text style={styles.addRevisionButtonText}>
            Add {activeRevisions.length > 0 ? `R${activeRevisions.length + 1}` : 'R1'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sticky Header Row */}
      <View style={styles.stickyHeaderContainer}>
        <ScrollView 
          ref={headerScrollRef}
          style={styles.headerScroll} 
          horizontal={true} 
          showsHorizontalScrollIndicator={false}
          onScroll={handleHeaderScroll}
          scrollEventThrottle={1}
          directionalLockEnabled={true}
        >
        <View style={[styles.headerRow, { width: tableWidth }]}>
          {/* Base Headers - Light Blue */}
          <Text style={[styles.headerCell, styles.srNoCell, styles.headerBaseColor]}>Sr. No.</Text>
          <Text style={[styles.headerCell, styles.itemNoCell, styles.headerBaseColor]}>Item No.</Text>
          <Text style={[styles.headerCell, styles.descriptionCell, styles.headerBaseColor]}>Description</Text>
          <Text style={[styles.headerCell, styles.categoryCell, styles.headerBaseColor]}>Category</Text>
          <Text style={[styles.headerCell, styles.subCategoryCell, styles.headerBaseColor]}>SubCategory</Text>
          <Text style={[styles.headerCell, styles.unitCell, styles.headerBaseColor]}>Unit</Text>
          <Text style={[styles.headerCell, styles.quantityCell, styles.headerBaseColor]}>Quantity</Text>
          <Text style={[styles.headerCell, styles.rateCell, styles.headerBaseColor]}>Rate</Text>
          <Text style={[styles.headerCell, styles.amountCell, styles.headerBaseColor]}>Amount (Rs.)</Text>

          {/* Revision Headers - Alternating Colors */}
          {activeRevisions.map((revisionKey, revIndex) => (
            <View key={revisionKey} style={styles.revisionHeaderGroup}>
              <Text
                style={[
                  styles.headerCell,
                  styles.revisionRateCell,
                  revIndex % 2 === 0 ? styles.headerRevisionColor1 : styles.headerRevisionColor2,
                ]}
              >
                Rate ({revisionKey})
              </Text>
              <Text
                style={[
                  styles.headerCell,
                  styles.revisionAmountCell,
                  revIndex % 2 === 0 ? styles.headerRevisionColor1 : styles.headerRevisionColor2,
                ]}
              >
                Amount ({revisionKey})
              </Text>
              <TouchableOpacity
                style={[
                  styles.deleteRevisionButton,
                  revIndex % 2 === 0 ? styles.headerRevisionColor1 : styles.headerRevisionColor2,
                ]}
                onPress={() => deleteRevision(revisionKey)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Delete revision ${revisionKey}`}
              >
                <Text style={styles.deleteRevisionText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
      </View>

      {/* Data Rows - Single Horizontal ScrollView for all rows */}
      <ScrollView 
        ref={bodyScrollRef}
        horizontal={true}
        showsHorizontalScrollIndicator={true}
        onScroll={handleBodyScroll}
        scrollEventThrottle={1}
        directionalLockEnabled={true}
        style={styles.bodyHorizontalScroll}
        removeClippedSubviews={false}
      >
        <View style={[styles.tableContentWrapper, { width: '100%' }]}> 
          <ScrollView 
            style={[styles.rowsContainer, itemsToDisplayWithIndex.length > 10 ? { maxHeight: 500 } : { maxHeight: undefined }]}
            scrollEnabled={itemsToDisplayWithIndex.length > 10}
            showsVerticalScrollIndicator={itemsToDisplayWithIndex.length > 10}
            nestedScrollEnabled={true}
            removeClippedSubviews={false}
          >
            {(itemsToDisplayWithIndex.length > 0 ? itemsToDisplayWithIndex : [{ row: {}, originalIndex: 0 }]).map(({ row: item, originalIndex }, filteredIndex) => (
              <View
                key={`${item.srNo || 'empty'}-${originalIndex}`}
                style={[styles.tableRow, { width: tableWidth }]}
              >
                {/* Base Columns */}
                <Text style={[styles.cell, styles.srNoCell]}>{filteredIndex + 1}</Text>
                <Text style={[styles.cell, styles.itemNoCell]}>{item.itemNo || '—'}</Text>
                <Text style={[styles.cell, styles.descriptionCell]}>{item.description || '—'}</Text>
                <Text style={[styles.cell, styles.categoryCell]} numberOfLines={1}>{item.category || '—'}</Text>
                <Text style={[styles.cell, styles.subCategoryCell]} numberOfLines={1}>{item.subCategory || '—'}</Text>
                <Text style={[styles.cell, styles.unitCell]}>{item.unit || '—'}</Text>
                <Text style={[styles.cell, styles.quantityCell]}>{formatQuantity(item.quantity)}</Text>
                <Text style={[styles.cell, styles.rateCell]}>{item.tenderRate ? formatCurrency(item.tenderRate) : '—'}</Text>
                <Text style={[styles.cell, styles.amountCell]}>{getOriginalAmountDisplay(item)}</Text>

                {/* Revision Columns */}
                {activeRevisions.map((revisionKey) => (
                  <View key={`${originalIndex}-${revisionKey}`} style={styles.revisionCellGroup}>
                    <View style={[styles.cell, styles.revisionRateCell]}>
                      {getRateDisplay(item, originalIndex, revisionKey)}
                    </View>
                    <Text style={[styles.cell, styles.revisionAmountCell]}>
                      {getRevisionAmountDisplay(item, revisionKey)}
                    </Text>
                  </View>
                ))}
              </View>
            ))}

            {/* Totals Row (only amounts) */}
            <View style={[styles.totalRow, { width: tableWidth }]}> 
              <Text style={[styles.cell, styles.srNoCell, styles.totalText]}>—</Text>
              <Text style={[styles.cell, styles.itemNoCell, styles.totalText]}>—</Text>
              <Text style={[styles.cell, styles.descriptionCell, styles.totalText]}>Total</Text>
              <Text style={[styles.cell, styles.categoryCell, styles.totalText]}>—</Text>
              <Text style={[styles.cell, styles.subCategoryCell, styles.totalText]}>—</Text>
              <Text style={[styles.cell, styles.unitCell, styles.totalText]}>—</Text>
              <Text style={[styles.cell, styles.quantityCell, styles.totalText]}>—</Text>
              <Text style={[styles.cell, styles.rateCell, styles.totalText]}>Total</Text>
              <Text style={[styles.cell, styles.amountCell, styles.totalText]}>
                {formatCurrency(calculateTotalAmount())}
              </Text>

              {/* Revision Totals */}
              {activeRevisions.map((revisionKey) => (
                <View key={`total-${revisionKey}`} style={styles.revisionCellGroup}>
                  <Text style={[styles.cell, styles.revisionRateCell, styles.totalText]}>Total</Text>
                  <Text style={[styles.cell, styles.revisionAmountCell, styles.totalText]}>
                    {formatCurrency(
                      itemsToDisplayWithIndex.reduce((sum, { row }) => {
                        const revision = (row.revisions as any)?.[revisionKey];
                        if (revision && revision.rate) {
                          return sum + revision.rate * (row.quantity || 0);
                        }
                        return sum;
                      }, 0)
                    )}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginVertical: 16,
  },

  stickyHeaderContainer: {
    // position: 'sticky' is not supported in React Native
    // Use zIndex for layering instead
    zIndex: 10,
    backgroundColor: '#fff',
  },

  buttonBar: {
    padding: 0,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  addRevisionButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addRevisionButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },

  headerScroll: {
    backgroundColor: '#f8f9fa',
  },

  bodyHorizontalScroll: {
    flex: 1,
  },

  tableContentWrapper: {
    flexDirection: 'column',
  },

  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 2,
    borderBottomColor: '#dee2e6',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },

  headerCell: {
    fontWeight: '700',
    fontSize: 12,
    color: '#333',
    justifyContent: 'center',
  },

  headerBaseColor: {
    backgroundColor: '#e3f2fd',
  },

  headerRevisionColor1: {
    backgroundColor: '#f0f4c3',
  },

  headerRevisionColor2: {
    backgroundColor: '#c8e6c9',
  },

  srNoCell: {
    width: 50,
    textAlign: 'center',
  },

  itemNoCell: {
    width: 80,
    textAlign: 'center',
  },

  descriptionCell: {
    width: 250,
    textAlign: 'justify',
  },

  categoryCell: {
    width: 100,
  },

  subCategoryCell: {
    width: 100,
  },

  unitCell: {
    width: 60,
    textAlign: 'center',
  },

  quantityCell: {
    width: 80,
    textAlign: 'right',
    paddingRight: 8,
  },

  rateCell: {
    width: 90,
    textAlign: 'right',
    paddingRight: 8,
  },

  amountCell: {
    width: 110,
    textAlign: 'right',
    paddingRight: 8,
  },

  revisionHeaderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  revisionRateCell: {
    width: 100,
    textAlign: 'center',
  },

  revisionAmountCell: {
    width: 110,
    textAlign: 'right',
    paddingRight: 8,
  },

  deleteRevisionButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },

  deleteRevisionText: {
    color: '#d32f2f',
    fontSize: 18,
    fontWeight: 'bold',
  },

  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    alignItems: 'flex-start',
  },

  totalRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#333',
    borderTopWidth: 2,
    borderTopColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'flex-start',
  },

  totalText: {
    fontWeight: '700',
    color: '#333',
  },

  revisionCellGroup: {
    flexDirection: 'row',
  },

  cell: {
    fontSize: 13,
    color: '#333',
    justifyContent: 'center',
  },

  rateButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },

  rateValueTouchable: {
    backgroundColor: '#fffde7',
    borderWidth: 1,
    borderColor: '#ffe082',
    borderRadius: 3,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },

  rateButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },

  rateValueText: {
    color: '#0056b3',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  rowsContainer: {
    maxHeight: 500,
  },

  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },

  emptyStateText: {
    fontSize: 14,
    color: '#999',
  },
});
