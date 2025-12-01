// src/services/tenderUploadsService.ts
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, auth } from './firebase';
import type { TenderDocument, DocumentCategory } from '../types/tender';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

export const tenderUploadsService = {
  async uploadFile(
    file: File,
    category: DocumentCategory,
    isMandatory: boolean,
    isDraft: boolean,
    draftId?: string,
    tenderId?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<TenderDocument> {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Construct storage path
    let storagePath: string;
    if (isDraft && draftId) {
      storagePath = `drafts/${user.uid}/${draftId}/attachments/${Date.now()}_${file.name}`;
    } else if (tenderId) {
      storagePath = `tenders/${tenderId}/attachments/${Date.now()}_${file.name}`;
    } else {
      throw new Error('Either draftId or tenderId must be provided');
    }

    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = {
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          };
          onProgress?.(progress);
        },
        (error) => {
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const doc: TenderDocument = {
            id: Date.now().toString(),
            fileName: file.name,
            fileUrl: downloadURL,
            storagePath,
            fileSize: file.size,
            fileType: file.type,
            category,
            isMandatory,
            uploadedBy: user.uid,
            uploadedAt: new Date(),
          };
          resolve(doc);
        }
      );
    });
  },

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      // Don't throw - file might already be deleted
    }
  },

  async moveFileFromDraftToTender(storagePath: string, tenderId: string): Promise<{ newPath: string }> {
    // Only move if in drafts path
    if (!storagePath.startsWith('drafts/')) {
      return { newPath: storagePath }; // Already in final path
    }
    const fileName = storagePath.substring(storagePath.lastIndexOf('/') + 1);
    const newPath = `tenders/${tenderId}/attachments/${fileName}`;
    // Use Firebase Admin via callable CF in production; here client libs cannot copy server-side.
    // This placeholder returns original path; server function should perform actual copy.
    return { newPath };
  },
};
