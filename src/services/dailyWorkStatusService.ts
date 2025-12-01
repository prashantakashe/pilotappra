// src/services/dailyWorkStatusService.ts
/**
 * Firebase service for Daily Work Status module
 * Handles CRUD operations for projects, personnel, statuses, and daily entries
 */

import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from './firebase';
import type {
  DWSProject,
  DWSPersonnel,
  DWSStatus,
  DWSDailyEntry,
  DWSDashboardMetrics,
  DWSReportFilter
} from '../types/dailyWorkStatus';
import { DEFAULT_STATUSES } from '../types/dailyWorkStatus';

// Collection names
const COLLECTIONS = {
  PROJECTS: 'dws_projects',
  PERSONNEL: 'dws_personnel',
  STATUSES: 'dws_statuses',
  ENTRIES: 'dws_entries'
};

// Helper to get current user ID
const getCurrentUserId = (): string => {
  return auth.currentUser?.uid || 'unknown';
};

// Helper to convert Firestore timestamp to Date
const toDate = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  if (timestamp.toDate) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp);
};

// ==================== PROJECTS ====================

/**
 * Get all projects
 */
export const getAllProjects = async (): Promise<DWSProject[]> => {
  try {
    const q = query(collection(db, COLLECTIONS.PROJECTS), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: toDate(doc.data().createdAt),
      updatedAt: toDate(doc.data().updatedAt)
    } as DWSProject));
  } catch (error) {
    console.error('[DWS Service] Error getting projects:', error);
    throw error;
  }
};

/**
 * Subscribe to projects
 */
export const subscribeToProjects = (
  callback: (projects: DWSProject[]) => void
): (() => void) => {
  const q = query(collection(db, COLLECTIONS.PROJECTS), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const projects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: toDate(doc.data().createdAt),
      updatedAt: toDate(doc.data().updatedAt)
    } as DWSProject));
    callback(projects);
  }, (error) => {
    console.error('[DWS Service] Error subscribing to projects:', error);
  });
};

/**
 * Add a new project
 */
export const addProject = async (project: Omit<DWSProject, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.PROJECTS), {
      ...project,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: getCurrentUserId()
    });
    console.log('[DWS Service] Project added:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[DWS Service] Error adding project:', error);
    throw error;
  }
};

/**
 * Update a project
 */
export const updateProject = async (id: string, updates: Partial<DWSProject>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.PROJECTS, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
    console.log('[DWS Service] Project updated:', id);
  } catch (error) {
    console.error('[DWS Service] Error updating project:', error);
    throw error;
  }
};

/**
 * Delete a project
 */
export const deleteProject = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.PROJECTS, id));
    console.log('[DWS Service] Project deleted:', id);
  } catch (error) {
    console.error('[DWS Service] Error deleting project:', error);
    throw error;
  }
};

// ==================== PERSONNEL ====================

/**
 * Get all personnel
 */
export const getAllPersonnel = async (): Promise<DWSPersonnel[]> => {
  try {
    const q = query(collection(db, COLLECTIONS.PERSONNEL), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: toDate(doc.data().createdAt),
      updatedAt: toDate(doc.data().updatedAt)
    } as DWSPersonnel));
  } catch (error) {
    console.error('[DWS Service] Error getting personnel:', error);
    throw error;
  }
};

/**
 * Subscribe to personnel
 */
export const subscribeToPersonnel = (
  callback: (personnel: DWSPersonnel[]) => void
): (() => void) => {
  const q = query(collection(db, COLLECTIONS.PERSONNEL), orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const personnel = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: toDate(doc.data().createdAt),
      updatedAt: toDate(doc.data().updatedAt)
    } as DWSPersonnel));
    callback(personnel);
  }, (error) => {
    console.error('[DWS Service] Error subscribing to personnel:', error);
  });
};

/**
 * Add a new person
 */
export const addPersonnel = async (person: Omit<DWSPersonnel, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.PERSONNEL), {
      ...person,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: getCurrentUserId()
    });
    console.log('[DWS Service] Personnel added:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[DWS Service] Error adding personnel:', error);
    throw error;
  }
};

/**
 * Update a person
 */
export const updatePersonnel = async (id: string, updates: Partial<DWSPersonnel>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.PERSONNEL, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
    console.log('[DWS Service] Personnel updated:', id);
  } catch (error) {
    console.error('[DWS Service] Error updating personnel:', error);
    throw error;
  }
};

/**
 * Delete a person
 */
