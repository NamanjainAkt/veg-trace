import { create } from 'zustand';
import { Product } from '../types';
import { clearScanHistory, getScanHistory } from '../services/storage';

interface HistoryState {
  items: Product[];
  loaded: boolean;
  refresh: () => Promise<void>;
  clear: () => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  items: [],
  loaded: false,

  refresh: async () => {
    const items = await getScanHistory();
    set({ items, loaded: true });
  },

  clear: async () => {
    await clearScanHistory();
    set({ items: [] });
  },
}));
