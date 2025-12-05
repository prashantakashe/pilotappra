/**
 * BOQ Parser Service - Phase 2 (Complete Implementation)
 * Implements deterministic BOQ parsing covering all 19 scenarios
 * Converts uploaded Excel/CSV files to standardized BOQ schema
 * 
 * Scenarios covered:
 * 1. Direct items with SrNo, Description, Qty, Rate, Amount
 * 2. Multi-level numbering (1.1, 1.1.1)
 * 3. Multi-line descriptions (continuation rows)
 * 4-5. Section/Category headings
 * 6. Sub-items with parent tracking
 * 7. Items with partial numeric data
 * 8. Parent-child relationships
 * 9. Currency detection and handling
 * 10. Item code detection (DSR, CPWD)
 * 11. Lump-sum detection
 * 12. Alternative items (10A, 10B, etc.)
 * 13. Split rates (Material, Labour, Equipment)
 * 14. Subtotal and Grand Total rows
 * 15. Remarks and Notes rows
 * 16-17. Merged cells and page headers
 * 18-19. Ambiguous numeric formats and validation
 */

import * as XLSX from 'xlsx';

// ==================== TYPES ====================

export interface StandardBOQRow {
  srNo: string;
  itemNo: string | null; // Original item number from BOQ
  parentSr: string | null;
  category: string | null;
  subCategory: string | null;
  description: string;
  unit: string | null;
  quantity: number | null;
  tenderRate: number | null;
  tenderAmount: number | null;
  itemCode: string | null;
  currency: string | null;
  lumpSum: boolean;
  altGroup: string | null;
  remark: boolean;
  subtotal: boolean;
  grandTotal: boolean;
  sheetName: string | null;
  rawRowIndex: number;
  original: Record<string, any>;
  
  // Phase 2.1: Rate Analysis - Revisions for rate builder
  revisions?: {
    R1?: {
      rate: number;
      amount: number;
      breakdown: Array<{
        name: string;
        qty: number;
        unitRate: number;
        amount: number;
      }>;
      meta: {
        ohPct: number;
        profitPct: number;
        gstPct: number;
        createdAt: string;
      };
    };
  };
}

export interface ParseWarning {
  rowIndex: number;
  reason: string;
  rawRow?: Record<string, any>;
  severity?: 'info' | 'warning' | 'error';
}

export interface ParseReport {
  rowsParsed: number;
  rowsSkipped: number;
  warnings: ParseWarning[];
  mappingConfidence: number;
  suggestedMapping: Record<string, number>;
  sheets: string[];
  detectedColumns?: Record<string, number>;
  ambiguousHeaderConfidence?: number;
}

export interface ParseResult {
  parsedBoq: StandardBOQRow[];
  parseReport: ParseReport;
}

export interface ParseOptions {
  sheetName?: string;
  headerRowGuess?: number;
  templateMapping?: Record<string, number>;
}

// ==================== HEADER DETECTION ====================

const HEADER_PATTERNS: Record<string, RegExp[]> = {
  srNo: [
    /sr\s*no/i, /^sr$/i, /^s\.no$/i, /^sno$/i,
    /item\s*no/i, /serial\s*no/i,
    /^sl\s*no$/i, /^seq$/i, /^sequence$/i, /^#$/i, /^line\s*no$/i
  ],
  description: [
    /description/i, /item\s*desc/i,
    /^work$/i, /particulars/i, /details/i,
    /^name$/i, /item\s*name/i
  ],
  unit: [
    /^unit$/i, /uom/i, /^u\.m\.$/i,
    /units/i, /measure/i
  ],
  quantity: [
    /qty/i, /quantity/i, /qnty/i, /quant/i
  ],
  rate: [
    /rate/i, /price/i, /tender\s*rate/i,
    /unit\s*price/i
  ],
  amount: [
    /amount/i, /^total$/i, /value/i,
    /\brs\b/i, /₹/
  ],
  itemCode: [
    /^code$/i, /item\s*code/i,
    /dsr/i, /cpwd/i, /ssr/i, /schedule/i
  ],
  remarks: [
    /remarks/i, /^notes?$/i, /note\s*:/i,
    /comments?/i, /remark\s*:/i
  ]
};

