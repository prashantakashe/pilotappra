// src/services/stageService.ts
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';
import { Tender } from '../types/tender';
import { StageId } from '../constants/stageConfig';

/**
 * Client-side API for tender stage operations
 * All stage mutations go through Cloud Functions for security and validation
 */

interface FinalizeStageRequest {
  tenderId: string;
  stageId: StageId;
  evidenceRefs?: string[];
  notes?: string;
}

interface FinalizeStageResponse {
  success: boolean;
  tender?: Tender;
  message?: string;
  error?: string;
}

interface AwardTenderRequest {
  tenderId: string;
  loaRef: string;
  notes?: string;
}

interface AwardTenderResponse {
  success: boolean;
  tender?: Tender;
  message?: string;
  error?: string;
}

/**
 * Mark a stage as completed
 * Validates user permissions and stage-specific conditions server-side
 */
export async function finalizeStage(
  tenderId: string,
  stageId: StageId,
  evidenceRefs: string[] = [],
  notes?: string
): Promise<FinalizeStageResponse> {
  try {
    const finalizeStageFunc = httpsCallable<FinalizeStageRequest, FinalizeStageResponse>(
      functions,
      'finalizeStage'
    );
    
    const result = await finalizeStageFunc({
      tenderId,
      stageId,
      evidenceRefs,
      notes
    });
    
    return result.data;
  } catch (error: any) {
    console.error('Error finalizing stage:', error);
    return {
      success: false,
      error: error.message || 'Failed to finalize stage'
    };
  }
}

/**
 * Award tender (completes Stage 16)
 * Admin-only operation
 */
export async function awardTender(
  tenderId: string,
  loaRef: string,
  notes?: string
): Promise<AwardTenderResponse> {
  try {
    const awardTenderFunc = httpsCallable<AwardTenderRequest, AwardTenderResponse>(
      functions,
      'awardTender'
    );
    
    const result = await awardTenderFunc({
      tenderId,
      loaRef,
      notes
    });
    
    return result.data;
  } catch (error: any) {
    console.error('Error awarding tender:', error);
    return {
      success: false,
      error: error.message || 'Failed to award tender'
    };
  }
}

/**
 * Client-side auto-eligibility checks
 * These are advisory only - server validates before allowing completion
 */

export function isStage2Eligible(tender: Tender): boolean {
  // Stage 2: All mandatory documents uploaded
  if (!tender.documentChecklist) return false;
  
  const mandatoryDocs = Object.values(tender.documentChecklist).filter(doc => doc.required);
  if (mandatoryDocs.length === 0) return false;
  
  return mandatoryDocs.every(doc => doc.uploaded);
}

export function isStage6Eligible(tender: Tender): boolean {
  // Stage 6: All BOQ items have completed rate analysis + summary exists
  if (!tender.boq?.uploaded) return false;
  if (!tender.boq?.summaryRef) return false;
  if (tender.boq?.rateAnalysisStatus !== 'completed') return false;
  
  return true;
}

export function isStage9Eligible(tender: Tender): boolean {
  // Stage 9: All required approvals obtained
  if (!tender.approvals) return false;
  
  const requiredApprovals = [
    tender.approvals.engineering,
    tender.approvals.finance,
    tender.approvals.management
  ].filter(approval => approval !== undefined);
  
  if (requiredApprovals.length === 0) return false;
  
  return requiredApprovals.every(approval => approval?.status === 'approved');
}

/**
 * Get overall auto-eligibility status for a tender
 * Returns map of stageId -> eligible boolean
 */
export function getAutoEligibilityStatus(tender: Tender): Record<string, boolean> {
  return {
    '2_documents': isStage2Eligible(tender),
    '6_boq': isStage6Eligible(tender),
    '9_approvals': isStage9Eligible(tender)
  };
}

// Default export for convenience
export const stageService = {
  finalizeStage,
  awardTender,
  isStage2Eligible,
  isStage6Eligible,
  isStage9Eligible,
  getAutoEligibilityStatus
};
