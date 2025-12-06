// src/constants/sidebarMenus.ts
/**
 * Module-specific sidebar menu configurations
 * Each module can have its own set of navigation items
 */

import { MenuItem } from '../components/SideBarNew';

// Main navigation (used on Dashboard, Profile, Settings)
export const MAIN_NAV: MenuItem[] = [
  { key: 'Dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'Tender', label: 'Tender', icon: '📋' },
  { key: 'RateAnalysis', label: 'Rate Analysis', icon: '🧮' },
  { key: 'Engineering', label: 'Engineering', icon: '⚙️' },
  { key: 'Projects', label: 'Projects', icon: '🏗️' },
  { key: 'DailyWorkStatus', label: 'Daily Work Status', icon: '📅' },
  { key: 'Settings', label: 'Settings', icon: '⚙️' },
];

// Tender module sub-navigation
// Tender module navigation (only include existing routes)
export const TENDER_MODULE_NAV: MenuItem[] = [
  { key: 'Tender', label: 'All Tenders', icon: '📋' },
  { key: 'AddTenderForm', label: 'Create Tender', icon: '➕' },
  { key: 'Dashboard', label: '← Back to Main', icon: '🏠' },
];

// Rate Analysis module sub-navigation
export const RATE_ANALYSIS_NAV: MenuItem[] = [
  { key: 'RateAnalysis', label: 'All Tenders', icon: '🧮' },
  { key: 'MasterRateData', label: 'Master Rate Data', icon: '📊' },
  { key: 'SSRDSR', label: 'SSR/DSR', icon: '📋' },
  { key: 'Dashboard', label: '← Back to Main', icon: '🏠' },
];

// Tender Detail sub-navigation
// Detail nav arrays kept for future in-screen tab rendering (not used for routing)
export const TENDER_DETAIL_NAV: MenuItem[] = [];

// Rate Analysis Tender Detail sub-navigation
export const RATE_ANALYSIS_DETAIL_NAV: MenuItem[] = [];

// Engineering module sub-navigation
export const ENGINEERING_NAV: MenuItem[] = [
  { key: 'Engineering', label: 'Engineering Home', icon: '⚙️' },
  { key: 'EscalationBill', label: 'Escalation Bill', icon: '📈' },
  { key: 'Dashboard', label: '← Back to Main', icon: '🏠' },
];

// Projects module sub-navigation
export const PROJECTS_NAV: MenuItem[] = [
  { key: 'Projects', label: 'Projects Home', icon: '🏗️' },
  { key: 'Dashboard', label: '← Back to Main', icon: '🏠' },
];

// Daily Work Status module sub-navigation
export const DAILY_WORK_STATUS_NAV: MenuItem[] = [
  { key: 'DWSDashboard', label: 'Dashboard', icon: '📊' },
  { key: 'DWSDaily', label: 'Daily Entry', icon: '📝' },
  { key: 'DWSMaster', label: 'Master Data', icon: '📁' }, // Admin only
  { key: 'DWSReport', label: 'Report', icon: '📊' },
  { key: 'DWSNotifications', label: 'Notifications', icon: '🔔' },
  { key: 'DWSReminders', label: 'Reminder Settings', icon: '⏰' }, // Admin only
  { key: 'DWSUsers', label: 'User Management', icon: '👥' }, // Admin only
  { key: 'Dashboard', label: '← Back to Main', icon: '🏠' },
];

/**
 * Filter DWS menu items based on user role
 */
export const getFilteredDWSNav = (userRole: 'Super Admin' | 'Admin' | 'Manager' | 'Engineer' | null): MenuItem[] => {
  // Default to Admin if no role is assigned (for backward compatibility)
  if (!userRole || userRole === 'Super Admin' || userRole === 'Admin') {
    return DAILY_WORK_STATUS_NAV; // Super Admin and Admin see everything
  }
  
  if (userRole === 'Manager') {
    // Manager sees: Dashboard, Daily Entry, Report
    return DAILY_WORK_STATUS_NAV.filter(item => 
      !['DWSMaster', 'DWSReminders', 'DWSUsers'].includes(item.key)
    );
  }
  
  // Engineer sees: Dashboard, Daily Entry
  return DAILY_WORK_STATUS_NAV.filter(item => 
    ['DWSDashboard', 'DWSDaily', 'Dashboard'].includes(item.key)
  );
};


