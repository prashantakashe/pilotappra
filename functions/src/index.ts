// functions/src/index.ts
import * as functions from 'firebase-functions';
import admin from 'firebase-admin';
import cors from 'cors';

// Initialize Firebase Admin
admin.initializeApp();

const corsHandler = cors({ 
  origin: true,
  credentials: true 
});

// Export migration function
export { migrateTendersAddStage1 } from './migrateTenders';

/**
 * Cloud Function to handle mediated messages
 * This function validates the user and creates message documents
 * No direct client-to-client contact is allowed
 */
export const sendMediatedMessage = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated.'
    );
  }

  const { toUserId, content, subject } = data;

  // Validate input
  if (!toUserId || !content) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields: toUserId and content'
    );
  }

  if (typeof content !== 'string' || content.trim().length === 0) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Message content must be a non-empty string'
    );
  }

  try {
    // Verify recipient exists
    const recipientDoc = await admin
      .firestore()
      .collection('users')
      .doc(toUserId)
      .get();

    if (!recipientDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Recipient user not found'
      );
    }

    // Prevent self-messaging (optional)
    if (context.auth.uid === toUserId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Cannot send message to yourself'
      );
    }

    // Create message document (server-side only)
    const messageRef = await admin
      .firestore()
      .collection('messages')
      .add({
        fromUserId: context.auth.uid,
        toUserId: toUserId,
        content: content.trim(),
        subject: subject || 'No Subject',
        status: 'new', // new, read, archived
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // Log audit event
    await admin
      .firestore()
      .collection('audit_logs')
      .add({
        action: 'MESSAGE_SENT',
        performedBy: context.auth.uid,
        toUser: toUserId,
        messageId: messageRef.id,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        meta: {
          contentLength: content.length,
        },
      });

    // Optional: Send notification email to recipient
    // This would require a third-party email service (SendGrid, Mailgun, etc.)
    // Example:
    // const recipient = recipientDoc.data();
    // await sendEmailNotification(recipient.email, context.auth.uid, content);

    return {
      success: true,
      messageId: messageRef.id,
      message: 'Message sent successfully',
    };
  } catch (error) {
    console.error('Error in sendMediatedMessage:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while sending the message'
    );
  }
});

/**
 * Cloud Function to handle HTTP requests
 * Provides a REST endpoint for messaging if needed
 */
