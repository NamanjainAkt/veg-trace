import { beforeEach, describe, expect, it, vi } from 'vitest';

const asyncStorageMemory = new Map<string, string>();
const secureStoreMemory = new Map<string, string>();

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (key: string) => asyncStorageMemory.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      asyncStorageMemory.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      asyncStorageMemory.delete(key);
    }),
    clear: vi.fn(async () => {
      asyncStorageMemory.clear();
    }),
  },
}));

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(async (key: string) => secureStoreMemory.get(key) ?? null),
  setItemAsync: vi.fn(async (key: string, value: string) => {
    secureStoreMemory.set(key, value);
  }),
  deleteItemAsync: vi.fn(async (key: string) => {
    secureStoreMemory.delete(key);
  }),
}));

vi.mock('../../database/sqlite', () => ({
  sqliteCacheProduct: vi.fn(async () => {}),
  sqliteGetProduct: vi.fn(async () => null),
  sqliteDeleteProduct: vi.fn(async () => {}),
  sqliteClearProducts: vi.fn(async () => {}),
}));

vi.mock('expo-sqlite', () => ({
  openDatabaseSync: vi.fn(),
}));

import {
  clearScanHistory,
  getCloudSyncConsent,
  getDietaryPreferences,
  getScanHistory,
  getSourcingInquiries,
  HISTORY_RETENTION_MS,
  saveDietaryPreferences,
  saveScanProduct,
  saveSourcingInquiry,
  setCloudSyncConsent,
} from '../storage';
import { Product } from '../../types';

const sampleProduct: Product = {
  id: 'test-1',
  barcode: '123456789012',
  name: 'Test Biscuit',
  brand: 'Test Brand',
  imageUrl: undefined,
  verdict: 'vegetarian',
  confidence: 90,
  ingredients: [],
  rawIngredientText: 'Wheat flour, sugar, salt',
  summary: 'Vegetarian verified',
  scannedAt: new Date().toISOString(),
  isCachedOffline: true,
};

describe('storage service', () => {
  beforeEach(() => {
    asyncStorageMemory.clear();
    secureStoreMemory.clear();
  });

  describe('cloud sync consent', () => {
    it('defaults to false (opt-in requirement)', async () => {
      const consent = await getCloudSyncConsent();
      expect(consent).toBe(false);
    });

    it('persists consent toggle accurately', async () => {
      await setCloudSyncConsent(true);
      expect(await getCloudSyncConsent()).toBe(true);

      await setCloudSyncConsent(false);
      expect(await getCloudSyncConsent()).toBe(false);
    });
  });

  describe('sourcing inquiries', () => {
    it('persists sourcing inquiries and retrieves them', async () => {
      await saveSourcingInquiry({
        additiveCode: 'E471',
        brand: 'Britannia',
        evidenceUrl: 'https://example.com/proof',
        notes: 'Confirmed 100% plant origin.',
      });

      const inquiries = await getSourcingInquiries();
      expect(inquiries).toHaveLength(1);
      expect(inquiries[0].additiveCode).toBe('E471');
      expect(inquiries[0].brand).toBe('Britannia');
      expect(inquiries[0].synced).toBe(false);
    });

    it('rethrows when storage fails', async () => {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      vi.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('Disk full'));

      await expect(
        saveSourcingInquiry({
          additiveCode: 'E471',
          brand: 'Brand',
          notes: 'Notes',
        })
      ).rejects.toThrow('Disk full');
    });
  });

  describe('scan history & pruning', () => {
    it('saves and retrieves scan history', async () => {
      await saveScanProduct(sampleProduct);
      const history = await getScanHistory();
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('test-1');
    });

    it('prunes expired history older than 90 days', async () => {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const oldDate = new Date(Date.now() - HISTORY_RETENTION_MS - 86400000).toISOString();
      const expiredProduct: Product = {
        ...sampleProduct,
        id: 'expired-1',
        barcode: '999999999999',
        scannedAt: oldDate,
      };

      await AsyncStorage.setItem(
        '@vegtrace_scan_history_v1',
        JSON.stringify([expiredProduct, sampleProduct])
      );

      const history = await getScanHistory();
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('test-1');
    });

    it('clears scan history', async () => {
      await saveScanProduct(sampleProduct);
      expect(await getScanHistory()).toHaveLength(1);

      await clearScanHistory();
      expect(await getScanHistory()).toHaveLength(0);
    });
  });

  describe('dietary preferences', () => {
    it('saves and retrieves user dietary preferences in secure storage', async () => {
      const prefs = await getDietaryPreferences();
      expect(prefs.dietType).toBe('strict_vegetarian');

      await saveDietaryPreferences({ ...prefs, dietType: 'vegan', strictUndisclosedMode: true });
      const updated = await getDietaryPreferences();
      expect(updated.dietType).toBe('vegan');
      expect(updated.strictUndisclosedMode).toBe(true);
    });
  });
});
