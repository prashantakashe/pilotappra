# DSR Module Architecture & Data Flow

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Web Browser (Expo Web)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              SSRDSRScreen.tsx                        │       │
│  │         (Main DSR Module Entry Point)                │       │
│  └────────────────┬─────────────────────────────────────┘       │
│                   │                                               │
│        ┌──────────┴──────────┬─────────────────┐                │
│        │                     │                 │                │
│        ▼                     ▼                 ▼                │
│  ┌────────────┐    ┌─────────────────┐   ┌──────────┐         │
│  │ProjectList │    │AddEditForm      │   │Hook      │         │
│  │DetailsList │    │Modal            │   │State Mgmt│         │
│  └─────┬──────┘    └────────┬────────┘   └──────────┘         │
│        │                    │                                   │
│        └────────────┬───────┘                                   │
│                     │                                            │
│                     ▼                                            │
│        ┌────────────────────────────┐                          │
│        │   ProjectDetailsCard       │                          │
│        │   (Renders Individual      │                          │
│        │    Project Cards)          │                          │
│        └──────────┬─────────────────┘                          │
│                   │                                             │
│                   │ Props (edit, delete callbacks)             │
│                   ▼                                             │
└─────────────────────────────────────────────────────────────────┘
        │
        │ All CRUD Operations
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    dsrService.ts                                │
│         (Firestore CRUD Service Layer)                          │
│                                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
│  │  Project    │ │  BOQ        │ │  Recap      │              │
│  │  Operations │ │  Operations │ │  Operations │              │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘              │
│         │                │                │                    │
│  ┌──────┴────────────────┼────────────────┘                   │
│  │                       │                                     │
│  ▼                       ▼                                     │
│  Firestore SDK      Firebase Storage                          │
└─────────────────────────────────────────────────────────────────┘
        │                           │
        ▼                           ▼
┌──────────────────┐      ┌──────────────────┐
│   Firestore DB   │      │  Cloud Storage   │
│                  │      │                  │
│ dsr_projects/    │      │  /dsr/{proj}/    │
│  ├─ {projectId}  │      │   boq_uploads/   │
│  │  ├─ data      │      │                  │
│  │  └─ subs      │      │  (Future Phase)  │
│  │     ├─ boq    │      │                  │
│  │     └─ recap  │      │                  │
│  │               │      │                  │
│  └─ ...          │      │                  │
└──────────────────┘      └──────────────────┘
```

---

## 🔄 Data Flow Diagram

### Create Project Flow
```
User Input (Form)
       │
       ▼
Form Validation
       │
       ├─ Valid? Yes ─→ setLoading(true)
       │                     │
       │                     ▼
       │              dsrService.createProject()
       │                     │
       │                     ▼
       │              Firebase Firestore
       │                     │
       │                     ├─ Create dsr_projects/{id}
       │                     ├─ Set Timestamps
       │                     ├─ Set createdBy
       │                     │
       │                     ▼
       │              Returns: projectId
       │                     │
       │                     ▼
       │              Alert: "Created Successfully"
       │              onSuccess(projectId)
       │              setLoading(false)
       │              Modal closes
       │
       └─ Valid? No ──→ Display field errors
                        Form stays open
```

### Fetch Projects Flow
```
Component Mount OR Pull-to-Refresh
       │
       ▼
setLoading(true) / setRefreshing(true)
       │
       ▼
dsrService.getProjects()
       │
       ├─ Query: WHERE isActive == true
       ├─ Order: BY createdAt DESC
       │
       ▼
Firestore returns snapshot
       │
       ├─ Success ──→ Map docs to DSRProject[]
       │               │
       │               ▼
       │               Convert Timestamps to Dates
       │               │
       │               ▼
       │               setProjects(data)
       │               setLoading(false)
       │               Render list
       │
       └─ Error ──→ setError(message)
                     Show error state
                     Display retry button
```

### Edit Project Flow
```
User clicks "Edit" on card
       │
       ▼
onEdit(project) callback
       │
       ▼
setSelectedProject(project)
setShowForm(true)
       │
       ▼
Form Modal Opens
       │
       ├─ Fill form data from project
       ├─ Title shows: "Edit Project"
       │
       ▼
