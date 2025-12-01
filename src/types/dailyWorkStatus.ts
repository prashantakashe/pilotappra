// src/types/dailyWorkStatus.ts
/**
 * Types for Daily Work Status module
 */

// Project master data
export interface DWSProject {
  id: string;
  name: string;
  client: string;
  projectManager: string;
  location: string;
  timeline: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Personnel assigned to projects
export interface DWSPersonnel {
  id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Final status options
export interface DWSStatus {
  id: string;
  name: string;
  color?: string;
  order?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Status update log entry
export interface DWSStatusUpdate {
  id: string;
  note: string;
  timestamp: Date;
  updatedBy: string;
}

// Sub-activity within a daily entry
export interface DWSSubActivity {
  id: string;
  description: string;
  assignedTo: string;
  hours: number;
  status: string;
  statusUpdates: DWSStatusUpdate[];
}

// Main daily entry
export interface DWSDailyEntry {
  id: string;
  projectId: string;
  projectName: string;
  date: Date;
  dateTime: string;
  mainActivity: string;
  assignedTo: string;
  hours: number;
  finalStatus: string;
  statusUpdates: DWSStatusUpdate[];
  subActivities: DWSSubActivity[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Report filter options
export interface DWSReportFilter {
  reportType: 'daily' | 'project' | 'user' | 'status';
  projectId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}

// Dashboard metrics
export interface DWSDashboardMetrics {
  todayEntries: number;
  activeProjects: number;
  totalPersonnel: number;
  pendingApprovals: number;
  completedActivities: number;
  ongoingActivities: number;
  notStartedActivities: number;
}

// Category options for projects
export const PROJECT_CATEGORIES = [
  { value: 'development', label: 'Development' },
  { value: 'training', label: 'Training' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'construction', label: 'Construction' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other', label: 'Other' }
];

// Default status options
export const DEFAULT_STATUSES = [
  { name: 'Not Started', color: '#dc3545' },
  { name: 'Ongoing', color: '#ffc107' },
  { name: 'Completed', color: '#28a745' },
  { name: 'On Hold', color: '#6c757d' }
];
