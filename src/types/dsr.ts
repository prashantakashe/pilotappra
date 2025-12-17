// src/types/dsr.ts
/**
 * DSR (Detailed Schedule of Rates) Module Types
 * Comprehensive type definitions for all DSR submodule features
 */

export type DSRProjectStatus = 'draft' | 'in_progress' | 'completed' | 'archived';
export type FileFormat = 'pdf' | 'xls' | 'xlsx' | 'other';
export type SheetType = 'boq' | 'recap' | 'summary' | 'abstract' | 'measurement' | 'rate_analysis' | 'lead_chart';

/**
 * Main DSR Project
 * Contains basic project information required for DSR work
 */
export interface DSRProject {
  id: string;
  
  // Required fields
  nameOfWork: string; // Full name (compulsory)
  nameOfWorkShort: string; // Short name (compulsory)
  department: string; // Department name (compulsory)
  targetDateOfSubmission: Date | any; // Firestore Timestamp (compulsory)
  
  // Optional fields
  projectLocation?: string;
  estimatedCost?: number; // In Indian Rupees
  
  // Meta fields
  status: DSRProjectStatus;
  createdAt: Date | any;
  updatedAt: Date | any;
  createdBy: string;
  createdByName?: string;
  lastModifiedBy?: string;
  
  // Tracking
  totalBOQFiles?: number;
  recapSheets?: number;
  isActive?: boolean;
}

/**
 * BOQ Upload File Entry
 * Tracks uploaded BOQ files with metadata
 */
export interface DSRBOQUpload {
  id: string;
  projectId: string;
  
  // File metadata
  srNo: number; // Auto-generated serial number
  description: string; // User-entered description
  fileName: string; // Original uploaded file name
  fileSize: number; // Size in bytes
  fileFormat: FileFormat; // pdf | xls | xlsx | other
  fileUrl: string; // Firebase Storage URL
  
  // Timestamps
  fileLastModified: Date | any; // When file was last modified
  createdAt: Date | any;
  uploadedBy: string;
  uploadedByName?: string;
  
  // Processing
  isProcessed?: boolean;
  processedRecords?: number;
}

/**
 * Recap Sheet Entry
 * Summarized data extracted/generated from BOQ
 */
export interface DSRRecapSheet {
  id: string;
  projectId: string;
  
  // Reference information
  srNo: number; // Auto-generated
  description: string; // From BOQ or user input
  fileName: string; // Associated BOQ file name
  
  // Recap data (array of line items)
  recapData: DSRRecapDataRow[];
  
  // Summary totals
  totalQuantity?: number;
  totalAmount?: number;
  
  // Meta
  createdAt: Date | any;
  updatedAt: Date | any;
  createdBy: string;
}

/**
 * Individual Recap Data Row
 * Line item in recap sheet
 */
export interface DSRRecapDataRow {
  id?: string;
  itemCode: string;
  itemDescription: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number; // quantity * rate
  remarks?: string;
}

/**
 * Summary Sheet
 * High-level summary of the project
 */
export interface DSRSummarySheet {
  id: string;
  projectId: string;
  
  // Summary information
  totalItems: number;
  totalQuantity: number;
  totalEstimatedCost: number;
  
  // Department-wise breakdown
  departmentBreakdown: Record<string, number>;
  
  createdAt: Date | any;
  updatedAt: Date | any;
}

/**
 * Abstract Sheet
 * Abstract/overview of BOQ items
 */
export interface DSRAbstractSheet {
  id: string;
  projectId: string;
  
  // Abstract data
  abstractData: DSRAbstractRow[];
  
  createdAt: Date | any;
  updatedAt: Date | any;
}

export interface DSRAbstractRow {
  id?: string;
  itemNumber: number;
  itemDescription: string;
  quantity: number;
  unit: string;
  estimatedRate: number;
  estimatedAmount: number;
}

/**
 * Measurement Sheet
 * Detailed measurements for project items
 */
export interface DSRMeasurementSheet {
  id: string;
  projectId: string;
  
  // Measurement data
  measurements: DSRMeasurementRow[];
  
  createdAt: Date | any;
  updatedAt: Date | any;
}

export interface DSRMeasurementRow {
  id?: string;
  itemCode: string;
  description: string;
  length: number;
  width: number;
  height: number;
  quantity: number;
  unit: string;
  remarks?: string;
}

/**
 * Rate Analysis Data
 * Detailed rate analysis as per DSR
 */
export interface DSRRateAnalysis {
  id: string;
  projectId: string;
  
  // Reference
  itemCode: string;
  description: string;
  
  // DSR Details
  dsrRate: number;
  dsrSource: string; // e.g., "PWD DSR 2023", "State DSR", etc.
  dsrCategory: string;
  
  // Analysis
  variations?: DSRRateVariation[];
  applicablePercentage?: number; // For escalation
  finalRate?: number;
  
  createdAt: Date | any;
  updatedAt: Date | any;
  analyzedBy: string;
}

export interface DSRRateVariation {
  id?: string;
  type: 'labour' | 'material' | 'contingency' | 'overhead';
  description: string;
  percentage: number;
  amount: number;
}

/**
 * Lead Chart
 * Project timeline and schedule
 */
export interface DSRLeadChart {
  id: string;
  projectId: string;
  
  // Timeline data
  phases: DSRLeadChartPhase[];
  
  createdAt: Date | any;
  updatedAt: Date | any;
}

export interface DSRLeadChartPhase {
  id?: string;
  phaseName: string;
  startDate: Date | any;
  endDate: Date | any;
  activities: string;
  responsibility: string;
  status: 'pending' | 'in_progress' | 'completed';
}

/**
 * Final BOQ (Output)
 * Compiled final BOQ from all processing
 */
export interface DSRFinalBOQ {
  id: string;
  projectId: string;
  
  // Final BOQ items
  items: DSRFinalBOQItem[];
  
  // Totals
  totalItems: number;
  totalQuantity: number;
  totalAmount: number;
  
  // Generation info
  generatedAt: Date | any;
  generatedBy: string;
  generatedFrom: SheetType[];
}

export interface DSRFinalBOQItem {
  id?: string;
  srNo: number;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  remarks?: string;
  source?: SheetType; // Which sheet this came from
}

/**
 * File Operations Metadata
 * For tracking uploads and downloads
 */
export interface DSRFileOperation {
  id: string;
  projectId: string;
  
  type: 'upload' | 'download' | 'delete';
  fileName: string;
  fileFormat: FileFormat;
  fileSize: number;
  
  performedBy: string;
  performedAt: Date | any;
  
  status: 'success' | 'failed';
  errorMessage?: string;
}

/**
 * DSR Project Statistics
 * For dashboard and analytics
 */
export interface DSRProjectStats {
  projectId: string;
  
  totalProjects: number;
  completedProjects: number;
  inProgressProjects: number;
  draftProjects: number;
  
  totalBOQFiles: number;
  totalRecapSheets: number;
  
  lastUpdated: Date | any;
}
