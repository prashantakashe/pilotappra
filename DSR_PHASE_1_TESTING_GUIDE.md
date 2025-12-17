# DSR Phase 1 - Integration Testing Guide

## 🧪 Testing Overview

This guide provides step-by-step instructions for testing the DSR Phase 1 implementation (Project Details management).

**Prerequisites:**
- Web app built and running on localhost:8000
- Logged into Firebase authentication
- Internet connection (for Firestore operations)

---

## ✅ Test Case 1: View Empty Project List

### Setup
- Just completed first login to app
- Navigate to DSR Rate Analysis section

### Steps
1. Go to Rate Analysis sidebar menu
2. Click "DSR Rate Analysis" 
3. Observe Project Details list

### Expected Results
✅ Screen shows:
- "DSR Projects" title with "0 projects found" subtitle
- Empty state illustration (folder icon)
- "No projects yet" heading
- "Create your first DSR project to get started" text
- "New Project" button in center
- "Add Project" floating button (top-right)

### Pass/Fail
- **PASS** if all elements visible and clickable
- **FAIL** if any element missing or error shown

---

## ✅ Test Case 2: Create New Project - Minimal Fields

### Steps
1. Click "Add Project" button (from Test 1)
2. Fill form:
   - Project Name: "Test Project Alpha"
   - Short Name: "TPA-001"
   - Department: "Testing"
   - Leave Location empty
   - Select any future date for submission
   - Leave Cost empty
3. Click "Create" button

### Expected Results
✅ Form shows:
- Modal opens with "New Project" title
- All form fields rendered
- Required fields marked with "*"
- Date picker works when tapped

✅ After submission:
- Success alert: "Project created successfully"
- Modal closes
- Project appears in list
- Card shows:
  - Project Name: "Test Project Alpha"
  - Short Name: "TPA-001"
  - Department: "Testing"
  - Status badge: "Draft"
  - 0 BOQ Files, 0 Recap Sheets

### Pass/Fail
- **PASS** if project created and visible in list
- **FAIL** if error alert or project not appearing

---

## ✅ Test Case 3: Create New Project - All Fields

### Steps
1. Click "Add Project" button
2. Fill complete form:
   - Project Name: "Highway Construction Project"
   - Short Name: "HCP-2024-001"
   - Department: "Infrastructure"
   - Location: "Mumbai to Pune"
   - Submission Date: "2024-12-31"
   - Estimated Cost: "75000000"
3. Click "Create"

### Expected Results
✅ Form accepts all inputs without errors
✅ Success alert shown
✅ Project appears with all fields displayed:
  - Name: "Highway Construction Project"
  - Short: "HCP-2024-001"
  - Department: "Infrastructure"
  - Location: "Mumbai to Pune"
  - Submission: "31 Dec 2024"
  - Est. Cost: "₹ 7,50,00,000" (formatted)

### Pass/Fail
- **PASS** if all fields saved and formatted correctly
- **FAIL** if any field missing or formatting wrong

---

## ✅ Test Case 4: Form Validation - Required Fields

### Steps
1. Click "Add Project"
2. Try submitting with empty form
   - Leave all fields blank
   - Click "Create"
3. Repeat for each required field:
   - Leave only "Project Name" filled
   - Leave only "Short Name" filled
   - Leave only "Department" filled
   - Leave only "Submission Date" selected

### Expected Results
✅ Error messages appear:
- "Project name is required"
- "Short name is required"
- "Department is required"
- "Submission date is required"

✅ Form doesn't submit with validation errors
✅ Can fix one field and try again

### Pass/Fail
- **PASS** if all required field validations work
- **FAIL** if form submits with missing required fields

---

## ✅ Test Case 5: Form Validation - Invalid Cost

### Steps
1. Click "Add Project"
2. Fill valid fields:
   - Project Name: "Test"
   - Short Name: "TST-001"
   - Department: "Test"
   - Date: Select future date
3. In Cost field, enter: "abc123xyz"
4. Click "Create"

### Expected Results
✅ Error message: "Must be a valid number"
✅ Form doesn't submit
✅ Can clear field and try again

### Pass/Fail
- **PASS** if cost validation catches non-numeric input
- **FAIL** if form accepts invalid cost format

---

## ✅ Test Case 6: Edit Project

### Setup
- At least one project exists from Test 2 or 3