User modifies fields
       │
       ▼
User clicks "Update"
       │
       ▼
Validate form
       │
       ├─ Valid? Yes ──→ setLoading(true)
       │                     │
       │                     ▼
       │              dsrService.updateProject(id, updates)
       │                     │
       │                     ▼
       │              Firestore updateDoc()
       │              ├─ Update fields
       │              ├─ Set updatedAt
       │              ├─ Verify createdBy unchanged
       │              │
       │              ▼
       │              Success Alert
       │              Modal closes
       │              List refreshes
       │
       └─ Valid? No ──→ Show field errors
```

### Delete Project Flow
```
User clicks "Delete"
       │
       ▼
Confirmation Alert
       │
       ├─ User clicks "Cancel"
       │   │
       │   ▼
       │   Dialog closes, no action
       │
       └─ User clicks "Delete"
           │
           ▼
           setIsDeleting(true)
           │
           ▼
           dsrService.deleteProject(projectId)
           │
           ├─ Set isActive = false (soft delete)
           ├─ Set updatedAt
           │
           ▼
           Firestore updateDoc()
           │
           ▼
           Success
           │
           ├─ setIsDeleting(false)
           ├─ Call onDelete(projectId)
           ├─ Remove from local state
           ├─ Update project count
           │
           ▼
           Card disappears from list
```

### Real-time Update Flow (Future)
```
Subscribe to project changes
       │
       ▼
dsrService.subscribeToProject(projectId, callback)
       │
       ▼
