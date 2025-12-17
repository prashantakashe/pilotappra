// src/services/dsrService.ts
// DSR service stub - SSR/DSR module removed
// This file provides a no-op/stubbed API so other modules importing
// `dsrService` won't break. The real implementation will be provided
// when the DSR/SSR module is reintroduced at its new location.
/**
 * DSR Module Firestore Service
 * Handles all database operations for DSR Rate Analysis module
 */

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  onSnapshot,
  QueryConstraint,
  increment,
  runTransaction,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import {
  DSRProject,
  DSRBOQUpload,
  DSRRecapSheet,
  DSRSummarySheet,
  DSRAbstractSheet,
  DSRMeasurementSheet,
  DSRRateAnalysis,
  DSRLeadChart,
  DSRFinalBOQ,
  DSRFileOperation,
} from '../types/dsr';

/**
 * DSR Project Operations
 */
export const dsrService = {
  // ===== PROJECT OPERATIONS =====

  /**
   * Create a new DSR project
   */
  createProject: async (projectData: Omit<DSRProject, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<string> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Build document data, excluding undefined values
      const docData: any = {
        nameOfWork: projectData.nameOfWork,
        nameOfWorkShort: projectData.nameOfWorkShort,
        department: projectData.department,
        status: projectData.status || 'draft',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: user.uid,
        createdByName: user.displayName || user.email || 'Unknown',
        totalBOQFiles: 0,
        recapSheets: 0,
        isActive: true,
      };
      // Only add targetDateOfSubmission if it is defined
      if (projectData.targetDateOfSubmission !== undefined) {
        docData.targetDateOfSubmission = projectData.targetDateOfSubmission instanceof Date
          ? Timestamp.fromDate(projectData.targetDateOfSubmission)
          : projectData.targetDateOfSubmission;
      }

      // Add optional fields only if defined
      if (projectData.projectLocation) docData.projectLocation = projectData.projectLocation;
      if (projectData.estimatedCost !== undefined && projectData.estimatedCost !== null) {
        docData.estimatedCost = projectData.estimatedCost;
      }

      const docRef = await addDoc(collection(db, 'dsr_projects'), docData);

      console.log('[DSRService] Project created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('[DSRService] Error creating project:', error);
      throw error;
    }
  }, // <--- CORRECTED: Comma added to separate method definitions

  /**
   * Get all DSR projects for current user
   */
  getProjects: async (): Promise<DSRProject[]> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Note: Using orderBy alone (no where clause) to avoid requiring composite index
      const q = query(
        collection(db, 'dsr_projects'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const projects: DSRProject[] = [];

      function toDateSafe(val: any) {
        if (!val) return new Date();
        if (val.toDate && typeof val.toDate === 'function') return val.toDate();
        if (typeof val === 'string') return new Date(val);
        if (val instanceof Date) return val;
        return new Date();
      }
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Filter out inactive projects
        if (data.isActive !== false) {
          projects.push({
            id: doc.id,
            nameOfWork: data.nameOfWork,
            nameOfWorkShort: data.nameOfWorkShort,
            department: data.department,
            targetDateOfSubmission: toDateSafe(data.targetDateOfSubmission),
            projectLocation: data.projectLocation,
            estimatedCost: data.estimatedCost,
            status: data.status || 'draft',
            createdAt: toDateSafe(data.createdAt),
            updatedAt: toDateSafe(data.updatedAt),
            createdBy: data.createdBy,
            createdByName: data.createdByName,
            totalBOQFiles: data.totalBOQFiles || 0,
            recapSheets: data.recapSheets || 0,
            isActive: data.isActive,
          });
        }
      });

      return projects;
    } catch (error) {
      console.error('[DSRService] Error fetching projects:', error);
      throw error;
    }
  },

  /**
   * Get single DSR project by ID
   */
  getProject: async (projectId: string): Promise<DSRProject | null> => {
    try {
      const docRef = doc(db, 'dsr_projects', projectId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.warn('[DSRService] Project not found:', projectId);
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        nameOfWork: data.nameOfWork,
        nameOfWorkShort: data.nameOfWorkShort,
        department: data.department,
        targetDateOfSubmission: data.targetDateOfSubmission?.toDate() || new Date(),
        projectLocation: data.projectLocation,
        estimatedCost: data.estimatedCost,
        status: data.status || 'draft',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        createdBy: data.createdBy,
        createdByName: data.createdByName,
        totalBOQFiles: data.totalBOQFiles || 0,
        recapSheets: data.recapSheets || 0,
        isActive: data.isActive,
      };
    } catch (error) {
      console.error('[DSRService] Error fetching project:', error);
      throw error;
    }
  },

  /**
   * Update DSR project
   */
  updateProject: async (projectId: string, updates: Partial<DSRProject>): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const docRef = doc(db, 'dsr_projects', projectId);
      
      const updateData: any = {
        updatedAt: Timestamp.now(),
        lastModifiedBy: user.uid,
      };

      // Add fields from updates, excluding undefined values
      Object.keys(updates).forEach((key) => {
        const value = (updates as any)[key];
        if (value !== undefined && value !== null) {
          if (key === 'targetDateOfSubmission' && value instanceof Date) {
            updateData[key] = Timestamp.fromDate(value);
          } else {
            updateData[key] = value;
          }
        }
      });

      await updateDoc(docRef, updateData);
      console.log('[DSRService] Project updated:', projectId);
    } catch (error) {
      console.error('[DSRService] Error updating project:', error);
      throw error;
    }
  },

  /**
   * Delete (soft delete) DSR project
   */
  deleteProject: async (projectId: string): Promise<void> => {
    try {
      const docRef = doc(db, 'dsr_projects', projectId);
      await updateDoc(docRef, {
        isActive: false,
        updatedAt: Timestamp.now(),
      });
      console.log('[DSRService] Project deleted:', projectId);
    } catch (error) {
      console.error('[DSRService] Error deleting project:', error);
      throw error;
    }
  },

  // ===== BOQ UPLOAD OPERATIONS =====

  /**
   * Add BOQ file upload record
   */
  addBOQUpload: async (
    projectId: string,
    upload: Omit<DSRBOQUpload, 'id' | 'createdAt' | 'uploadedBy' | 'uploadedByName'>
  ): Promise<string> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const projectRef = doc(db, 'dsr_projects', projectId);

      return await runTransaction(db, async (transaction) => {
        // Get current project to validate existence (optional but recommended)
        const projectSnap = await transaction.get(projectRef);
        if (!projectSnap.exists()) {
          throw new Error('Project does not exist');
        }

        // Add the BOQ upload document
        const boqUploadRef = doc(collection(db, 'dsr_projects', projectId, 'boq_uploads'));
        transaction.set(boqUploadRef, {
          ...upload,
          createdAt: Timestamp.now(),
          uploadedBy: user.uid,
          uploadedByName: user.displayName || user.email || 'Unknown',
          isProcessed: false,
        });

        // Atomically increment the totalBOQFiles counter
        transaction.update(projectRef, {
          totalBOQFiles: increment(1),
          updatedAt: Timestamp.now(),
        });

        return boqUploadRef.id;
      });
    } catch (error) {
      console.error('[DSRService] Error adding BOQ upload:', error);
      throw error;
    }
  },
}