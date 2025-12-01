// src/utils/migrationUtils.ts
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase';

/**
 * Run Stage 1 migration for existing tenders
 * This is a one-time operation to fix tenders created before Stage 1 auto-completion
 */
export async function runStage1Migration() {
  try {
    const migrateFunction = httpsCallable(functions, 'migrateTendersStage1');
    const result = await migrateFunction({});
    
    console.log('[Migration] Stage 1 migration result:', result.data);
    return result.data;
  } catch (error: any) {
    console.error('[Migration] Stage 1 migration failed:', error);
    throw error;
  }
}
