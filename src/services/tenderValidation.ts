// src/services/tenderValidation.ts
import type { TenderFormData, ValidationResult, ValidationError } from '../types/tender';

export const tenderValidation = {
  validateBasicDetails(data: Partial<TenderFormData>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data.title?.trim()) {
      errors.push({ field: 'title', message: 'Tender title is required' });
    }

    if (!data.shortName?.trim()) {
      errors.push({ field: 'shortName', message: 'Short name is required' });
    }

    if (!data.workType) {
      errors.push({ field: 'workType', message: 'Work type is required' });
    }

    if (!data.tenderSource) {
      errors.push({ field: 'tenderSource', message: 'Tender source is required' });
    }

    if (data.tenderSource === 'Other' && !data.tenderSourceOther?.trim()) {
      errors.push({ field: 'tenderSourceOther', message: 'Please specify tender source' });
    }

    if (!data.estimatedValue?.trim()) {
      errors.push({ field: 'estimatedValue', message: 'Estimated value is required' });
    } else {
      const value = parseFloat(data.estimatedValue);
      if (isNaN(value) || value <= 0) {
        errors.push({ field: 'estimatedValue', message: 'Enter a valid positive amount' });
      }
    }

    return errors;
  },

  validateKeyDates(data: Partial<TenderFormData>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data.publishDate) {
      errors.push({ field: 'publishDate', message: 'Publish date is required' });
    }

    if (!data.submissionDeadline) {
      errors.push({ field: 'submissionDeadline', message: 'Submission deadline is required' });
    }

    // Date logic validations
    if (data.publishDate && data.submissionDeadline) {
      if (data.submissionDeadline <= data.publishDate) {
        errors.push({
          field: 'submissionDeadline',
          message: 'Submission deadline must be after publish date',
        });
      }
    }

    if (data.queryDeadline && data.submissionDeadline) {
      if (data.queryDeadline >= data.submissionDeadline) {
        errors.push({
          field: 'queryDeadline',
          message: 'Query deadline must be before submission deadline',
        });
      }
    }

    if (data.prebidMeetingDate && data.publishDate && data.submissionDeadline) {
      if (
        data.prebidMeetingDate < data.publishDate ||
        data.prebidMeetingDate > data.submissionDeadline
      ) {
        errors.push({
          field: 'prebidMeetingDate',
          message: 'Pre-bid meeting must be between publish date and submission deadline',
        });
      }
    }

    if (data.documentPurchaseDeadline && data.submissionDeadline) {
      if (data.documentPurchaseDeadline > data.submissionDeadline) {
        errors.push({
          field: 'documentPurchaseDeadline',
          message: 'Document purchase deadline must be before submission deadline',
        });
      }
    }

    return errors;
  },

  validateTeam(data: Partial<TenderFormData>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data.tenderManager?.trim()) {
      errors.push({ field: 'tenderManager', message: 'Tender manager is required' });
    }

    return errors;
  },

  validateNumericField(value: string, fieldName: string): ValidationError | null {
    if (!value.trim()) return null; // Optional field
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      return { field: fieldName, message: 'Enter a valid positive number' };
    }
    return null;
  },

  validateAll(data: Partial<TenderFormData>): ValidationResult {
    const allErrors: ValidationError[] = [
      ...this.validateBasicDetails(data),
      ...this.validateKeyDates(data),
      ...this.validateTeam(data),
    ];

    // Validate optional numeric fields
    if (data.tenderValue) {
      const error = this.validateNumericField(data.tenderValue, 'tenderValue');
      if (error) allErrors.push(error);
    }

    if (data.emdAmount) {
      const error = this.validateNumericField(data.emdAmount, 'emdAmount');
      if (error) allErrors.push(error);
    }

    // Generate warnings for optional but recommended fields
    const warnings: string[] = [];
    if (!data.client?.trim()) {
      warnings.push('Client/Department not specified');
    }
    if (!data.state?.trim()) {
      warnings.push('State not specified');
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  },

  checkDuplicateWarning(
    title: string,
    client: string,
    existingTenders: Array<{ title: string; client?: string }>
  ): string | null {
    const normalizedTitle = title.toLowerCase().trim();
    const normalizedClient = client.toLowerCase().trim();

    for (const tender of existingTenders) {
      const existingTitle = tender.title?.toLowerCase().trim() || '';
      const existingClient = tender.client?.toLowerCase().trim() || '';

      if (
        existingTitle === normalizedTitle &&
        existingClient === normalizedClient &&
        normalizedClient !== ''
      ) {
        return 'A tender with similar title and client already exists';
      }
    }

    return null;
  },

  validateFileExtension(fileName: string): boolean {
    const allowedExtensions = ['.pdf', '.docx', '.xlsx', '.dwg', '.jpg', '.jpeg', '.png'];
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return allowedExtensions.includes(ext);
  },

  validateFileSize(sizeInBytes: number): boolean {
    const maxSizeInBytes = 20 * 1024 * 1024; // 20 MB
    return sizeInBytes <= maxSizeInBytes;
  },
};
