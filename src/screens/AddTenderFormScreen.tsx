// src/screens/AddTenderFormScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { useResponsive } from '../hooks/useResponsive';
import { FormInput } from '../components/FormInput';
import { FormDropdown } from '../components/FormDropdown';
import { DatePickerModal } from '../components/DatePickerModal';
import { FileUploadBox } from '../components/FileUploadBox';
import { TeamAssignmentSection } from '../components/TeamAssignmentSection';
import { tenderValidation } from '../services/tenderValidation';
import { tenderDraftService } from '../services/tenderDraftService';
import { tenderUploadsService } from '../services/tenderUploadsService';
import { tenderService } from '../services/tenderService';
import { auth } from '../services/firebase';
import type { TenderFormData, TenderDocument, WorkType, TenderSource, SubmissionMode } from '../types/tender';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
  'Andaman and Nicobar Islands', 'Dadra and Nagar Haveli and Daman and Diu', 'Lakshadweep',
];

class ScreenErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: any) { return { error }; }
  componentDidCatch(error: any, info: any) { console.error('AddTenderFormScreen boundary caught error:', error, info); }
  render() {
    if (this.state.error) {
      return (
        <View style={{ padding: 24 }}>
          <Text style={{ color: '#B91C1C', fontWeight: '700', fontSize: 16 }}>Failed to load Tender Form</Text>
          <Text style={{ marginTop: 12, color: '#1F2937' }}>{String(this.state.error)}</Text>
          <Text style={{ marginTop: 8, fontSize: 12, color: '#6B7280' }}>Check console for stack trace.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export const AddTenderFormScreen: React.FC = () => {
  console.log('[AddTenderFormScreen] mount start');
  const navigation = useNavigation();
  const [draftId] = useState(() => tenderDraftService.generateDraftId());
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<TenderDocument[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Log authentication status
  useEffect(() => {
    console.log('[AddTenderFormScreen] Auth user:', auth.currentUser?.email || 'Not logged in');
    if (!auth.currentUser) {
      Alert.alert('Authentication Required', 'Please log in to create tenders');
    }
  }, []);

  const [formData, setFormData] = useState<TenderFormData>({
    // Basic Details
    title: '',
    shortName: '',
    workType: '' as WorkType,
    tenderSource: '' as TenderSource,
    tenderSourceOther: '',
    estimatedValue: '',
    currency: 'INR',
    description: '',

    // Identification & Reference
    client: '',
    department: '',
    tenderUID: '',
    externalLink: '',

    // Location Details
    country: 'India',
    state: '',
    city: '',
    siteAddress: '',
    prebidMeetingAddress: '',

    // Key Dates
    publishDate: null,
    prebidMeetingDate: null,
    queryDeadline: null,
    documentPurchaseDeadline: null,
    submissionDeadline: null,
    technicalOpeningDate: null,
    financialOpeningDate: null,
    reminderEnabled: true,
    reminderLeadDays: 3,

    // BOQ/Financial
    boqFileUrl: '',
    boqItemCount: 0,
    tenderValue: '',
    paymentTerms: '',

    // Team
    tenderManager: '',
    engineeringLead: '',
    estimationEngineer: '',
    documentController: '',
    additionalMembers: [],

    // Workflow
    status: 'draft',
    submissionMode: 'Online' as SubmissionMode,
    internalNotes: '',
    emdAmount: '',
    // Advanced Optional
    prebidQueryInstructions: '',
    extraReminders: '',
    bidProbabilityScore: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-save draft every 10 seconds if there are changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      saveDraft();
    }, 10000);

    return () => clearTimeout(timer);
  }, [formData, hasUnsavedChanges]);

  const updateField = (field: keyof TenderFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const saveDraft = async () => {
    try {
      setIsSaving(true);
      console.log('[SaveDraft] Saving draft...', { draftId, user: auth.currentUser?.email });
      console.log('[SaveDraft] Form data keys:', Object.keys(formData));
      console.log('[SaveDraft] Documents count:', documents.length);
      
      await tenderDraftService.saveDraft(draftId, formData, documents);
      
      console.log('[SaveDraft] Draft saved successfully');
      setHasUnsavedChanges(false);
    } catch (error: any) {
      console.error('[SaveDraft] Error:', error);
      console.error('[SaveDraft] Error code:', error.code);
      console.error('[SaveDraft] Error message:', error.message);
      
      // Show user-friendly error
      if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
        Alert.alert('Permission Error', 'Unable to save draft. Please ensure you are logged in.');
      } else {
        Alert.alert('Save Error', error.message || 'Failed to save draft');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save as draft before leaving?',
        [
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
          { text: 'Save Draft', onPress: async () => { await saveDraft(); navigation.goBack(); } },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const handleSaveDraft = async () => {
    console.log('[HandleSaveDraft] Button clicked');
    await saveDraft();
    if (!isSubmitting && !isSaving) {
      Alert.alert('Success', 'Draft saved successfully (check console for details)');
    }
  };

  const handleAddFiles = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = '.pdf,.docx,.xlsx,.dwg,.jpg,.jpeg,.png';
      
      input.onchange = async (e: any) => {
        const files = Array.from(e.target.files || []) as File[];
        
        for (const file of files) {
          if (!tenderValidation.validateFileExtension(file.name)) {
            Alert.alert('Invalid File', `${file.name} has an unsupported file type`);
            continue;
          }
          
          if (!tenderValidation.validateFileSize(file.size)) {
            Alert.alert('File Too Large', `${file.name} exceeds 20MB limit`);
            continue;
          }

          try {
            setUploading(true);
            // Default category - user can change later
            const doc = await tenderUploadsService.uploadFile(
              file,
              'Other',
              false,
              true,
              draftId
            );
            setDocuments((prev) => [...prev, doc]);
          } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Upload Failed', `Failed to upload ${file.name}`);
          } finally {
            setUploading(false);
          }
        }
      };
      
      input.click();
    } else {
      Alert.alert('Info', 'File upload is available on web version');
    }
  };

  const handleRemoveFile = (docId: string) => {
    Alert.alert(
      'Remove File',
      'Are you sure you want to remove this file?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const doc = documents.find((d) => d.id === docId);
            if (doc) {
              tenderUploadsService.deleteFile(doc.fileUrl).catch(console.error);
            }
            setDocuments((prev) => prev.filter((d) => d.id !== docId));
          },
        },
      ]
    );
  };

  // Cross-platform confirm helper for warnings
  const confirmContinueWithWarnings = async (warnings: string[]): Promise<boolean> => {
    try {
      if (Platform.OS === 'web') {
        // Use native browser confirm on web (Alert with multiple buttons is limited)
        // eslint-disable-next-line no-alert
        return Promise.resolve(window.confirm(`The following warnings were found:\n\n${warnings.join('\n')}\n\nDo you want to continue anyway?`));
      }
      return await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Warning',
          warnings.join('\n'),
          [
            { text: 'Go Back', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Continue Anyway', onPress: () => resolve(true) },
          ]
        );
      });
    } catch (e) {
      console.warn('[AddTenderFormScreen] Warning confirm failed, proceeding by default');
      return true;
    }
  };

  const handleSubmit = async () => {
    // Validate all fields
    const validation = tenderValidation.validateAll(formData);
    
    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach((err) => {
        errorMap[err.field] = err.message;
      });
      setErrors(errorMap);
      
      Alert.alert(
        'Validation Error',
        `Please fix the following errors:\n${validation.errors.map((e) => `• ${e.message}`).join('\n')}`
      );
      return;
    }

    // Show warnings if any
    if (validation.warnings && validation.warnings.length > 0) {
      const proceed = await confirmContinueWithWarnings(validation.warnings);
      if (!proceed) return;
    }
    submitTender();
  };

  const submitTender = async () => {
    try {
      setIsSubmitting(true);

      console.log('[Submit] Starting tender creation...');
      console.log('[Submit] Form data:', formData);

      // Call Cloud Function to create tender
      const tenderId = await tenderService.finalizeTenderCreate({
        ...formData,
        draftId,
        documents,
      });

      console.log('[Submit] Tender created with ID:', tenderId);

      // Delete draft
      await tenderDraftService.deleteDraft(draftId);

      Alert.alert('Success', 'Tender created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate to Tender list and show newest first
            (navigation as any).replace('Tender', {
              selectedStatus: formData.status || 'all',
              highlightTenderId: tenderId
            });
          },
        },
      ]);
    } catch (error: any) {
      console.error('[Submit] Error:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Failed to create tender';
      
      if (error.code === 'functions/unauthenticated') {
        errorMessage = 'Please log in to create a tender';
      } else if (error.code === 'functions/invalid-argument') {
        errorMessage = error.message || 'Invalid data provided';
      } else if (error.message?.includes('CORS')) {
        errorMessage = 'Network error: Cannot connect to server. Please ensure you are logged in and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage, [
        { text: 'OK' },
        { text: 'View Console', onPress: () => console.log('Full error:', error) }
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check section completion
  const isBasicComplete = formData.title && formData.shortName && formData.workType && formData.tenderSource && formData.estimatedValue;
  const isDatesComplete = formData.publishDate && formData.submissionDeadline;
  const isTeamComplete = formData.tenderManager;

  const { isMobile, isTablet, isDesktop } = useResponsive();
  const columns = isDesktop ? 3 : isTablet ? 2 : 1;
  const colWidth = Platform.OS === 'web' 
    ? `${100 / columns}%` as any
    : { flex: 1 / columns };

  useEffect(() => {
    console.log('[AddTenderFormScreen] useEffect mounted');
  }, []);

  return (
    <ScreenErrorBoundary>
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>✕ Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Tender</Text>
        <View style={styles.headerRight}>
          {isSaving && <ActivityIndicator size="small" color="#1E90FF" />}
          {hasUnsavedChanges && !isSaving && (
            <Text style={styles.unsavedText}>Unsaved</Text>
          )}
        </View>
      </View>

      {/* Form Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* A. BASIC DETAILS */}
        <CollapsibleSection
          title="A. Basic Details"
          required
          completed={!!isBasicComplete}
          defaultExpanded
        >
          <View style={styles.formGrid}>
            <FormInput
              label="Tender Title (Full Name)"
              value={formData.title}
              onChangeText={(text) => updateField('title', text)}
              required
              error={errors.title}
              placeholder="e.g., Construction of 4-Lane Highway Project"
              containerStyle={[styles.formItem, { width: colWidth }]}
            />
            <FormInput
              label="Tender Short Name"
              value={formData.shortName}
              onChangeText={(text) => updateField('shortName', text)}
              required
              error={errors.shortName}
              placeholder="e.g., NH4-Highway"
              containerStyle={[styles.formItem, { width: colWidth }]}
            />
            <FormDropdown
              label="Work Type / Category"
              value={formData.workType}
              options={['Civil', 'Building', 'Sports', 'Metro', 'EPC', 'MEP', 'Net Zero', 'Other']}
              onSelect={(value) => updateField('workType', value)}
              required
              error={errors.workType}
              containerStyle={[styles.formItem, { width: colWidth }]}
            />
            <FormDropdown
              label="Tender Source"
              value={formData.tenderSource}
              options={['eTendering', 'GEM', 'PWD', 'Railways', 'Other']}
              onSelect={(value) => updateField('tenderSource', value)}
              required
              error={errors.tenderSource}
              containerStyle={[styles.formItem, { width: colWidth }]}
            />
            {formData.tenderSource === 'Other' && (
              <FormInput
                label="Specify Tender Source"
                value={formData.tenderSourceOther || ''}
                onChangeText={(text) => updateField('tenderSourceOther', text)}
                required
                error={errors.tenderSourceOther}
                containerStyle={[styles.formItem, { width: colWidth }]}
              />
            )}
            <FormInput
              label="Estimated Value (INR)"
              value={formData.estimatedValue}
              onChangeText={(text) => updateField('estimatedValue', text)}
              required
              error={errors.estimatedValue}
              keyboardType="numeric"
              placeholder="e.g., 5000000"
              containerStyle={[styles.formItem, { width: colWidth }]}
            />
            <FormDropdown
              label="Currency"
              value={formData.currency}
              options={['INR', 'USD', 'EUR', 'GBP']}
              onSelect={(value) => updateField('currency', value)}
              containerStyle={[styles.formItem, { width: colWidth }]}
            />
            <FormInput
              label="Tender Description"
              value={formData.description}
              onChangeText={(text) => updateField('description', text)}
              multiline
              placeholder="Brief description of the tender scope and requirements..."
              containerStyle={[styles.formItem, { width: columns === 1 ? '100%' : '100%' }]}
            />
          </View>
        </CollapsibleSection>

        {/* B. IDENTIFICATION & REFERENCE */}
        <CollapsibleSection title="B. Identification & Reference">
          <View style={styles.formGrid}>
            <FormInput
              label="Client / Department"
              value={formData.client}
              onChangeText={(text) => updateField('client', text)}
              error={errors.client}
              placeholder="e.g., National Highways Authority of India"
              containerStyle={[styles.formItem, { width: colWidth }]}
            />
            <FormInput
              label="Department"
              value={formData.department}
              onChangeText={(text) => updateField('department', text)}
              placeholder="e.g., Engineering Department"
              containerStyle={[styles.formItem, { width: colWidth }]}
            />
            <FormInput
              label="Tender ID (if provided by department)"
              value={formData.tenderUID}
              onChangeText={(text) => updateField('tenderUID', text)}
              placeholder="e.g., NHAI/2025/001"
              containerStyle={[styles.formItem, { width: colWidth }]}
            />
            <FormInput
              label="External Link / Tender Notice URL"
              value={formData.externalLink}
              onChangeText={(text) => updateField('externalLink', text)}
              placeholder="https://..."
              keyboardType="url"
              containerStyle={[styles.formItem, { width: columns === 1 ? '100%' : '100%' }]}
            />
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              📋 Tender No. will be auto-generated as TNR-2025-XXXX on submission
            </Text>
          </View>

        </CollapsibleSection>

        {/* C. LOCATION DETAILS */}
        <CollapsibleSection title="C. Location Details">
          <View style={styles.formGrid}>
            <FormDropdown
              label="Country"
              value={formData.country}
              options={['India', 'USA', 'UAE', 'UK', 'Other']}
              onSelect={(value) => updateField('country', value)}
              containerStyle={[styles.formItem, { width: colWidth }]}
            />
            <FormDropdown
              label="State"
              value={formData.state}
              options={INDIAN_STATES}
              onSelect={(value) => updateField('state', value)}
              placeholder="Select state"
              containerStyle={[styles.formItem, { width: colWidth }]}
            />
            <FormInput
              label="City / District"
              value={formData.city}
              onChangeText={(text) => updateField('city', text)}
              placeholder="e.g., Mumbai"
              containerStyle={[styles.formItem, { width: colWidth }]}
            />
            <FormInput
              label="Site Address"
              value={formData.siteAddress}
              onChangeText={(text) => updateField('siteAddress', text)}
              multiline
              placeholder="Full site address..."
              containerStyle={[styles.formItem, { width: columns === 1 ? '100%' : '100%' }]}
            />
            <FormInput
              label="Pre-bid Meeting Address"
              value={formData.prebidMeetingAddress}
              onChangeText={(text) => updateField('prebidMeetingAddress', text)}
              multiline
              placeholder="Meeting venue address..."
              containerStyle={[styles.formItem, { width: columns === 1 ? '100%' : '100%' }]}
            />
          </View>
        </CollapsibleSection>

        {/* D. KEY DATES */}
        <CollapsibleSection
          title="D. Key Dates"
          required
          completed={!!isDatesComplete}
        >
          <View style={styles.formGrid}>
            <DatePickerModal
              label="Tender Publish Date"
              value={formData.publishDate}
              onChange={(date) => updateField('publishDate', date)}
              required
              error={errors.publishDate}
              containerStyle={[styles.formItem, { width: colWidth }]}
            />
            <DatePickerModal
              label="Pre-bid Meeting Date"
              value={formData.prebidMeetingDate}
              onChange={(date) => updateField('prebidMeetingDate', date)}
              error={errors.prebidMeetingDate}
              minimumDate={formData.publishDate || undefined}
              containerStyle={[styles.formItem, { width: colWidth }]}
            />
            <DatePickerModal
              label="Query Submission Deadline"
              value={formData.queryDeadline}
              onChange={(date) => updateField('queryDeadline', date)}
              error={errors.queryDeadline}
              containerStyle={[styles.formItem, { width: colWidth }]}
            />
            <DatePickerModal
              label="Last Date for Document Purchase"
              value={formData.documentPurchaseDeadline}
              onChange={(date) => updateField('documentPurchaseDeadline', date)}
              error={errors.documentPurchaseDeadline}
              containerStyle={[styles.formItem, { width: colWidth }]}
            />
            <DatePickerModal
              label="Submission Deadline"
              value={formData.submissionDeadline}
              onChange={(date) => updateField('submissionDeadline', date)}
              required
              error={errors.submissionDeadline}
              minimumDate={formData.publishDate || undefined}
              containerStyle={[styles.formItem, { width: colWidth }]}
            />
            <DatePickerModal
              label="Technical Opening Date"
              value={formData.technicalOpeningDate}
              onChange={(date) => updateField('technicalOpeningDate', date)}
              minimumDate={formData.submissionDeadline || undefined}
              containerStyle={[styles.formItem, { width: colWidth }]}
            />
            <DatePickerModal
              label="Financial Opening Date"
              value={formData.financialOpeningDate}
              onChange={(date) => updateField('financialOpeningDate', date)}
              minimumDate={formData.technicalOpeningDate || formData.submissionDeadline || undefined}
              containerStyle={[styles.formItem, { width: colWidth }]}
            />
            <View style={[styles.formItem, { width: colWidth }]}>
              <Text style={styles.reminderTitle}>Reminder Settings</Text>
              <FormDropdown
                label="Lead Time for Reminders"
                value={formData.reminderLeadDays.toString()}
                options={['1', '3', '7', '14']}
                onSelect={(value) => updateField('reminderLeadDays', parseInt(value))}
              />
            </View>
          </View>
        </CollapsibleSection>

        {/* E. BOQ / FINANCIAL BASICS */}
        <CollapsibleSection title="E. BOQ / Financial Basics">
          <View style={styles.formGrid}>
            <View style={[styles.formItem, { width: '100%' }]}> 
              <TouchableOpacity style={styles.uploadBOQButton} onPress={handleAddFiles}>
                <Text style={styles.uploadBOQText}>📄 Upload BOQ File</Text>
              </TouchableOpacity>
            </View>
            <FormInput
              label="Tender Value (if different from estimated)"
              value={formData.tenderValue}
              onChangeText={(text) => updateField('tenderValue', text)}
              error={errors.tenderValue}
              keyboardType="numeric"
              placeholder="Leave blank if same as estimated value"
              containerStyle={[styles.formItem, { width: colWidth }]}
            />
            <FormInput
              label="Payment Terms"
              value={formData.paymentTerms}
              onChangeText={(text) => updateField('paymentTerms', text)}
              multiline
              placeholder="e.g., 90% on completion, 10% retention for 12 months"
              containerStyle={[styles.formItem, { width: columns === 1 ? '100%' : '100%' }]}
            />
          </View>
        </CollapsibleSection>

        {/* F. DOCUMENTS & ATTACHMENTS */}
        <CollapsibleSection title="F. Documents & Attachments">
          <FileUploadBox
            documents={documents}
            onAddFiles={handleAddFiles}
            onRemoveFile={handleRemoveFile}
            uploading={uploading}
          />
        </CollapsibleSection>

        {/* G. TEAM & PERMISSIONS */}
        <CollapsibleSection
          title="G. Team & Permissions"
          required
          completed={!!isTeamComplete}
        >
          <View style={styles.formGrid}>
            <View style={[styles.formItem, { width: '100%' }]}> 
              <TeamAssignmentSection
                tenderManager={formData.tenderManager}
                engineeringLead={formData.engineeringLead}
                estimationEngineer={formData.estimationEngineer}
                documentController={formData.documentController}
                onChangeTenderManager={(value) => updateField('tenderManager', value)}
                onChangeEngineeringLead={(value) => updateField('engineeringLead', value)}
                onChangeEstimationEngineer={(value) => updateField('estimationEngineer', value)}
                onChangeDocumentController={(value) => updateField('documentController', value)}
                errors={errors}
              />
            </View>
          </View>
        </CollapsibleSection>

        {/* H. TENDER WORKFLOW & STATUS */}
        <CollapsibleSection title="H. Tender Workflow & Status">
          <View style={styles.formGrid}>
            <FormDropdown
              label="Initial Status"
              value={formData.status}
              options={['draft', 'active', 'to_submit']}
              onSelect={(value) => updateField('status', value as any)}
              containerStyle={[styles.formItem, { width: colWidth }]}
            />
            <FormDropdown
              label="Submission Mode"
              value={formData.submissionMode}
              options={['Online', 'Physical', 'Both']}
              onSelect={(value) => updateField('submissionMode', value as SubmissionMode)}
              containerStyle={[styles.formItem, { width: colWidth }]}
            />
            <FormInput
              label="EMD / Bid Bond Amount (Optional)"
              value={formData.emdAmount}
              onChangeText={(text) => updateField('emdAmount', text)}
              error={errors.emdAmount}
              keyboardType="numeric"
              placeholder="e.g., 50000"
              containerStyle={[styles.formItem, { width: colWidth }]}
            />
            <FormInput
              label="Internal Notes (Private)"
              value={formData.internalNotes}
              onChangeText={(text) => updateField('internalNotes', text)}
              multiline
              placeholder="Internal notes visible only to team members..."
              containerStyle={[styles.formItem, { width: columns === 1 ? '100%' : '100%' }]}
            />
          </View>
        </CollapsibleSection>

        {/* I. OPTIONAL ADVANCED */}
        <CollapsibleSection title="I. Optional Advanced">
          <View style={styles.formGrid}>
            <FormInput
              label="Pre-bid Query Submission Instructions"
              value={formData.prebidQueryInstructions || ''}
              onChangeText={(text) => updateField('prebidQueryInstructions', text)}
              multiline
              placeholder="Instructions for submitting pre-bid queries (emails, portal steps, etc.)"
              containerStyle={[styles.formItem, { width: columns === 1 ? '100%' : '100%' }]}
            />
            <FormInput
              label="Extra Reminder Notes"
              value={formData.extraReminders || ''}
              onChangeText={(text) => updateField('extraReminders', text)}
              multiline
              placeholder="Any additional reminders (site visit, security clearance, etc.)"
              containerStyle={[styles.formItem, { width: columns === 1 ? '100%' : '100%' }]}
            />
            <View style={[styles.formItem, { width: '100%' }]}> 
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>🤖 Bid Probability Score (AI) will appear here in future releases.</Text>
              </View>
            </View>
          </View>
        </CollapsibleSection>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleSaveDraft}
            disabled={isSaving || isSubmitting}
          >
            <Text style={styles.buttonSecondaryText}>Save Draft</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleSubmit}
            disabled={isSaving || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonPrimaryText}>Submit & Create Tender</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
    </ScreenErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
    justifyContent: 'flex-end',
  },
  unsavedText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#1E40AF',
  },
  reminderSection: {
    marginTop: 8,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  uploadBOQButton: {
    borderWidth: 1,
    borderColor: '#1E90FF',
    borderRadius: 6,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    marginBottom: 16,
  },
  uploadBOQText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E90FF',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 24,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  formItem: {
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  buttonSecondary: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 12,
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  buttonPrimary: {
    backgroundColor: '#1E90FF',
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
