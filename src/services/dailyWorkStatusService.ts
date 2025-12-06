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
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: toDate(data.date),
        startDate: data.startDate ? toDate(data.startDate) : undefined,
        targetDate: data.targetDate ? toDate(data.targetDate) : undefined,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        statusUpdates: (data.statusUpdates || []).map((update: any) => ({
          ...update,
          timestamp: toDate(update.timestamp)
        })),
        subActivities: (data.subActivities || []).map((sub: any) => ({
          ...sub,
          startDate: sub.startDate ? toDate(sub.startDate) : undefined,
          targetDate: sub.targetDate ? toDate(sub.targetDate) : undefined,
          statusUpdates: (sub.statusUpdates || []).map((update: any) => ({
            ...update,
            timestamp: toDate(update.timestamp)
          }))
        }))
      } as DWSDailyEntry;
    });
  } catch (error) {
    console.error('[DWS Service] Error getting entries:', error);
    throw error;
  }
};

/**
 * Check and auto-update delayed status for entries
 */
const checkAndUpdateDelayedStatus = async (entry: DWSDailyEntry): Promise<DWSDailyEntry> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if entry has a target date
  if (entry.targetDate) {
    const targetDate = toDate(entry.targetDate);
    targetDate.setHours(0, 0, 0, 0);
    
    // If target date has passed and status is not 'Completed', auto-set to 'Delayed'
    if (targetDate < today && entry.status !== 'Completed' && entry.status !== 'Delayed') {
      try {
        await updateDoc(doc(db, COLLECTIONS.ENTRIES, entry.id), {
          status: 'Delayed',
          updatedAt: Timestamp.now(),
          updatedBy: getCurrentUserId()
        });
        return { ...entry, status: 'Delayed' };
      } catch (error) {
        console.error('[DWS Service] Error auto-updating delayed status:', error);
      }
    }
  }
  
  return entry;
};

/**
 * Subscribe to daily entries
 */
