# Component Organization Guide

## Problem Solved ✅
Previously, the two similar cards ("Escalation Bill" and "Price Escalation Bill") had confusing file references due to:
- "Escalation Bill" files scattered in `src/components/escalation/`
- "Price Escalation Bill" files at root level in `price-escalation-bill/`
- This caused interchanged file references and confusion

## Solution Implemented
The `price-escalation-bill/` folder has been moved from root to `src/components/price-escalation-bill/`

---

## Current File Organization

### Escalation Bill (Standard Escalation)
**Location:** `src/components/escalation/`

Components:
- `CalculationTab.tsx` - Escalation calculations
- `CreateBillTab.tsx` - Bill creation
- `DatePickerField.tsx` - Date selection
- `DocumentsTab.tsx` - Document management
- `HistoryTab.tsx` - History tracking
- `IndicesGraphsTab.tsx` - Graph visualization
- `MasterSetupTab.tsx` - Master setup configuration

**Main Screen:** `src/screens/EscalationBillScreen.tsx` (if exists)

---

### Price Escalation Bill (Price Index-Based Escalation)
**Location:** `src/components/price-escalation-bill/`

Components:
- `AnalysisGraph.tsx` - Analysis graphs
- `DocumentCard.tsx` - Document cards
- `DocumentLibraryTab.tsx` - Document library
- `IndexRow.tsx` - Index row display
- `IndicesDashboard.tsx` - Indices dashboard
- `MasterIndicesTab.tsx` - Master indices
- `ProjectSpecificTab.tsx` - Project-specific data
- `useFirestore.ts` - Firebase hooks
- `useIndices.ts` - Indices hooks
- `WeightageCard.tsx` - Weightage cards

**Main Component:** `src/components/PriceEscalationTabs.tsx`

**Main Screen:** `src/screens/PriceEscalationBillScreen.tsx`

**Navigation Key:** `'PriceEscalationBill'`

---

## How to Reference Files

### ✅ Correct Import Paths

**For Escalation Bill components:**
```typescript
import { CalculationTab } from '../components/escalation/CalculationTab';
import { CreateBillTab } from '../components/escalation/CreateBillTab';
```

**For Price Escalation Bill components:**
```typescript
import { IndicesDashboard } from '../components/price-escalation-bill/IndicesDashboard';
import { DocumentLibraryTab } from '../components/price-escalation-bill/DocumentLibraryTab';
import { useIndices } from '../components/price-escalation-bill/useIndices';
```

---

## Key Differences

| Aspect | Escalation Bill | Price Escalation Bill |
|--------|-----------------|----------------------|
| **Folder** | `src/components/escalation/` | `src/components/price-escalation-bill/` |
| **Main Component** | (if exists) | `PriceEscalationTabs.tsx` |
| **Type** | Standard escalation | Price index-based escalation |
| **Key Data** | Calculation-focused | Indices & weightage-focused |
| **Main Screen** | `EscalationBillScreen.tsx` | `PriceEscalationBillScreen.tsx` |
| **Navigation Key** | (as configured) | `'PriceEscalationBill'` |

---

## Best Practices Moving Forward

1. **Always check the folder location** before importing components
2. **Use the folder names as a guide:**
   - `escalation/` → Escalation Bill related
   - `price-escalation-bill/` → Price Escalation Bill related
3. **When adding new files:**
   - Add Price Escalation Bill files to `src/components/price-escalation-bill/`
   - Add Escalation Bill files to `src/components/escalation/`
4. **Avoid mixing imports** from both folders in the same component unless necessary
5. **Document any cross-card references** if you must use both

---

## Migration Notes

- ✅ Folder moved: `price-escalation-bill/` → `src/components/price-escalation-bill/`
- ✅ All files preserved in the new location
- ⚠️ **ACTION REQUIRED:** Update any import statements in your codebase that reference the old root-level path
- To find old import paths, search for: `from '../../price-escalation-bill` or `import.*price-escalation-bill`

---

*Last Updated: December 21, 2025*
