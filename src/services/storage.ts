import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { DietaryPreferences, Product } from '../types';
import { DEFAULT_PREFERENCES } from '../constants/preferences';
import { mockProducts } from '../mocks/products';
import { AppLanguage } from '../i18n/strings';
import {
  AppLanguageSchema,
  CacheRecordSchema,
  DietaryPreferencesSchema,
  HistorySchema,
} from '../schemas';
import {
  sqliteCacheProduct,
  sqliteClearProducts,
  sqliteDeleteProduct,
  sqliteGetProduct,
} from '../database/sqlite';

const STORAGE_KEYS = {
  HISTORY: '@vegtrace_scan_history_v1',
  PREFERENCES: '@vegtrace_user_preferences_v1',
  CACHED_PRODUCTS: '@vegtrace_cached_products_v1',
  LANGUAGE: '@vegtrace_app_language_v1',
  INQUIRIES: '@vegtrace_sourcing_inquiries_v1',
  CLOUD_SYNC_CONSENT: '@vegtrace_cloud_sync_consent',
};

const HISTORY_LIMIT = 50;
export const HISTORY_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

function devLog(...args: unknown[]): void {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.error(...args);
  }
}

/**
 * Prunes scan history items older than the retention limit (90 days).
 */
function pruneExpiredHistory(items: Product[]): Product[] {
  const cutoff = Date.now() - HISTORY_RETENTION_MS;
  return items.filter((item) => {
    const timestamp = Date.parse(item.scannedAt);
    return Number.isFinite(timestamp) ? timestamp >= cutoff : true;
  });
}

/**
 * Encrypted small-value storage (Keychain / Keystore; localStorage on web).
 * Reads fall back to the legacy plaintext AsyncStorage key once and
 * migrate it forward, so existing installs upgrade silently.
 */
async function secureGetItem(key: string): Promise<string | null> {
  try {
    const value = await SecureStore.getItemAsync(key);
    if (value !== null) return value;
  } catch {
    // SecureStore unavailable (e.g. web) — use the fallback below.
  }
  try {
    const legacy = await AsyncStorage.getItem(key);
    if (legacy !== null) {
      try {
        await SecureStore.setItemAsync(key, legacy);
        await AsyncStorage.removeItem(key);
      } catch {
        // Migration best-effort; legacy value still returned.
      }
    }
    return legacy;
  } catch {
    return null;
  }
}

async function secureSetItem(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
    return;
  } catch {
    // SecureStore unavailable (e.g. web) — plaintext fallback.
  }
  await AsyncStorage.setItem(key, value);
}

function parseHistory(raw: string | null): Product[] {
  if (!raw) return [];
  try {
    const result = HistorySchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

/** One-time upgrade path: move a legacy AsyncStorage record into SQLite. */
async function migrateLegacyRecord(idOrBarcode: string): Promise<Product | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_PRODUCTS);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    const result = CacheRecordSchema.safeParse(
      (parsed as Record<string, unknown>)[idOrBarcode]
    );
    if (!result.success) return null;
    await sqliteCacheProduct(result.data.product);
    return result.data.product;
  } catch {
    return null;
  }
}

/**
 * Retrieves the user's persistent scan history.
 * Empty on first launch — sample products are served separately via
 * getSampleProducts() and are never stored as user scans.
 */
export async function getScanHistory(): Promise<Product[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
    const parsed = parseHistory(raw);
    const pruned = pruneExpiredHistory(parsed);
    if (pruned.length !== parsed.length) {
      await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(pruned)).catch(() => {});
    }
    return pruned;
  } catch (error) {
    devLog('Failed to load scan history:', error);
    return [];
  }
}

/** Demo/sample catalogue for first-run discovery. Never persisted as history. */
export function getSampleProducts(): Product[] {
  return Object.values(mockProducts);
}

/**
 * Saves a new or updated product scan to persistent history.
 * Honours the caller's offline flag: un-saved products stay in history
 * but are dropped from the SQLite offline cache.
 */
export async function saveScanProduct(product: Product): Promise<void> {
  try {
    const cached = product.isCachedOffline ?? true;
    const record: Product = {
      ...product,
      scannedAt: new Date().toISOString(),
      isCachedOffline: cached,
    };
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
    const current = pruneExpiredHistory(parseHistory(raw));
    const updated = [
      record,
      ...current.filter((item) => item.id !== product.id && item.barcode !== product.barcode),
    ].slice(0, HISTORY_LIMIT);

    await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    if (cached) await cacheProduct(record);
    else await sqliteDeleteProduct(record.id);
  } catch (error) {
    devLog('Failed to save scan:', error);
  }
}

/**
 * Adds or removes a single product from the offline cache without
 * touching its history position or original scan timestamp.
 */
export async function setProductCached(product: Product, cached: boolean): Promise<void> {
  try {
    const record: Product = { ...product, isCachedOffline: cached };
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
    const current = parseHistory(raw);
    const exists = current.some(
      (item) => item.id === product.id || item.barcode === product.barcode
    );
    const updated = exists
      ? current.map((item) =>
          item.id === product.id || item.barcode === product.barcode ? record : item
        )
      : [record, ...current].slice(0, HISTORY_LIMIT);

    await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    if (cached) await cacheProduct(record);
    else await sqliteDeleteProduct(record.id);
  } catch (error) {
    devLog('Failed to update offline cache:', error);
  }
}

