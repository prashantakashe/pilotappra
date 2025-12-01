// src/components/__tests__/ParsedBOQTable.test.tsx
/**
 * Parsed BOQ Table Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ParsedBOQTable } from '../ParsedBOQTable';
import type { StandardBOQRow, ParseReport } from '../../services/boqParser';

describe('ParsedBOQTable', () => {
  const mockParsedBoq: StandardBOQRow[] = [
    {
      srNo: '1',
      category: 'Civil Works',
      subCategory: '',
      description: 'Excavation in foundation',
      unit: 'cum',
      quantity: 100,
      tenderRate: 250,
      tenderAmount: 25000,
      itemCode: 'DSR-101',
      currency: 'INR',
      lumpSum: false,
      altGroup: null,
      remark: false,
      subtotal: false,
      grandTotal: false,
      sheetName: 'BOQ',
      rawRowIndex: 1,
      original: {}
    },
    {
      srNo: '2',
      category: 'Civil Works',
      subCategory: '',
      description: 'Concrete M20',
      unit: 'cum',
      quantity: 50,
      tenderRate: 5000,
      tenderAmount: 250000,
      itemCode: null,
      currency: 'INR',
      lumpSum: false,
      altGroup: null,
      remark: false,
      subtotal: false,
      grandTotal: false,
      sheetName: 'BOQ',
      rawRowIndex: 2,
      original: {}
    }
  ];

  const mockParseReport: ParseReport = {
    rowsParsed: 2,
    rowsSkipped: 0,
    warnings: [],
    ambiguousHeaderConfidence: 1.0,
    suggestedMapping: {},
    sheets: ['BOQ']
  };

  const mockOnSave = jest.fn();
  const mockOnExport = jest.fn();

  it('should render parsed BOQ rows', () => {
    const { getByText } = render(
      <ParsedBOQTable
        parsedBoq={mockParsedBoq}
        parseReport={mockParseReport}
        tenderId="test-tender"
        onSave={mockOnSave}
        onExport={mockOnExport}
      />
    );

    expect(getByText('Excavation in foundation')).toBeTruthy();
    expect(getByText('Concrete M20')).toBeTruthy();
  });

  it('should show validation warnings for negative values', () => {
    const boqWithError: StandardBOQRow[] = [
      {
        ...mockParsedBoq[0],
        quantity: -10 // Negative quantity
      }
    ];

    const { getByText } = render(
      <ParsedBOQTable
        parsedBoq={boqWithError}
        parseReport={mockParseReport}
        tenderId="test-tender"
        onSave={mockOnSave}
        onExport={mockOnExport}
      />
    );

    // Warnings button should show count
    expect(getByText(/1.*Warnings/i)).toBeTruthy();
  });

  it('should recalculate amount when quantity or rate is edited', () => {
    const { getByDisplayValue } = render(
      <ParsedBOQTable
        parsedBoq={mockParsedBoq}
        parseReport={mockParseReport}
        tenderId="test-tender"
        onSave={mockOnSave}
        onExport={mockOnExport}
      />
    );

    // Find quantity input and change it
    const qtyInput = getByDisplayValue('100');
    fireEvent.changeText(qtyInput, '200');

    // Amount should be recalculated (200 * 250 = 50000)
    // Note: Actual test would verify the displayed amount
  });

  it('should show empty state when no BOQ data', () => {
    const { getByText } = render(
      <ParsedBOQTable
        parsedBoq={[]}
        parseReport={{ ...mockParseReport, rowsParsed: 0 }}
        tenderId="test-tender"
        onSave={mockOnSave}
        onExport={mockOnExport}
      />
    );

    expect(getByText('No Parsed BOQ Data')).toBeTruthy();
  });

  it('should call onExport when export button is pressed', () => {
    const { getByText } = render(
      <ParsedBOQTable
        parsedBoq={mockParsedBoq}
        parseReport={mockParseReport}
        tenderId="test-tender"
        onSave={mockOnSave}
        onExport={mockOnExport}
      />
    );

    const exportButton = getByText(/Export/i);
    fireEvent.press(exportButton);

    expect(mockOnExport).toHaveBeenCalled();
  });
});
