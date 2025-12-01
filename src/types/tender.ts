// src/types/tender.ts
export type TenderStatus =
  | 'draft'
  | 'active'
  | 'to_submit'
  | 'submitted'
  | 'won'
  | 'lost'
  | 'archived';

export type WorkType = 'Civil' | 'Building' | 'Sports' | 'Metro' | 'EPC' | 'MEP' | 'Net Zero' | 'Other';
export type TenderSource = 'eTendering' | 'GEM' | 'PWD' | 'Railways' | 'Other';
export type SubmissionMode = 'Online' | 'Physical' | 'Both';
export type DocumentCategory = 'Tender Notice' | 'Technical Bid' | 'BOQ' | 'Financial Bid' | 'Corrigendum' | 'Drawings' | 'Annexure' | 'Other';

export interface Tender {
  tenderId: string;
  title: string;
  shortName?: string | null;
  tenderNo?: string;
  client?: string;
  department?: string;
  tenderUID?: string; // external tender ID
  submissionDeadline?: any; // Timestamp
  status?: TenderStatus;
  value?: number;
  membersMap: Record<string, string>;
  rateAnalysisAllowedRoles: string[];
  createdAt?: any;
  
  // Extended fields for full tender
  workType?: WorkType;
  tenderSource?: TenderSource;
  tenderSourceOther?: string;
  estimatedValue?: number;
  currency?: string;
  description?: string;
  externalLink?: string;
  
  // Location
  country?: string;
  state?: string;
  city?: string;
  siteAddress?: string;
  prebidMeetingAddress?: string;
  
  // Key dates
  publishDate?: any;
  prebidMeetingDate?: any;
  queryDeadline?: any;
  documentPurchaseDeadline?: any;
  technicalOpeningDate?: any;
  financialOpeningDate?: any;
  
  // Reminders
  reminderEnabled?: boolean;
  reminderLeadDays?: number;
  
  // BOQ/Financial
  boqFileUrl?: string;
  boqItemCount?: number;
  tenderValue?: number;
  paymentTerms?: string;
  
  // Team
  tenderManager?: string;
  engineeringLead?: string;
  estimationEngineer?: string;
  documentController?: string;
  additionalMembers?: string[];
  
  // Workflow
  submissionMode?: SubmissionMode;
  internalNotes?: string;
  emdAmount?: number;
  
  // Metadata
  createdBy?: string;
  lastModifiedBy?: string;
  lastModifiedAt?: any;
  lastUpdated?: any;
  
  // Progress tracking
  tenderProgressPercent?: number;
  documentProgressSummary?: {
    mandatoryCompleted: number;
    mandatoryTotal: number;
  };
  
  // Stage tracking (16 stages)
  stageCompletion?: Record<string, StageCompletionInfo>;
  progressPercent?: number;
  
  // Document checklist
  documentChecklist?: Record<string, DocumentChecklistItem>;
  
  // BOQ tracking
  boq?: {
    uploaded: boolean;
    rateAnalysisStatus: 'pending' | 'inprogress' | 'completed';
    summaryRef?: string;
  };
  
  // Phase 2: Parsed BOQ
  parsedBoq?: any[]; // StandardBOQRow[]
  parsedAt?: any; // Timestamp
  parsedBy?: string;
  boqRevisions?: any[]; // BOQRevision[]
  boqHeaders?: Record<string, number>; // Detected header mapping
  boqSheets?: string[]; // Sheet names from parsed file
  
  // Approvals
  approvals?: {
    engineering?: ApprovalInfo;
    finance?: ApprovalInfo;
    management?: ApprovalInfo;
  };
  
  // Submission tracking
  submission?: {
    mode: 'online' | 'physical' | null;
    submittedAt?: any;
    proofRef?: string;
  };
  
  // Award tracking
  award?: {
    recommendationRef?: string;
    loaRef?: string;
    awarded: boolean;
  };
}

export interface StageCompletionInfo {
  done: boolean;
  by: string | null;
  at: any; // Timestamp
  evidenceRefs: string[];
}

export interface DocumentChecklistItem {
  required: boolean;
  uploaded: boolean;
  fileRef?: string;
}

export interface ApprovalInfo {
  status: 'pending' | 'approved' | 'rejected';
  by?: string;
  at?: any;
  notes?: string;
}

export interface TenderDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  storagePath?: string; // internal storage path for move/copy ops
  fileSize: number;
  fileType: string;
  category: DocumentCategory;
  isMandatory: boolean;
  uploadedBy: string;
  uploadedAt: any;
}

export interface TenderFormData {
  // Basic Details
  title: string;
  shortName: string;
  workType: WorkType;
  tenderSource: TenderSource;
  tenderSourceOther?: string;
  estimatedValue: string;
  currency: string;
  description: string;
  
  // Identification & Reference
  client: string;
  department: string;
  tenderUID: string;
  externalLink: string;
  
  // Location Details
  country: string;
  state: string;
  city: string;
  siteAddress: string;
  prebidMeetingAddress: string;
  
  // Key Dates
  publishDate: Date | null;
  prebidMeetingDate: Date | null;
  queryDeadline: Date | null;
  documentPurchaseDeadline: Date | null;
  submissionDeadline: Date | null;
  technicalOpeningDate: Date | null;
  financialOpeningDate: Date | null;
  reminderEnabled: boolean;
  reminderLeadDays: number;
  
  // BOQ/Financial
  boqFileUrl: string;
  boqItemCount: number;
  tenderValue: string;
  paymentTerms: string;
  
  // Team
  tenderManager: string;
  engineeringLead: string;
  estimationEngineer: string;
  documentController: string;
  additionalMembers: string[];
  
  // Workflow
  status: TenderStatus;
  submissionMode: SubmissionMode;
  internalNotes: string;
  emdAmount: string;
  // Optional Advanced
  prebidQueryInstructions?: string;
  extraReminders?: string; // free-form or CSV of additional reminder notes
  bidProbabilityScore?: number; // placeholder (AI generated later)
}

export interface TenderDraft {
  draftId: string;
  userId: string;
  formData: Partial<TenderFormData>;
  documents: TenderDocument[];
  createdAt: any;
  lastSavedAt: any;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: string[];
}

export interface RateBreakdown {
  materials: number;
  labour: number;
  plant: number;
  transport: number;
  overheads: number;
  profit: number;
  other?: number;
}

export interface RateAnalysisDoc {
  id: string;
  tenderId: string;
  boqItemId: string | null;
  description: string;
  unit: string;
  quantity: number;
  rateBreakdown: RateBreakdown;
  computedRate: number;
  totalAmount: number;
  lastEditedBy: string;
  lastEditedAt: any;
  version: number;
  status: 'draft' | 'final';
  isLocked: boolean;
  lockedBy: string | null;
  lockedAt: any;
}