export const subscribeToDailyEntries = (
  callback: (entries: DWSDailyEntry[]) => void
): (() => void) => {
  const q = query(collection(db, COLLECTIONS.ENTRIES), orderBy('date', 'desc'));
  return onSnapshot(q, async (snapshot) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const entries = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: toDate(data.date),
        startDate: data.startDate ? toDate(data.startDate) : undefined,
        targetDate: data.targetDate ? toDate(data.targetDate) : undefined,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        statusUpdates: (data.statusUpdates || []).map((update: any) => ({
          ...update,
          timestamp: toDate(update.timestamp)
        })),
        subActivities: (data.subActivities || []).map((sub: any) => ({
          ...sub,
          startDate: sub.startDate ? toDate(sub.startDate) : undefined,
          targetDate: sub.targetDate ? toDate(sub.targetDate) : undefined,
          statusUpdates: (sub.statusUpdates || []).map((update: any) => ({
            ...update,
            timestamp: toDate(update.timestamp)
          }))
        }))
      } as DWSDailyEntry;
    });
    
    // Auto-update delayed status for main entries and sub-activities
    for (const entry of entries) {
      let needsUpdate = false;
      const updates: any = {};
      
      // Check main activity
      if (entry.targetDate) {
        const targetDate = new Date(entry.targetDate);
        targetDate.setHours(0, 0, 0, 0);
        if (targetDate < today && entry.status !== 'Completed' && entry.status !== 'Delayed') {
          updates.status = 'Delayed';
          needsUpdate = true;
        }
      }
      
      // Check sub-activities
      if (entry.subActivities && entry.subActivities.length > 0) {
        const updatedSubActivities = entry.subActivities.map(sub => {
          if (sub.targetDate) {
            const subTargetDate = new Date(sub.targetDate);
            subTargetDate.setHours(0, 0, 0, 0);
            if (subTargetDate < today && sub.status !== 'Completed' && sub.status !== 'Delayed') {
              needsUpdate = true;
              return { ...sub, status: 'Delayed' };
            }
          }
          return sub;
        });
        
        if (updatedSubActivities.some((s, i) => s.status !== entry.subActivities![i].status)) {
          updates.subActivities = updatedSubActivities;
          needsUpdate = true;
        }
      }
      
      // Apply updates if needed
      if (needsUpdate && Object.keys(updates).length > 0) {
        try {
          await updateDoc(doc(db, COLLECTIONS.ENTRIES, entry.id), {
            ...updates,
            updatedAt: Timestamp.now(),
            updatedBy: getCurrentUserId()
          });
        } catch (error) {
          console.error('[DWS Service] Error auto-updating delayed status:', error);
        }
      }
    }
    
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
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: toDate(data.date),
        startDate: data.startDate ? toDate(data.startDate) : undefined,
        targetDate: data.targetDate ? toDate(data.targetDate) : undefined,
        createdAt: toDate(data.createdAt),
        updatedAt: toDate(data.updatedAt),
        statusUpdates: (data.statusUpdates || []).map((update: any) => ({
          ...update,
          timestamp: toDate(update.timestamp)
        })),
        subActivities: (data.subActivities || []).map((sub: any) => ({
          ...sub,
          startDate: sub.startDate ? toDate(sub.startDate) : undefined,
          targetDate: sub.targetDate ? toDate(sub.targetDate) : undefined,
          statusUpdates: (sub.statusUpdates || []).map((update: any) => ({
            ...update,
            timestamp: toDate(update.timestamp)
          }))
        }))
      } as DWSDailyEntry;
    });
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
    if (updates.startDate) {
      updateData.startDate = Timestamp.fromDate(updates.startDate instanceof Date ? updates.startDate : new Date(updates.startDate));
    } else if (updates.startDate === null) {
      updateData.startDate = null;
    }
    if (updates.targetDate) {
      updateData.targetDate = Timestamp.fromDate(updates.targetDate instanceof Date ? updates.targetDate : new Date(updates.targetDate));
    } else if (updates.targetDate === null) {
      updateData.targetDate = null;
    }
    
    // Handle sub-activities with proper date conversion and remove undefined values
    if (updates.subActivities) {
      updateData.subActivities = updates.subActivities.map(sub => {
        const cleanSub: any = { ...sub };
        
        // Convert startDate to Timestamp if it exists, otherwise remove the field
        if (sub.startDate) {
          cleanSub.startDate = Timestamp.fromDate(sub.startDate instanceof Date ? sub.startDate : new Date(sub.startDate));
        } else {
          delete cleanSub.startDate; // Remove undefined startDate
        }
        
        // Convert targetDate to Timestamp if it exists, otherwise remove the field
        if (sub.targetDate) {
          cleanSub.targetDate = Timestamp.fromDate(sub.targetDate instanceof Date ? sub.targetDate : new Date(sub.targetDate));
        } else {
          delete cleanSub.targetDate; // Remove undefined targetDate
        }
        
        // Ensure statusUpdates timestamps are converted properly
        if (cleanSub.statusUpdates && Array.isArray(cleanSub.statusUpdates)) {
          cleanSub.statusUpdates = cleanSub.statusUpdates.map((update: any) => {
            const cleanUpdate = { ...update };
            // Only convert if timestamp is a Date object and not already a Firestore Timestamp
            if (update.timestamp) {
              if (update.timestamp instanceof Date) {
                cleanUpdate.timestamp = Timestamp.fromDate(update.timestamp);
              } else if (update.timestamp.toDate) {
                // Already a Firestore Timestamp, keep as is
                cleanUpdate.timestamp = update.timestamp;
              } else {
                // Try to create a Date from it
                try {
                  cleanUpdate.timestamp = Timestamp.fromDate(new Date(update.timestamp));
                } catch (e) {
                  console.warn('[DWS Service] Invalid timestamp, using current time:', update.timestamp);
                  cleanUpdate.timestamp = Timestamp.now();
                }
              }
            } else {
              cleanUpdate.timestamp = Timestamp.now();
            }
            return cleanUpdate;
          });
        }
        
        return cleanSub;
      });
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
    
    // Determine filter mode: entry date or status update date
    const filterBy = filter.filterBy || 'entryDate';
    
    if (filterBy === 'statusUpdateDate') {
      // Filter by status update timestamp
      if (filter.startDate || filter.endDate) {
        entries = entries.map(entry => {
          // Find status updates within the date range
          const filteredStatusUpdates = entry.statusUpdates.filter(update => {
            const updateDate = new Date(update.timestamp);
            updateDate.setHours(0, 0, 0, 0);
            
            if (filter.startDate) {
              const startDate = new Date(filter.startDate);
              startDate.setHours(0, 0, 0, 0);
              if (updateDate < startDate) return false;
            }
            
            if (filter.endDate) {
              const endDate = new Date(filter.endDate);
              endDate.setHours(23, 59, 59, 999);
              if (updateDate > endDate) return false;
            }
            
            return true;
          });
          
          // Only include entries that have status updates in the date range
          if (filteredStatusUpdates.length > 0) {
            return {
              ...entry,
              statusUpdates: filteredStatusUpdates
            };
          }
          return null;
        }).filter(entry => entry !== null) as DWSDailyEntry[];
      }
    } else {
      // Original behavior: Filter by entry date
      if (filter.startDate) {
        entries = entries.filter(e => e.date >= filter.startDate!);
      }
      if (filter.endDate) {
        entries = entries.filter(e => e.date <= filter.endDate!);
      }
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
  subscribeToEntries: subscribeToDailyEntries,
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
