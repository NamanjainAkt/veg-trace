import { create } from 'zustand';
import { DEFAULT_PREFERENCES } from '../constants/preferences';
import { DietaryPreferences } from '../types';
import { AppLanguage } from '../i18n/strings';
import {
  getAppLanguage,
  getDietaryPreferences,
  saveDietaryPreferences,
  setAppLanguage,
} from '../services/storage';
import { syncI18nLanguage } from '../i18n';

interface PreferencesState {
  prefs: DietaryPreferences;
  language: AppLanguage;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setPrefs: (prefs: DietaryPreferences) => Promise<void>;
  updatePrefs: (patch: Partial<DietaryPreferences>) => Promise<void>;
  setLanguage: (language: AppLanguage) => Promise<void>;
}

/**
 * Single source of truth for diet prefs + language at runtime.
 * Persistence stays in services/storage (Zod-validated); this store
 * is hydrated once from _layout and written through on every change,
 * so existing installs keep their saved settings with zero migration.
 */
export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  prefs: DEFAULT_PREFERENCES,
  language: 'en',
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const [prefs, language] = await Promise.all([getDietaryPreferences(), getAppLanguage()]);
    set({ prefs, language, hydrated: true });
    syncI18nLanguage(language);
  },

  setPrefs: async (prefs) => {
    set({ prefs });
    await saveDietaryPreferences(prefs);
  },

  updatePrefs: async (patch) => {
    const prefs = { ...get().prefs, ...patch };
    set({ prefs });
    await saveDietaryPreferences(prefs);
  },

  setLanguage: async (language) => {
    set({ language });
    syncI18nLanguage(language);
    await setAppLanguage(language);
  },
}));
