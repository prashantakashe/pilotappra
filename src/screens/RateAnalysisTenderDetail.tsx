// src/screens/RateAnalysisTenderDetail.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../navigation/AppNavigator';
import { AppLayout } from '../components/AppLayout';
import { RATE_ANALYSIS_NAV } from '../constants/sidebarMenus';
import { BOQUploadWidget } from '../components/BOQUploadWidget';
import { ParsedBOQTable, type BOQRevision } from '../components/ParsedBOQTable';
import { ParsedBoqTablePhase2_1 } from '../components/ParsedBoqTablePhase2_1';
import { RateBuilder, type RateRevision } from '../components/RateBuilder';
import { BOQParseSettings } from '../components/BOQParseSettings';
import { BoqFilesMetadataTable, type BoqFileRow } from '../components/BoqFilesMetadataTable';
import LeadChartTab from '../components/LeadChartTab';
import RecapTab from '../components/RecapTab';
import ProjectDetailsTab from '../components/ProjectDetailsTab';
import { UploadBOQTab } from '../components/dsr';
import SummaryTab from '../components/SummaryTab';
import AbstractTab from '../components/AbstractTab';
import { useResponsive } from '../hooks/useResponsive';
import { tenderService } from '../services/tenderService';
import type { Tender } from '../types/tender';
import { dateUtils } from '../utils/dateUtils';
import { formatUtils } from '../utils/formatUtils';
import { auth, db } from '../services/firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import type { ParseResult, StandardBOQRow } from '../services/boqParser';
import { testParser, testComplexParser } from '../services/boqParserDebug';
import * as XLSX from 'xlsx';
import { saveParsedBoq as saveBoqToFirestore, saveRevisionForItem } from '../services/firestoreBoqApi';

type RouteParams = RouteProp<AppStackParamList, 'RateAnalysisTenderDetail'>;
type NavigationParams = NativeStackNavigationProp<AppStackParamList, 'RateAnalysisTenderDetail'>;

