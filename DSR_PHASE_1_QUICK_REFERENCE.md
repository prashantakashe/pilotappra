# DSR Phase 1 - Quick Reference Guide

## 🚀 Quick Start for Testing

### Start the Development Server
```powershell
cd "d:\APP_PILOT PROJECT"
npm run build:web
# Then in another terminal:
python -m http.server 8000 --directory web-build
# Visit: http://localhost:8000
```

### Navigate to DSR Module
1. **Web App** → Left Sidebar → **Rate Analysis** → **DSR Rate Analysis**
2. Should show empty project list with "Add Project" button

---

## 📁 Phase 1 Component Structure

```
src/
├── components/
│   └── dsr/
│       ├── ProjectDetailsCard.tsx      ← Individual project card
│       ├── ProjectDetailsList.tsx      ← List of all projects
│       ├── AddEditProjectForm.tsx      ← Modal form for create/edit
│       └── index.ts                    ← Exports
├── services/
│   └── dsrService.ts                   ← Firestore CRUD operations
├── screens/
│   └── SSRDSRScreen.tsx                ← Main DSR screen (updated)
├── types/
│   └── dsr.ts                          ← TypeScript interfaces
└── theme/
    ├── colors.ts                       ← Color palette (used)
    └── spacing.ts                      ← Spacing scale (used)
```

---

## 🔧 Key Service Functions

### Create Project
```typescript
const projectId = await dsrService.createProject({
  nameOfWork: "Residential Complex",
  nameOfWorkShort: "RC-2024-001",
  department: "Civil Works",
  targetDateOfSubmission: new Date("2024-12-31"),
  projectLocation: "Mumbai",
  estimatedCost: 5000000
});
```

### Fetch Projects
```typescript
const projects = await dsrService.getProjects();
// Returns: DSRProject[]
```

### Update Project
```typescript
await dsrService.updateProject(projectId, {
  nameOfWork: "Updated Name",
  estimatedCost: 6000000
});
```

### Delete Project
```typescript
await dsrService.deleteProject(projectId);
// Soft delete - sets isActive=false
```

### Real-time Updates
```typescript
const unsubscribe = dsrService.subscribeToProject(
  projectId,
  (project) => {
    console.log("Project updated:", project);
  }
);
// Call unsubscribe() to stop listening
```

---

## 🎨 Component Usage

### In Other Screens
```typescript
import { ProjectDetailsList, AddEditProjectForm } from '../components/dsr';

// In your component:
const [showForm, setShowForm] = useState(false);

<ProjectDetailsList
  onAddProject={() => setShowForm(true)}
  onEditProject={(project) => {
    setSelectedProject(project);
    setShowForm(true);
  }}
/>

<AddEditProjectForm
  visible={showForm}
  project={selectedProject || null}
  onClose={() => {
    setShowForm(false);
    setSelectedProject(null);
  }}
  onSuccess={(projectId) => {
    console.log("Success:", projectId);
  }}
/>
```

---

## 📊 Data Model Quick Reference

### Project Fields
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | Auto | Firebase document ID |
| nameOfWork | string | ✅ | Full project name |
| nameOfWorkShort | string | ✅ | Short code (e.g., RC-001) |
| department | string | ✅ | Department name |
| projectLocation | string | | Optional location |
| targetDateOfSubmission | Date | ✅ | Submission deadline |
| estimatedCost | number | | Optional cost in ₹ |
| status | string | Auto | draft/in-progress/completed |
| createdAt | Date | Auto | Creation timestamp |
| updatedAt | Date | Auto | Last update timestamp |
| createdBy | string | Auto | Firebase UID of creator |
| createdByName | string | Auto | Creator's display name |
| totalBOQFiles | number | Auto | Count of BOQ uploads |
| recapSheets | number | Auto | Count of recap sheets |
| isActive | boolean | Auto | Soft delete flag |

---

## 🔒 Firebase Security Rules

All access controlled by:
1. **Authentication**: `request.auth != null` - User must be logged in
2. **Ownership**: `request.auth.uid == resource.data.createdBy` - Creator can edit/delete
3. **Admin Override**: `request.auth.token.role == 'admin'` - Admins can do anything
4. **Collection-level**: Each subcollection inherits parent rules

---

## 🐛 Common Issues & Solutions

### Issue: "User not authenticated" Error
**Solution**: Ensure user is logged in via Firebase Auth before accessing DSR module

### Issue: Projects not loading
**Solution**: 
1. Check Firestore rules are deployed: `firebase deploy --only firestore:rules`
2. Check browser console for errors: `[DSRService]` logs
3. Verify Firestore database exists in Firebase Console

### Issue: Form not validating
**Solution**: Check field values match required types:
- nameOfWork, nameOfWorkShort, department: non-empty strings
- targetDateOfSubmission: valid Date object
- estimatedCost: if provided, must be valid number

### Issue: Deleted project still showing
**Solution**: Soft delete uses `isActive=false` flag. Projects with `isActive=false` won't appear in lists

---

## 🧪 Test Data

### Sample Project 1
```json
{
  "nameOfWork": "National Highway Expansion - Phase 1",
  "nameOfWorkShort": "NH-EXP-2024-001",
  "department": "Roads & Infrastructure",
  "projectLocation": "Delhi to Jaipur",
  "targetDateOfSubmission": "2024-12-31",
  "estimatedCost": 50000000
}
```

### Sample Project 2
```json
{
  "nameOfWork": "Smart City Water Management System",
  "nameOfWorkShort": "SCWMS-2024-001",
  "department": "Urban Development",
  "projectLocation": "Bangalore",
  "targetDateOfSubmission": "2024-11-30",
  "estimatedCost": 25000000
}
```

---

## 🔄 Phase 2 Preview

**Next Tab: Upload BOQ**
- Upload Excel/PDF files with project rates
- Auto-parse BOQ data
- Generate recap sheets
- File management (view/edit/delete)

**Files to Create:**
- `src/components/dsr/DSRTabs.tsx`
- `src/components/dsr/UploadBOQTab.tsx`
- `src/components/dsr/BOQTableRow.tsx`

**Estimated Effort**: 2-3 days

---

## 📞 Support References

### Service Layer Methods
See `src/services/dsrService.ts` for:
- All CRUD operations
- Real-time subscriptions
- Error handling patterns

### Type Definitions
See `src/types/dsr.ts` for:
- All data structures
- Field requirements
- Optional vs required fields

### Firebase Rules
See `firestore.rules` for:
- Access control policies
- Subcollection permissions
- Validation rules

---

## ✅ Verification Checklist

- [x] Web build succeeds without errors
- [x] All TypeScript types are correct
- [x] All components render without crashing
- [x] Firestore service layer is complete
- [x] Security rules are configured
- [x] Components match app theme
- [x] Forms have proper validation
- [x] Error handling is in place
- [x] Loading states are implemented
- [x] Empty states are shown

**Status**: ✅ Phase 1 Ready for Testing & Deployment