export const sendMediatedMessageHttp = functions.https.onRequest(
  (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      try {
        // Verify Firebase token
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }

        const decodedToken = await admin.auth().verifyIdToken(token);
        const { toUserId, content, subject } = req.body;

        if (!toUserId || !content) {
          res.status(400).json({ error: 'Missing required fields' });
          return;
        }

        // Create message
        const messageRef = await admin
          .firestore()
          .collection('messages')
          .add({
            fromUserId: decodedToken.uid,
            toUserId: toUserId,
            content,
            subject: subject || 'No Subject',
            status: 'new',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

        res.json({
          success: true,
          messageId: messageRef.id,
        });
      } catch (error) {
        console.error('Error in sendMediatedMessageHttp:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
  }
);

/**
 * Cloud Function to handle user creation
 * Create additional user metadata when a user is created via Auth
 */
export const createUserRecord = functions.auth.user().onCreate(async (user) => {
  try {
    await admin
      .firestore()
      .collection('users')
      .doc(user.uid)
      .set({
        email: user.email,
        name: user.displayName || 'User',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        role: 'user',
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      });

    console.log(`User record created for: ${user.uid}`);
  } catch (error) {
    console.error('Error creating user record:', error);
  }
});

/**
 * Cloud Function to handle user deletion
 * Clean up user data when a user is deleted from Auth
 */
export const deleteUserRecord = functions.auth.user().onDelete(async (user) => {
  try {
    // Delete user document
    await admin.firestore().collection('users').doc(user.uid).delete();

    // Optional: Clean up related documents
    const messagesSnapshot = await admin
      .firestore()
      .collection('messages')
      .where('fromUserId', '==', user.uid)
      .limit(100)
      .get();

    const batch = admin.firestore().batch();
    messagesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    console.log(`User record deleted for: ${user.uid}`);
  } catch (error) {
    console.error('Error deleting user record:', error);
  }
});

// =========================
// Rate Analysis Functions
// =========================

type RateBreakdown = {
  materials: number;
  labour: number;
  plant: number;
  transport: number;
  overheads: number;
  profit: number;
  other?: number;
};

const computeRate = (rb: RateBreakdown): number => {
  const base =
    (rb.materials || 0) +
    (rb.labour || 0) +
    (rb.plant || 0) +
    (rb.transport || 0) +
    (rb.overheads || 0) +
    (rb.profit || 0) +
    (rb.other || 0);
  return Math.max(0, Number(base.toFixed(2)));
};

const getTenderAndRole = async (tenderId: string, uid: string) => {
  const tenderRef = admin.firestore().collection('tenders').doc(tenderId);
  const snap = await tenderRef.get();
  if (!snap.exists) {
    throw new functions.https.HttpsError('not-found', 'Tender not found');
  }
  const data = snap.data() as any;
  const role = data?.membersMap?.[uid] || null;
  const allowedRoles: string[] = data?.rateAnalysisAllowedRoles || [];
  return { tenderRef, tender: data, role, allowedRoles };
};

const assertMember = (role: string | null, uid: string) => {
  if (!role) {
    throw new functions.https.HttpsError(
      'permission-denied',
      `User ${uid} is not a member of this tender`
    );
  }
};

const assertEditor = (role: string | null, allowed: string[], uid: string) => {
  if (!role || !allowed.includes(role) ) {
    throw new functions.https.HttpsError(
      'permission-denied',
      `User ${uid} does not have edit permission`
    );
  }
};

export const raCreate = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }
  const uid = context.auth.uid;
  const { tenderId, rateAnalysis } = data || {};
  if (!tenderId || !rateAnalysis) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing args');
  }

  const { tenderRef, role, allowedRoles } = await getTenderAndRole(tenderId, uid);
  assertEditor(role, allowedRoles, uid);

  const raRef = tenderRef.collection('rateAnalysis').doc();
  const rb: RateBreakdown = rateAnalysis.rateBreakdown || {};
  const computedRate = computeRate(rb);
  const quantity = Number(rateAnalysis.quantity || 0);
  const totalAmount = Number((computedRate * quantity).toFixed(2));

  const now = admin.firestore.FieldValue.serverTimestamp();
  const doc = {
    id: raRef.id,
    tenderId,
    boqItemId: rateAnalysis.boqItemId || null,
    description: rateAnalysis.description || '',
    unit: rateAnalysis.unit || '',
    quantity,
    rateBreakdown: {
      materials: Number(rb.materials || 0),
      labour: Number(rb.labour || 0),
      plant: Number(rb.plant || 0),
      transport: Number(rb.transport || 0),
      overheads: Number(rb.overheads || 0),
      profit: Number(rb.profit || 0),
      other: Number(rb.other || 0),
    },
    computedRate,
    totalAmount,
    lastEditedBy: uid,
    lastEditedAt: now,
    version: 1,
    status: 'draft',
    isLocked: false,
    lockedBy: null,
    lockedAt: null,
  } as any;

  await raRef.set(doc);

  await admin.firestore().collection('audit_logs').add({
    action: 'create',
    docPath: `tenders/${tenderId}/rateAnalysis/${raRef.id}`,
    performedBy: uid,
    timestamp: now,
    diff: { created: true },
    oldVersion: 0,
    newVersion: 1,
  });

  return { success: true, id: raRef.id };
});