### Steps
1. Find project card "Test Project Alpha"
2. Click "Edit" button on that card
3. Form opens in modal showing:
   - "Edit Project" title
   - All current values pre-filled
4. Change Department: "Testing" → "Quality Assurance"
5. Click "Update"

### Expected Results
✅ Form shows correct mode: "Edit Project" title
✅ All fields pre-populated with current values
✅ Edit succeeds with alert: "Project updated successfully"
✅ Project card shows updated department: "Quality Assurance"

### Pass/Fail
- **PASS** if project updated successfully
- **FAIL** if edit fails or values not updated

---

## ✅ Test Case 7: Delete Project - Confirmation

### Setup
- Project "Test Project Alpha" exists from previous tests

### Steps
1. Click "Delete" button on project card
2. Observe confirmation dialog
3. Click "Cancel"
4. Observe card still present

### Expected Results
✅ Alert dialog shows:
- Title: "Delete Project"
- Message: "Are you sure you want to delete "Test Project Alpha"? This action cannot be undone."
- Buttons: "Cancel" and "Delete"

✅ After clicking Cancel:
- Dialog closes
- Project still visible in list

### Pass/Fail
- **PASS** if confirmation dialog shown and Cancel works
- **FAIL** if project deleted without confirmation

---

## ✅ Test Case 8: Delete Project - Complete

### Setup
- Project exists from previous test

### Steps
1. Click "Delete" on a project card
2. Click "Delete" in confirmation dialog
3. Wait for operation to complete

### Expected Results
✅ Delete button shows loading spinner during delete
✅ Success (no alert needed, just removal)
✅ Project disappears from list immediately
✅ Project count updates (e.g., "1 project found" → "0 projects found")

### Pass/Fail
- **PASS** if project deleted and removed from list
- **FAIL** if project remains or error shown

---

## ✅ Test Case 9: Pull-to-Refresh

### Setup
- At least 2 projects in list

### Steps
1. Manually delete a project from Firebase Console or another session
2. In app, pull down on project list (scroll up past top)
3. Release to trigger refresh
4. Wait for refresh to complete

### Expected Results
✅ RefreshControl spinner appears
✅ Spinner disappears after refresh
✅ Deleted project no longer shows in list
✅ Project count is accurate

### Pass/Fail
- **PASS** if refresh works and reflects Firestore changes
- **FAIL** if refresh doesn't update list

---

## ✅ Test Case 10: Multiple Project Management

### Steps
1. Create 5 new projects with different names:
   - Project A (Department: Civil)
   - Project B (Department: Electrical)
   - Project C (Department: Mechanical)
   - Project D (Department: Civil)
   - Project E (Department: Structural)
2. Scroll through entire list
3. Verify project counts in cards

### Expected Results
✅ All 5 projects visible in scrollable list
✅ Cards display in reverse chronological order (newest first)
✅ Header shows "5 projects found"
✅ Each project card shows:
   - Correct name and department
   - Correct creation date
   - 0 BOQ Files, 0 Recap Sheets
✅ Smooth scrolling with no lag

### Pass/Fail
- **PASS** if all projects visible and ordered correctly
- **FAIL** if missing projects or incorrect ordering

---

## ✅ Test Case 11: Date Picker Functionality

### Steps
1. Click "Add Project"
2. Tap on "Target Submission Date" field
3. In date picker:
   - Navigate to December 2024
   - Select 25th
4. Verify date shown: "25 Dec 2024"
5. Click different dates multiple times
6. Complete form and submit

### Expected Results
✅ Date picker modal opens when tapping date field
✅ Can select past dates (disabled) and future dates (enabled)
✅ Selected date displays correctly
✅ Date persists in form
✅ Creates project with correct date

### Pass/Fail
- **PASS** if date picker works and dates save correctly
- **FAIL** if date selection not working

---

## ✅ Test Case 12: Loading States

### Steps
1. Create project (slow internet simulation)
2. Observe delete operation
3. During form submission/delete, try:
   - Clicking buttons again
   - Closing form
   - Navigating away

### Expected Results
✅ Create/Update: Submit button disabled with loading spinner
✅ Delete: Delete button disabled with loading spinner
✅ Form cannot be closed during submission
✅ No duplicate submissions
✅ All operations complete successfully