export const deletePersonnel = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.PERSONNEL, id));
    console.log('[DWS Service] Personnel deleted:', id);
  } catch (error) {
    console.error('[DWS Service] Error deleting personnel:', error);
    throw error;
  }
};

// ==================== STATUSES ====================

/**
 * Get all statuses
 */
export const getAllStatuses = async (): Promise<DWSStatus[]> => {
  try {
    const q = query(collection(db, COLLECTIONS.STATUSES), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: toDate(doc.data().createdAt),
      updatedAt: toDate(doc.data().updatedAt)
    } as DWSStatus));
  } catch (error) {
    console.error('[DWS Service] Error getting statuses:', error);
    throw error;
  }
};

/**
 * Subscribe to statuses
 */
export const subscribeToStatuses = (
  callback: (statuses: DWSStatus[]) => void
): (() => void) => {
  const q = query(collection(db, COLLECTIONS.STATUSES), orderBy('order', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const statuses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: toDate(doc.data().createdAt),
      updatedAt: toDate(doc.data().updatedAt)
    } as DWSStatus));
    callback(statuses);
  }, (error) => {
    console.error('[DWS Service] Error subscribing to statuses:', error);
  });
};

/**
 * Add a new status
 */
export const addStatus = async (status: Omit<DWSStatus, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.STATUSES), {
      ...status,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: getCurrentUserId()
    });
    console.log('[DWS Service] Status added:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[DWS Service] Error adding status:', error);
    throw error;
  }
};

/**
 * Update a status
 */
export const updateStatus = async (id: string, updates: Partial<DWSStatus>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.STATUSES, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
    console.log('[DWS Service] Status updated:', id);
  } catch (error) {
    console.error('[DWS Service] Error updating status:', error);
    throw error;
  }
};

/**
 * Delete a status
 */
export const deleteStatus = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.STATUSES, id));
    console.log('[DWS Service] Status deleted:', id);
  } catch (error) {
    console.error('[DWS Service] Error deleting status:', error);
    throw error;
  }
};

/**
 * Initialize default statuses if none exist
 */
export const initializeDefaultStatuses = async (): Promise<void> => {
  try {
    const existing = await getAllStatuses();
    if (existing.length === 0) {
      console.log('[DWS Service] Initializing default statuses...');
      for (let i = 0; i < DEFAULT_STATUSES.length; i++) {
        await addStatus({
          name: DEFAULT_STATUSES[i].name,
          color: DEFAULT_STATUSES[i].color,
          order: i
        });
      }
      console.log('[DWS Service] Default statuses initialized');
    }
  } catch (error) {
    console.error('[DWS Service] Error initializing default statuses:', error);
  }
};

// ==================== DAILY ENTRIES ====================

/**
 * Get all daily entries
 */
export const getAllEntries = async (): Promise<DWSDailyEntry[]> => {
  try {
    const q = query(collection(db, COLLECTIONS.ENTRIES), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: toDate(doc.data().date),
      createdAt: toDate(doc.data().createdAt),
      updatedAt: toDate(doc.data().updatedAt)
    } as DWSDailyEntry));
  } catch (error) {
    console.error('[DWS Service] Error getting entries:', error);
    throw error;
  }
};

/**
 * Subscribe to daily entries
 */
export const subscribeToEntries = (
  callback: (entries: DWSDailyEntry[]) => void
): (() => void) => {
  const q = query(collection(db, COLLECTIONS.ENTRIES), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const entries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: toDate(doc.data().date),
      createdAt: toDate(doc.data().createdAt),
      updatedAt: toDate(doc.data().updatedAt)
    } as DWSDailyEntry));
    callback(entries);
  }, (error) => {
    console.error('[DWS Service] Error subscribing to entries:', error);
  });
};

/**
 * Get entries by date range
 */
export const getEntriesByDateRange = async (startDate: Date, endDate: Date): Promise<DWSDailyEntry[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.ENTRIES),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: toDate(doc.data().date),
      createdAt: toDate(doc.data().createdAt),
      updatedAt: toDate(doc.data().updatedAt)
    } as DWSDailyEntry));
  } catch (error) {
    console.error('[DWS Service] Error getting entries by date range:', error);
    throw error;
  }
};

/**
 * Get today's entries
 */
export const getTodayEntries = async (): Promise<DWSDailyEntry[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getEntriesByDateRange(today, tomorrow);
};

/**
 * Add a new daily entry
 */
export const addEntry = async (entry: Omit<DWSDailyEntry, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.ENTRIES), {
      ...entry,
      date: Timestamp.fromDate(entry.date instanceof Date ? entry.date : new Date(entry.date)),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: getCurrentUserId()
    });
    console.log('[DWS Service] Entry added:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[DWS Service] Error adding entry:', error);
    throw error;
  }
};