export const raUpdate = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }
  const uid = context.auth.uid;
  const { tenderId, raId, changes } = data || {};
  if (!tenderId || !raId || !changes) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing args');
  }

  const { tenderRef, role, allowedRoles } = await getTenderAndRole(tenderId, uid);
  assertEditor(role, allowedRoles, uid);

  const raRef = tenderRef.collection('rateAnalysis').doc(raId);
  const snap = await raRef.get();
  if (!snap.exists) throw new functions.https.HttpsError('not-found', 'RA not found');
  const current = snap.data() as any;
  if (current.isLocked && current.lockedBy !== uid) {
    throw new functions.https.HttpsError('failed-precondition', 'Document is locked');
  }

  const rb: RateBreakdown = (changes.rateBreakdown ?? current.rateBreakdown) || {};
  const quantity: number = changes.quantity !== undefined ? Number(changes.quantity) : Number(current.quantity || 0);
  const computedRate = computeRate(rb);
  const totalAmount = Number((computedRate * quantity).toFixed(2));

  const now = admin.firestore.FieldValue.serverTimestamp();
  const nextVersion = Number(current.version || 1) + 1;

  const update: any = {
    ...changes,
    rateBreakdown: {
      materials: Number((changes.rateBreakdown?.materials ?? rb.materials) || 0),
      labour: Number((changes.rateBreakdown?.labour ?? rb.labour) || 0),
      plant: Number((changes.rateBreakdown?.plant ?? rb.plant) || 0),
      transport: Number((changes.rateBreakdown?.transport ?? rb.transport) || 0),
      overheads: Number((changes.rateBreakdown?.overheads ?? rb.overheads) || 0),
      profit: Number((changes.rateBreakdown?.profit ?? rb.profit) || 0),
      other: Number((changes.rateBreakdown?.other ?? rb.other) || 0),
    },
    quantity,
    computedRate,
    totalAmount,
    lastEditedBy: uid,
    lastEditedAt: now,
    version: nextVersion,
  };

  await raRef.update(update);
  await admin.firestore().collection('audit_logs').add({
    action: 'update',
    docPath: `tenders/${tenderId}/rateAnalysis/${raId}`,
    performedBy: uid,
    timestamp: now,
    diff: changes,
    oldVersion: current.version || 1,
    newVersion: nextVersion,
  });
  return { success: true };
});

export const raDelete = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  const uid = context.auth.uid;
  const { tenderId, raId } = data || {};
  if (!tenderId || !raId) throw new functions.https.HttpsError('invalid-argument', 'Missing args');

  const { tenderRef, role, allowedRoles } = await getTenderAndRole(tenderId, uid);
  assertEditor(role, allowedRoles, uid);

  const raRef = tenderRef.collection('rateAnalysis').doc(raId);
  const snap = await raRef.get();
  if (!snap.exists) return { success: true };
  const current = snap.data() as any;
  if (current.isLocked && current.lockedBy !== uid) {
    throw new functions.https.HttpsError('failed-precondition', 'Document is locked');
  }

  await raRef.delete();
  await admin.firestore().collection('audit_logs').add({
    action: 'delete',
    docPath: `tenders/${tenderId}/rateAnalysis/${raId}`,
    performedBy: uid,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    diff: { deleted: true },
    oldVersion: current.version || 1,
    newVersion: null,
  });
  return { success: true };
});

export const raLock = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  const uid = context.auth.uid;
  const { tenderId, raId } = data || {};
  if (!tenderId || !raId) throw new functions.https.HttpsError('invalid-argument', 'Missing args');

  const { tenderRef, role, allowedRoles } = await getTenderAndRole(tenderId, uid);
  assertEditor(role, allowedRoles, uid);

  const raRef = tenderRef.collection('rateAnalysis').doc(raId);
  const snap = await raRef.get();
  if (!snap.exists) throw new functions.https.HttpsError('not-found', 'RA not found');
  const current = snap.data() as any;
  if (current.isLocked && current.lockedBy !== uid) {
    // already locked by someone else
    throw new functions.https.HttpsError('failed-precondition', 'Already locked');
  }
  await raRef.update({
    isLocked: true,
    lockedBy: uid,
    lockedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { success: true };
});

export const raUnlock = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  const uid = context.auth.uid;
  const { tenderId, raId } = data || {};
  if (!tenderId || !raId) throw new functions.https.HttpsError('invalid-argument', 'Missing args');

  const { tenderRef, role, allowedRoles } = await getTenderAndRole(tenderId, uid);
  assertEditor(role, allowedRoles, uid);

  const raRef = tenderRef.collection('rateAnalysis').doc(raId);
  const snap = await raRef.get();
  if (!snap.exists) throw new functions.https.HttpsError('not-found', 'RA not found');
  const current = snap.data() as any;
  if (current.isLocked && current.lockedBy !== uid) {
    throw new functions.https.HttpsError('failed-precondition', 'Locked by another user');
  }
  await raRef.update({ isLocked: false, lockedBy: null, lockedAt: null });
  return { success: true };
});

