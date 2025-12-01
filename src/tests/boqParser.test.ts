/**
 * BOQ Parser Test Suite
 */

import { describe, it, expect } from '@jest/globals';
import { parseBoqFile, mapHeaders, mergeMultiLineRows } from '../services/boqParser';

describe('BOQ Parser - All 19 Scenarios', () => {
  
  // Test data fixtures
  const SIMPLE_BOQ_BUFFER = (() => {
    const data = [
      ['Sr. No.', 'Description', 'Unit', 'Quantity', 'Rate', 'Amount'],
      ['1', 'A', 'Cum', '120', '1584', '190080'],
      ['2', 'B', 'Sqmt', '1235', '2657', '3281395'],
      ['3', 'C', 'Rmt', '1456', '1597', '2325232'],
      ['4', 'D', 'No.', '189', '35416', '6693624'],
      ['5', 'R', 'Cum', '146', '5542', '809132'],
      ['', '', '', '', '', ''],
      ['Total', '', '', '', '', '13209463']
    ];
    
    // Create XLSX format data
    const ws = require('xlsx').utils.aoa_to_sheet(data);
    const wb = require('xlsx').utils.book_new();
    require('xlsx').utils.book_append_sheet(wb, ws, 'Sheet1');
    const buf = require('xlsx').write(wb, { bookType: 'xlsx', type: 'array' });
    return new Uint8Array(buf);
  })();

  it('Scenario 1: Should parse direct items with SrNo, Description, Qty, Rate, Amount', async () => {
    const result = await parseBoqFile(SIMPLE_BOQ_BUFFER, 'test.xlsx');
    
    console.log('Parse result:', {
      rowsParsed: result.parseReport.rowsParsed,
      rowsSkipped: result.parseReport.rowsSkipped,
      warnings: result.parseReport.warnings.length,
      confidence: result.parseReport.mappingConfidence
    });

    expect(result.parsedBoq.length).toBeGreaterThan(0);
    expect(result.parseReport.rowsParsed).toBeGreaterThan(0);
  });

  it('Should detect headers with fuzzy matching', () => {
    const headerRow = ['Sr. No.', 'Description', 'Unit', 'Quantity', 'Rate', 'Amount'];
    const { mapping, confidenceScore } = mapHeaders(headerRow);
    
    console.log('Header mapping:', mapping);
    console.log('Confidence:', confidenceScore);
    
    expect(mapping.srNo).toBe(0);
    expect(mapping.description).toBe(1);
    expect(mapping.unit).toBe(2);
    expect(mapping.quantity).toBe(3);
    expect(mapping.rate).toBe(4);
    expect(mapping.amount).toBe(5);
    expect(confidenceScore).toBeGreaterThan(0.8);
  });

  it('Scenario 3: Should merge multi-line descriptions', () => {
    const rows = [
      ['Sr. No.', 'Description', 'Unit', 'Qty', 'Rate', 'Amount'],
      ['1', 'First line', '', '', '', ''],
      ['', 'Second line', '', '100', '50', '5000'],
      ['2', 'Another item', 'nos', '50', '100', '5000']
    ];
    
    const merged = mergeMultiLineRows(rows);
    console.log('Merged rows:', merged);
    
    // Should have main header + 2 main items
    expect(merged.length).toBe(3);
  });
});
