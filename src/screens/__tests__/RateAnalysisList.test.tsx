// src/screens/__tests__/RateAnalysisList.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RateAnalysisList } from '../RateAnalysisList';
import { tenderService } from '../../services/tenderService';
import type { Tender } from '../../types/tender';

// Mock dependencies
jest.mock('../../services/tenderService');
jest.mock('../../hooks/useResponsive', () => ({
  useResponsive: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true
  })
}));
jest.mock('../../services/firebase', () => ({
  auth: {
    currentUser: {
      displayName: 'Test User',
      email: 'test@example.com'
    },
    signOut: jest.fn()
  }
}));

describe('RateAnalysisList', () => {
  const mockTenders: Tender[] = [
    {
      tenderId: 'T001',
      tenderNo: 'TENDER-2024-001',
      title: 'Building Construction Project',
      client: 'State PWD',
      submissionDeadline: new Date('2024-12-31'),
      estimatedValue: 5000000,
      currency: 'INR',
      status: 'active',
      boqItemCount: 150,
      membersMap: {},
      rateAnalysisAllowedRoles: []
    },
    {
      tenderId: 'T002',
      tenderNo: 'TENDER-2024-002',
      title: 'Road Widening Project',
      client: 'City Corporation',
      submissionDeadline: new Date('2024-11-30'),
      estimatedValue: 3000000,
      currency: 'INR',
      status: 'upcoming',
      boqItemCount: 80,
      membersMap: {},
      rateAnalysisAllowedRoles: []
    }
  ];

  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock subscribeTenders to return tenders immediately
    (tenderService.subscribeTenders as jest.Mock).mockImplementation((callback) => {
      callback(mockTenders);
      return jest.fn(); // Return unsubscribe function
    });
  });

  it('renders loading state initially', () => {
    const { getByText } = render(
      <RateAnalysisList navigation={mockNavigation} />
    );
    
    // Should show loading indicator initially
    expect(getByText('Loading tenders...')).toBeTruthy();
  });

  it('renders list of tender cards after loading', async () => {
    const { getByText } = render(
      <RateAnalysisList navigation={mockNavigation} />
    );
    
    await waitFor(() => {
      expect(getByText('Building Construction Project')).toBeTruthy();
      expect(getByText('Road Widening Project')).toBeTruthy();
    });
  });

  it('renders empty state when no tenders exist', async () => {
    (tenderService.subscribeTenders as jest.Mock).mockImplementation((callback) => {
      callback([]);
      return jest.fn();
    });

    const { getByText } = render(
      <RateAnalysisList navigation={mockNavigation} />
    );
    
    await waitFor(() => {
      expect(getByText('No Tenders Available')).toBeTruthy();
      expect(getByText(/Create a new tender/)).toBeTruthy();
    });
  });

  it('navigates to tender detail when card is clicked', async () => {
    const { getByText } = render(
      <RateAnalysisList navigation={mockNavigation} />
    );
    
    await waitFor(() => {
      expect(getByText('Building Construction Project')).toBeTruthy();
    });

    // Find and click a tender card
    const tenderCard = getByText('Building Construction Project');
    fireEvent.press(tenderCard);
    
    // Should navigate to detail screen with tenderId
    expect(mockNavigation.navigate).toHaveBeenCalledWith(
      'RateAnalysisTenderDetail',
      { tenderId: 'T001' }
    );
  });

  it('navigates to AddTenderForm when Create New Tender is clicked', async () => {
    (tenderService.subscribeTenders as jest.Mock).mockImplementation((callback) => {
      callback([]);
      return jest.fn();
    });

    const { getByText } = render(
      <RateAnalysisList navigation={mockNavigation} />
    );
    
    await waitFor(() => {
      expect(getByText('+ Create New Tender')).toBeTruthy();
    });

    const createButton = getByText('+ Create New Tender');
    fireEvent.press(createButton);
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('AddTenderForm');
  });

  it('subscribes to tenders on mount and unsubscribes on unmount', () => {
    const mockUnsubscribe = jest.fn();
    (tenderService.subscribeTenders as jest.Mock).mockReturnValue(mockUnsubscribe);

    const { unmount } = render(
      <RateAnalysisList navigation={mockNavigation} />
    );
    
    expect(tenderService.subscribeTenders).toHaveBeenCalledWith(
      expect.any(Function),
      {
        status: undefined,
        sortField: 'submissionDeadline',
        sortOrder: 'asc'
      }
    );

    unmount();
    
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