// Optional: create tender minimal endpoint
export const tenderCreate = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  const uid = context.auth.uid;
  const { title, shortName } = data || {};
  if (!title) throw new functions.https.HttpsError('invalid-argument', 'Title required');
  const ref = await admin.firestore().collection('tenders').add({
    title,
    shortName: shortName || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    tenderId: '',
    membersMap: { [uid]: 'owner' },
    rateAnalysisAllowedRoles: ['estimator', 'owner'],
  });
  await ref.update({ tenderId: ref.id });
  return { success: true, id: ref.id };
});

// Generate unique tender number (TNR-YYYY-XXXX format)
export const generateTenderNumber = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  
  const year = new Date().getFullYear();
  const counterRef = admin.firestore().collection('_counters').doc('tenderNumbers');
  
  // Use Firestore transaction for atomic increment
  const tenderNo = await admin.firestore().runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    
    let yearCounters = counterDoc.exists ? counterDoc.data()?.years || {} : {};
    const currentCount = yearCounters[year] || 0;
    const nextNumber = currentCount + 1;
    
    // Update counter
    yearCounters[year] = nextNumber;
    transaction.set(counterRef, { years: yearCounters }, { merge: true });
    
    // Format: TNR-2025-0001
    return `TNR-${year}-${String(nextNumber).padStart(4, '0')}`;
  });
  
  return { tenderNo };
});