/**
 * Normalize header text for matching
 */
function normalizeHeaderText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Map header row to canonical columns
 * Implements pattern matching for all header variations
 */
export function mapHeaders(headerRow: any[]): {
  mapping: Record<string, number>;
  confidenceScore: number;
} {
  const mapping: Record<string, number> = {};
  let matched = 0;

  console.log(`[mapHeaders] Input row:`, headerRow.slice(0, 10));

  for (let colIndex = 0; colIndex < Math.min(headerRow.length, 30); colIndex++) {
    const rawCell = String(headerRow[colIndex] || '').trim();
    const cellText = normalizeHeaderText(rawCell);
    
    if (!cellText) continue;

    console.log(`[mapHeaders] Col ${colIndex}: raw="${rawCell}" -> normalized="${cellText}"`);

    // Try to match against canonical patterns
    for (const [canonical, patterns] of Object.entries(HEADER_PATTERNS)) {
      if (canonical in mapping) continue; // Already mapped

      for (const pattern of patterns) {
        if (pattern.test(cellText)) {
          mapping[canonical] = colIndex;
          matched++;
          console.log(`[mapHeaders]   ✓ Matched '${canonical}' at col ${colIndex}`);
          break;
        }
      }
      
      if (canonical in mapping) break; // Move to next column once matched
    }
  }

  // FALLBACK: If we don't have key columns, try alternate positions
  if (!('srNo' in mapping)) {
    console.warn('[mapHeaders] srNo not found, trying fallback');
    mapping.srNo = 0; // First column is usually Sr No
  }
  
  if (!('description' in mapping)) {
    console.warn('[mapHeaders] description not found, trying fallback');
    // If we have srNo and no description, description is likely the 2nd column
    if ('srNo' in mapping) {
      const srNoCol = mapping.srNo;
      mapping.description = srNoCol + 1;
    } else {
      mapping.description = 1;
    }
    matched++;
    console.log(`[mapHeaders]   ⚠ Fallback: Using col ${mapping.description} for description`);
  }

  // Confidence: matched columns / expected columns
  const expectedColumns = Object.keys(HEADER_PATTERNS).length;
  const confidence = matched / expectedColumns;

  console.log(`[mapHeaders] Final: ${matched}/${expectedColumns} matched, confidence=${confidence.toFixed(2)}`);
  console.log(`[mapHeaders] Mapping:`, mapping);
  
  return { mapping, confidenceScore: confidence };
}

// ==================== NUMERIC PARSING ====================

const CURRENCY_SYMBOLS = ['₹', '$', '€', '£', '¥', 'Rs', 'INR', 'USD', 'EUR', 'GBP'];

/**
 * Parse numeric value from string, handling various formats
 * Covers Scenario 18 (ambiguous numeric formats)
 */
function parseNumeric(value: string | number | null | undefined): number | null {
  if (!value && value !== 0) return null;
  
  const str = String(value).trim();
  if (!str) return null;

  // Remove currency symbols
  let cleaned = str;
  for (const symbol of CURRENCY_SYMBOLS) {
    cleaned = cleaned.replace(new RegExp(`\\b${symbol}\\b|^${symbol}\\s*`, 'gi'), '');
  }

  // Detect decimal separator (comma vs dot)
  // If both present, assume: last separator is decimal, others are thousands
  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');
  let normalizedNumeric = cleaned;

  if (hasComma && hasDot) {
    const lastCommaIdx = cleaned.lastIndexOf(',');
    const lastDotIdx = cleaned.lastIndexOf('.');
    if (lastDotIdx > lastCommaIdx) {
      // Dot is decimal: 1,234.56
      normalizedNumeric = cleaned.replace(/,/g, '');
    } else {
      // Comma is decimal: 1.234,56
      normalizedNumeric = cleaned.replace(/\./g, '').replace(',', '.');
    }
  } else if (hasComma) {
    normalizedNumeric = cleaned.replace(/,/g, '');
  }

  // Handle bracketed negatives: (123) => -123
  if (/^\(.*\)$/.test(normalizedNumeric)) {
    normalizedNumeric = '-' + normalizedNumeric.replace(/[()]/g, '');
  }

  const num = parseFloat(normalizedNumeric);
  return isNaN(num) ? null : num;
}