### Pass/Fail
- **PASS** if loading states prevent user errors
- **FAIL** if operations fail or duplicate

---

## ✅ Test Case 13: Error Handling - Network Error

### Setup
- Turn off internet while app is open

### Steps
1. Try to fetch projects (pull to refresh)
2. Try to create new project
3. Turn internet back on
4. Retry operations

### Expected Results
✅ Fetch error shows alert with error message
✅ Create error shows alert with error message
✅ Retry button works after reconnect
✅ Operations succeed when internet restored

### Pass/Fail
- **PASS** if graceful error handling with retry
- **FAIL** if app crashes or hangs

---

## ✅ Test Case 14: Error Handling - Invalid Form Data

### Steps
1. Create project with all fields valid
2. Somehow change data before submit (console manipulation)
3. Or submit with special characters:
   - Name: "Test <script>alert()</script>"
   - Department: "Dept™ © ®"

### Expected Results
✅ Form sanitizes input and submits
✅ Project creates without XSS vulnerabilities
✅ Special characters displayed correctly in card
✅ Firestore stores data safely

### Pass/Fail
- **PASS** if special characters handled safely
- **FAIL** if XSS vulnerability or data corruption

---

## ✅ Test Case 15: UI Responsiveness - Different Screen Sizes

### Setup
- Test on different device sizes or browser widths

### Steps
1. On mobile (375px width):
   - Create project, view list, edit, delete
2. On tablet (800px width):
   - Same operations
3. On desktop (1920px width):
   - Same operations

### Expected Results
✅ Mobile:
- Cards stack vertically
- Buttons full width
- Text readable without horizontal scroll
- Single column layout

✅ Tablet:
- Responsive layout
- Good spacing
- All elements accessible

✅ Desktop:
- Cards properly spaced
- Optimal reading width
- No excessive white space

### Pass/Fail
- **PASS** if responsive across all sizes
- **FAIL** if text unreadable or overlapping on any size

---

## 🔍 Console Logging Verification

### Steps
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Perform these actions:
   - Create project
   - Fetch projects
   - Edit project
   - Delete project
   - Refresh projects

### Expected Console Output
```
[DSRService] Project created: abc123
[DSRService] Project updated: abc123
[DSRService] Project deleted: abc123
[DSRService] Error fetching projects: [error details]
[ProjectDetailsList] Error fetching projects: [error details]
[AddEditProjectForm] Error: [error details]
```

### Pass/Fail
- **PASS** if console logs follow expected pattern
- **FAIL** if missing logs or error details

---

## 📋 Test Summary Sheet

| Test Case | Feature | Status | Notes |
|-----------|---------|--------|-------|
| 1 | View Empty List | ⭕ | |
| 2 | Create - Minimal | ⭕ | |
| 3 | Create - All Fields | ⭕ | |
| 4 | Form Validation | ⭕ | |
| 5 | Cost Validation | ⭕ | |
| 6 | Edit Project | ⭕ | |
| 7 | Delete - Confirmation | ⭕ | |
| 8 | Delete - Complete | ⭕ | |
| 9 | Refresh | ⭕ | |
| 10 | Multiple Projects | ⭕ | |
| 11 | Date Picker | ⭕ | |
| 12 | Loading States | ⭕ | |
| 13 | Error Handling | ⭕ | |
| 14 | Form Security | ⭕ | |
| 15 | Responsiveness | ⭕ | |

**Legend:**
- ⭕ To Test
- ✅ Pass
- ❌ Fail

---

## 🐛 Bug Report Template

If you find issues, please report:

```markdown
## Bug Title: [Short description]

**Severity:** [Critical/High/Medium/Low]

**Test Case:** [Which test case exposed this]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happens]

**Screenshots:**
[Include if possible]

**Console Errors:**
[Any error messages]

**Device/Browser:**
[Device type and browser version]

**Reproducibility:**
[Always/Sometimes/First time only]
```

---

## ✅ Sign-Off

After completing all 15 test cases:

- Date Tested: _____________
- Tester Name: _____________
- Test Result: ✅ All Pass / ⚠️ Some Issues
- Issues Count: _____________
- Ready for Phase 2: ✅ Yes / ❌ No

---

**Phase 1 Testing Complete!** 🎉

Proceed to Phase 2 (Upload BOQ Tab) after resolving any critical issues.

