import { Account, Client, Databases } from 'react-native-appwrite';

const ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || '';
const PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '';

export const APPWRITE_DATABASE_ID =
  process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || 'vegtrace';

export const APPWRITE_COLLECTIONS = {
  profiles: 'profiles',
  products: 'products',
  verifications: 'verifications',
  inquiries: 'inquiries',
} as const;

let client: Client | null = null;

export function isAppwriteConfigured(): boolean {
  return Boolean(ENDPOINT && PROJECT_ID);
}

export function getAppwriteClient(): Client {
  if (!client) {
    client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID);
  }
  return client;
}

export function getAccount(): Account {
  return new Account(getAppwriteClient());
}

export function getDatabases(): Databases {
  return new Databases(getAppwriteClient());
}
