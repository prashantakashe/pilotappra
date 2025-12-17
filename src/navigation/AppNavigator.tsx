// src/navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainScreenNew from '../screens/MainScreenNew';
import TendersMainScreen from '../screens/TendersMainScreen';
import { TenderMainScreen } from '../screens/TenderMainScreen';
import TenderDetailScreen from '../screens/TenderDetailScreen';
import { AddTenderFormScreen } from '../screens/AddTenderFormScreen';
import RateAnalysisScreen from '../screens/RateAnalysisScreen';
import { RateAnalysisList } from '../screens/RateAnalysisList';
import { RateAnalysisTenderDetail } from '../screens/RateAnalysisTenderDetail';
import { MasterRateDataScreen } from '../screens/MasterRateDataScreen';
import EngineeringScreen from '../screens/EngineeringScreen';
import EscalationBillScreen from '../screens/EscalationBillScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import ProjectViewScreen from '../screens/ProjectViewScreen';
import DailyWorkStatusScreen from '../screens/DailyWorkStatusScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DashboardScreen from '../screens/DashboardScreen';
import { MasterRateDatabaseScreen } from '../screens/MasterRateDatabaseScreen';

// Define navigation param types
export type AppStackParamList = {
  MainNew: undefined;
  Dashboard: undefined;
  Tender: undefined;
  TenderOld: undefined;
  TenderDetail: { tenderId: string };
  AddTenderForm: undefined;
  RateAnalysis: undefined;
  RateAnalysisTenderDetail: { tenderId: string; mode?: 'market' | 'ssr' };
  RateAnalysisOld: undefined;
  MasterRateData: undefined;
  MasterRateDatabase: undefined;
  Engineering: undefined;
  EscalationBill: undefined;
  Projects: undefined;
  ProjectViewScreen: { projectId: string };
  DailyWorkStatus: undefined;
  Settings: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

/**
 * AppNavigator - Main app stack after authentication
 * Includes Dashboard and all module screens with TopBar + SideBar
 */
export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="MainNew"
        component={MainScreenNew}
        options={{ title: 'Dashboard' }}
      />
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Old Dashboard' }}
      />
      <Stack.Screen
        name="Tender"
        component={TenderMainScreen}
        options={{ title: 'Tenders' }}
      />
      <Stack.Screen
        name="TenderOld"
        component={TendersMainScreen}
        options={{ title: 'Tenders (Old)' }}
      />
      <Stack.Screen
        name="TenderDetail"
        component={TenderDetailScreen}
        options={{ title: 'Tender Detail' }}
      />
      <Stack.Screen
        name="AddTenderForm"
        component={AddTenderFormScreen}
        options={{ title: 'Add New Tender' }}
      />
      <Stack.Screen
        name="RateAnalysis"
        component={RateAnalysisList}
        options={{ title: 'Rate Analysis' }}
      />
      <Stack.Screen
        name="RateAnalysisTenderDetail"
        component={RateAnalysisTenderDetail}
        options={{ title: 'Rate Analysis - Tender Detail' }}
      />
      <Stack.Screen
        name="RateAnalysisOld"
        component={RateAnalysisScreen}
        options={{ title: 'Rate Analysis (Old)' }}
      />
      <Stack.Screen
        name="MasterRateData"
        component={MasterRateDataScreen}
        options={{ title: 'Master Rate Data' }}
      />
      {/* SSR/DSR module removed - implement elsewhere */}
      <Stack.Screen
        name="MasterRateDatabase"
        component={MasterRateDatabaseScreen}
        options={{ title: 'Master Rate Database' }}
      />
      <Stack.Screen
        name="Engineering"
        component={EngineeringScreen}
        options={{ title: 'Engineering' }}
      />
      <Stack.Screen
        name="EscalationBill"
        component={EscalationBillScreen}
        options={{ title: 'Escalation Bill' }}
      />
      <Stack.Screen
        name="Projects"
        component={ProjectsScreen}
        options={{ title: 'Projects' }}
      />
      <Stack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ title: 'Reports' }}
      />
      <Stack.Screen
        name="ProjectViewScreen"
        component={ProjectViewScreen}
        options={{ title: 'Project View' }}
      />
      <Stack.Screen
        name="DailyWorkStatus"
        component={DailyWorkStatusScreen}
        options={{ title: 'Daily Work Status' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Stack.Navigator>
  );
};