onSnapshot(docRef, (snapshot) => {
       │
       ├─ Document exists? 
       │   ├─ Yes ──→ Parse data
       │   │          Call callback(project)
       │   │
       │   └─ No ───→ Call callback(null)
       │
       ▼
Callback updates component state
       │
       ▼
Component re-renders with latest data
       │
       ▼
unsubscribe() to cleanup
```

---

## 📊 Component Hierarchy

```
SSRDSRScreen
│
├── ProjectDetailsList
│   │
│   ├── Header Section
│   │   ├── Title "DSR Projects"
│   │   ├── Project Count Badge
│   │   └── Add Button (FAB)
│   │
│   ├── ScrollView
│   │   ├── RefreshControl (Pull-to-refresh)
│   │   │
│   │   ├── [ProjectDetailsCard] × N projects
│   │   │   ├── Header (Title, Status Badge)
│   │   │   ├── Details Grid (Department, Location, Date, Cost)
│   │   │   ├── Stats Row (BOQ Count, Recap Count, Created Date)
│   │   │   └── Action Row (Edit, Delete buttons)
│   │   │
│   │   └── Empty State / Error State
│   │
│   └── Loading State
│
└── AddEditProjectForm (Modal)
    │
    ├── Header
    │   ├── Back Button
    │   ├── Title ("New Project" / "Edit Project")
    │   └── Close Indicator
    │
    ├── ScrollView (Form Content)
    │   ├── FormInput (nameOfWork)
    │   ├── FormInput (nameOfWorkShort)
    │   ├── FormInput (department)
    │   ├── FormInput (projectLocation)
    │   ├── DatePickerModal (targetDate)
    │   ├── FormInput (estimatedCost)
    │   └── Required Fields Note
    │
    └── Footer
        ├── Cancel Button
        └── Submit Button (with Loading)
```

---

## 🗄️ Firestore Data Structure

### Collections & Documents

```
dsr_projects/
│
├── {projectId}
│   ├── id: string
│   ├── nameOfWork: string
│   ├── nameOfWorkShort: string
│   ├── department: string
│   ├── projectLocation: string (optional)
│   ├── targetDateOfSubmission: Timestamp
│   ├── estimatedCost: number (optional)
│   ├── status: "draft" | "in-progress" | "completed"
│   ├── createdAt: Timestamp
│   ├── updatedAt: Timestamp
│   ├── createdBy: string (uid)
│   ├── createdByName: string
│   ├── lastModifiedBy: string (uid)
│   ├── totalBOQFiles: number
│   ├── recapSheets: number
│   ├── isActive: boolean
│   │
│   ├── boq_uploads/ (subcollection)
│   │   └── {uploadId}
│   │       ├── id: string
│   │       ├── projectId: string
│   │       ├── srNo: number
│   │       ├── description: string
│   │       ├── fileName: string
│   │       ├── fileSize: number
│   │       ├── fileFormat: string
│   │       ├── fileUrl: string
│   │       ├── fileLastModified: Timestamp
│   │       ├── createdAt: Timestamp
│   │       ├── uploadedBy: string
│   │       ├── uploadedByName: string
│   │       └── isProcessed: boolean
│   │
│   ├── recap_sheets/ (subcollection)
│   │   └── {recapId}
│   │       ├── id: string
│   │       ├── projectId: string
│   │       ├── srNo: number
│   │       ├── description: string
│   │       ├── fileName: string
│   │       ├── recapData: array
│   │       ├── totalQuantity: number
│   │       ├── totalAmount: number
│   │       ├── createdAt: Timestamp
│   │       ├── updatedAt: Timestamp
│   │       └── createdBy: string
│   │
│   ├── summary_sheets/ (subcollection) [Phase 4]
│   ├── abstract_sheets/ (subcollection) [Phase 4]
│   ├── measurement_sheets/ (subcollection) [Phase 4]
│   ├── rate_analysis/ (subcollection) [Phase 4]
│   ├── lead_charts/ (subcollection) [Phase 4]
│   ├── final_boq/ (subcollection) [Phase 4]
│   │
│   └── file_operations/ (subcollection - audit trail)
│       └── {operationId}
│           ├── type: "upload" | "download" | "delete"
│           ├── fileName: string
│           ├── timestamp: Timestamp
│           ├── performedBy: string
│           └── details: object
```

---

## 🔐 Firebase Security Rules Architecture

```
Firestore Security Rules
│
├── Authentication Check
│   └── request.auth != null
│       (User must be logged in)
│
├── dsr_projects Collection
│   │
│   ├── READ (list/get)
│   │   └── request.auth != null && resource.data.isActive == true
│   │
│   ├── CREATE
│   │   ├── request.auth != null
│   │   ├── request.resource.data.nameOfWork != null
│   │   ├── request.resource.data.nameOfWorkShort != null
│   │   ├── request.resource.data.department != null
│   │   └── request.resource.data.targetDateOfSubmission != null
│   │
│   ├── UPDATE
│   │   ├── request.auth != null
│   │   ├── (creator OR admin)
│   │   └── createdBy field unchanged
│   │
│   ├── DELETE
│   │   └── (creator OR admin)
│   │
│   └── Subcollections (boq_uploads, recap_sheets, etc.)
│       ├── Same auth checks
│       ├── Read: All authenticated users
│       ├── Write: Creator or admin
│       └── Delete: Creator or admin
```

---

## 🔄 State Management Pattern

### Component State Structure
```typescript
// SSRDSRScreen
{
  showAddForm: boolean,          // Form modal visibility
  selectedProject: DSRProject | null  // For edit operations
}

// ProjectDetailsList
{
  projects: DSRProject[],        // Current list of projects
  isLoading: boolean,            // Initial load state
  isRefreshing: boolean,         // Pull-to-refresh state
  error: string | null           // Error message if any
}

// AddEditProjectForm
{
  formData: {
    nameOfWork: string,
    nameOfWorkShort: string,
    department: string,
    projectLocation: string,
    targetDateOfSubmission: Date,
    estimatedCost: string
  },
  errors: Record<string, string>, // Field-level errors
  isLoading: boolean,             // Submission state
  showDatePicker: boolean         // Date picker modal state
}

// ProjectDetailsCard
{
  isDeleting: boolean  // Delete operation state
}
```

---

## 🎯 Service Layer Architecture

```
dsrService
│
├── Project Operations
│   ├── createProject(data) → Promise<string>
│   ├── getProjects() → Promise<DSRProject[]>
│   ├── getProject(id) → Promise<DSRProject | null>
│   ├── updateProject(id, updates) → Promise<void>
│   ├── deleteProject(id) → Promise<void>
│   ├── subscribeToProject(id, callback) → unsubscribe fn
│   │
│   └── Internal Helpers
│       ├── validateAuth()
│       ├── convertTimestamp(timestamp)
│       └── logOperation(action, docId)
│
├── BOQ Upload Operations
│   ├── addBOQUpload(projectId, upload) → Promise<string>
│   ├── getBOQUploads(projectId) → Promise<DSRBOQUpload[]>
│   ├── deleteBOQUpload(projectId, uploadId) → Promise<void>
│   └── subscribeToBOQUploads(projectId, callback) → unsubscribe fn
│
├── Recap Sheet Operations
│   ├── createRecapSheet(projectId, recap) → Promise<string>
│   ├── getRecapSheets(projectId) → Promise<DSRRecapSheet[]>
│   │
│   └── Future: [summary, abstract, measurement, rate, lead, final]
│
└── Firestore Integration
    ├── Firebase Initialization (db, auth)
    ├── Firestore Collections Refs
    ├── Transaction Handling
    ├── Batch Operations
    └── Error Logging
```

---

## 🎨 Theme Integration

```
Colors (theme/colors.ts)
├── ACTION_BLUE (#1E90FF) → Primary actions
├── SUCCESS_GREEN (#4CAF50) → Success states
├── ERROR_RED (#FF4444) → Errors, delete actions
├── TEXT_PRIMARY (#222222) → Main text
├── TEXT_SECONDARY (#666666) → Secondary text
└── BORDER_LIGHT (#E0E0E0) → Dividers, borders

Spacing (theme/spacing.ts)
├── xs → 4px
├── sm → 8px
├── md → 12px
├── lg → 16px
├── xl → 24px
└── xxl → 32px

Typography
├── Heading (24px, 700) → Page titles
├── Subheading (18px, 600) → Section headers
├── Body (14px, 400) → Content
├── Small (12px, 400) → Labels, hints
└── Bold labels (12px, 600) → Field names
```

---

## 📈 Error Flow Architecture

```
Operation (Create/Read/Update/Delete)
│
└──try/catch
   │
   ├─ Success Path
   │  │
   │  ├─ [DSRService] Log success
   │  ├─ Return data/id
   │  ├─ Component updates state
   │  ├─ Show success alert
   │  │
   │  └─ User sees confirmation
   │
   └─ Error Path
      │
      ├─ catch(error)
      │  │
      │  ├─ [DSRService] Log error details
      │  ├─ Pass to component
      │  │
      │  ▼
      ├─ Component handles error
      │  │
      │  ├─ setError(message)
      │  ├─ Show error alert to user
      │  ├─ Disable relevant buttons
      │  │
      │  ▼
      ├─ User sees error message
      │  │
      │  ├─ Retry button (if applicable)
      │  ├─ Cancel/Close option
      │  │
      │  └─ Form stays open for correction
```

---

## 🚀 Optimization Strategies

### Performance
- ✅ List pagination (implement in Phase 2 if needed)
- ✅ Memoized components (React.memo)
- ✅ Efficient Firestore queries (isActive, order, limit)
- ✅ Bundle optimization (3.63 MB already optimized)

### UX
- ✅ Loading states during operations
- ✅ Optimistic UI updates (show before confirmation)
- ✅ Empty/error states with helpful messages
- ✅ Confirmation dialogs for destructive actions

### Code
- ✅ Service layer abstraction
- ✅ Type-safe interfaces
- ✅ Reusable form components
- ✅ Proper error boundaries (future)

---

## 📝 API Documentation

### createProject(projectData)
```typescript
// Input
{
  nameOfWork: "Project Name",        // required
  nameOfWorkShort: "PN-001",         // required
  department: "Dept",                // required
  projectLocation: "City",           // optional
  targetDateOfSubmission: Date,      // required
  estimatedCost: 5000000             // optional
}

// Output
"documentId" // Firebase document ID

// Errors
Error("User not authenticated")
Error("Field validation failed")
Error("Firebase operation failed")
```

### updateProject(projectId, updates)
```typescript
// Input
projectId: "abc123"
updates: Partial<DSRProject>

// Output
void

// Side Effects
- Updates updatedAt timestamp
- Sets lastModifiedBy to current user
- Prevents changing createdBy field
```

---

This architecture document provides a complete view of how Phase 1 components, services, and Firebase integrate together. Use as reference for Phase 2+ development.

