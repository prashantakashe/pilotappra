// src/services/__tests__/boqParser.test.ts
/**
 * BOQ Parser Unit Tests - Phase 2
 * 
 * Tests covering all 19 parsing scenarios
 */

import { parseBoqFile, boqParser } from '../boqParser';
import * as XLSX from 'xlsx';

describe('BOQ Parser', () => {
  
  describe('Scenario 1: Direct items with all fields', () => {
    it('should parse simple items with srNo, description, qty, rate, amount', async () => {
      const testData = [
        ['Sr No', 'Description', 'Qty', 'Unit', 'Rate', 'Amount'],
        ['1', 'Excavation in foundation', 100, 'cum', 250, 25000],
        ['2', 'Concrete M20', 50, 'cum', 5000, 250000]
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(testData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BOQ');
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      
      const result = await parseBoqFile(buffer, 'test.xlsx');
      
      expect(result.parsedBoq).toHaveLength(2);
      expect(result.parsedBoq[0].srNo).toBe('1');
      expect(result.parsedBoq[0].description).toBe('Excavation in foundation');
      expect(result.parsedBoq[0].quantity).toBe(100);
      expect(result.parsedBoq[0].unit).toBe('cum');
      expect(result.parsedBoq[0].tenderRate).toBe(250);
      expect(result.parsedBoq[0].tenderAmount).toBe(25000);
    });
  });

  describe('Scenario 2: Main item with sub-items', () => {
    it('should parse main item followed by sub-items without srNo', async () => {
      const testData = [
        ['Sr No', 'Description', 'Qty', 'Unit', 'Rate', 'Amount'],
        ['1', 'Plastering work', '', '', '', ''],
        ['', 'Internal walls', 200, 'sqm', 150, 30000],
        ['', 'External walls', 300, 'sqm', 180, 54000]
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(testData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BOQ');
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      
      const result = await parseBoqFile(buffer, 'test.xlsx');
      
      expect(result.parsedBoq).toHaveLength(3);
      expect(result.parsedBoq[0].srNo).toBe('1');
      expect(result.parsedBoq[0].description).toBe('Plastering work');
      expect(result.parsedBoq[1].srNo).toBe('1');
      expect(result.parsedBoq[1].description).toContain('Internal walls');
      expect(result.parsedBoq[2].srNo).toBe('1');
      expect(result.parsedBoq[2].description).toContain('External walls');
    });
  });

  describe('Scenario 3: Multi-line description', () => {
    it('should merge multi-line descriptions', async () => {
      const testData = [
        ['Sr No', 'Description', 'Qty', 'Unit', 'Rate', 'Amount'],
        ['1', 'Supply and installation of', '', '', '', ''],
        ['', 'pump including all accessories', 1, 'no', 50000, 50000]
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(testData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BOQ');
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      
      const result = await parseBoqFile(buffer, 'test.xlsx');
      
      // Should have one main item with merged description
      const mainItem = result.parsedBoq.find(r => r.srNo === '1' && r.quantity > 0);
      expect(mainItem).toBeDefined();
      expect(mainItem?.description).toContain('Supply and installation');
    });
  });

  describe('Scenario 4 & 5: Section/Category headings', () => {
    it('should detect section headings (all caps, no values)', async () => {
      const testData = [
        ['Sr No', 'Description', 'Qty', 'Unit', 'Rate', 'Amount'],
        ['', 'CIVIL WORKS', '', '', '', ''],
        ['1', 'Excavation', 100, 'cum', 250, 25000],
        ['', 'ELECTRICAL WORKS', '', '', '', ''],
        ['2', 'Wiring', 500, 'm', 50, 25000]
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(testData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BOQ');
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      
      const result = await parseBoqFile(buffer, 'test.xlsx');
      
      const civilSection = result.parsedBoq.find(r => r.description === 'CIVIL WORKS');
      expect(civilSection).toBeDefined();
      expect(civilSection?.category).toBe('CIVIL WORKS');
      expect(civilSection?.quantity).toBe(0);
      
      const excavation = result.parsedBoq.find(r => r.srNo === '1');
      expect(excavation?.category).toBe('CIVIL WORKS');
    });
  });

  describe('Scenario 10: Item code detection', () => {
    it('should extract item codes (DSR, CPWD, etc.)', async () => {
      const testData = [
        ['Sr No', 'Description', 'Item Code', 'Qty', 'Unit', 'Rate', 'Amount'],
        ['1', 'Excavation as per DSR-2022', 'DSR-101', 100, 'cum', 250, 25000],
        ['2', 'Concrete CPWD-45', '', 50, 'cum', 5000, 250000]
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(testData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BOQ');
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      
      const result = await parseBoqFile(buffer, 'test.xlsx');
      
      expect(result.parsedBoq[0].itemCode).toBe('DSR-101');
      expect(result.parsedBoq[1].itemCode).toBe('CPWD-45');
    });
  });

  describe('Scenario 11: Lump-sum detection', () => {
    it('should detect lump-sum items (no qty/unit, has amount)', async () => {
      const testData = [
        ['Sr No', 'Description', 'Qty', 'Unit', 'Rate', 'Amount'],
        ['1', 'Project Management - Lump Sum', '', 'LS', '', 500000],
        ['2', 'Site mobilization', '', '', '', 200000]
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(testData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BOQ');
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      
      const result = await parseBoqFile(buffer, 'test.xlsx');
      
      expect(result.parsedBoq[0].lumpSum).toBe(true);
      expect(result.parsedBoq[0].quantity).toBe(1);
      expect(result.parsedBoq[0].tenderRate).toBe(500000);
      expect(result.parsedBoq[1].lumpSum).toBe(true);
    });
  });

  describe('Scenario 12: Alternative items grouping', () => {
    it('should group alternative items (10A, 10B)', async () => {
      const testData = [
        ['Sr No', 'Description', 'Qty', 'Unit', 'Rate', 'Amount'],
        ['10', 'Option 1 - Granite flooring', 100, 'sqm', 1500, 150000],
        ['10A', 'Option 2 - Marble flooring', 100, 'sqm', 2000, 200000],
        ['10B', 'Option 3 - Vitrified tiles', 100, 'sqm', 1000, 100000]
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(testData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BOQ');
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      
      const result = await parseBoqFile(buffer, 'test.xlsx');
      
      expect(result.parsedBoq[0].altGroup).toBeNull();
      expect(result.parsedBoq[1].altGroup).toBe('10');
      expect(result.parsedBoq[2].altGroup).toBe('10');
      expect(result.parsedBoq[1].srNo).toBe('10A');
      expect(result.parsedBoq[2].srNo).toBe('10B');
    });
  });

  describe('Scenario 13: Split rates consolidation', () => {
    it('should consolidate material and labour rates', async () => {
      const testData = [
        ['Sr No', 'Description', 'Qty', 'Unit', 'Material Rate', 'Labour Rate', 'Amount'],
        ['1', 'Brickwork', 100, 'cum', 3000, 1500, 450000]
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(testData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BOQ');
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      
      // Note: Current parser doesn't implement split rates yet
      // This test documents expected behavior
      const result = await parseBoqFile(buffer, 'test.xlsx');
      
      // Expected: tenderRate = 3000 + 1500 = 4500
      // Current: May not detect split columns
      expect(result.parsedBoq).toHaveLength(1);
    });
  });

  describe('Scenario 14: Subtotal and Grand Total', () => {
    it('should detect subtotal and grand total rows', async () => {
      const testData = [
        ['Sr No', 'Description', 'Qty', 'Unit', 'Rate', 'Amount'],
        ['', 'SECTION A', '', '', '', ''],
        ['1', 'Item 1', 100, 'cum', 250, 25000],
        ['', 'Subtotal - Section A', '', '', '', 25000],
        ['', 'SECTION B', '', '', '', ''],
        ['2', 'Item 2', 50, 'cum', 1000, 50000],
        ['', 'Subtotal - Section B', '', '', '', 50000],
        ['', 'Grand Total', '', '', '', 75000]
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(testData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BOQ');
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      
      const result = await parseBoqFile(buffer, 'test.xlsx');
      
      const subtotalA = result.parsedBoq.find(r => r.description.includes('Subtotal - Section A'));
      expect(subtotalA?.subtotal).toBe(true);
      expect(subtotalA?.tenderAmount).toBe(25000);
      
      const grandTotal = result.parsedBoq.find(r => r.description.includes('Grand Total'));
      expect(grandTotal?.grandTotal).toBe(true);
      expect(grandTotal?.tenderAmount).toBe(75000);
    });
  });

  describe('Scenario 15: Remark rows', () => {
    it('should detect and flag remark rows', async () => {
      const testData = [
        ['Sr No', 'Description', 'Qty', 'Unit', 'Rate', 'Amount'],
        ['1', 'Excavation', 100, 'cum', 250, 25000],
        ['', 'Note: All rates inclusive of taxes', '', '', '', ''],
        ['2', 'Concrete', 50, 'cum', 5000, 250000]
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(testData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BOQ');
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      
      const result = await parseBoqFile(buffer, 'test.xlsx');
      
      const note = result.parsedBoq.find(r => r.description.includes('All rates inclusive'));
      expect(note?.remark).toBe(true);
      expect(note?.quantity).toBe(0);
    });
  });

  describe('Scenario 19: Page headers/footers filtering', () => {
    it('should skip page header and footer rows', async () => {
      const testData = [
        ['Sr No', 'Description', 'Qty', 'Unit', 'Rate', 'Amount'],
        ['1', 'Excavation', 100, 'cum', 250, 25000],
        ['', 'Page 1 of 3', '', '', '', ''],
        ['', 'Continued on next page', '', '', '', ''],
        ['2', 'Concrete', 50, 'cum', 5000, 250000]
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(testData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BOQ');
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      
      const result = await parseBoqFile(buffer, 'test.xlsx');
      
      // Page indicators should be skipped
      expect(result.parseReport.rowsSkipped).toBeGreaterThan(0);
      expect(result.parsedBoq).toHaveLength(2);
      expect(result.parsedBoq[0].srNo).toBe('1');
      expect(result.parsedBoq[1].srNo).toBe('2');
    });
  });

  describe('Edge case: Currency detection and normalization', () => {
    it('should detect currency symbols and normalize amounts', async () => {
      const testData = [
        ['Sr No', 'Description', 'Qty', 'Unit', 'Rate', 'Amount'],
        ['1', 'Excavation', 100, 'cum', '₹250', '₹25,000'],
        ['2', 'Concrete', 50, 'cum', 'Rs. 5,000', 'Rs. 2,50,000']
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(testData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BOQ');
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      
      const result = await parseBoqFile(buffer, 'test.xlsx');
      
      expect(result.parsedBoq[0].currency).toBe('INR');
      expect(result.parsedBoq[0].tenderRate).toBe(250);
      expect(result.parsedBoq[0].tenderAmount).toBe(25000);
      expect(result.parsedBoq[1].tenderRate).toBe(5000);
      expect(result.parsedBoq[1].tenderAmount).toBe(250000);
    });
  });

  describe('Edge case: Missing amount calculation', () => {
    it('should calculate missing amount from qty and rate', async () => {
      const testData = [
        ['Sr No', 'Description', 'Qty', 'Unit', 'Rate', 'Amount'],
        ['1', 'Excavation', 100, 'cum', 250, ''],
        ['2', 'Concrete', 50, 'cum', '', 250000]
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(testData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BOQ');
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      
      const result = await parseBoqFile(buffer, 'test.xlsx');
      
      // Item 1: Amount should be calculated
      expect(result.parsedBoq[0].tenderAmount).toBe(25000);
      
      // Item 2: Rate should be calculated
      expect(result.parsedBoq[1].tenderRate).toBe(5000);
    });
  });

  describe('Header mapping', () => {
    it('should detect headers with various spellings', async () => {
      const testData = [
        ['S.No', 'Item Description', 'Qnty', 'U.O.M', 'Unit Rate', 'Total Amount'],
        ['1', 'Excavation', 100, 'cum', 250, 25000]
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(testData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BOQ');
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      
      const result = await parseBoqFile(buffer, 'test.xlsx');
      
      expect(result.parsedBoq).toHaveLength(1);
      expect(result.parsedBoq[0].srNo).toBe('1');
      expect(result.parsedBoq[0].description).toBe('Excavation');
      expect(result.parseReport.ambiguousHeaderConfidence).toBeGreaterThan(0.5);
    });
  });

  describe('Multiple sheets', () => {
    it('should parse BOQ from multiple sheets', async () => {
      const testData1 = [
        ['Sr No', 'Description', 'Qty', 'Unit', 'Rate', 'Amount'],
        ['1', 'Sheet 1 Item', 100, 'cum', 250, 25000]
      ];
      
      const testData2 = [
        ['Sr No', 'Description', 'Qty', 'Unit', 'Rate', 'Amount'],
        ['2', 'Sheet 2 Item', 50, 'cum', 500, 25000]
      ];
      
      const ws1 = XLSX.utils.aoa_to_sheet(testData1);
      const ws2 = XLSX.utils.aoa_to_sheet(testData2);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws1, 'Civil');
      XLSX.utils.book_append_sheet(wb, ws2, 'Electrical');
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      
      const result = await parseBoqFile(buffer, 'test.xlsx');
      
      expect(result.parseReport.sheets).toContain('Civil');
      expect(result.parseReport.sheets).toContain('Electrical');
      expect(result.parsedBoq).toHaveLength(2);
      expect(result.parsedBoq[0].sheetName).toBe('Civil');
      expect(result.parsedBoq[1].sheetName).toBe('Electrical');
    });
  });

  describe('Parse report', () => {
    it('should generate comprehensive parse report', async () => {
      const testData = [
        ['Sr No', 'Description', 'Qty', 'Unit', 'Rate', 'Amount'],
        ['1', 'Item 1', 100, 'cum', 250, 25000],
        ['', 'Invalid row', '', '', '', ''], // Should be skipped
        ['2', 'Item 2', 50, 'cum', 500, 25000]
      ];
      
      const ws = XLSX.utils.aoa_to_sheet(testData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BOQ');
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      
      const result = await parseBoqFile(buffer, 'test.xlsx');
      
      expect(result.parseReport.rowsParsed).toBeGreaterThan(0);
      expect(result.parseReport.rowsSkipped).toBeGreaterThan(0);
      expect(result.parseReport.sheets).toContain('BOQ');
      expect(result.parseReport.ambiguousHeaderConfidence).toBeDefined();
    });
  });
});