export const RateAnalysisTenderDetail: React.FC = () => {
  const route = useRoute<RouteParams>();
  const navigation = useNavigation<NavigationParams>();
  const { tenderId, mode } = route.params;
  const effectiveMode = mode || 'market'; // default to market RA when not provided
  
  const [tender, setTender] = useState<Tender | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [parsedBoq, setParsedBoq] = useState<StandardBOQRow[]>([]);
  const [parseReport, setParseReport] = useState<any>(null);
  const [showParseSettings, setShowParseSettings] = useState(false);
  const [pendingParseResult, setPendingParseResult] = useState<ParseResult | null>(null);
  const [boqFiles, setBoqFiles] = useState<Array<{ name: string; rows: StandardBOQRow[]; report: any }>>([]);
  const [currentBoqIndex, setCurrentBoqIndex] = useState<number>(0);
  const [rateBuilderOpen, setRateBuilderOpen] = useState(false);
  const [selectedRateItem, setSelectedRateItem] = useState<StandardBOQRow | null>(null);
  const [selectedRateItemIndex, setSelectedRateItemIndex] = useState<number>(-1);
  const [selectedRevisionKey, setSelectedRevisionKey] = useState<string>('R1');
  const [boqFileMetadataRows, setBoqFileMetadataRows] = useState<BoqFileRow[]>([]);
  const [activeTab, setActiveTab] = useState<string>('Project Details');
  
  // Track if we just uploaded data locally (to prevent Firestore listener from overwriting)
  const justUploadedRef = React.useRef(false);
  
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // Monitor boqFiles changes
  useEffect(() => {
    console.log('[RateAnalysisTenderDetail] ⚠️ boqFiles changed:', boqFiles.length, 'files');
    boqFiles.forEach((file, idx) => {
      console.log(`  [${idx}] ${file.name} - ${file.rows?.length || 0} rows`);
    });
  }, [boqFiles.length]);

  // CRITICAL: Dedicated effect to sync boqFiles from tender data
  useEffect(() => {
    console.log('[RateAnalysisTenderDetail TENDER SYNC] Tender object changed');
    if (!tender) {
      console.log('[RateAnalysisTenderDetail TENDER SYNC] No tender');
      return;
    }

    console.log('[RateAnalysisTenderDetail TENDER SYNC] Checking if we need to populate boqFiles from tender');
    console.log('[RateAnalysisTenderDetail TENDER SYNC] tender.parsedBoq:', tender.parsedBoq ? `${(tender.parsedBoq as any[]).length} items` : 'none');
    console.log('[RateAnalysisTenderDetail TENDER SYNC] tender.boqFileUrl:', tender.boqFileUrl);
    console.log('[RateAnalysisTenderDetail TENDER SYNC] tender.boqFiles:', Array.isArray((tender as any).boqFiles) ? (tender as any).boqFiles.length : 'none');
    console.log('[RateAnalysisTenderDetail TENDER SYNC] currentBoqFiles.length:', boqFiles.length);
    console.log('[RateAnalysisTenderDetail TENDER SYNC] justUploadedRef.current:', justUploadedRef.current);

    // Prefer multi-file field when present
    const tenderBoqFiles: Array<{ name: string; rows: any[]; report: any }> = Array.isArray((tender as any).boqFiles) ? (tender as any).boqFiles : [];
    const tenderMetadata: any[] = Array.isArray((tender as any).boqFileMetadata) ? (tender as any).boqFileMetadata : [];

    // If no parsedBoq and no boqFiles AND no metadata, clear any stale local files
    if ((tenderBoqFiles.length === 0) && (!tender.parsedBoq || !Array.isArray(tender.parsedBoq) || tender.parsedBoq.length === 0) && (tenderMetadata.length === 0)) {
      setBoqFileMetadataRows([]);
      return;
    }
    // If we have a single file, set it
    if (tenderBoqFiles.length === 1) {
      const file = tenderBoqFiles[0];
      console.log('[RateAnalysisTenderDetail TENDER SYNC] ✅ Setting single boqFile:', { name: file.name, rows: file.rows.length });
      setBoqFiles([file] as any);
      // Populate metadata for single-file tenders
      try {
        const tenderMetadata: any[] = Array.isArray((tender as any).boqFileMetadata) ? (tender as any).boqFileMetadata : [];
        // If we have explicit metadata stored, use it
        // Otherwise create a single entry from the file
        if (tenderMetadata.length > 0) {
          const mapped = tenderMetadata.map((m, idx) => ({
            id: `boq_meta_${idx}_${(m.fileName || '').replace(/\s+/g, '_')}`,
            srNo: idx + 1,
            description: m.description || '',
            fileName: m.fileName || '',
            fileSize: m.fileSize || (m.size ? formatUtils.formatFileSize(m.size) : '—'),
            fileLastModified: m.fileLastModified || (m.lastModified ? dateUtils.formatDate(new Date(m.lastModified)) : ''),
            fileUrl: m.fileUrl,
            parsedBoqName: m.parsedBoqName,
            saved: true,
          }));
          console.log('[RateAnalysisTenderDetail TENDER SYNC] Using stored metadata for single file:', mapped.length, 'entries');
          setBoqFileMetadataRows(mapped);
        } else {
          // Create inferred metadata from the single file
          const inferredRow = {
            id: `boq_meta_inferred_0_${(file.name || '').replace(/\s+/g, '_')}`,
            srNo: 1,
            description: '',
            fileName: file.name || '',
            fileSize: '—',
            fileLastModified: '',
            fileUrl: (tender as any)?.boqFileUrl || undefined,
            parsedBoqName: file.name || undefined,
            saved: true, // Already parsed since we have file.rows
          };
          console.log('[RateAnalysisTenderDetail TENDER SYNC] Using inferred metadata for single file:', file.name);
          setBoqFileMetadataRows([inferredRow]);
        }
      } catch (err) {
        console.warn('[RateAnalysisTenderDetail] Error populating single-file boqFileMetadataRows:', err);
      }
      setCurrentBoqIndex(0);
      setParsedBoq(file.rows as any[]);
      setParseReport(file.report);
      setUploadedFileName(file.name);
    }
  }, [tender?.tenderId, (tender as any)?.boqFiles]);

  // Ensure boqFiles list stays in sync with parsedBoq whenever tender/uploadedFileName changes
  useEffect(() => {
    console.log('[RateAnalysisTenderDetail SYNC] Checking sync conditions');
    console.log('[RateAnalysisTenderDetail SYNC] parsedBoq.length:', parsedBoq.length);
    console.log('[RateAnalysisTenderDetail SYNC] uploadedFileName:', uploadedFileName);
    console.log('[RateAnalysisTenderDetail SYNC] boqFiles.length:', boqFiles.length);
    console.log('[RateAnalysisTenderDetail SYNC] parseReport exists:', !!parseReport);
    
    // Sync if we have parsed data but empty files list
    if (parsedBoq.length > 0 && uploadedFileName && boqFiles.length === 0) {
      console.log('[RateAnalysisTenderDetail SYNC] ✅ SYNCING - Creating boqFiles entry');
      const syncedFile = {
        name: uploadedFileName,
        rows: parsedBoq,
        report: parseReport || { rowsParsed: parsedBoq.length, rowsSkipped: 0, warnings: [] }
      };
      console.log('[RateAnalysisTenderDetail SYNC] Synced file object:', {
        name: syncedFile.name,
        rowCount: syncedFile.rows.length,
        hasReport: !!syncedFile.report
      });
      setBoqFiles([syncedFile]);
    }
  }, [uploadedFileName, boqFiles.length]);

  // Load tender data - use direct subscription for single tender
  useEffect(() => {
    console.log('[RateAnalysisTenderDetail] Loading tender:', tenderId);
    
    // Set timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.warn('[RateAnalysisTenderDetail] Loading timeout - tender not found');
      setLoading(false);
    }, 5000); // 5 second timeout
    
    // Use direct tender subscription for better performance
    const unsubscribe = tenderService.subscribeTender(
      tenderId,
      (foundTender) => {
        clearTimeout(loadingTimeout); // Clear timeout when data arrives
        
        console.log('[RateAnalysisTenderDetail] Direct tender subscription update');
        console.log('[RateAnalysisTenderDetail] Found tender:', !!foundTender);
        
        if (foundTender) {
          console.log('[RateAnalysisTenderDetail] Tender found:', foundTender.title);
          console.log('[RateAnalysisTenderDetail] Tender data keys:', Object.keys(foundTender));
          console.log('[RateAnalysisTenderDetail] boqFileUrl:', foundTender.boqFileUrl);
          console.log('[RateAnalysisTenderDetail] parsedBoq exists:', !!foundTender.parsedBoq);
          console.log('[RateAnalysisTenderDetail] parsedBoq is array:', Array.isArray(foundTender.parsedBoq));
          console.log('[RateAnalysisTenderDetail] parsedBoq length:', foundTender.parsedBoq?.length);
          
          setTender(foundTender);
          
          // Load uploaded filename if exists
          if (foundTender.boqFileUrl) {
            console.log('[RateAnalysisTenderDetail] Setting uploadedFileName:', foundTender.boqFileUrl);
            setUploadedFileName(foundTender.boqFileUrl);
          }
          
          // Load existing parsed BOQ if available
          const tenderBoqFiles2: Array<{ name: string; rows: any[]; report: any }> = Array.isArray((foundTender as any).boqFiles) ? (foundTender as any).boqFiles : [];
          if ((tenderBoqFiles2.length > 0) || (foundTender.parsedBoq && Array.isArray(foundTender.parsedBoq) && foundTender.parsedBoq.length > 0)) {
            const firstLen = tenderBoqFiles2.length > 0 ? tenderBoqFiles2[0].rows.length : (foundTender.parsedBoq?.length || 0);
            console.log('[RateAnalysisTenderDetail] Found parsed BOQ data in Firestore:', firstLen, 'rows');
            
            // Don't overwrite if we just uploaded (state already set via handleFileUpload)
            if (!justUploadedRef.current) {
              console.log('[RateAnalysisTenderDetail] Loading from Firestore (not a recent upload)');
              const files = tenderBoqFiles2.length > 0 ? tenderBoqFiles2 : [{
                name: foundTender.boqFileUrl || 'BOQ Sample - 2.xlsx',
                rows: foundTender.parsedBoq,
                report: {
                  rowsParsed: foundTender.parsedBoq.length,
                  rowsSkipped: 0,
                  warnings: [],
                  mappingConfidence: 1.0,
                  suggestedMapping: foundTender.boqHeaders || {},
                  sheets: [...new Set(foundTender.parsedBoq.map((r: any) => r.sheetName).filter(Boolean))]
                }
              }];
              setBoqFiles(files as any);
              // Don't reset currentBoqIndex - preserve user's current file selection
              // Only set to 0 if we don't have a valid index yet
              if (currentBoqIndex < 0 || currentBoqIndex >= files.length) {
                setCurrentBoqIndex(0);
              }
              // Load the file at current index (or 0 if index was invalid)
              const indexToLoad = (currentBoqIndex >= 0 && currentBoqIndex < files.length) ? currentBoqIndex : 0;
              setParsedBoq((files[indexToLoad] as any).rows as any[]);
              setParseReport((files[indexToLoad] as any).report);
              setUploadedFileName((files[indexToLoad] as any).name);
              
              console.log('[RateAnalysisTenderDetail] Loaded existing parsed BOQ:', foundTender.parsedBoq.length, 'rows');
            } else {
              console.log('[RateAnalysisTenderDetail] Just uploaded, skipping Firestore load (clearing flag for next update)');
              justUploadedRef.current = false;
            }
          } else {
            console.log('[RateAnalysisTenderDetail] No parsedBoq found in tender:', {
              hasParsedBoq: !!foundTender.parsedBoq,
              isArray: Array.isArray(foundTender.parsedBoq),
              length: foundTender.parsedBoq?.length
            });
            // CRITICAL FIX: Clear boqFiles if there's no parsedBoq data
            // This prevents stale data from showing
            if (boqFiles.length > 0) {
              console.log('[RateAnalysisTenderDetail] Clearing stale boqFiles');
              setBoqFiles([]);
            }
          }
        } else {
          console.warn('[RateAnalysisTenderDetail] Tender not found or access denied:', tenderId);
        }
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, [tenderId]);

  const handleFileUpload = async (fileName: string, parseResult?: ParseResult, fileMetadata?: { size: number; lastModified: number }) => {
    console.log('[RateAnalysisTenderDetail] BOQ file uploaded:', fileName);
    console.log('[RateAnalysisTenderDetail] Parse result:', parseResult);
    console.log('[RateAnalysisTenderDetail] File metadata:', fileMetadata);
    setUploadedFileName(fileName);
    
    if (parseResult) {
      console.log('[RateAnalysisTenderDetail] parseResult exists');
      console.log('[RateAnalysisTenderDetail] parsedBoq rows:', parseResult.parsedBoq?.length);
      console.log('[RateAnalysisTenderDetail] parseReport:', parseResult.parseReport);
      
      // AUTO-PARSE MODE: Always accept the parse and show the table
      // Mark that we just uploaded (prevents Firestore listener from overwriting)
      justUploadedRef.current = true;
      
      // Set the parsed BOQ immediately for display - this is CRITICAL
      console.log('[RateAnalysisTenderDetail] Setting parsedBoq state with', parseResult.parsedBoq.length, 'rows');
      setParsedBoq(parseResult.parsedBoq);
      
      console.log('[RateAnalysisTenderDetail] Setting parseReport state');
      setParseReport(parseResult.parseReport);
      
      // Add to BOQ files list (for multiple file support)
      const newFile = {
        name: fileName,
        rows: parseResult.parsedBoq,
        report: parseResult.parseReport
      };
      
      console.log('[RateAnalysisTenderDetail] Adding to boqFiles:', newFile);
      setBoqFiles(prev => {
        // Check if file already exists
        const existingIndex = prev.findIndex(f => f.name === fileName);
        if (existingIndex >= 0) {
          // Replace existing
          const updated = [...prev];
          updated[existingIndex] = newFile;
          setCurrentBoqIndex(existingIndex);
          console.log('[RateAnalysisTenderDetail] Replaced existing file at index:', existingIndex);
          return updated;
        } else {
          // Add new
          console.log('[RateAnalysisTenderDetail] Adding new file at index:', prev.length);
          setCurrentBoqIndex(prev.length);
          return [...prev, newFile];
        }
      });

      // Create metadata row for the BOQ file
      const fileSizeFormatted = fileMetadata
        ? formatUtils.formatFileSize(fileMetadata.size)
        : '—';
      const lastModifiedFormatted = fileMetadata
        ? dateUtils.formatDate(new Date(fileMetadata.lastModified))
        : dateUtils.formatDate(new Date());

      const newMetadataRow: BoqFileRow = {
        id: `boq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        srNo: boqFileMetadataRows.length + 1,
        description: '',
        fileName: fileName,
        fileSize: fileSizeFormatted,
        fileLastModified: lastModifiedFormatted,
        fileUrl: undefined,
        parsedBoqName: parseResult.parsedBoq.length > 0 ? fileName : undefined,
        saved: false,
      };

      setBoqFileMetadataRows(prev => {
        const updated = [...prev];
        const existingIndex = updated.findIndex(r => r.fileName === fileName);
        if (existingIndex >= 0) {
          updated[existingIndex] = newMetadataRow;
        } else {
          updated.push(newMetadataRow);
        }
        return updated;
      });
      
      // If we have rows, save to Firestore IMMEDIATELY with await
      if (parseResult.parsedBoq.length > 0) {
        console.log('[RateAnalysisTenderDetail] Auto-parse - Saving', parseResult.parsedBoq.length, 'rows to Firestore');
        
        // Save to Firestore and wait for result
        console.log('[RateAnalysisTenderDetail] Calling saveParsedBoq');
        await saveParsedBoq(parseResult.parsedBoq, parseResult.parseReport, fileName);
        
        // Clear the justUploaded flag after Firestore has time to sync back
        setTimeout(() => {
          console.log('[RateAnalysisTenderDetail] Clearing justUploadedRef flag');
          justUploadedRef.current = false;
        }, 3000); // Increased to 3 seconds to ensure Firestore sync completes
      } else {
        // No rows - show alert and option to configure mapping
        Alert.alert(
          'No Rows Found',
          'The parser could not find any data rows. Try adjusting the column mapping.',
          [
            { text: 'Cancel' },
            { text: 'Configure Mapping', onPress: () => {
              setPendingParseResult(parseResult);
              setShowParseSettings(true);
            }}
          ]
        );
      }
    } else {
      console.warn('[RateAnalysisTenderDetail] No parseResult provided!');
    }
  };

  const handleParseSettingsConfirm = (mapping: Record<string, number>) => {
    // TODO: Re-parse with confirmed mapping
    // For now, use pending result
    if (pendingParseResult) {
      setParsedBoq(pendingParseResult.parsedBoq);
      setParseReport(pendingParseResult.parseReport);
      saveParsedBoq(pendingParseResult.parsedBoq, pendingParseResult.parseReport);
    }
    setShowParseSettings(false);
    setPendingParseResult(null);
  };

  const saveParsedBoq = async (boq: StandardBOQRow[], report: any, filename?: string) => {
    try {
      console.log('[saveParsedBoq] Starting save to Firestore');
      console.log('[saveParsedBoq] BOQ rows:', boq.length);
      console.log('[saveParsedBoq] Filename:', filename || uploadedFileName);
      console.log('[saveParsedBoq] Tender ID:', tenderId);
      console.log('[saveParsedBoq] Current user:', auth.currentUser?.uid);
      
      const fileToSave = filename || uploadedFileName || '';
      
      if (!fileToSave) {
        throw new Error('No filename provided for BOQ save');
      }
      
      if (!tenderId) {
        throw new Error('Tender ID is missing');
      }
      
      // Use the new Firestore API
      const result = await saveBoqToFirestore(
        tenderId,
        boq,
        fileToSave,
        report?.suggestedMapping || {},
        report?.sheets || []
      );
      
      console.log('[saveParsedBoq] ✅ Saved to Firestore successfully:', result);
      console.log('[saveParsedBoq] Verifying save - checking tender document...');
      
      // Verify the save by reading back
      const { getTenderWithParsedBoq } = await import('../services/firestoreBoqApi');
      const verifyTender = await getTenderWithParsedBoq(tenderId);
      console.log('[saveParsedBoq] Verification - boqFiles:', verifyTender.boqFiles?.length || 0);
      console.log('[saveParsedBoq] Verification - parsedBoq:', verifyTender.parsedBoq?.length || 0);
      
      Alert.alert(
        '✅ BOQ Saved',
        `Successfully saved ${boq.length} items from ${fileToSave} to Firestore.\n\nYou can now navigate away and return - the data will persist.`,
        [{ text: 'OK' }]
      );
      return true;
    } catch (error: any) {
      console.error('[saveParsedBoq] ❌ Failed to save to Firestore:', error);
      console.log('[saveParsedBoq] Error code:', error.code);
      console.log('[saveParsedBoq] Error message:', error.message);
      console.log('[saveParsedBoq] Error stack:', error.stack);
      
      // Still show the BOQ table even if Firestore save fails
      Alert.alert(
        '❌ Save Failed',
        `Failed to save to Firestore.\n\nError: ${error.message}\n\nBOQ is displayed locally but will NOT persist when you navigate away.`,
        [{ text: 'OK' }]
      );
      return false;
    }
  };

  const handleSaveParsedBoq = async (updatedBoq: StandardBOQRow[], revision: BOQRevision) => {
    try {
      const tenderRef = doc(db, 'tenders', tenderId);
      const existingRevisions = tender?.boqRevisions || [];
      
      await updateDoc(tenderRef, {
        parsedBoq: updatedBoq,
        parsedAt: Timestamp.now(),
        parsedBy: auth.currentUser?.uid || 'unknown',
        boqRevisions: [...existingRevisions, {
          ...revision,
          createdAt: Timestamp.fromDate(revision.createdAt)
        }]
      });
      
      setParsedBoq(updatedBoq);
      console.log('[RateAnalysisTenderDetail] BOQ revision saved');
    } catch (error: any) {
      console.error('[RateAnalysisTenderDetail] Failed to save BOQ revision:', error);
      throw error;
    }
  };

  // Phase 2.1: Handle Rate Builder open
  const handleOpenRateBuilder = (index: number, item: StandardBOQRow, revisionKey?: string) => {
    console.log('[RateAnalysisTenderDetail] Opening rate builder for item:', item.srNo, item.description, 'revision:', revisionKey);
    console.log('[RateAnalysisTenderDetail] Item index in parsedBoq:', index);
    console.log('[RateAnalysisTenderDetail] Current item revisions:', item.revisions);
    setSelectedRateItemIndex(index);
    setSelectedRateItem(item);
    setSelectedRevisionKey(revisionKey || 'R1');
    setRateBuilderOpen(true);
  };

  // Phase 2.1: Handle Rate Revision save
  const handleSaveRateRevision = async (revision: RateRevision) => {
    if (selectedRateItemIndex < 0 || !selectedRateItem) {
      console.error('[RateAnalysisTenderDetail] Invalid rate item index or item');
      return;
    }

    try {
      console.log('[RateAnalysisTenderDetail] Saving rate revision for item index:', selectedRateItemIndex, 'revision key:', selectedRevisionKey);
      console.log('[RateAnalysisTenderDetail] Revision data:', revision);
      
      // Use the new Firestore API with the selected revision key
      const result = await saveRevisionForItem(
        tenderId,
        selectedRateItemIndex,
        selectedRevisionKey,
        revision
      );

      // Optimistically update local state - create new array to force re-render
      const updatedParsedBoq = parsedBoq.map((item, idx) => {
        if (idx === selectedRateItemIndex) {
          const updatedItem = { ...item };
          if (!updatedItem.revisions) {
            updatedItem.revisions = {};
          }
          (updatedItem.revisions as any)[selectedRevisionKey] = { ...revision };
          console.log('[RateAnalysisTenderDetail] Updated item:', updatedItem);
          return updatedItem;
        }
        return item;
      });
      
      console.log('[RateAnalysisTenderDetail] Updated parsedBoq:', updatedParsedBoq);
      console.log('[RateAnalysisTenderDetail] 🔍 BEFORE SAVE - currentBoqIndex:', currentBoqIndex, 'boqFiles.length:', boqFiles.length);
      console.log('[RateAnalysisTenderDetail] 🔍 BEFORE SAVE - boqFiles:', boqFiles.map((f, i) => `[${i}] ${f.name}`));
      
      setParsedBoq(updatedParsedBoq);
      
      // Update the current BOQ file's rows without changing the file list or index
      if (currentBoqIndex >= 0 && currentBoqIndex < boqFiles.length) {
        const updatedFiles = boqFiles.map((file, idx) => {
          if (idx === currentBoqIndex) {
            return { ...file, rows: updatedParsedBoq };
          }
          return file;
        });
        console.log('[RateAnalysisTenderDetail] 🔍 UPDATING boqFiles - keeping index at:', currentBoqIndex);
        setBoqFiles(updatedFiles);
      }

      console.log('[RateAnalysisTenderDetail] ✅ Rate revision saved successfully');
      Alert.alert('Success', result.message);
      
      // Close the Rate Builder
      setRateBuilderOpen(false);
      setSelectedRateItem(null);
      setSelectedRateItemIndex(-1);
      setSelectedRevisionKey('R1');
    } catch (error: any) {
      console.error('[RateAnalysisTenderDetail] Failed to save rate revision:', error);
      Alert.alert('Error', 'Failed to save rate revision: ' + error.message);
    }
  };

  const handleExportBoq = async (format: 'excel' | 'pdf') => {
    if (parsedBoq.length === 0) {
      Alert.alert('No Data', 'No parsed BOQ data to export');
      return;
    }

    try {
      if (format === 'excel') {
        // Get revision keys
        const firstRowWithRevisions = parsedBoq.find(r => r.revisions && Object.keys(r.revisions).length > 0);
        const revisionKeys = firstRowWithRevisions?.revisions ? Object.keys(firstRowWithRevisions.revisions).sort() : [];

        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // Build all rows manually
        const allRows: any[][] = [];
        
        // Tender info rows
        allRows.push(['ID:', tender?.tenderNo || tender?.tenderId || '']);
        allRows.push(['Title:', tender?.title || '']);
        allRows.push(['Client:', tender?.client || 'N/A']);
        allRows.push([]); // Empty row
        
        // Header row
        const headerRow = [
          'Sr No',
          'Description',
          'Category',
          'SubCategory',
          'Unit',
          'Quantity',
          'Rate',
          'Amount'
        ];
        revisionKeys.forEach(revKey => {
          headerRow.push(`Rate (${revKey})`);
          headerRow.push(`Amount (${revKey})`);
        });
        allRows.push(headerRow);
        
        // Data rows
        let totalAmount = 0;
        const revisionTotals: { [key: string]: number } = {};
        revisionKeys.forEach(key => {
          revisionTotals[key] = 0;
        });
        
        parsedBoq.forEach((row, index) => {
          const dataRow: any[] = [
            index + 1,
            row.description || '',
            row.category || '',
            row.subCategory || '',
            row.unit || '',
            row.quantity || 0,
            row.tenderRate || 0,
            row.tenderAmount || 0
          ];
          
          totalAmount += row.tenderAmount || 0;
          
          revisionKeys.forEach(revKey => {
            const rev = row.revisions?.[revKey];
            const rate = rev?.rate || 0;
            const amount = rate * (row.quantity || 0);
            dataRow.push(rate);
            dataRow.push(amount);
            revisionTotals[revKey] += amount;
          });
          
          allRows.push(dataRow);
        });
        
        // Totals row
        const totalsRow: any[] = ['', '', '', '', '', '', 'Total', totalAmount];
        revisionKeys.forEach(revKey => {
          totalsRow.push('Total');
          totalsRow.push(revisionTotals[revKey]);
        });
        allRows.push(totalsRow);
        
        // Create worksheet from array of arrays
        const ws = XLSX.utils.aoa_to_sheet(allRows);
        
        // Set column widths
        const colWidths = [
          { wch: 8 },   // Sr No
          { wch: 50 },  // Description
          { wch: 15 },  // Category
          { wch: 15 },  // SubCategory
          { wch: 10 },  // Unit
          { wch: 12 },  // Quantity
          { wch: 12 },  // Rate
          { wch: 15 },  // Amount
        ];
        revisionKeys.forEach(() => {
          colWidths.push({ wch: 15 }); // Rate (Rx)
          colWidths.push({ wch: 15 }); // Amount (Rx)
        });
        ws['!cols'] = colWidths;
        
        // Calculate ranges
        const headerRowIndex = 4; // Row 5 in Excel (0-indexed)
        const dataStartRow = 5;
        const totalsRowIndex = allRows.length - 1;
        const numCols = headerRow.length;
        
        // Apply cell formatting
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        
        for (let R = 0; R <= range.e.r; ++R) {
          for (let C = 0; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cellAddress]) continue;
            
            // Tender info rows (0-2)
            if (R < 3) {
              ws[cellAddress].s = {
                font: { bold: true, sz: 11 },
                alignment: { horizontal: 'left', vertical: 'center' }
              };
            }
            // Header row (row 4)
            else if (R === headerRowIndex) {
              ws[cellAddress].s = {
                font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
                fill: { fgColor: { rgb: '4472C4' } },
                alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
                border: {
                  top: { style: 'thin', color: { rgb: '000000' } },
                  bottom: { style: 'thin', color: { rgb: '000000' } },
                  left: { style: 'thin', color: { rgb: '000000' } },
                  right: { style: 'thin', color: { rgb: '000000' } }
                }
              };
            }
            // Totals row
            else if (R === totalsRowIndex) {
              const alignment: any = { vertical: 'center' };
              
              if (C === 0) {
                alignment.horizontal = 'center';
              } else if (C === 1 || C === 2 || C === 3) {
                alignment.horizontal = 'left';
              } else {
                alignment.horizontal = 'center';
              }
              
              ws[cellAddress].s = {
                font: { bold: true, sz: 11 },
                alignment: alignment,
                fill: { fgColor: { rgb: 'E7E6E6' } },
                border: {
                  top: { style: 'medium', color: { rgb: '000000' } },
                  bottom: { style: 'medium', color: { rgb: '000000' } },
                  left: { style: 'thin', color: { rgb: '000000' } },
                  right: { style: 'thin', color: { rgb: '000000' } }
                }
              };
              
              // Number formatting
              if (C >= 5 && typeof ws[cellAddress].v === 'number') {
                ws[cellAddress].z = '#,##0.00';
              }
            }
            // Data rows
            else if (R >= dataStartRow && R < totalsRowIndex) {
              const alignment: any = { vertical: 'center' };
              
              if (C === 0) {
                alignment.horizontal = 'center';
              } else if (C === 1) {
                alignment.horizontal = 'left';
                alignment.wrapText = true;
              } else if (C === 2 || C === 3) {
                alignment.horizontal = 'left';
              } else {
                alignment.horizontal = 'center';
              }
              
              ws[cellAddress].s = {
                alignment: alignment,
                border: {
                  top: { style: 'thin', color: { rgb: 'D0D0D0' } },
                  bottom: { style: 'thin', color: { rgb: 'D0D0D0' } },
                  left: { style: 'thin', color: { rgb: 'D0D0D0' } },
                  right: { style: 'thin', color: { rgb: 'D0D0D0' } }
                }
              };
              
              // Number formatting for numeric columns
              if (C >= 5 && typeof ws[cellAddress].v === 'number') {
                ws[cellAddress].z = '#,##0.00';
              }
            }
          }
        }
        
        // Set row heights
        ws['!rows'] = [];
        for (let i = 0; i <= range.e.r; i++) {
          if (i === headerRowIndex) {
            ws['!rows'][i] = { hpt: 30 };
          } else if (i === totalsRowIndex) {
            ws['!rows'][i] = { hpt: 25 };
          } else if (i >= dataStartRow) {
            ws['!rows'][i] = { hpt: 20 };
          }
        }
        
        // Page setup
        ws['!pageSetup'] = {
          fitToWidth: 1,
          fitToHeight: 0,
          orientation: 'portrait',
          paperSize: 9,
          scale: 100
        };
        
        ws['!margins'] = {
          left: 0.5,
          right: 0.5,
          top: 0.75,
          bottom: 0.75,
          header: 0.3,
          footer: 0.3
        };
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'BOQ with Revisions');
        
        // Download
        if (Platform.OS === 'web') {
          XLSX.writeFile(wb, `${tender?.title || 'BOQ'}_with_revisions.xlsx`, {
            cellStyles: true,
            bookSST: true
          });
          Alert.alert('Success', 'BOQ exported to Excel');
        }
      } else if (format === 'pdf') {
        // For PDF export, create a formatted HTML and use browser print
        const htmlContent = generatePDFHTML();
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        // Open in new window for printing
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
            }, 250);
          };
        }
      }
    } catch (error: any) {
      console.error('[RateAnalysisTenderDetail] Export error:', error);
      Alert.alert('Error', 'Failed to export BOQ: ' + error.message);
    }
  };

  // Generate HTML for PDF export
  const generatePDFHTML = () => {
    let revisionsHtml = '';
    const firstRowWithRevisions = parsedBoq.find(r => r.revisions && Object.keys(r.revisions).length > 0);
    const revisionKeys = firstRowWithRevisions?.revisions ? Object.keys(firstRowWithRevisions.revisions).sort() : [];
    
    // Generate revision headers
    revisionKeys.forEach(revKey => {
      revisionsHtml += `<th style="border: 1px solid #ddd; padding: 8px; background-color: #4472C4; color: white; text-align: center;">Rate (${revKey})</th>`;
      revisionsHtml += `<th style="border: 1px solid #ddd; padding: 8px; background-color: #4472C4; color: white; text-align: center;">Amount (${revKey})</th>`;
    });
    
    // Generate data rows
    let dataRowsHtml = '';
    parsedBoq.forEach((row, index) => {
      let revisionCellsHtml = '';
      revisionKeys.forEach(revKey => {
        const rev = (row.revisions as any)?.[revKey];
        const rate = rev?.rate || 0;
        const amount = rate * (row.quantity || 0);
        revisionCellsHtml += `<td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${rate.toFixed(2)}</td>`;
        revisionCellsHtml += `<td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>`;
      });
      
      dataRowsHtml += `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${(row as any).itemNo || '\u2014'}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: justify;">${row.description || ''}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${row.category || ''}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${row.subCategory || ''}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${row.unit || ''}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${(row.quantity || 0).toFixed(2)}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${(row.tenderRate || 0).toFixed(2)}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${(row.tenderAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          ${revisionCellsHtml}
        </tr>
      `;
    });
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${tender?.title || 'BOQ'} - Rate Analysis</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 15mm;
          }
          @media print {
            body { margin: 0; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 10pt;
          }
          .header-info {
            margin-bottom: 20px;
          }
          .header-info p {
            margin: 5px 0;
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
          }
          th {
            background-color: #4472C4;
            color: white;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header-info">
          <p>ID: ${tender?.tenderNo || tender?.tenderId || ''}</p>
          <p>Title: ${tender?.title || ''}</p>
          <p>Client: ${tender?.client || 'N/A'}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #4472C4; color: white; text-align: center;">Sr No</th>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #4472C4; color: white; text-align: center;">Item No.</th>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #4472C4; color: white; text-align: center;">Description</th>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #4472C4; color: white; text-align: center;">Category</th>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #4472C4; color: white; text-align: center;">SubCategory</th>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #4472C4; color: white; text-align: center;">Unit</th>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #4472C4; color: white; text-align: center;">Quantity</th>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #4472C4; color: white; text-align: center;">Rate</th>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #4472C4; color: white; text-align: center;">Amount (Rs.)</th>
              ${revisionsHtml}
            </tr>
          </thead>
          <tbody>
            ${dataRowsHtml}
          </tbody>
        </table>
        <script>
          // Auto-trigger print dialog
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 100);
          };
        </script>
      </body>
      </html>
    `;
  };

  // Debug: Check what's in tender object and state
  const handleDebugInfo = async () => {
    console.log('=== DEBUG INFO ===');
    console.log('Tender ID:', tenderId);
    console.log('Tender Object:', tender);
    console.log('Uploaded Filename:', uploadedFileName);
    console.log('Parsed BOQ State:', {
      length: parsedBoq.length,
      hasData: parsedBoq.length > 0,
      firstItem: parsedBoq[0]
    });
    console.log('Parse Report State:', parseReport);
    console.log('BOQ Files State:', {
      length: boqFiles.length,
      files: boqFiles.map(f => ({ name: f.name, rowCount: f.rows.length }))
    });
    console.log('Current BOQ Index:', currentBoqIndex);
    console.log('Render Condition:', {
      parsedBoqLength: parsedBoq.length,
      parseReportExists: !!parseReport,
      shouldShow: parsedBoq.length > 0 && !!parseReport
    });
    
    if (tender) {
      console.log('Tender Firebase Data:', {
        boqFileUrl: tender.boqFileUrl,
        parsedBoq: tender.parsedBoq ? `[${tender.parsedBoq.length} items]` : 'undefined',
        boqHeaders: (tender as any).boqHeaders,
        boqSheets: (tender as any).boqSheets,
        parsedAt: tender.parsedAt,
        parsedBy: tender.parsedBy
      });
    }
    
    // Test parser with sample data
    try {
      console.log('\n=== TESTING PARSER ===');
      const result = await testParser();
      console.log('Parser test result:', {
        rowsParsed: result.parseReport.rowsParsed,
        rowsSkipped: result.parseReport.rowsSkipped,
        warnings: result.parseReport.warnings.length,
        confidence: result.parseReport.mappingConfidence
      });
    } catch (error) {
      console.error('Parser test error:', error);
    }
    
    Alert.alert(
      'Debug Info',
      `Parsed BOQ: ${parsedBoq.length} rows\n` +
      `Parse Report: ${parseReport ? 'Yes' : 'No'}\n` +
      `Should Show: ${parsedBoq.length > 0 && parseReport ? 'Yes' : 'No'}\n` +
      `Uploaded File: ${uploadedFileName || 'None'}\n` +
      `Check console for full details`
    );
  };

  if (loading) {
    return (
      <AppLayout
        title="Rate Analysis"
        activeRoute="RateAnalysis"
        showBackButton={true}
        sidebarItems={RATE_ANALYSIS_NAV}
        onBackPress={() => navigation.goBack()}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E90FF" />
          <Text style={styles.loadingText}>Loading tender details...</Text>
        </View>
      </AppLayout>
    );
  }

  if (!tender) {
    return (
      <AppLayout
        title="Rate Analysis"
        activeRoute="RateAnalysis"
        showBackButton={true}
        sidebarItems={RATE_ANALYSIS_NAV}
        onBackPress={() => navigation.goBack()}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorTitle}>Tender Not Found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Back to List</Text>
          </TouchableOpacity>
        </View>
      </AppLayout>
    );
  }

  // If SSR mode requested, return compact SSR UI (only Selected Tender + tabs)
  if (effectiveMode === 'ssr') {
    return (
      <AppLayout
        title={`SSR Rate Analysis - ${tender?.title || 'Tender'}`}
        activeRoute="RateAnalysis"
        showBackButton={true}
        sidebarItems={RATE_ANALYSIS_NAV}
        onBackPress={() => navigation.goBack()}
      >
        <ScrollView style={styles.mainContent}>
          <View style={styles.ssrWrapper}>
            <Text style={styles.ssrTitle}>SSR Rate Analysis (Compact)</Text>
            <View style={styles.ssrSelectedCard}>
              <Text style={styles.sectionTitle}>Selected Tender</Text>
              <Text style={styles.tenderValue}>{tender.title}</Text>
              <Text style={styles.tenderLabel}>ID: {tender.tenderNo || tender.tenderId}</Text>
            </View>
            <View style={styles.tabsRow}>
              {['Project Details','SSR/DSR','Upload BOQ','Racapitulation','Summery','Abstract','Measurement','SSR RA','Lead Chart'].map(tab => (
                <TouchableOpacity key={tab} style={[styles.tabButton, activeTab===tab && styles.tabButtonActive]} onPress={() => setActiveTab(tab)}>
                  <Text style={[styles.tabText, activeTab===tab && styles.tabTextActive]}>{tab}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.tabContentPlaceholder}>
              {activeTab === 'Project Details' ? (
                <ProjectDetailsTab tenderId={tenderId} />
              ) : activeTab === 'Upload BOQ' ? (
                <UploadBOQTab />
              ) : activeTab === 'Lead Chart' ? (
                <LeadChartTab tenderId={tenderId} />
              ) : activeTab === 'Racapitulation' ? (
                <RecapTab tenderId={tenderId} />
              ) : activeTab === 'Summery' ? (
                <SummaryTab tenderId={tenderId} />
              ) : activeTab === 'Abstract' ? (
                <AbstractTab tenderId={tenderId} />
              ) : (
                <Text style={{ color: '#6B7280' }}>Content for "{activeTab}" will be added later.</Text>
              )}
            </View>
          </View>
        </ScrollView>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={`Rate Analysis - ${tender?.title || 'Tender Detail'}`}
      activeRoute="RateAnalysis"
      showBackButton={true}
      sidebarItems={RATE_ANALYSIS_NAV}
      onBackPress={() => navigation.goBack()}
    >

      <View style={[styles.tabsRow, styles.stickyTabsRow]}>
        {['Project Details','SSR/DSR','Upload BOQ','Racapitulation','Summery','Abstract','Measurement','SSR RA','Lead Chart'].map(tab => (
          <TouchableOpacity key={tab} style={[styles.tabButton, activeTab===tab && styles.tabButtonActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab===tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'Project Details' && (
        <View style={[styles.topRow, isMobile && styles.topRowMobile]}>
          {/* Left: Selected Tender Info */}
          <View style={[styles.tenderInfoCard, isMobile && styles.tenderInfoCardMobile]}>
            <Text style={styles.sectionTitle}>Selected Tender</Text>
            <View style={styles.tenderDetails}>
              <Text style={styles.tenderLabel}>ID:</Text>
              <Text style={styles.tenderValue}>{tender.tenderNo || tender.tenderId}</Text>
            </View>
            <View style={styles.tenderDetails}>
              <Text style={styles.tenderLabel}>Title:</Text>
              <Text style={styles.tenderValue}>{tender.title}</Text>
            </View>
            <View style={styles.tenderDetails}>
              <Text style={styles.tenderLabel}>Client:</Text>
              <Text style={styles.tenderValue}>{tender.client || 'N/A'}</Text>
            </View>
            <View style={styles.tenderDetails}>
              <Text style={styles.tenderLabel}>Deadline:</Text>
              <Text style={styles.tenderValue}>
                {dateUtils.formatDate(tender.submissionDeadline)}
              </Text>
            </View>
            <View style={styles.tenderDetails}>
              <Text style={styles.tenderLabel}>Value:</Text>
              <Text style={styles.tenderValue}>
                {formatUtils.formatCurrency(tender.estimatedValue, tender.currency)}
              </Text>
            </View>
            <View style={styles.tenderDetails}>
              <Text style={styles.tenderLabel}>Status:</Text>
              <Text style={[styles.tenderValue, { color: '#3B82F6', fontWeight: '600' }]}>
                {tender.status.charAt(0).toUpperCase() + tender.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>
      )}

        {/* BOQ File Metadata Table */}
        {boqFileMetadataRows.length > 0 && (
          <BoqFilesMetadataTable
            rows={boqFileMetadataRows}
            onRowsChange={setBoqFileMetadataRows}
            onAddRow={() => {
              const newRow: BoqFileRow = {
                id: `boq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                srNo: boqFileMetadataRows.length + 1,
                description: '',
                fileName: '',
                fileSize: '—',
                fileLastModified: dateUtils.formatDate(new Date()),
                fileUrl: undefined,
                parsedBoqName: undefined,
                saved: false,
                isNewRow: true,
                isEditing: true,
                editingDescription: '',
                editingFileName: '',
              };
              setBoqFileMetadataRows([...boqFileMetadataRows, newRow]);
            }}
            tenderId={tenderId}
            onSaveRow={async (row) => {
              // Persist to Firestore - update tender document with file metadata
              try {
                const tenderRef = doc(db, 'tenders', tenderId);
                const existingMetadata = (tender as any)?.boqFileMetadata || [];
                const existingIndex = existingMetadata.findIndex((m: any) => m.fileName === row.fileName);
                
                const updatedMetadata = [...existingMetadata];
                if (existingIndex >= 0) {
                  updatedMetadata[existingIndex] = {
                    fileName: row.fileName,
                    description: row.description,
                    fileSize: row.fileSize,
                    fileLastModified: row.fileLastModified,
                    parsedBoqName: row.parsedBoqName,
                    fileUrl: row.fileUrl,
                  };
                } else {
                  updatedMetadata.push({
                    fileName: row.fileName,
                    description: row.description,
                    fileSize: row.fileSize,
                    fileLastModified: row.fileLastModified,
                    parsedBoqName: row.parsedBoqName,
                    fileUrl: row.fileUrl,
                  });
                }
                
                await updateDoc(tenderRef, {
                  boqFileMetadata: updatedMetadata,
                });
              } catch (error) {
                console.error('[RateAnalysisTenderDetail] Error saving file metadata:', error);
                throw error;
              }
            }}
            onDeleteRow={async (rowId) => {
              // Remove from Firestore
              try {
                const rowToDelete = boqFileMetadataRows.find(r => r.id === rowId);
                if (!rowToDelete) return;

                const tenderRef = doc(db, 'tenders', tenderId);
                const existingMetadata = (tender as any)?.boqFileMetadata || [];
                const updatedMetadata = existingMetadata.filter((m: any) => m.fileName !== rowToDelete.fileName);
                
                await updateDoc(tenderRef, {
                  boqFileMetadata: updatedMetadata,
                });
              } catch (error) {
                console.error('[RateAnalysisTenderDetail] Error deleting file metadata:', error);
                throw error;
              }
            }}
            onParsedBoqClick={(row) => {
              // Find the corresponding BOQ file by name and switch to it
              const fileIndex = boqFiles.findIndex(f => f.name === row.parsedBoqName);
              if (fileIndex >= 0) {
                setCurrentBoqIndex(fileIndex);
                console.log('[RateAnalysisTenderDetail] Switched to BOQ file:', row.parsedBoqName, 'at index', fileIndex);
              } else {
                Alert.alert('Not Found', `Could not find parsed BOQ: ${row.parsedBoqName}`);
              }
            }}
          />
        )}

        {/* BOQ Table - Phase 2: Parsed BOQ or Empty State */}
        <View style={styles.boqTableSection}>
          {(() => {
            const hasData = parsedBoq && Array.isArray(parsedBoq) && parsedBoq.length > 0;
            console.log('[RateAnalysisTenderDetail RENDER] hasData:', hasData);
            console.log('[RateAnalysisTenderDetail RENDER] parsedBoq.length:', parsedBoq?.length);
            console.log('[RateAnalysisTenderDetail RENDER] parseReport exists:', !!parseReport);
            if (parsedBoq && parsedBoq.length > 0) {
              console.log('[RateAnalysisTenderDetail RENDER] First BOQ item:', parsedBoq[0]);
            }
            return hasData;
          })() ? (
            <>
              {/* Phase 2.1: New Rate Builder Table */}
              <ParsedBoqTablePhase2_1
                tenderId={tenderId}
                parsedBoq={parsedBoq}
                onOpenRateBuilder={handleOpenRateBuilder}
              />
              
              {/* Export Buttons */}
              <View style={styles.exportSection}>
                <TouchableOpacity
                  style={[styles.exportButton, { backgroundColor: '#059669' }]}
                  onPress={() => handleExportBoq('excel')}
                >
                  <Text style={styles.exportButtonIcon}>📄</Text>
                  <Text style={styles.exportButtonText}>Export to Excel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.exportButton, { backgroundColor: '#DC2626' }]}
                  onPress={() => handleExportBoq('pdf')}
                >
                  <Text style={styles.exportButtonIcon}>📝</Text>
                  <Text style={styles.exportButtonText}>Export to PDF</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.emptyBoqState}>
              <Text style={styles.emptyBoqIcon}>📋</Text>
              <Text style={styles.emptyBoqTitle}>No BOQ Data</Text>
              <Text style={styles.emptyBoqText}>
                Upload a BOQ file above to parse and display the bill of quantities
              </Text>
            </View>
          )}
        </View>

        {/* Phase 2 Success Notice */}
        {parsedBoq.length > 0 && (
          <View style={styles.successNotice}>
            <Text style={styles.successNoticeTitle}>✅ Phase 2 — BOQ Parsing Active</Text>
            <Text style={styles.successNoticeText}>
              BOQ has been parsed using the master parser. You can now edit items inline, apply master rates, and export.
            </Text>
          </View>
        )}
        {/* Parse Settings Modal */}
        {showParseSettings && pendingParseResult && (
          <BOQParseSettings
            visible={showParseSettings}
            onClose={() => {
              setShowParseSettings(false);
              setPendingParseResult(null);
            }}
            detectedMapping={pendingParseResult.parseReport.suggestedMapping}
            previewRows={[]} // TODO: Pass actual preview rows from parser
            onConfirm={handleParseSettingsConfirm}
          />
        )}

        {/* Phase 2.1: Rate Builder Modal */}
        <RateBuilder
          open={rateBuilderOpen}
          onClose={() => {
            setRateBuilderOpen(false);
            setSelectedRateItem(null);
            setSelectedRateItemIndex(-1);
          }}
          item={selectedRateItem}
          onSaveRevision={handleSaveRateRevision}
        />
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
    padding: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 24
  },
  backButton: {
    backgroundColor: '#1E90FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  headerSection: {
    marginBottom: 24
  },
  backButtonSmall: {
    marginBottom: 8
  },
  saveButton: {
    marginTop: 12,
    backgroundColor: '#10B981',
    borderWidth: 1,
    borderColor: '#059669',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  debugButton: {
    marginTop: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center'
  },
  debugButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E'
  },
  exportSection: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 16
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    ...Platform.select({
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
      }
    })
  },
  exportButtonIcon: {
    fontSize: 20
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  boqFilesSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB'
  },
  boqFilesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8
  },
  boqFilesList: {
    flexDirection: 'row'
  },
  boqFileButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    minWidth: 120
  },
  boqFileButtonActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6'
  },
  boqFileButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center'
  },
  boqFileButtonTextActive: {
    color: '#1E40AF',
    fontWeight: '600'
  },
  backButtonTextSmall: {
    fontSize: 14,
    color: '#1E90FF',
    fontWeight: '600'
  },
  breadcrumb: {
    fontSize: 12,
    color: '#9CA3AF'
  },
  topRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24
  },
  topRowMobile: {
    flexDirection: 'column'
  },
  tenderInfoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2
      }
    })
  },
  tenderInfoCardMobile: {
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10
  },
  tenderDetails: {
    flexDirection: 'row',
    marginBottom: 8
  },
  tenderLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    width: 92
  },
  tenderValue: {
    flex: 1,
    fontSize: 13,
    color: '#111827'
  },
  rightSection: {
    flex: 1,
    flexDirection: 'column',
    gap: 12
  },
  rightSectionMobile: {
    marginBottom: 16
  },
  uploadSaveRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start'
  },
  boqUploadCard: {
    flex: 1,
    minWidth: 200
  },
  saveIconButton: {
    backgroundColor: '#10B981',
    borderWidth: 1,
    borderColor: '#059669',
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2
      }
    })
  },
  saveIconButtonText: {
    fontSize: 28
  },
  boqTableSection: {
    marginBottom: 24
  },
  emptyBoqState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 60,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2
      }
    })
  },
  emptyBoqIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyBoqTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8
  },
  emptyBoqText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 400
  },
  successNotice: {
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#6EE7B7',
    marginBottom: 24
  },
  successNoticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: 8
  },
  successNoticeText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20
  },
  phaseNotice: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FCD34D',
    marginBottom: 24
  },
  phaseNoticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8
  },
  phaseNoticeText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20
  }
  ,
  ssrWrapper: { padding: 16, backgroundColor: '#fff', borderRadius: 8, margin: 16 },
  ssrTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  ssrSelectedCard: { padding: 12, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, marginBottom: 12 },
  tabsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  stickyTabsRow: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F3F4F6', borderRadius: 6, marginRight: 8, marginBottom: 8 },
  tabButtonActive: { backgroundColor: '#1E90FF' },
  tabText: { color: '#111827' },
  tabTextActive: { color: '#fff' },
  tabContentPlaceholder: { padding: 20, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, backgroundColor: '#FAFAFA' },
});

