import * as SQLite from 'expo-sqlite';
import { Product } from '../types';
import { ProductSchema } from '../schemas';

/** PRD Sec 30: re-check cached verifications after 30 days. */
export const PRODUCT_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_PRODUCTS = 200;

let db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('vegtrace.db');
    db.execSync(
      `CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY NOT NULL,
        barcode TEXT,
        data TEXT NOT NULL,
        cached_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
      CREATE TABLE IF NOT EXISTS verifications (
        id TEXT PRIMARY KEY NOT NULL,
        product_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        verified_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      );`
    );
  }
  return db;
}

function parseRow(row: { data: unknown; cached_at: unknown }): Product | null {
  if (typeof row.cached_at !== 'string' || typeof row.data !== 'string') return null;
  const cachedAt = Date.parse(row.cached_at);
  // Unparseable timestamps are treated as expired, never fresh.
  if (!Number.isFinite(cachedAt) || Date.now() - cachedAt > PRODUCT_CACHE_TTL_MS) return null;
  try {
    const result = ProductSchema.safeParse(JSON.parse(row.data));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/** Offline product cache (PRD Sec 23): Zod-validated, 30-day TTL, capped at 200 most-recently-written rows. */
export async function sqliteGetProduct(idOrBarcode: string): Promise<Product | null> {
  try {
    const database = getDb();
    const byId = database.getFirstSync<{ data: string; cached_at: string }>(
      'SELECT data, cached_at FROM products WHERE id = ?',
      [idOrBarcode]
    );
    if (byId) {
      const product = parseRow(byId);
      if (product) return product;
      database.runSync('DELETE FROM products WHERE id = ?', [idOrBarcode]);
    }
    const byBarcode = database.getFirstSync<{ data: string; cached_at: string }>(
      'SELECT data, cached_at FROM products WHERE barcode = ?',
      [idOrBarcode]
    );
    if (byBarcode) {
      const product = parseRow(byBarcode);
      if (product) return product;
    }
    return null;
  } catch {
    return null;
  }
}

export async function sqliteCacheProduct(product: Product): Promise<void> {
  try {
    const database = getDb();
    const now = new Date().toISOString();
    database.runSync(
      'INSERT OR REPLACE INTO products (id, barcode, data, cached_at) VALUES (?, ?, ?, ?)',
      [product.id, product.barcode || null, JSON.stringify(product), now]
    );
    database.execSync(
      `DELETE FROM products WHERE id NOT IN (
        SELECT id FROM products ORDER BY cached_at DESC LIMIT ${MAX_PRODUCTS}
      )`
    );
  } catch {
    // Cache is best-effort; scans must never fail because of it.
  }
}

/** Drops one cached product (used when the user un-saves a scan). */
export async function sqliteDeleteProduct(idOrBarcode: string): Promise<void> {
  try {
    getDb().runSync('DELETE FROM products WHERE id = ? OR barcode = ?', [
      idOrBarcode,
      idOrBarcode,
    ]);
  } catch {
    // Best-effort.
  }
}

export async function sqliteClearProducts(): Promise<void> {
  try {
    getDb().execSync('DELETE FROM products; DELETE FROM verifications;');
  } catch {
    // Best-effort.
  }
}

export interface StoredVerification {
  id: string;
  productId: string;
  payload: string;
  verifiedAt: string;
  expiresAt: string;
}

/** Verification cache backing PRD Sec 30 (research once, reuse 30 days). */
export async function sqliteSaveVerification(record: StoredVerification): Promise<void> {
  try {
    getDb().runSync(
      'INSERT OR REPLACE INTO verifications (id, product_id, payload, verified_at, expires_at) VALUES (?, ?, ?, ?, ?)',
      [record.id, record.productId, record.payload, record.verifiedAt, record.expiresAt]
    );
  } catch {
    // Best-effort.
  }
}

export async function sqliteGetVerification(id: string): Promise<StoredVerification | null> {
  try {
    const row = getDb().getFirstSync<{
      id: string;
      product_id: string;
      payload: string;
      verified_at: string;
      expires_at: string;
    }>('SELECT id, product_id, payload, verified_at, expires_at FROM verifications WHERE id = ?', [id]);
    if (!row || Date.parse(row.expires_at) <= Date.now()) return null;
    return {
      id: row.id,
      productId: row.product_id,
      payload: row.payload,
      verifiedAt: row.verified_at,
      expiresAt: row.expires_at,
    };
  } catch {
    return null;
  }
}