/** Product lookup inside the user's own scan history (never expires). */
export async function getHistoryProduct(idOrBarcode: string): Promise<Product | null> {
  try {
    const history = await getScanHistory();
    return (
      history.find((item) => item.id === idOrBarcode || item.barcode === idOrBarcode) ?? null
    );
  } catch (error) {
    devLog('Failed to read history product:', error);
    return null;
  }
}

export interface SourcingInquiry {
  additiveCode: string;
  brand: string;
  evidenceUrl?: string;
  notes: string;
  submittedAt: string;
  synced: boolean;
}

const INQUIRY_LIMIT = 50;

/** Queues a manufacturer sourcing inquiry on-device (synced later if signed in). */
export async function saveSourcingInquiry(
  inquiry: Omit<SourcingInquiry, 'submittedAt' | 'synced'>
): Promise<void> {
  const record: SourcingInquiry = {
    additiveCode: inquiry.additiveCode.trim().slice(0, 32),
    brand: inquiry.brand.trim().slice(0, 128),
    evidenceUrl: inquiry.evidenceUrl?.trim().slice(0, 2048) || undefined,
    notes: inquiry.notes.trim().slice(0, 2000),
    submittedAt: new Date().toISOString(),
    synced: false,
  };
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.INQUIRIES);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const current = Array.isArray(parsed) ? parsed : [];
    await AsyncStorage.setItem(
      STORAGE_KEYS.INQUIRIES,
      JSON.stringify([record, ...current].slice(0, INQUIRY_LIMIT))
    );
  } catch (error) {
    devLog('Failed to save sourcing inquiry:', error);
    throw error;
  }
}

export async function getSourcingInquiries(): Promise<SourcingInquiry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.INQUIRIES);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SourcingInquiry[]) : [];
  } catch (error) {
    devLog('Failed to load sourcing inquiries:', error);
    return [];
  }
}

/**
 * Clears all scan history from persistent storage.
 */
export async function clearScanHistory(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
  } catch (error) {
    devLog('Failed to clear history:', error);
  }
}

/**
 * Clears the offline product cache (history is kept).
 */
export async function clearProductCache(): Promise<void> {
  try {
    await sqliteClearProducts();
    await AsyncStorage.setItem(STORAGE_KEYS.CACHED_PRODUCTS, JSON.stringify({}));
  } catch (error) {
    devLog('Failed to clear product cache:', error);
  }
}

/**
 * Loads user dietary preferences from encrypted storage
 * (schema-validated, defaults on drift).
 */
export async function getDietaryPreferences(): Promise<DietaryPreferences> {
  try {
    const raw = await secureGetItem(STORAGE_KEYS.PREFERENCES);
    if (!raw) return DEFAULT_PREFERENCES;
    const result = DietaryPreferencesSchema.safeParse(JSON.parse(raw));
    if (!result.success) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...result.data };
  } catch (error) {
    devLog('Failed to load preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Persists updated dietary preferences to encrypted storage.
 */
export async function saveDietaryPreferences(prefs: DietaryPreferences): Promise<void> {
  try {
    await secureSetItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
  } catch (error) {
    devLog('Failed to save preferences:', error);
  }
}

export async function getAppLanguage(): Promise<AppLanguage> {
  try {
    const raw = await secureGetItem(STORAGE_KEYS.LANGUAGE);
    const result = AppLanguageSchema.safeParse(raw);
    return result.success ? result.data : 'en';
  } catch {
    return 'en';
  }
}

export async function setAppLanguage(language: AppLanguage): Promise<void> {
  try {
    await secureSetItem(STORAGE_KEYS.LANGUAGE, language);
  } catch (error) {
    devLog('Failed to save language:', error);
  }
}

/**
 * Explicit cloud sync consent (DPDP / PRD Sec 32): false unless the user
 * opted in. Stored in secure storage alongside the other sensitive settings.
 */
export async function getCloudSyncConsent(): Promise<boolean> {
  try {
    return (await secureGetItem(STORAGE_KEYS.CLOUD_SYNC_CONSENT)) === 'true';
  } catch {
    return false;
  }
}

export async function setCloudSyncConsent(enabled: boolean): Promise<void> {
  try {
    await secureSetItem(STORAGE_KEYS.CLOUD_SYNC_CONSENT, enabled ? 'true' : 'false');
  } catch (error) {
    devLog('Failed to save cloud sync consent:', error);
  }
}

/**
 * Caches an individual product record for offline lookup (SQLite, 30-day TTL).
 */
export async function cacheProduct(product: Product): Promise<void> {
  await sqliteCacheProduct(product);
}

/**
 * Retrieves a cached product by id or barcode.
 * SQLite cache first (with one-time legacy migration). Expired records
 * (30-day TTL) are treated as a miss — bundled demo records are never
 * served as if they were real scan results.
 */
export async function getCachedProduct(idOrBarcode: string): Promise<Product | null> {
  const fresh = await sqliteGetProduct(idOrBarcode);
  if (fresh) return fresh;

  const migrated = await migrateLegacyRecord(idOrBarcode);
  if (migrated) return migrated;

  // A product the user already scanned is still valid after the cache TTL.
  return getHistoryProduct(idOrBarcode);
}
