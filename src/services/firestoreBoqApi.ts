/**
 * Firestore API for BOQ and Rate Analysis operations
 * Handles saving parsed BOQ, rate revisions, and rate builder data
 */

import { doc, updateDoc, getDoc, Timestamp, collection, setDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from './firebase';
import type { StandardBOQRow } from './boqParser';
import type { RateRevision } from '../components/RateBuilder';

/**
 * Saves parsed BOQ data to Firestore
 * Path: tenders/{tenderId}
 * Fields: parsedBoq, parsedAt, parsedBy, boqFileUrl, boqHeaders, boqSheets
 */
export async function saveParsedBoq(
  tenderId: string,
  parsedBoq: StandardBOQRow[],
  boqFileUrl: string,
  boqHeaders?: Record<string, any>,
  boqSheets?: string[]
) {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to save BOQ');
    }

    if (!tenderId) {
      throw new Error('Tender ID is required');
    }

    console.log('[firestoreBoqApi] Saving parsed BOQ:', {
      tenderId,
      rowCount: parsedBoq.length,
      userId: auth.currentUser.uid,
      fileName: boqFileUrl,
    });

    const tenderRef = doc(db, 'tenders', tenderId);

    // First, verify the tender exists
    const tenderSnap = await getDoc(tenderRef);
    if (!tenderSnap.exists()) {
      throw new Error(`Tender document ${tenderId} does not exist`);
    }

    console.log('[firestoreBoqApi] Tender exists, proceeding with save');

    // Fetch existing files list to support multiple BOQs
    const data = tenderSnap.data() as any;
    const existingFiles: any[] = Array.isArray(data.boqFiles) ? data.boqFiles : [];

    // Check if BOQ is too large for inline storage (> 500 items use subcollection)
    const useLargeFileStorage = parsedBoq.length > 500;

    if (useLargeFileStorage) {
      console.log('[firestoreBoqApi] Large BOQ detected - using subcollection storage');
      
      // Save to subcollection: tenders/{tenderId}/boqItems/{fileId}/chunks/{chunkId}
      const fileId = boqFileUrl.replace(/[^a-zA-Z0-9]/g, '_'); // sanitize filename for Firestore ID
      const boqItemsRef = collection(db, 'tenders', tenderId, 'boqItems');
      const fileDocRef = doc(boqItemsRef, fileId);
      
      // Save file metadata
      await setDoc(fileDocRef, {
        name: boqFileUrl,
        rowCount: parsedBoq.length,
        createdAt: Timestamp.now(),
        createdBy: auth.currentUser.uid,
        report: {
          suggestedMapping: boqHeaders || {},
          sheets: boqSheets || [],
          rowsParsed: parsedBoq.length,
        }
      });

      // Split into chunks of 100 items each to avoid document size limits
      const chunkSize = 100;
      const chunks = [];
      for (let i = 0; i < parsedBoq.length; i += chunkSize) {
        chunks.push(parsedBoq.slice(i, i + chunkSize));
      }

      console.log(`[firestoreBoqApi] Splitting ${parsedBoq.length} rows into ${chunks.length} chunks`);

      // Save each chunk as a separate document
      const chunksRef = collection(fileDocRef, 'chunks');
      const batch = writeBatch(db);
      
      chunks.forEach((chunk, index) => {
        const chunkDocRef = doc(chunksRef, `chunk_${index}`);
        batch.set(chunkDocRef, {
          chunkIndex: index,
          rows: chunk,
          rowCount: chunk.length
        });
      });

      await batch.commit();
      console.log(`[firestoreBoqApi] Saved ${chunks.length} chunks to subcollection`);

      // Update file entry to reference subcollection
      const idx = existingFiles.findIndex(f => f?.name === boqFileUrl);
      const fileEntry = {
        name: boqFileUrl,
        rowCount: parsedBoq.length,
        usesSubcollection: true,
        fileId: fileId,
        report: {
          suggestedMapping: boqHeaders || {},
          sheets: boqSheets || [],
          rowsParsed: parsedBoq.length,
        }
      };
      
      let updatedFiles: any[];
      if (idx >= 0) {
        updatedFiles = [...existingFiles];
        updatedFiles[idx] = fileEntry;
      } else {
        updatedFiles = [...existingFiles, fileEntry];
      }

      const updateData = {
        parsedAt: Timestamp.now(),
        parsedBy: auth.currentUser.uid,
        boqFileUrl: boqFileUrl || null,
        boqHeaders: boqHeaders || {},
        boqSheets: boqSheets || [],
        boqFiles: updatedFiles,
        // Don't store parsedBoq inline for large files
      };

      await updateDoc(tenderRef, updateData);

    } else {
      // Small BOQ - use inline storage (original method)
      console.log('[firestoreBoqApi] Small BOQ - using inline storage');
      
      const idx = existingFiles.findIndex(f => f?.name === boqFileUrl);
      const fileEntry = {
        name: boqFileUrl,
        rows: parsedBoq,
        report: {
          suggestedMapping: boqHeaders || {},
          sheets: boqSheets || [],
          rowsParsed: parsedBoq.length,
        }
      };
      let updatedFiles: any[];
      if (idx >= 0) {
        updatedFiles = [...existingFiles];
        updatedFiles[idx] = fileEntry;
      } else {
        updatedFiles = [...existingFiles, fileEntry];
      }

      const updateData = {
        parsedBoq: parsedBoq,
        parsedAt: Timestamp.now(),
        parsedBy: auth.currentUser.uid,
        boqFileUrl: boqFileUrl || null,
        boqHeaders: boqHeaders || {},
        boqSheets: boqSheets || [],
        boqFiles: updatedFiles,
      };

      await updateDoc(tenderRef, updateData);
    }

    console.log('[firestoreBoqApi] ✅ Parsed BOQ saved successfully');
    return { success: true, message: `Saved ${parsedBoq.length} BOQ items` };
  } catch (error: any) {
    console.error('[firestoreBoqApi] ❌ Failed to save parsed BOQ:', error);

    // Provide helpful error messages
    if (error.code === 'permission-denied') {
      console.error('[firestoreBoqApi] Error: User does not have permission to update this tender');
      console.error('[firestoreBoqApi] Check: membersMap role in tender document or user role token');
    }

    throw error;
  }
}

