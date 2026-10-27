import { useQuery } from '@tanstack/react-query';
import { Product } from '../types';
import { getCachedProduct } from '../services/storage';
import {
  checkManufacturerDisclosure,
  FallbackSource,
  ManufacturerDisclosure,
  resolveProductWithFallback,
} from '../services/webFallback';
import { usePreferencesStore } from '../store/usePreferencesStore';

export interface ProductResolution {
  product: Product;
  source: 'cache' | FallbackSource;
  disclosure: ManufacturerDisclosure | null;
}

function describeProduct(product: Product): string {
  return `${product.name} ${product.brand} ${product.rawIngredientText}`;
}

/**
 * Cache-first product resolution with TanStack Query dedupe + caching:
 * SQLite/offline cache → Open Food Facts → public web fallback
 * (resolveProductWithFallback owns the full network chain).
 * Keyed by lookup + diet prefs so vegan/strict verdicts never leak
 * across preference profiles.
 */
export function useProductResolution(lookup: string | null | undefined) {
  const prefs = usePreferencesStore((s) => s.prefs);
  const hydrated = usePreferencesStore((s) => s.hydrated);

  return useQuery({
    queryKey: [
      'product-resolution',
      lookup,
      prefs.dietType,
      prefs.strictUndisclosedMode,
    ],
    enabled: Boolean(lookup) && hydrated,
    queryFn: async (): Promise<ProductResolution | null> => {
      const key = lookup as string;

      const cached = await getCachedProduct(key);
      if (cached) {
        return {
          product: cached,
          source: 'cache',
          disclosure: checkManufacturerDisclosure(describeProduct(cached)),
        };
      }

      if (/^\d+$/.test(key)) {
        const fallback = await resolveProductWithFallback({ barcode: key, prefs });
        if (fallback) return fallback;
      }

      return null;
    },
  });
}