// Finalize tender creation with full validation
export const finalizeTenderCreate = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  const uid = context.auth.uid;
  
  const {
    title,
    shortName,
    workType,
    tenderSource,
    tenderSourceOther,
    estimatedValue,
    currency,
    description,
    client,
    department,
    tenderUID,
    externalLink,
    country,
    state,
    city,
    siteAddress,
    prebidMeetingAddress,
    publishDate,
    prebidMeetingDate,
    queryDeadline,
    documentPurchaseDeadline,
    submissionDeadline,
    technicalOpeningDate,
    financialOpeningDate,
    reminderEnabled,
    reminderLeadDays,
    boqFileUrl,
    boqItemCount,
    tenderValue,
    paymentTerms,
    tenderManager,
    engineeringLead,
    estimationEngineer,
    documentController,
    additionalMembers,
    status,
    submissionMode,
    internalNotes,
    emdAmount,
    prebidQueryInstructions,
    extraReminders,
    bidProbabilityScore,
    draftId,
    documents,
  } = data || {};
  
  // Server-side validation
  if (!title?.trim()) {
    throw new functions.https.HttpsError('invalid-argument', 'Title is required');
  }
  if (!shortName?.trim()) {
    throw new functions.https.HttpsError('invalid-argument', 'Short name is required');
  }
  if (!workType) {
    throw new functions.https.HttpsError('invalid-argument', 'Work type is required');
  }
  if (!tenderSource) {
    throw new functions.https.HttpsError('invalid-argument', 'Tender source is required');
  }
  if (!estimatedValue || parseFloat(estimatedValue) <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Valid estimated value is required');
  }
  if (!publishDate) {
    throw new functions.https.HttpsError('invalid-argument', 'Publish date is required');
  }
  if (!submissionDeadline) {
    throw new functions.https.HttpsError('invalid-argument', 'Submission deadline is required');
  }
  if (!tenderManager?.trim()) {
    throw new functions.https.HttpsError('invalid-argument', 'Tender manager is required');
  }
  
  // Generate tender number
  const year = new Date().getFullYear();
  const counterRef = admin.firestore().collection('_counters').doc('tenderNumbers');
  
  const tenderNo = await admin.firestore().runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let yearCounters = counterDoc.exists ? counterDoc.data()?.years || {} : {};
    const currentCount = yearCounters[year] || 0;
    const nextNumber = currentCount + 1;
    yearCounters[year] = nextNumber;
    transaction.set(counterRef, { years: yearCounters }, { merge: true });
    return `TNR-${year}-${String(nextNumber).padStart(4, '0')}`;
  });
  
  // Build membersMap with role mapping (names would map to UIDs in production)
  const membersMap: Record<string, string> = { [uid]: 'owner' };
  // Placeholder: if different names provided, still only creator UID known.
  // Extend later by resolving user names to UIDs.
  
  // Create tender document
  const tenderRef = await admin.firestore().collection('tenders').add({
    tenderId: '', // Will update below
    tenderNo,
    title: title.trim(),
    shortName: shortName.trim(),
    workType,
    tenderSource,
    tenderSourceOther: tenderSource === 'Other' ? tenderSourceOther : null,
    estimatedValue: parseFloat(estimatedValue),
    currency: currency || 'INR',
    description: description?.trim() || null,
    client: client?.trim() || null,
    department: department?.trim() || null,
    tenderUID: tenderUID?.trim() || null,
    externalLink: externalLink?.trim() || null,
    country: country || 'India',
    state: state?.trim() || null,
    city: city?.trim() || null,
    siteAddress: siteAddress?.trim() || null,
    prebidMeetingAddress: prebidMeetingAddress?.trim() || null,
    publishDate: publishDate ? admin.firestore.Timestamp.fromDate(new Date(publishDate)) : null,
    prebidMeetingDate: prebidMeetingDate ? admin.firestore.Timestamp.fromDate(new Date(prebidMeetingDate)) : null,
    queryDeadline: queryDeadline ? admin.firestore.Timestamp.fromDate(new Date(queryDeadline)) : null,
    documentPurchaseDeadline: documentPurchaseDeadline ? admin.firestore.Timestamp.fromDate(new Date(documentPurchaseDeadline)) : null,
    submissionDeadline: submissionDeadline ? admin.firestore.Timestamp.fromDate(new Date(submissionDeadline)) : null,
    technicalOpeningDate: technicalOpeningDate ? admin.firestore.Timestamp.fromDate(new Date(technicalOpeningDate)) : null,
    financialOpeningDate: financialOpeningDate ? admin.firestore.Timestamp.fromDate(new Date(financialOpeningDate)) : null,
    reminderEnabled: reminderEnabled !== false,
    reminderLeadDays: reminderLeadDays || 3,
    boqFileUrl: boqFileUrl?.trim() || null,
    boqItemCount: boqItemCount || 0,
    tenderValue: tenderValue ? parseFloat(tenderValue) : null,
    paymentTerms: paymentTerms?.trim() || null,
    tenderManager: tenderManager?.trim() || null,
    engineeringLead: engineeringLead?.trim() || null,
    estimationEngineer: estimationEngineer?.trim() || null,
    documentController: documentController?.trim() || null,
    additionalMembers: additionalMembers || [],
    status: status || 'draft',
    submissionMode: submissionMode || 'Online',
    internalNotes: internalNotes?.trim() || null,
    emdAmount: emdAmount ? parseFloat(emdAmount) : null,
    prebidQueryInstructions: prebidQueryInstructions?.trim() || null,
    extraReminders: extraReminders?.trim() || null,
    bidProbabilityScore: bidProbabilityScore || null,
    membersMap,
    rateAnalysisAllowedRoles: ['estimator', 'owner'],
    createdBy: uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastModifiedBy: uid,
    lastModifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    tenderProgressPercent: 0,
    documentProgressSummary: {
      mandatoryCompleted: 0,
      mandatoryTotal: 0
    },
    // Initialize stage tracking with Stage 1 completed
    stageCompletion: {
      '1_identification': {
        done: true,
        by: uid,
        at: admin.firestore.Timestamp.now(),
        evidenceRefs: []
      }
    },
    progressPercent: 6.25 // 1/16 stages completed
  });
  
  // Update with tenderId
  await tenderRef.update({ tenderId: tenderRef.id });
  
  // Create initial status history entry
  await tenderRef.collection('statusHistory').add({
    status: status || 'draft',
    changedBy: uid,
    changedAt: admin.firestore.FieldValue.serverTimestamp(),
    notes: 'Tender created',
  });
  
  // Store documents metadata (files already uploaded to Storage)
  if (documents && Array.isArray(documents) && documents.length > 0) {
    const bucket = admin.storage().bucket();
    const batch = admin.firestore().batch();
    for (const doc of documents) {
      let finalStoragePath = doc.storagePath;
      if (doc.storagePath && doc.storagePath.startsWith('drafts/')) {
        // Attempt server-side copy to final path
        try {
          const fileName = doc.storagePath.substring(doc.storagePath.lastIndexOf('/') + 1);
            finalStoragePath = `tenders/${tenderRef.id}/attachments/${fileName}`;
          await bucket.file(doc.storagePath).copy(bucket.file(finalStoragePath));
        } catch (e) {
          console.error('File copy failed, keeping original path', doc.storagePath, e);
          finalStoragePath = doc.storagePath; // fallback
        }
      }
      const docRef = tenderRef.collection('documents').doc();
      batch.set(docRef, {
        id: doc.id || docRef.id,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl, // Could regenerate signed URL if needed
        storagePath: finalStoragePath,
        fileSize: doc.fileSize,
        fileType: doc.fileType,
        category: doc.category,
        isMandatory: !!doc.isMandatory,
        uploadedBy: doc.uploadedBy || uid,
        uploadedAt: doc.uploadedAt || admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
  }
  
  // Log audit
  await logTenderAuditInternal(tenderRef.id, 'TENDER_CREATED', uid, {
    tenderNo,
    title,
    estimatedValue,
  });
  
  // Log Stage 1 completion
  await logTenderAuditInternal(tenderRef.id, 'STAGE_1_IDENTIFICATION_COMPLETED', uid, {
    stageId: '1_identification',
    progressPercent: 6.25,
    notes: 'Auto-completed on tender creation'
  });
  
  return {
    success: true,
    tenderId: tenderRef.id,
    tenderNo,
  };
});

// Log tender audit events
export const logTenderAudit = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  const { tenderId, action, metadata } = data || {};
  if (!tenderId || !action) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing tenderId or action');
  }
  
  await logTenderAuditInternal(tenderId, action, context.auth.uid, metadata);
  return { success: true };
});

