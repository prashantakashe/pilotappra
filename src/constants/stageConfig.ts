// src/constants/stageConfig.ts
export type StageId = 
  | '1_identification'
  | '2_documents'
  | '3_prebid'
  | '4_sitevisit'
  | '5_technical'
  | '6_boq'
  | '7_costing'
  | '8_docu_prep'
  | '9_approvals'
  | '10_submission'
  | '11_followup'
  | '12_tech_opening'
  | '13_fin_opening'
  | '14_negotiation'
  | '15_recommendation'
  | '16_loa';

export interface StageConfig {
  id: StageId;
  number: number;
  title: string;
  description: string;
  completionPhrase: string;
  triggerType: 'auto' | 'manual' | 'hybrid';
  autoConditions?: string;
  requiredRoles?: string[];
  evidenceRequired?: boolean;
}

export const STAGE_CONFIGS: Record<StageId, StageConfig> = {
  '1_identification': {
    id: '1_identification',
    number: 1,
    title: 'Tender Identification',
    description: 'Basic tender information added to the system',
    completionPhrase: 'Basic Tender information added. Stage 1 completed.',
    triggerType: 'auto',
    autoConditions: 'Auto-completes when tender document is created',
    requiredRoles: [],
    evidenceRequired: false
  },
  '2_documents': {
    id: '2_documents',
    number: 2,
    title: 'Tender Document Download',
    description: 'All mandatory tender documents uploaded',
    completionPhrase: 'All mandatory tender documents uploaded. Stage 2 completed.',
    triggerType: 'auto',
    autoConditions: 'Auto-completes when all mandatory documents in checklist are uploaded',
    requiredRoles: [],
    evidenceRequired: false
  },
  '3_prebid': {
    id: '3_prebid',
    number: 3,
    title: 'Pre-Bid Preparation',
    description: 'Pre-bid queries addressed or meeting status set',
    completionPhrase: 'Pre-bid queries addressed / pre-bid meeting status set. Stage 3 completed.',
    triggerType: 'hybrid',
    autoConditions: 'Auto when prebid.queries entered or user marks "No Query"',
    requiredRoles: ['admin', 'tender_manager', 'engineer'],
    evidenceRequired: false
  },
  '4_sitevisit': {
    id: '4_sitevisit',
    number: 4,
    title: 'Site Visit',
    description: 'Site visit report uploaded or marked not required',
    completionPhrase: 'Site visit report uploaded or marked not required. Stage 4 completed.',
    triggerType: 'manual',
    autoConditions: 'Manual when siteVisit.reportRef uploaded or user marks "Not Required"',
    requiredRoles: ['admin', 'tender_manager', 'engineer'],
    evidenceRequired: true
  },
  '5_technical': {
    id: '5_technical',
    number: 5,
    title: 'Technical Study & Compliance Check',
    description: 'Technical compliance reviewed and Go/No-Go decision made',
    completionPhrase: 'Technical compliance reviewed and summary marked. Stage 5 completed (Go).',
    triggerType: 'manual',
    requiredRoles: ['admin', 'tender_manager', 'engineer'],
    evidenceRequired: true
  },
  '6_boq': {
    id: '6_boq',
    number: 6,
    title: 'BOQ Study & Rate Analysis',
    description: 'BOQ rate analysis completed for all items',
    completionPhrase: 'BOQ rate analysis completed and BOQ summary generated. Stage 6 completed.',
    triggerType: 'auto',
    autoConditions: 'Auto when every BOQ item has rateAnalysis.status == "completed" and boq.summaryRef exists',
    requiredRoles: [],
    evidenceRequired: false
  },
  '7_costing': {
    id: '7_costing',
    number: 7,
    title: 'Tender Costing & Financial Compilation',
    description: 'Final financial summary created and approved',
    completionPhrase: 'Final financial summary created and approved. Stage 6-7 completed.',
    triggerType: 'hybrid',
    autoConditions: 'Auto when financialSummary.approved == true or Manager confirms',
    requiredRoles: ['admin', 'tender_manager'],
    evidenceRequired: true
  },
  '8_docu_prep': {
    id: '8_docu_prep',
    number: 8,
    title: 'Tender Document Preparation',
    description: 'All technical documents uploaded and checklist complete',
    completionPhrase: 'All technical documents uploaded and checklist complete. Stage 8 completed.',
    triggerType: 'hybrid',
    autoConditions: 'Auto when technical document checklist is complete plus user confirmation',
    requiredRoles: ['admin', 'tender_manager'],
    evidenceRequired: false
  },
  '9_approvals': {
    id: '9_approvals',
    number: 9,
    title: 'Internal Approvals',
    description: 'All required internal approvals obtained',
    completionPhrase: 'All required internal approvals obtained. Stage 9 completed.',
    triggerType: 'auto',
    autoConditions: 'Auto when all required approvers in approvals have status == "approved"',
    requiredRoles: [],
    evidenceRequired: false
  },
  '10_submission': {
    id: '10_submission',
    number: 10,
    title: 'Tender Submission',
    description: 'Tender submitted online or physical proof uploaded',
    completionPhrase: 'Tender submitted (Online/Physical) and proof uploaded. Stage 10 completed.',
    triggerType: 'hybrid',
    autoConditions: 'Cloud Function validates online submission or physical proof uploaded',
    requiredRoles: ['admin', 'tender_manager'],
    evidenceRequired: true
  },
  '11_followup': {
    id: '11_followup',
    number: 11,
    title: 'Post-Submission Follow-up',
    description: 'All post-submission clarifications addressed',
    completionPhrase: 'All post-submission clarifications addressed. Stage 11 completed.',
    triggerType: 'manual',
    requiredRoles: ['admin', 'tender_manager'],
    evidenceRequired: false
  },
  '12_tech_opening': {
    id: '12_tech_opening',
    number: 12,
    title: 'Technical Bid Opening',
    description: 'Technical evaluation captured and sheet uploaded',
    completionPhrase: 'Technical evaluation captured and sheet uploaded. Stage 12 completed.',
    triggerType: 'manual',
    requiredRoles: ['admin', 'tender_manager'],
    evidenceRequired: true
  },
  '13_fin_opening': {
    id: '13_fin_opening',
    number: 13,
    title: 'Financial Bid Opening',
    description: 'Financial opening recorded and ranking entered',
    completionPhrase: 'Financial opening recorded and ranking entered. Stage 13 completed.',
    triggerType: 'manual',
    requiredRoles: ['admin', 'tender_manager'],
    evidenceRequired: true
  },
  '14_negotiation': {
    id: '14_negotiation',
    number: 14,
    title: 'Negotiation / Justification',
    description: 'Negotiation completed or marked not applicable',
    completionPhrase: 'Negotiation / justification completed (or not applicable). Stage 14 completed.',
    triggerType: 'manual',
    requiredRoles: ['admin', 'tender_manager'],
    evidenceRequired: false
  },
  '15_recommendation': {
    id: '15_recommendation',
    number: 15,
    title: 'Award Recommendation',
    description: 'Award recommendation document uploaded and recorded',
    completionPhrase: 'Award recommendation recorded. Stage 15 completed.',
    triggerType: 'manual',
    requiredRoles: ['admin', 'tender_manager'],
    evidenceRequired: true
  },
  '16_loa': {
    id: '16_loa',
    number: 16,
    title: 'LOA / Work Order (Award)',
    description: 'LOA received and tender marked as awarded',
    completionPhrase: 'LOA received and tender marked as Awarded. Stage 16 completed.',
    triggerType: 'manual',
    requiredRoles: ['admin'],
    evidenceRequired: true
  }
};