/**
 * Saves a rate revision (R1) for a specific BOQ item
 * Path: tenders/{tenderId}/parsedBoq[itemIndex].revisions.R1
 * Also updates boqFiles array to keep data in sync
 */
export async function saveRevisionForItem(
  tenderId: string,
  itemIndex: number,
  revisionKey: string, // e.g., 'R1', 'R2', etc.
  revisionData: RateRevision
) {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to save revision');
    }

    if (!tenderId || itemIndex < 0) {
      throw new Error('Tender ID and valid item index are required');
    }

    console.log('[firestoreBoqApi] Saving rate revision:', {
      tenderId,
      itemIndex,
      revisionKey,
      rate: revisionData.rate,
      userId: auth.currentUser.uid,
    });

    const tenderRef = doc(db, 'tenders', tenderId);

    // Fetch current tender data to update boqFiles array as well
    const snap = await getDoc(tenderRef);
    if (!snap.exists()) {
      throw new Error('Tender not found');
    }

    const data = snap.data() as any;
    const boqFiles: any[] = Array.isArray(data.boqFiles) ? data.boqFiles : [];

    // Build the update path: parsedBoq[itemIndex].revisions[revisionKey]
    const updatePath = `parsedBoq.${itemIndex}.revisions.${revisionKey}`;

    // Prepare update data
    const updateData: any = {
      [updatePath]: revisionData,
    };

    // Also update boqFiles array if it exists
    if (boqFiles.length > 0) {
      const updatedBoqFiles = boqFiles.map(file => {
        if (file.rows && Array.isArray(file.rows) && file.rows[itemIndex]) {
          const updatedRows = [...file.rows];
          if (!updatedRows[itemIndex].revisions) {
            updatedRows[itemIndex].revisions = {};
          }
          updatedRows[itemIndex].revisions[revisionKey] = revisionData;
          return { ...file, rows: updatedRows };
        }
        return file;
      });
      updateData.boqFiles = updatedBoqFiles;
    }

    // Update Firestore with the new revision in both parsedBoq and boqFiles
    await updateDoc(tenderRef, updateData);

    console.log('[firestoreBoqApi] ✅ Rate revision saved successfully to both parsedBoq and boqFiles');
    return { success: true, message: `Saved ${revisionKey} revision with rate ${revisionData.rate}` };
  } catch (error: any) {
    console.error('[firestoreBoqApi] ❌ Failed to save rate revision:', error);

    if (error.code === 'permission-denied') {
      console.error('[firestoreBoqApi] Error: User does not have permission to update this tender');
      console.error('[firestoreBoqApi] Check: membersMap role in tender document or user role token');
    }

    throw error;
  }
}