// Internal helper for audit logging
async function logTenderAuditInternal(
  tenderId: string,
  action: string,
  userId: string,
  metadata?: any
) {
  await admin.firestore().collection('audit_logs').add({
    entity: 'tender',
    entityId: tenderId,
    action,
    performedBy: userId,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    metadata: metadata || {},
  });
}

/**
 * Cloud Function: Finalize a tender stage
 * Validates user role, stage-specific conditions, updates stageCompletion, recalculates progress
 */
export const finalizeStage = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { tenderId, stageId, evidenceRefs, notes } = data;
  const uid = context.auth.uid;

  // Validate inputs
  if (!tenderId || !stageId) {
    throw new functions.https.HttpsError('invalid-argument', 'tenderId and stageId are required');
  }

  try {
    const tenderRef = admin.firestore().collection('tenders').doc(tenderId);
    const tenderDoc = await tenderRef.get();

    if (!tenderDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Tender not found');
    }

    const tender = tenderDoc.data();
    if (!tender) {
      throw new functions.https.HttpsError('internal', 'Failed to load tender data');
    }

    // Check user has access to this tender
    if (!tender.membersMap || !tender.membersMap[uid]) {
      throw new functions.https.HttpsError('permission-denied', 'You do not have access to this tender');
    }

    const userRole = tender.membersMap[uid];

    // Stage-specific validation
    const stageConfig: Record<string, any> = {
      '1_identification': { requiredRoles: [], autoCondition: () => true },
      '2_documents': {
        requiredRoles: [],
        autoCondition: (t: any) => {
          // All mandatory documents must be uploaded
          if (!t.documentChecklist) return false;
          const mandatoryDocs = Object.values(t.documentChecklist).filter((doc: any) => doc.required);
          return mandatoryDocs.length > 0 && mandatoryDocs.every((doc: any) => doc.uploaded);
        }
      },
      '3_prebid': { requiredRoles: ['admin', 'tender_manager', 'engineer'], autoCondition: () => true },
      '4_sitevisit': { requiredRoles: ['admin', 'tender_manager', 'engineer'], autoCondition: () => true },
      '5_technical': { requiredRoles: ['admin', 'tender_manager', 'engineer'], autoCondition: () => true },
      '6_boq': {
        requiredRoles: [],
        autoCondition: (t: any) => {
          // BOQ uploaded, rate analysis completed, summary exists
          return t.boq?.uploaded && t.boq?.summaryRef && t.boq?.rateAnalysisStatus === 'completed';
        }
      },
      '7_costing': { requiredRoles: ['admin', 'tender_manager'], autoCondition: () => true },
      '8_docu_prep': { requiredRoles: ['admin', 'tender_manager'], autoCondition: () => true },
      '9_approvals': {
        requiredRoles: [],
        autoCondition: (t: any) => {
          // All required approvals obtained
          if (!t.approvals) return false;
          const requiredApprovals = [t.approvals.engineering, t.approvals.finance, t.approvals.management].filter((a: any) => a);
          return requiredApprovals.length > 0 && requiredApprovals.every((a: any) => a.status === 'approved');
        }
      },
      '10_submission': { requiredRoles: ['admin', 'tender_manager'], autoCondition: () => true },
      '11_followup': { requiredRoles: ['admin', 'tender_manager'], autoCondition: () => true },
      '12_tech_opening': { requiredRoles: ['admin', 'tender_manager'], autoCondition: () => true },
      '13_fin_opening': { requiredRoles: ['admin', 'tender_manager'], autoCondition: () => true },
      '14_negotiation': { requiredRoles: ['admin', 'tender_manager'], autoCondition: () => true },
      '15_recommendation': { requiredRoles: ['admin', 'tender_manager'], autoCondition: () => true },
      '16_loa': { requiredRoles: ['admin'], autoCondition: () => true }
    };

    const config = stageConfig[stageId];
    if (!config) {
      throw new functions.https.HttpsError('invalid-argument', `Invalid stageId: ${stageId}`);
    }

    // Check role permissions
    if (config.requiredRoles.length > 0 && !config.requiredRoles.includes(userRole) && userRole !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        `Role '${userRole}' cannot complete this stage. Required roles: ${config.requiredRoles.join(', ')}`
      );
    }

    // For auto stages, validate conditions
    if (stageId === '2_documents' || stageId === '6_boq' || stageId === '9_approvals') {
      if (!config.autoCondition(tender)) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          `Stage ${stageId} conditions not met`
        );
      }
    }

    // Check if stage already completed
    const existingCompletion = tender.stageCompletion?.[stageId];
    if (existingCompletion?.done) {
      return {
        success: true,
        message: 'Stage already completed',
        tender: tender
      };
    }

    // Update stage completion
    const stageCompletion = tender.stageCompletion || {};
    stageCompletion[stageId] = {
      done: true,
      by: uid,
      at: admin.firestore.Timestamp.now(),
      evidenceRefs: evidenceRefs || []
    };

    // Calculate progress
    const STAGE_ORDER = [
      '1_identification', '2_documents', '3_prebid', '4_sitevisit', '5_technical',
      '6_boq', '7_costing', '8_docu_prep', '9_approvals', '10_submission',
      '11_followup', '12_tech_opening', '13_fin_opening', '14_negotiation',
      '15_recommendation', '16_loa'
    ];
    const completedCount = STAGE_ORDER.filter(id => stageCompletion[id]?.done).length;
    const progressPercent = Math.round((completedCount / 16) * 100);

    // Update tender
    await tenderRef.update({
      stageCompletion,
      progressPercent,
      lastModifiedBy: uid,
      lastModifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });

    // Log audit
    await logTenderAuditInternal(tenderId, `STAGE_${stageId.toUpperCase()}_COMPLETED`, uid, {
      stageId,
      evidenceRefs,
      notes,
      progressPercent
    });

    // Fetch updated tender
    const updatedTenderDoc = await tenderRef.get();
    const updatedTender = { tenderId: updatedTenderDoc.id, ...updatedTenderDoc.data() };

    return {
      success: true,
      message: `Stage ${stageId} completed successfully (${completedCount}/16 stages)`,
      tender: updatedTender
    };
  } catch (error: any) {
    console.error('[finalizeStage] Error:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', error.message || 'Failed to finalize stage');
  }
});

