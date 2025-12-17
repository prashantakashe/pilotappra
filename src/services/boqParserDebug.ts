/**
 * BOQ Parser Debug Utilities
 * Create sample BOQ files for testing
 */

import XLSX from 'xlsx';
import { parseBoqFile } from './boqParser';

/**
 * Create a simple test BOQ buffer
 */
export function createSimpleTestBOQ(): Uint8Array {
  const data = [
    ['Sr. No.', 'Description', 'Unit', 'Quantity', 'Rate', 'Amount'],
    ['1', 'Excavation for foundation', 'Cum', '120', '1584', '190080'],
    ['2', 'Concrete block work', 'Sqmt', '1235', '2657', '3281395'],
    ['3', 'Brick masonry', 'Rmt', '1456', '1597', '2325232'],
    ['4', 'Plastering', 'No.', '189', '35416', '6693624'],
    ['5', 'Painting', 'Cum', '146', '5542', '809132'],
    ['', '', '', '', '', ''],
    ['Total', '', '', '', '', '13209463']
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(buf);
}

/**
 * Create a complex test BOQ with multi-line descriptions
 */
export function createComplexTestBOQ(): Uint8Array {
  const data = [
    ['Sr. No.', 'Description', 'Unit', 'Quantity', 'Rate', 'Amount'],
    ['1', 'Excavation for foundation', 'Cum', '120', '1584', '190080'],
    ['', '  Including removal of spoil', '', '', '', ''],
    ['2', 'Concrete block work', 'Sqmt', '1235', '2657', '3281395'],
    ['3', 'Brick masonry', 'Rmt', '1456', '1597', '2325232'],
    ['', '  4.5 mm brick, 1:4 mortar', '', '', '', ''],
    ['', '  Includes all labor and materials', '', '', '', ''],
    ['Total', '', '', '', '', '13209463']
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(buf);
}

/**
 * Test the parser with sample data
 */
export async function testParser() {
  console.log('[TEST] Starting parser test');
  
  try {
    const buffer = createSimpleTestBOQ();
    console.log('[TEST] Created sample BOQ buffer:', buffer.byteLength, 'bytes');
    
    const result = await parseBoqFile(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), 'test.xlsx');
    
    console.log('[TEST] Parse result:');
    console.log('  - Rows parsed:', result.parseReport.rowsParsed);
    console.log('  - Rows skipped:', result.parseReport.rowsSkipped);
    console.log('  - Warnings:', result.parseReport.warnings.length);
    console.log('  - Confidence:', result.parseReport.mappingConfidence);
    console.log('  - Suggested mapping:', result.parseReport.suggestedMapping);
    console.log('  - Sheets:', result.parseReport.sheets);
    console.log('  - Detected columns:', result.parseReport.detectedColumns);
    
    if (result.parsedBoq.length > 0) {
      console.log('[TEST] ✅ SUCCESS: Parsed', result.parsedBoq.length, 'rows');
      console.log('[TEST] Detailed row data:');
      result.parsedBoq.forEach((row, idx) => {
        console.log(`[TEST] [${idx}] Row object:`, {
          srNo: row.srNo,
          description: `"${row.description}"`, // Explicitly show with quotes to see empty strings
          unit: row.unit,
          quantity: row.quantity,
          tenderRate: row.tenderRate,
          tenderAmount: row.tenderAmount,
          category: row.category,
          remark: row.remark,
          subtotal: row.subtotal,
          grandTotal: row.grandTotal
        });
      });
      console.log('[TEST] First row full JSON:', JSON.stringify(result.parsedBoq[0], null, 2));
    } else {
      console.warn('[TEST] ❌ FAILED: No rows parsed!');
      console.log('[TEST] Parse report:', result.parseReport);
    }
    
    return result;
  } catch (error) {
    console.error('[TEST] Parser error:', error);
    throw error;
  }
}

/**
 * Test complex BOQ
 */
export async function testComplexParser() {
  console.log('[TEST] Starting complex parser test');
  
  try {
    const buffer = createComplexTestBOQ();
    console.log('[TEST] Created complex BOQ buffer:', buffer.byteLength, 'bytes');
    
    const result = await parseBoqFile(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), 'complex_test.xlsx');
    
    console.log('[TEST] Parse result:');
    console.log('  - Rows parsed:', result.parseReport.rowsParsed);
    console.log('  - Rows skipped:', result.parseReport.rowsSkipped);
    console.log('  - Warnings:', result.parseReport.warnings.length);
    
    if (result.parsedBoq.length > 0) {
      console.log('[TEST] Parsed rows:');
      result.parsedBoq.forEach((row, idx) => {
        console.log(`  [${idx}] ${row.srNo}: ${row.description}`);
      });
    }
    
    return result;
  } catch (error) {
    console.error('[TEST] Parser error:', error);
    throw error;
  }
}