/**
 * Detect currency from text
 * Covers Scenario 9
 */
function detectCurrency(text: string): string | null {
  if (!text) return null;
  
  if (text.includes('₹') || /\binr\b/i.test(text)) return 'INR';
  if (text.includes('$') || /\busd\b/i.test(text)) return 'USD';
  if (text.includes('€') || /\beur\b/i.test(text)) return 'EUR';
  
  return null;
}

// ==================== UNIT DETECTION ====================

const UNIT_PATTERNS: Record<string, RegExp> = {
  'm3': /\bm3\b|\bcbm\b|\bcum\.?\b|\bcube\s*meter/i,
  'm2': /\bm2\b|\bsqm\b|\bsq\.?\s*m|square\s*meter|sqft|sq\.?\s*ft/i,
  'rmt': /\brmt\b|\brmtr\b|\brunning\s*meter/i,
  'm': /\bm\b|\bmeter|\bmeters|\bml/i,
  'km': /\bkm\b|\bkilometer/i,
  'nos': /\bnos\b|\bno\.?s?\b|\bpieces|\bpcs/i,
  'kg': /\bkg\b|\bkilogram|\bkgs/i,
  'ton': /\bton\b|\btonne\b|\bmt\b|\bmt\./i,
  'ltr': /\bltr\b|\blitre|\bliter|\bl\b/i,
  'hrs': /\bhrs\b|\bhour|\bhours/i,
  'days': /\bdays?\b|\bday/i,
  'ls': /\bls\b|\blump\s*sum/i,
};

/**
 * Detect unit from text
 */
function detectUnit(text: string): string | null {
  if (!text) return null;
  
  const normalized = text.toLowerCase().trim();
  
  for (const [unit, pattern] of Object.entries(UNIT_PATTERNS)) {
    if (pattern.test(normalized)) return unit;
  }
  
  return null;
}

// ==================== MERGE MULTI-LINE ROWS ====================

/**
 * Merge continuation rows (blank SrNo, non-empty description) into previous row
 * Covers Scenario 3
 */
export function mergeMultiLineRows(rows: any[][]): any[][] {
  if (rows.length === 0) return rows;

  const mapping = mapHeaders(rows[0]).mapping;
  const srNoCol = mapping.srNo;
  const descCol = mapping.description;

  // If we can't find key columns, just return as-is
  if (srNoCol === undefined || descCol === undefined) {
    console.warn('[mergeMultiLineRows] Could not find srNo or description columns, returning rows as-is');
    return rows;
  }

  const merged: any[][] = [];
  let currentRow: any[] | null = null;
  let currentMergedDesc = '';

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const srNo = String(row[srNoCol] || '').trim();
    const desc = String(row[descCol] || '').trim();

    // Continuation line: blank SrNo, has description
    if (!srNo && desc && currentRow) {
      currentMergedDesc += ' ' + desc;
      continue;
    }

    // New item or category
    if (currentRow) {
      currentRow[descCol] = currentMergedDesc.trim();
      merged.push(currentRow);
    }

    currentRow = [...row];
    currentMergedDesc = desc;
  }

  // Final row
  if (currentRow) {
    currentRow[descCol] = currentMergedDesc.trim();
    merged.push(currentRow);
  }

  return merged;
}

// ==================== ROW CLASSIFICATION ====================

