# BOQ File Upload & Auto-Parse Testing Guide

## Summary of Changes

### Files Modified
1. **`src/components/BoqFilesMetadataTable.tsx`**
   - Added web file picker with automatic upload to Firebase Storage
   - Added automatic BOQ parsing via `parseBoqFile()`
   - Added automatic save to Firestore via `saveParsedBoq()`
   - Added mobile file picker support (expo-document-picker fallback)
   - Fixed action menu positioning (z-index, overflow, positioning)
   - Made new rows auto-editable with editable fileName and description fields
   - Added Browse button for file selection

2. **`src/screens/RateAnalysisTenderDetail.tsx`**
   - Updated `onAddRow` handler to create rows with `isNewRow=true` and `isEditing=true`
   - New rows now have `editingDescription` and `editingFileName` initialized

### Features Implemented

#### 1. **Web File Upload + Auto-Parse** ✅
- User clicks "Browse" button in fileName field or "+ Add File"
- Selects Excel/PDF file → File is uploaded to Firebase Storage
- Automatically parsed using `parseBoqFile()`
- Parsed BOQ saved to Firestore under tender.parsedBoq
- Row metadata updated: fileUrl, fileSize, fileLastModified, parsedBoqName
- Success alert shows file processed

#### 2. **Mobile File Picker** ✅
- Falls back to `expo-document-picker` on mobile platforms
- Attempts to fetch and process the selected file
- If full processing unavailable, user can Save metadata manually
- Gracefully handles missing dependencies with user-friendly alerts

#### 3. **Action Menu Fixes** ✅
- Increased z-index from 1000 to 2000
- Changed table scroll overflow from 'hidden' to 'visible' so menu doesn't clip
- Adjusted positioning (top: 36, right: 8) for better visibility
- Added Save and Cancel buttons to action menu for new/editing rows

#### 4. **Auto-Editable New Rows** ✅
- When "+ Add File" clicked, new row is created with:
  - `isNewRow: true`
  - `isEditing: true`
  - `editingDescription: ''`
  - `editingFileName: ''`
- Description field shows as TextInput
- File Name field shows as TextInput + Browse button
- Action menu shows Save / Cancel instead of Edit / Delete

---

## Testing Checklist

### Prerequisites
- [ ] Firebase project configured (Firestore + Storage)
- [ ] Authentication working (user logged in)
- [ ] Tender document exists with valid ID
- [ ] Network connectivity available

### Web Testing (Expo / React Native Web)

#### Test 1: Add New File Row
```bash
npm run web
# Navigate to Rate Analysis → Tender Detail screen
# Scroll to "BOQ File Metadata" table
# Click "+ Add File"
```

**Expected Results:**
- [ ] New row appears at bottom of table with Sr. No. incremented
- [ ] Description field shows TextInput with placeholder "Enter description..."
- [ ] File Name field shows TextInput with "Browse" button
- [ ] Action menu (⋯) shows "Save" and "Cancel" buttons

#### Test 2: File Browse & Selection (Web)
```
Click Browse button in new row
→ File picker opens
→ Select Excel file (.xlsx, .xls) or BOQ file
```

**Expected Results:**
- [ ] File name appears in File Name field
- [ ] File Size shows human-readable format (KB/MB)
- [ ] File Last Modified shows formatted date
- [ ] Loading spinner appears briefly (upload + parse in progress)
- [ ] After success: "✅ Uploaded and parsed {filename}" alert appears
- [ ] parsedBoqName column shows "✓ Linked"
- [ ] Row is no longer in edit mode (locked in, shows data)

#### Test 3: Manual File Entry + Save
```
Click "+ Add File"
→ Type description manually (e.g., "Primary BOQ")
→ Type file name manually (e.g., "tender_boq_2025.xlsx")
→ Click ⋯ menu → Save
```

**Expected Results:**
- [ ] Validation error if filename is empty
- [ ] Success alert "File metadata saved successfully" if valid
- [ ] Row switches to read-only mode
- [ ] Data persisted to Firestore (tender.boqFileMetadata)

