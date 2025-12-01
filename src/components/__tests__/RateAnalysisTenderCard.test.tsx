// src/components/__tests__/RateAnalysisTenderCard.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RateAnalysisTenderCard } from '../RateAnalysisTenderCard';
import type { Tender } from '../../types/tender';

describe('RateAnalysisTenderCard', () => {
  const mockTender: Tender = {
    tenderId: 'T001',
    tenderNo: 'TENDER-2024-001',
    title: 'Construction of Multi-Story Building',
    client: 'State PWD',
    department: 'Buildings Department',
    submissionDeadline: new Date('2024-12-31'),
    estimatedValue: 5000000,
    currency: 'INR',
    status: 'active',
    boqItemCount: 150,
    membersMap: {},
    rateAnalysisAllowedRoles: []
  };

  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('renders tender ID correctly', () => {
    const { getByText } = render(
      <RateAnalysisTenderCard tender={mockTender} onPress={mockOnPress} />
    );
    
    expect(getByText(/TENDER-2024-001/)).toBeTruthy();
  });

  it('renders tender title correctly', () => {
    const { getByText } = render(
      <RateAnalysisTenderCard tender={mockTender} onPress={mockOnPress} />
    );
    
    expect(getByText('Construction of Multi-Story Building')).toBeTruthy();
  });

  it('renders client and department', () => {
    const { getByText } = render(
      <RateAnalysisTenderCard tender={mockTender} onPress={mockOnPress} />
    );
    
    expect(getByText(/State PWD/)).toBeTruthy();
    expect(getByText(/Buildings Department/)).toBeTruthy();
  });

  it('renders estimated value formatted', () => {
    const { getByText } = render(
      <RateAnalysisTenderCard tender={mockTender} onPress={mockOnPress} />
    );
    
    // Should format as ₹50.00 L (5 million = 50 lakhs)
    expect(getByText(/₹50.00 L/)).toBeTruthy();
  });

  it('renders status badge with correct text', () => {
    const { getByText } = render(
      <RateAnalysisTenderCard tender={mockTender} onPress={mockOnPress} />
    );
    
    expect(getByText('Active')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const { getByA11yRole } = render(
      <RateAnalysisTenderCard tender={mockTender} onPress={mockOnPress} />
    );
    
    const card = getByA11yRole('button');
    fireEvent.press(card);
    
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('calls onPress when Open button is pressed', () => {
    const { getByText } = render(
      <RateAnalysisTenderCard tender={mockTender} onPress={mockOnPress} />
    );
    
    const openButton = getByText('Open →');
    fireEvent.press(openButton);
    
    expect(mockOnPress).toHaveBeenCalled();
  });

  it('shows progress indicator when boqItemCount exists', () => {
    const { getByText } = render(
      <RateAnalysisTenderCard tender={mockTender} onPress={mockOnPress} />
    );
    
    // Should show itemsCompleted/totalItems format
    expect(getByText(/150\/150 items/)).toBeTruthy();
  });

  it('renders with urgent deadline styling (≤3 days)', () => {
    const urgentTender = {
      ...mockTender,
      submissionDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
    };
    
    const { getByText } = render(
      <RateAnalysisTenderCard tender={urgentTender} onPress={mockOnPress} />
    );
    
    expect(getByText(/2 days left/)).toBeTruthy();
  });
});