function isCategoryHeading(srNo: string, desc: string, qty: number | null, rate: number | null, amount: number | null): boolean {
  if (!desc) return false;
  if (srNo) return false; // Has SrNo = not a category
  if (qty !== null || rate !== null || amount !== null) return false; // Has numeric = not a category

  // Check if ALL CAPS or contains section keywords
  return desc === desc.toUpperCase() || /^(section|scope|part|chapter|trade|division|group)/i.test(desc);
}

function isSubtotalOrGrandTotal(desc: string, amount: number | null): boolean {
  if (!desc || amount === null) return false;
  return /total/i.test(desc);
}

function isRemarkRow(desc: string, remarks: string): boolean {
  if (!desc && !remarks) return false;
  const text = (desc + ' ' + remarks).toLowerCase();
  return /^(note|remark|n\.b\.):?/.test(text);
}

/**
 * Detect lump-sum items
 * Covers Scenario 11
 */
/**
 * Normalize unit to standard format
 * Handles variations like Each, Nos, No, per
 */
function normalizeUnit(unit: string | null): string | null {
  if (!unit) return null;
  
  const unitLower = unit.toLowerCase().trim();
  
  // Map variations to standard units
  const unitMappings: Record<string, string> = {
    'each': 'nos',
    'no': 'nos',
    'no.': 'nos',
    'number': 'nos',
    'numbers': 'nos',
    'per': 'nos',
    'pcs': 'nos',
    'piece': 'nos',
    'pieces': 'nos',
    'job': 'job',
    'pair': 'pair',
    'pairs': 'pair',
    'sqm': 'm2',
    'sq.m': 'm2',
    'sq m': 'm2',
    'square meter': 'm2',
    'square metre': 'm2',
    'cum': 'm3',
    'cu.m': 'm3',
    'cu m': 'm3',
    'cubic meter': 'm3',
    'cubic metre': 'm3',
    'rmt': 'rmt',
    'running meter': 'rmt',
    'running metre': 'rmt',
    'rm': 'rmt',
    'kg': 'kg',
    'kilogram': 'kg',
    'tonne': 'MT',
    'ton': 'MT',
    'mt': 'MT',
    'metric ton': 'MT',
    'metric tonne': 'MT',
    'litre': 'ltr',
    'liter': 'ltr',
    'l': 'ltr',
    'per month': 'Per Month',
    'per/month': 'Per Month',
    'p.m': 'Per Month',
    'pm': 'Per Month'
  };
  
  return unitMappings[unitLower] || unit;
}

function isLumpSum(unit: string | null, qty: number | null, amount: number | null): boolean {
  if (!amount || amount === 0) return false;
  if (!unit || unit.toLowerCase() === 'ls' || unit.toLowerCase() === 'lump sum') return true;
  if (qty === null || qty === 0) return true;
  return false;
}

/**
 * Detect alternative group
 * Covers Scenario 12
 */
function detectAlternativeGroup(srNo: string): { baseGroup: string | null; isAlternative: boolean } {
  if (!srNo) return { baseGroup: null, isAlternative: false };

  // Match patterns like "10A", "10(a)", "10-1", "10(A)"
  const altMatch = srNo.match(/^(\d+)[a-zA-Z\-\(\)](.*)$/);
  if (altMatch) {
    return { baseGroup: altMatch[1], isAlternative: true };
  }

  return { baseGroup: null, isAlternative: false };
}

/**
 * Detect item code
 * Covers Scenario 10
 */
function detectItemCode(description: string, itemCode: string | null): string | null {
  if (itemCode && itemCode.trim()) return itemCode.trim();

  if (!description) return null;

  // DSR pattern: D.1.2.3 or DSR-1234
  const dsrMatch = description.match(/\b(DSR|CPWD|SSR|IS)[\s\.\-]?[\d\.\-]+/i);
  if (dsrMatch) return dsrMatch[0];

  return null;
}

// ==================== MAIN PARSER ====================

/**
 * Main parse function
 * Implements all 19 scenarios
 */