#### Test 4: Edit Existing Row
```
Click ⋯ menu on saved row
→ Click "Edit"
→ Change description
→ Click ⋯ menu → Save
```

**Expected Results:**
- [ ] Description field becomes TextInput
- [ ] Changes persist in Firestore
- [ ] Alert shows "File metadata saved successfully"

#### Test 5: Delete Row
```
Click ⋯ menu
→ Click "Delete"
→ Confirm dialog appears
→ Click "Delete" in dialog
```

**Expected Results:**
- [ ] Row removed from table
- [ ] Success alert "File removed successfully"
- [ ] Sr. No. of remaining rows updated if needed

#### Test 6: Action Menu Visibility
```
Hover over ⋯ button in Action column
→ Menu pops up
```

**Expected Results:**
- [ ] Menu is fully visible (not clipped behind other text)
- [ ] Menu appears centered under the ⋯ button
- [ ] All action items readable without scrolling
- [ ] Menu closes when clicking elsewhere

#### Test 7: BOQ Table Display After Parse
```
Upload BOQ file via new row
→ Wait for "Success" alert
→ Scroll down to "BOQ Table" section
```

**Expected Results:**
- [ ] Parsed BOQ displays with all columns: Sr. No., Description, Unit, Quantity, Rate, Amount
- [ ] Rows populated from uploaded file
- [ ] Data matches original Excel content

---

### Mobile Testing (Android / iOS)

#### Test 1: File Picker on Mobile
```bash
npm run android  # or: npm run ios
# Navigate to Rate Analysis → Tender Detail
# Click "+ Add File" → Browse button
```

**Expected Results (if expo-document-picker installed):**
- [ ] Native file picker opens
- [ ] User can select file from device
- [ ] File name appears in fileName field
- [ ] If File constructor available: auto-uploads and parses
- [ ] If not available: shows alert "File selected. Press Save to persist."

**Expected Results (if expo-document-picker NOT installed):**
- [ ] Alert: "Mobile file picker is not configured."
- [ ] User can manually type file name and click Save

#### Test 2: Mobile Fallback (Manual Entry)
```
Select Browse
→ Not available alert shown
→ Type file name manually
→ Click Save
```

**Expected Results:**
- [ ] Metadata saved to Firestore
- [ ] No parsing occurs (file not uploaded)
- [ ] User informed with alert message

---

### Error Handling Tests

#### Test 1: Large File (> 20MB)
```
Select file > 20MB
→ Click Browse
```

**Expected Results:**
- [ ] Upload fails with error message
- [ ] Error alert shown: "Failed to upload/parse file: {reason}"
- [ ] Row reverts to editable state
- [ ] No corrupted data in Firestore

#### Test 2: Invalid File Type
```
Select non-Excel file (.txt, .docx, etc.)
→ Try to upload
```

**Expected Results (depends on validation):**
- [ ] Parse should fail gracefully
- [ ] Error alert shown: "Failed to upload/parse file: ..."
- [ ] Row metadata may be saved but without parsed BOQ

#### Test 3: Network Failure
```
Disable internet
→ Click Browse and select file
```

**Expected Results:**
- [ ] Upload fails with network error
- [ ] Error alert: "Failed to upload/parse file: network error"
- [ ] Row remains editable
- [ ] User can retry when online

#### Test 4: Missing Firestore Permissions
```
(Requires modified Firebase rules to deny access)
→ Try to save file
```

**Expected Results:**
- [ ] Error alert: "Failed to save file metadata"
- [ ] Row reverts to loading state
- [ ] Console shows permission-denied error

---

## Deployment Steps

### 1. Install Dependencies (if not done)
```bash
cd "d:\APP_PILOT PROJECT"
npm install
# If mobile expo-document-picker support desired:
# expo install expo-document-picker
```

### 2. Run Development Server
```bash
# Web
npm run web

# Android
npm run android

# iOS
npm run ios
```