/**
 * Fetches a tender's parsed BOQ
 * Returns the full tender document with parsed BOQ array
 */
export async function getTenderWithParsedBoq(tenderId: string) {
  try {
    if (!tenderId) {
      throw new Error('Tender ID is required');
    }

    console.log('[firestoreBoqApi] Fetching tender with parsed BOQ:', tenderId);

    const tenderRef = doc(db, 'tenders', tenderId);
    const tenderSnap = await getDoc(tenderRef);

    if (!tenderSnap.exists()) {
      throw new Error(`Tender not found: ${tenderId}`);
    }

    const tender = tenderSnap.data();

    console.log('[firestoreBoqApi] ✅ Tender fetched:', {
      tenderId,
      hasParseBoq: !!tender.parsedBoq,
      parsedBoqLength: tender.parsedBoq?.length || 0,
    });

    return tender;
  } catch (error: any) {
    console.error('[firestoreBoqApi] ❌ Failed to fetch tender:', error);
    throw error;
  }
}

/**
 * Updates the entire parsed BOQ array for a tender
 * Useful for batch updates or replacing the entire BOQ
 */
export async function updateEntireParsedBoq(
  tenderId: string,
  updatedParsedBoq: StandardBOQRow[]
) {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated');
    }

    if (!tenderId) {
      throw new Error('Tender ID is required');
    }

    console.log('[firestoreBoqApi] Updating entire parsed BOQ:', {
      tenderId,
      rowCount: updatedParsedBoq.length,
    });

    const tenderRef = doc(db, 'tenders', tenderId);

    await updateDoc(tenderRef, {
      parsedBoq: updatedParsedBoq,
      updatedAt: Timestamp.now(),
      updatedBy: auth.currentUser.uid,
    });

    console.log('[firestoreBoqApi] ✅ Entire parsed BOQ updated successfully');
    return { success: true };
  } catch (error: any) {
    console.error('[firestoreBoqApi] ❌ Failed to update parsed BOQ:', error);
    throw error;
  }
}

/**
 * Helper: Check if user has permission to edit this tender
 * Returns true if user is the creator or has 'editor'/'manager'/'admin' role in membersMap
 */
export async function checkTenderEditPermission(tenderId: string): Promise<boolean> {
  try {
    const tender = await getTenderWithParsedBoq(tenderId);
    const userId = auth.currentUser?.uid;

    if (!userId) return false;

    // Check if user is creator
    if (tender.createdBy === userId) return true;

    // Check if user is in membersMap with editor/manager/admin role
    const userRole = tender.membersMap?.[userId];
    if (userRole && ['editor', 'manager', 'admin'].includes(userRole)) {
      return true;
    }

    console.warn('[firestoreBoqApi] User does not have edit permission for tender:', tenderId);
    return false;
  } catch (error) {
    console.error('[firestoreBoqApi] Error checking permission:', error);
    return false;
  }
}

/**
 * Loads BOQ items from subcollection for large files
 * Path: tenders/{tenderId}/boqItems/{fileId}/chunks/{chunkId}
 */
export async function loadBoqFromSubcollection(tenderId: string, fileId: string): Promise<StandardBOQRow[]> {
  try {
    console.log('[firestoreBoqApi] Loading BOQ from subcollection:', { tenderId, fileId });

    const chunksRef = collection(db, 'tenders', tenderId, 'boqItems', fileId, 'chunks');
    const { getDocs, query, orderBy } = await import('firebase/firestore');
    const chunksQuery = query(chunksRef, orderBy('chunkIndex'));
    const chunksSnap = await getDocs(chunksQuery);

    const allRows: StandardBOQRow[] = [];
    chunksSnap.forEach(chunkDoc => {
      const chunkData = chunkDoc.data();
      if (chunkData.rows && Array.isArray(chunkData.rows)) {
        allRows.push(...chunkData.rows);
      }
    });

    console.log(`[firestoreBoqApi] ✅ Loaded ${allRows.length} rows from ${chunksSnap.size} chunks`);
    return allRows;
  } catch (error: any) {
    console.error('[firestoreBoqApi] ❌ Failed to load BOQ from subcollection:', error);
    throw error;
  }
}

export default {
  saveParsedBoq,
  saveRevisionForItem,
  getTenderWithParsedBoq,
  updateEntireParsedBoq,
  checkTenderEditPermission,
  loadBoqFromSubcollection,
};