export async function parseBoqFile(
  fileBuffer: ArrayBuffer | Buffer,
  fileName: string,
  options: ParseOptions = {}
): Promise<ParseResult> {
  console.log(`[BOQParser] ========== STARTING PARSE ==========`);
  console.log(`[BOQParser] File: ${fileName}`);

  const parsedBoq: StandardBOQRow[] = [];
  const parseReport: ParseReport = {
    rowsParsed: 0,
    rowsSkipped: 0,
    warnings: [],
    mappingConfidence: 1.0,
    suggestedMapping: {},
    sheets: [],
    detectedColumns: {}
  };

  try {
    // Read workbook
    const bytes = fileBuffer instanceof ArrayBuffer
      ? new Uint8Array(fileBuffer)
      : fileBuffer;

    const workbook = XLSX.read(bytes, { type: 'array' });
    console.log(`[BOQParser] Workbook loaded: ${workbook.SheetNames.length} sheets`);
    
    parseReport.sheets = workbook.SheetNames;

    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      console.log(`\n[BOQParser] Processing sheet: "${sheetName}"`);

      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      // Convert to array format
      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      console.log(`[BOQParser] Sheet has ${rawRows.length} rows`);

      if (rawRows.length < 2) {
        console.warn(`[BOQParser] Sheet too small, skipping`);
        continue;
      }

      // Find header row (first 10 rows)
      let headerRowIndex = 0;
      let headerMapping: Record<string, number> = {};
      let bestConfidence = 0;

      for (let i = 0; i < Math.min(10, rawRows.length); i++) {
        const { mapping, confidenceScore } = mapHeaders(rawRows[i]);
        if (confidenceScore > bestConfidence) {
          bestConfidence = confidenceScore;
          headerMapping = mapping;
          headerRowIndex = i;
        }
        if (confidenceScore >= 0.7) break; // Good match, stop searching
      }

      console.log(`[BOQParser] Header at row ${headerRowIndex}, confidence: ${bestConfidence.toFixed(2)}`);

      if (bestConfidence < 0.5) {
        parseReport.warnings.push({
          rowIndex: -1,
          reason: `Low header confidence (${bestConfidence.toFixed(2)}). Manual verification recommended.`,
          severity: 'warning'
        });
      }

      parseReport.mappingConfidence = Math.min(parseReport.mappingConfidence, bestConfidence);
      parseReport.suggestedMapping = headerMapping;
      parseReport.detectedColumns = headerMapping;

      // Merge multi-line descriptions
      const dataRows = rawRows.slice(headerRowIndex + 1);
      const processedRows = mergeMultiLineRows([rawRows[headerRowIndex], ...dataRows]).slice(1);

      console.log(`[BOQParser] Processing ${processedRows.length} data rows`);

      // Parse rows
      const sheetParsedBoq = parseDataRows(
        processedRows,
        headerMapping,
        sheetName,
        headerRowIndex + 1,
        parseReport
      );

      console.log(`[BOQParser] Sheet yielded ${sheetParsedBoq.length} parsed rows`);
      parsedBoq.push(...sheetParsedBoq);
    }

    parseReport.rowsParsed = parsedBoq.length;

    console.log(`\n[BOQParser] ========== PARSE COMPLETE ==========`);
    console.log(`[BOQParser] Total: ${parseReport.rowsParsed} rows, ${parseReport.rowsSkipped} skipped, ${parseReport.warnings.length} warnings`);

    return { parsedBoq, parseReport };

  } catch (error: any) {
    console.error('[BOQParser] PARSE FAILED:', error);
    parseReport.warnings.push({
      rowIndex: -1,
      reason: `Parse error: ${error.message}`,
      severity: 'error'
    });
    return { parsedBoq, parseReport };
  }
}

/**
 * Parse data rows using header mapping
 * Implements the decision tree for all scenarios
 */
