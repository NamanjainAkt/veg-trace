import { ID, Permission, Query, Role } from 'react-native-appwrite';
import { DietaryPreferences, Product } from '../types';
import { AppLanguage } from '../i18n/strings';
import {
  APPWRITE_COLLECTIONS,
  APPWRITE_DATABASE_ID,
  getDatabases,
  isAppwriteConfigured,
} from './appwrite';
import { getCloudSyncConsent, getScanHistory } from './storage';
import {
  cloudProfileToLocal,
  prefsToCloudDoc,
  productToCloudDoc,
} from './appwriteMappers';
import { usePreferencesStore } from '../store/usePreferencesStore';

export interface SyncResult {
  /** History products pushed to the shared cache (0 when push was skipped). */
  pushed: number;
  /** True when the signed-in user's prefs profile was pulled from the cloud. */
  pulledProfile: boolean;
  /**
   * Present when sync stopped early. 'consent_required' is NOT an error:
   * profile pull/upsert already ran; history push was skipped pending the
   * user's explicit opt-in. Callers should treat the call as successful.
   */
  skipped?: 'consent_required';
  error?: string;
}

const HISTORY_PUSH_LIMIT = 50;

/** Raw-analyzer results ('custom-…' ids) hold user label text and never enter the shared cache. */
const CUSTOM_PRODUCT_PREFIX = 'custom-';

/**
 * Local-first cloud sync (PRD Sec 21, 32): profile pull/upsert always runs
 * so preferences follow the user across devices; history/product push only
 * runs after explicit cloud sync consent. Every step is best-effort —
 * local data always wins on failure.
 */
export async function syncOnSignIn(userId: string): Promise<SyncResult> {
  if (!isAppwriteConfigured()) {
    return { pushed: 0, pulledProfile: false, error: 'not_configured' };
  }
  const databases = getDatabases();
  const db = APPWRITE_DATABASE_ID;
  let pulledProfile = false;

  try {
    const existing = await databases.listDocuments(db, APPWRITE_COLLECTIONS.profiles, [
      Query.equal('userId', userId),
      Query.limit(1),
    ]);
    if (existing.total > 0) {
      const local = cloudProfileToLocal(existing.documents[0]);
      if (local) {
        await usePreferencesStore.getState().setPrefs(local.prefs);
        await usePreferencesStore.getState().setLanguage(local.language);
        pulledProfile = true;
      }
    }
  } catch {
    // Pull is best-effort; profile upsert below still runs.
  }

  const { prefs, language } = usePreferencesStore.getState();
  await upsertProfile(userId, prefs, language);

  // PRD Sec 32/48: history/product push requires explicit cloud sync consent;
  // the profile pull/upsert above always runs for multi-device preferences.
  if (!(await getCloudSyncConsent())) {
    return { pushed: 0, pulledProfile, skipped: 'consent_required' };
  }

  const history = (await getScanHistory())
    .filter(
      (product) =>
        !product.id.startsWith(CUSTOM_PRODUCT_PREFIX) &&
        !product.id.startsWith('ocr-') &&
        !product.id.startsWith('custom-')
    )
    .slice(0, HISTORY_PUSH_LIMIT);
  let pushed = 0;
  for (const product of history) {
    try {
      await upsertSharedProduct(product, userId);
      pushed += 1;
    } catch {
      // Per-item best-effort.
    }
  }
  return { pushed, pulledProfile };
}

async function upsertProfile(
  userId: string,
  prefs: DietaryPreferences,
  language: AppLanguage
): Promise<void> {
  const databases = getDatabases();
  const db = APPWRITE_DATABASE_ID;
  const data = prefsToCloudDoc(prefs, language, userId);
  const existing = await databases.listDocuments(db, APPWRITE_COLLECTIONS.profiles, [
    Query.equal('userId', userId),
    Query.limit(1),
  ]);
  if (existing.total > 0) {
    await databases.updateDocument(db, APPWRITE_COLLECTIONS.profiles, existing.documents[0].$id, data);
  } else {
    await databases.createDocument(db, APPWRITE_COLLECTIONS.profiles, ID.unique(), data, [
      Permission.read(Role.user(userId)),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ]);
  }
}

async function upsertSharedProduct(product: Product, userId: string): Promise<void> {
  const databases = getDatabases();
  const db = APPWRITE_DATABASE_ID;
  const data = productToCloudDoc(product);
  const existing = await databases.listDocuments(db, APPWRITE_COLLECTIONS.products, [
    Query.equal('barcode', product.barcode),
    Query.limit(1),
  ]);
  if (existing.total > 0) {
    await databases.updateDocument(db, APPWRITE_COLLECTIONS.products, existing.documents[0].$id, data);
  } else {
    await databases.createDocument(db, APPWRITE_COLLECTIONS.products, ID.unique(), data, [
      Permission.read(Role.user(userId)),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ]);
  }
}