/**
 * Cloud Function: Award tender (completes Stage 16)
 * Admin-only operation
 */
export const awardTender = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { tenderId, loaRef, notes } = data;
  const uid = context.auth.uid;

  // Validate inputs
  if (!tenderId || !loaRef) {
    throw new functions.https.HttpsError('invalid-argument', 'tenderId and loaRef are required');
  }

  try {
    const tenderRef = admin.firestore().collection('tenders').doc(tenderId);
    const tenderDoc = await tenderRef.get();

    if (!tenderDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Tender not found');
    }

    const tender = tenderDoc.data();
    if (!tender) {
      throw new functions.https.HttpsError('internal', 'Failed to load tender data');
    }

    // Check user has admin access
    if (!tender.membersMap || tender.membersMap[uid] !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Only admins can award tenders');
    }

    // Check if already awarded
    if (tender.award?.awarded) {
      return {
        success: true,
        message: 'Tender already awarded',
        tender: tender
      };
    }

    // Update award info and complete Stage 16
    const stageCompletion = tender.stageCompletion || {};
    stageCompletion['16_loa'] = {
      done: true,
      by: uid,
      at: admin.firestore.Timestamp.now(),
      evidenceRefs: [loaRef]
    };

    // Calculate final progress (should be 100%)
    const STAGE_ORDER = [
      '1_identification', '2_documents', '3_prebid', '4_sitevisit', '5_technical',
      '6_boq', '7_costing', '8_docu_prep', '9_approvals', '10_submission',
      '11_followup', '12_tech_opening', '13_fin_opening', '14_negotiation',
      '15_recommendation', '16_loa'
    ];
    const completedCount = STAGE_ORDER.filter(id => stageCompletion[id]?.done).length;
    const progressPercent = Math.round((completedCount / 16) * 100);

    await tenderRef.update({
      stageCompletion,
      progressPercent,
      award: {
        awarded: true,
        loaRef,
        awardedAt: admin.firestore.FieldValue.serverTimestamp(),
        awardedBy: uid
      },
      status: 'awarded',
      lastModifiedBy: uid,
      lastModifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });

    // Log audit
    await logTenderAuditInternal(tenderId, 'TENDER_AWARDED', uid, {
      loaRef,
      notes,
      progressPercent
    });

    // Fetch updated tender
    const updatedTenderDoc = await tenderRef.get();
    const updatedTender = { tenderId: updatedTenderDoc.id, ...updatedTenderDoc.data() };

    return {
      success: true,
      message: 'Tender awarded successfully! All 16 stages completed.',
      tender: updatedTender
    };
  } catch (error: any) {
    console.error('[awardTender] Error:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', error.message || 'Failed to award tender');
  }
});

