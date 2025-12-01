// src/types/escalation.ts

export type EscalationFormula = 
  | 'CPWD_75_25' 
  | 'NHAI_85_15' 
  | 'IEEMA' 
  | 'PWD_MAHARASHTRA' 
  | 'CUSTOM';

export interface EscalationMaster {
  id: string;
  contractName: string;
  agreementNo: string;
  workOrderNo: string;
  workOrderDate: string; // ISO date string
  baseDate: string; // ISO date string
  contractAmount: number;
  fixedPortion: number;
  starCement: number;
  starSteel: number;
  formula: EscalationFormula;
  weightages: {
    labour: number;
    others: number;
    pol: number;
    cement: number;
    steel: number;
  };
  uploadedFiles: UploadedFile[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
}

export interface PriceIndex {
  id: string;
  month: string; // YYYY-MM format
  labour: number;
  pol: number;
  other: number;
  steel: number;
  cement: number;
  structural: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EscalationBill {
  id: string;
  billNo: string;
  raBillReference: string;
  billPeriod: string; // YYYY-MM format
  masterId: string;
  baseMonth: string;
  currentMonth: string;
  
  // Base and Current Indices
  indices: {
    labour: { base: number; current: number; increase: number };
    pol: { base: number; current: number; increase: number };
    other: { base: number; current: number; increase: number };
    steel: { base: number; current: number; increase: number };
    cement: { base: number; current: number; increase: number };
    structural: { base: number; current: number; increase: number };
  };
  
  // Calculations
  grossWorkDone: number;
  fixedPortion: number;
  fixedAmount: number;
  cementAmount: number;
  steelAmount: number;
  eligibleAmount: number;
  
  // Escalations by component
  escalations: {
    labour: number;
    pol: number;
    other: number;
    cement: number;
    steel: number;
    total: number;
  };
  
  // Component Details
  components: {
    labour?: ComponentCalculation;
    pol?: ComponentCalculation;
    other?: ComponentCalculation;
    cement?: ComponentCalculation;
    steel?: ComponentCalculation;
  };
  
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  supportingDocs: UploadedFile[];
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface ComponentCalculation {
  componentName: string;
  baseIndex: number;
  currentIndex: number;
  percentIncrease: number;
  weightage: number;
  quantityUsed?: number;
  baseRate?: number;
  currentRate?: number;
  escalationAmount: number;
}

export interface EscalationHistory {
  billId: string;
  billNo: string;
  raBillReference: string;
  period: string;
  amount: number;
  status: string;
  createdAt: Date;
}