export const STAGE_ORDER: StageId[] = [
  '1_identification',
  '2_documents',
  '3_prebid',
  '4_sitevisit',
  '5_technical',
  '6_boq',
  '7_costing',
  '8_docu_prep',
  '9_approvals',
  '10_submission',
  '11_followup',
  '12_tech_opening',
  '13_fin_opening',
  '14_negotiation',
  '15_recommendation',
  '16_loa'
];

export const TOTAL_STAGES = 16;

/**
 * Calculate progress percentage based on completed stages
 */
export function calculateProgressPercent(stageCompletion?: Record<string, any>): number {
  if (!stageCompletion) return 0;
  
  const completedCount = STAGE_ORDER.filter(stageId => {
    return stageCompletion[stageId]?.done === true;
  }).length;
  
  return Math.round((completedCount / TOTAL_STAGES) * 100);
}

/**
 * Get the next incomplete stage
 */
export function getNextStage(stageCompletion?: Record<string, any>): StageConfig | null {
  if (!stageCompletion) return STAGE_CONFIGS['1_identification'];
  
  for (const stageId of STAGE_ORDER) {
    if (!stageCompletion[stageId]?.done) {
      return STAGE_CONFIGS[stageId];
    }
  }
  
  return null; // All stages complete
}

/**
 * Count completed stages
 */
export function getCompletedStagesCount(stageCompletion?: Record<string, any>): number {
  if (!stageCompletion) return 0;
  
  return STAGE_ORDER.filter(stageId => {
    return stageCompletion[stageId]?.done === true;
  }).length;
}

/**
 * Check if user has required role for a stage
 */
export function userCanCompleteStage(stageId: StageId, userRole: string): boolean {
  const config = STAGE_CONFIGS[stageId];
  if (!config.requiredRoles || config.requiredRoles.length === 0) return true;
  return config.requiredRoles.includes(userRole) || userRole === 'admin';
}