/**
 * Cloud Function: Migrate existing tenders to add Stage 1 completion
 * Admin-only operation - run once to fix existing tenders
 */
export const migrateTendersStage1 = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const uid = context.auth.uid;

  try {
    // Get all tenders without stage completion
    const tendersSnapshot = await admin.firestore()
      .collection('tenders')
      .get();

    let migratedCount = 0;
    let skippedCount = 0;

    const batch = admin.firestore().batch();

    for (const doc of tendersSnapshot.docs) {
      const tender = doc.data();
      
      // Skip if already has stage completion
      if (tender.stageCompletion && tender.stageCompletion['1_identification']) {
        skippedCount++;
        continue;
      }

      // Add Stage 1 completion
      const stageCompletion = tender.stageCompletion || {};
      stageCompletion['1_identification'] = {
        done: true,
        by: tender.createdBy || uid,
        at: tender.createdAt || admin.firestore.Timestamp.now(),
        evidenceRefs: []
      };

      batch.update(doc.ref, {
        stageCompletion,
        progressPercent: 6.25
      });

      migratedCount++;

      // Firestore batch limit is 500
      if (migratedCount % 500 === 0) {
        await batch.commit();
      }
    }

    // Commit remaining
    if (migratedCount % 500 !== 0) {
      await batch.commit();
    }

    // Log audit
    await logTenderAuditInternal('MIGRATION', 'STAGE1_MIGRATION', uid, {
      migratedCount,
      skippedCount,
      totalTenders: tendersSnapshot.size
    });

    return {
      success: true,
      message: `Migrated ${migratedCount} tenders, skipped ${skippedCount} already migrated`,
      migratedCount,
      skippedCount,
      totalTenders: tendersSnapshot.size
    };
  } catch (error: any) {
    console.error('[migrateTendersStage1] Error:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to migrate tenders');
  }
});