### 3. Test Sequence (Recommended)
1. Test add/edit/delete on web first
2. Test file browse and auto-parse on web
3. Verify Firestore updates
4. Test on mobile (if available)

### 4. Production Deployment
```bash
# Build for web
npm run build:web

# Deploy to hosting (e.g., Firebase Hosting)
firebase deploy --only hosting
```

---

## Firestore Data Structure

After successful upload:

```javascript
{
  // In tenders/{tenderId}
  boqFileMetadata: [
    {
      id: "boq_1702256400000_abcdef123",
      srNo: 1,
      description: "Primary Tender BOQ",
      fileName: "tender_boq_2025.xlsx",
      fileSize: "2.45 MB",
      fileLastModified: "10 Dec 2025",
      fileUrl: "https://storage.googleapis.com/.../tender_boq_2025.xlsx",
      parsedBoqName: "tender_boq_2025.xlsx",
      saved: true
    }
  ],
  
  // Automatically populated by saveParsedBoq:
  parsedBoq: [
    {
      srNo: "1",
      description: "Excavation",
      unit: "cum",
      quantity: 100,
      tenderRate: 250,
      tenderAmount: 25000,
      // ... full StandardBOQRow structure
    },
    // ... more rows
  ],
  
  boqFiles: [
    {
      name: "tender_boq_2025.xlsx",
      rows: [ /* StandardBOQRow array */ ],
      report: {
        suggestedMapping: { srNo: 0, description: 1, ... },
        sheets: ["Sheet1"],
        rowsParsed: 42
      }
    }
  ],
  
  parsedAt: Timestamp,
  parsedBy: "user-uid",
  boqFileUrl: "https://storage.googleapis.com/.../tender_boq_2025.xlsx"
}
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "Failed to upload/parse file" | Storage upload failed | Check Firebase storage rules, file size, network |
| File picker doesn't open (web) | Browser permissions | Allow file picker in browser permissions |
| File picker doesn't open (mobile) | expo-document-picker not installed | Run `expo install expo-document-picker` |
| "Please select a file" validation | Empty fileName field | Ensure fileName is populated before Save |
| Parsed BOQ doesn't appear | Parse failed silently | Check browser console for parse errors |
| Menu hidden behind text | CSS z-index issue | Ensure z-index: 2000 in actionMenuContainer style |
| No data in Firestore | Permissions denied | Check `membersMap` and Firestore security rules |

---

## Code References

### Key Functions Added

**`handleProcessFile(rowId, file)`**
- Orchestrates upload → parse → save sequence
- Updates UI state throughout process
- Handles errors gracefully

**`pickFileMobile(rowId)`**
- Attempts expo-document-picker import
- Falls back to metadata-only entry if processing unavailable
- Provides user-friendly error messages

**Web File Picker (inline in table cell)**
```tsx
<TouchableOpacity onPress={() => {
  const input = document.createElement('input');
  input.type = 'file';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    await handleProcessFile(rowId, file);
  };
  input.click();
}}
```

---

## Success Criteria

✅ All items below should pass before considering implementation complete:

- [ ] New rows appear editable by default
- [ ] File picker opens on web when Browse clicked
- [ ] Selected files upload to Firebase Storage
- [ ] Uploaded files are automatically parsed
- [ ] Parsed BOQ appears in Firestore
- [ ] BOQ table displays parsed data correctly
- [ ] Action menu visible without clipping
- [ ] Save/Cancel/Edit/Delete actions work
- [ ] Mobile picker works (or shows graceful fallback)
- [ ] Error handling for network/permission failures
- [ ] All data persists across page refresh
- [ ] No console errors in browser DevTools

---

## Future Enhancements

- [ ] Progress bar during upload (% transferred)
- [ ] Batch file upload (select multiple files at once)
- [ ] Drag-and-drop file upload
- [ ] Parse result preview before committing
- [ ] Support for CSV and other formats
- [ ] Template-based column mapping UI
- [ ] Comparison view for multiple BOQ versions