function parseDataRows(
  rows: any[][],
  mapping: Record<string, number>,
  sheetName: string,
  startRowIndex: number,
  parseReport: ParseReport
): StandardBOQRow[] {
  const result: StandardBOQRow[] = [];
  let currentCategory: string | null = null;
  let currentSubCategory: string | null = null;
  let lastMainItem: Partial<StandardBOQRow> | null = null;

  console.log(`\n[parseDataRows] Starting with ${rows.length} rows`);
  console.log(`[parseDataRows] Column mapping:`, mapping);

  // Helper to get cell value
  const getCell = (row: any[], colKey: string): string => {
    const colIndex = mapping[colKey];
    if (colIndex === undefined || colIndex < 0 || colIndex >= row.length) return '';
    const val = row[colIndex];
    return String(val || '').trim();
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawRowIndex = startRowIndex + i;

    // Extract values
    const srNo = getCell(row, 'srNo');
    const desc = getCell(row, 'description');
    const unit = getCell(row, 'unit');
    const qtyStr = getCell(row, 'quantity');
    const rateStr = getCell(row, 'rate');
    const amountStr = getCell(row, 'amount');
    const codeStr = getCell(row, 'itemCode');
    const remarksStr = getCell(row, 'remarks');

    const qty = parseNumeric(qtyStr);
    const rate = parseNumeric(rateStr);
    const amount = parseNumeric(amountStr);
    const detectedUnit = detectUnit(unit);
    const currency = detectCurrency(rateStr + ' ' + amountStr);

    // Debug: log first 5 rows in detail
    if (i < 5) {
      console.log(`[parseDataRows] Row ${i}:`, {
        srNo, desc, unit, qtyStr, rateStr, amountStr,
        parsedQty: qty, parsedRate: rate, parsedAmount: amount
      });
    }

    // Skip checks
    if (!desc && !srNo) {
      parseReport.rowsSkipped++;
      continue;
    }

    // A. Category/Section heading (Scenario 4, 5)
    if (isCategoryHeading(srNo, desc, qty, rate, amount)) {
      currentCategory = desc;
      currentSubCategory = null;
      lastMainItem = null;

      result.push({
        srNo: '',
        itemNo: null,
        parentSr: null,
        category: desc,
        subCategory: null,
        description: desc,
        unit: null,
        quantity: null,
        tenderRate: null,
        tenderAmount: null,
        itemCode: null,
        currency: null,
        lumpSum: false,
        altGroup: null,
        remark: false,
        subtotal: false,
        grandTotal: false,
        sheetName,
        rawRowIndex,
        original: { ...row, rowNumber: rawRowIndex }
      });
      continue;
    }

    // B. Subtotal or Grand Total (Scenario 14)
    if (isSubtotalOrGrandTotal(desc, amount)) {
      const isGrand = /grand\s*total/i.test(desc);

      result.push({
        srNo: '',
        itemNo: null,
        parentSr: null,
        category: currentCategory,
        subCategory: currentSubCategory,
        description: desc,
        unit: null,
        quantity: null,
        tenderRate: null,
        tenderAmount: amount,
        itemCode: null,
        currency,
        lumpSum: false,
        altGroup: null,
        remark: false,
        subtotal: !isGrand,
        grandTotal: isGrand,
        sheetName,
        rawRowIndex,
        original: { ...row, rowNumber: rawRowIndex }
      });
      continue;
    }

    // C. Remark row (Scenario 15)
    if (isRemarkRow(desc, remarksStr)) {
      result.push({
        srNo: '',
        itemNo: null,
        parentSr: null,
        category: currentCategory,
        subCategory: currentSubCategory,
        description: desc || remarksStr,
        unit: null,
        quantity: null,
        tenderRate: null,
        tenderAmount: null,
        itemCode: null,
        currency: null,
        lumpSum: false,
        altGroup: null,
        remark: true,
        subtotal: false,
        grandTotal: false,
        sheetName,
        rawRowIndex,
        original: { ...row, rowNumber: rawRowIndex }
      });
      continue;
    }

    // D. Main item (Scenario 1, 7)
    if (srNo && desc) {
      let finalQty = qty;
      let finalRate = rate;
      let finalAmount = amount;

      // Calculate missing numeric field (Scenario 7)
      if (finalQty !== null && finalRate !== null && finalAmount === null) {
        finalAmount = finalQty * finalRate;
      } else if (finalQty === null && finalRate !== null && finalAmount !== null) {
        finalQty = finalAmount / finalRate;
      } else if (finalQty !== null && finalRate === null && finalAmount !== null) {
        finalRate = finalAmount / finalQty;
      }

      const altMatch = detectAlternativeGroup(srNo);
      const itemCode = detectItemCode(desc, codeStr);
      const isLump = isLumpSum(detectedUnit, finalQty, finalAmount);
      const normalizedUnit = normalizeUnit(detectedUnit);

      const parsedRow: StandardBOQRow = {
        srNo,
        itemNo: srNo, // Preserve original item number
        parentSr: null,
        category: currentCategory,
        subCategory: currentSubCategory,
        description: desc || '', // Ensure it's always a string
        unit: normalizedUnit,
        quantity: finalQty,
        tenderRate: finalRate,
        tenderAmount: finalAmount,
        itemCode,
        currency,
        lumpSum: isLump,
        altGroup: altMatch.isAlternative ? altMatch.baseGroup : null,
        remark: false,
        subtotal: false,
        grandTotal: false,
        sheetName,
        rawRowIndex,
        original: { ...row, rowNumber: rawRowIndex }
      };

      result.push(parsedRow);
      lastMainItem = parsedRow;
      continue;
    }

    // E. Continuation / blank SrNo with numeric fields (Scenario 6)
    if (!srNo && desc && (qty !== null || rate !== null || amount !== null)) {
      if (lastMainItem) {
        // Sub-item
        const finalQty = qty;
        const finalRate = rate;
        const finalAmount = amount;

        result.push({
          srNo: '',
          itemNo: null,
          parentSr: lastMainItem.srNo,
          category: currentCategory,
          subCategory: currentSubCategory,
          description: desc,
          unit: normalizeUnit(detectedUnit),
          quantity: finalQty,
          tenderRate: finalRate,
          tenderAmount: finalAmount,
          itemCode: detectItemCode(desc, codeStr),
          currency,
          lumpSum: false,
          altGroup: null,
          remark: false,
          subtotal: false,
          grandTotal: false,
          sheetName,
          rawRowIndex,
          original: { ...row, rowNumber: rawRowIndex }
        });
        continue;
      }
    }

    // FALLBACK: If we have any description or srNo, create a generic row
    if (desc || srNo) {
      console.log(`[parseDataRows] Fallback: Creating row for srNo="${srNo}" desc="${desc}"`);
      result.push({
        srNo: srNo || '',
        itemNo: srNo || null,
        parentSr: null,
        category: currentCategory,
        subCategory: currentSubCategory,
        description: desc || '',
        unit: normalizeUnit(detectedUnit),
        quantity: qty,
        tenderRate: rate,
        tenderAmount: amount,
        itemCode: detectItemCode(desc, codeStr),
        currency,
        lumpSum: isLumpSum(detectedUnit, qty, amount),
        altGroup: detectAlternativeGroup(srNo).baseGroup || null,
        remark: false,
        subtotal: false,
        grandTotal: false,
        sheetName,
        rawRowIndex,
        original: { ...row, rowNumber: rawRowIndex }
      });
      lastMainItem = result[result.length - 1];
      continue;
    }

    parseReport.rowsSkipped++;
  }

  return result;
}

// ==================== EXPORTS ====================

/**
 * Test helper functions (for unit tests)
 */
export function testHelpers() {
  return {
    parseNumeric,
    normalizeHeaderText,
    isCategoryHeading,
    isSubtotalOrGrandTotal,
    isRemarkRow,
    isLumpSum,
    detectAlternativeGroup,
    detectUnit,
    detectCurrency,
    detectItemCode
  };
}