/**
 * Update a daily entry
 */
export const updateEntry = async (id: string, updates: Partial<DWSDailyEntry>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.ENTRIES, id);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };
    if (updates.date) {
      updateData.date = Timestamp.fromDate(updates.date instanceof Date ? updates.date : new Date(updates.date));
    }
    await updateDoc(docRef, updateData);
    console.log('[DWS Service] Entry updated:', id);
  } catch (error) {
    console.error('[DWS Service] Error updating entry:', error);
    throw error;
  }
};

/**
 * Delete a daily entry
 */
export const deleteEntry = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.ENTRIES, id));
    console.log('[DWS Service] Entry deleted:', id);
  } catch (error) {
    console.error('[DWS Service] Error deleting entry:', error);
    throw error;
  }
};

/**
 * Add status update to an entry
 */
export const addStatusUpdateToEntry = async (
  entryId: string, 
  note: string
): Promise<void> => {
  try {
    const entryRef = doc(db, COLLECTIONS.ENTRIES, entryId);
    const entries = await getAllEntries();
    const entry = entries.find(e => e.id === entryId);
    
    if (!entry) {
      throw new Error('Entry not found');
    }
    
    const newUpdate = {
      id: Date.now().toString(),
      note,
      timestamp: new Date(),
      updatedBy: getCurrentUserId()
    };
    
    const statusUpdates = [...(entry.statusUpdates || []), newUpdate];
    
    await updateDoc(entryRef, {
      statusUpdates,
      updatedAt: Timestamp.now()
    });
    
    console.log('[DWS Service] Status update added to entry:', entryId);
  } catch (error) {
    console.error('[DWS Service] Error adding status update:', error);
    throw error;
  }
};

// ==================== DASHBOARD METRICS ====================

/**
 * Get dashboard metrics
 */
export const getDashboardMetrics = async (): Promise<DWSDashboardMetrics> => {
  try {
    const [projects, personnel, entries, statuses] = await Promise.all([
      getAllProjects(),
      getAllPersonnel(),
      getTodayEntries(),
      getAllStatuses()
    ]);
    
    const allEntries = await getAllEntries();
    
    const statusCounts = allEntries.reduce((acc, entry) => {
      const status = entry.finalStatus?.toLowerCase() || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      todayEntries: entries.length,
      activeProjects: projects.length,
      totalPersonnel: personnel.length,
      pendingApprovals: 0, // TODO: Implement approvals
      completedActivities: statusCounts['completed'] || 0,
      ongoingActivities: statusCounts['ongoing'] || 0,
      notStartedActivities: statusCounts['not started'] || 0
    };
  } catch (error) {
    console.error('[DWS Service] Error getting dashboard metrics:', error);
    throw error;
  }
};

// ==================== REPORT GENERATION ====================

/**
 * Get report data based on filters
 */
export const getReportData = async (filter: DWSReportFilter): Promise<DWSDailyEntry[]> => {
  try {
    let entries = await getAllEntries();
    
    // Filter by date range
    if (filter.startDate) {
      entries = entries.filter(e => e.date >= filter.startDate!);
    }
    if (filter.endDate) {
      entries = entries.filter(e => e.date <= filter.endDate!);
    }
    
    // Filter by project
    if (filter.projectId) {
      entries = entries.filter(e => e.projectId === filter.projectId);
    }
    
    // Filter by user
    if (filter.userId) {
      entries = entries.filter(e => e.assignedTo === filter.userId);
    }
    
    return entries;
  } catch (error) {
    console.error('[DWS Service] Error getting report data:', error);
    throw error;
  }
};

// Export service object for convenience
export const dailyWorkStatusService = {
  // Projects
  getAllProjects,
  subscribeToProjects,
  addProject,
  updateProject,
  deleteProject,
  
  // Personnel
  getAllPersonnel,
  subscribeToPersonnel,
  addPersonnel,
  updatePersonnel,
  deletePersonnel,
  
  // Statuses
  getAllStatuses,
  subscribeToStatuses,
  addStatus,
  updateStatus,
  deleteStatus,
  initializeDefaultStatuses,
  
  // Entries
  getAllEntries,
  subscribeToEntries,
  getEntriesByDateRange,
  getTodayEntries,
  addEntry,
  updateEntry,
  deleteEntry,
  addStatusUpdateToEntry,
  
  // Dashboard & Reports
  getDashboardMetrics,
  getReportData
};
