import { create } from 'zustand';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { OAuthProvider } from 'react-native-appwrite';
import { getAccount, isAppwriteConfigured } from '../services/appwrite';
import { syncOnSignIn } from '../services/sync';

WebBrowser.maybeCompleteAuthSession();

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

interface SessionState {
  user: SessionUser | null;
  hydrated: boolean;
  signingIn: boolean;
  syncing: boolean;
  lastSync: { pushed: number; at: string } | null;
  error: string | null;
  hydrate: () => Promise<void>;
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
  clearError: () => void;
}

function toSessionUser(account: { $id: string; name: string; email: string }): SessionUser {
  return { id: account.$id, name: account.name, email: account.email };
}

export const useSessionStore = create<SessionState>((set, get) => ({
  user: null,
  hydrated: false,
  signingIn: false,
  syncing: false,
  lastSync: null,
  error: null,

  hydrate: async () => {
    if (get().hydrated) return;
    if (!isAppwriteConfigured()) {
      set({ hydrated: true });
      return;
    }
    try {
      const account = await getAccount().get();
      set({
        user: toSessionUser(account as { $id: string; name: string; email: string }),
        hydrated: true,
      });
    } catch {
      set({ user: null, hydrated: true });
    }
  },

  signInWithGoogle: async () => {
    if (!isAppwriteConfigured()) {
      set({ error: 'not_configured' });
      return false;
    }
    set({ signingIn: true, error: null });
    const completeSignIn = async (): Promise<boolean> => {
      try {
        const fetched = await getAccount().get();
        const nextUser = toSessionUser(
          fetched as { $id: string; name: string; email: string }
        );
        set({ user: nextUser, signingIn: false });
        await get().syncNow();
        return true;
      } catch {
        set({ signingIn: false, error: 'failed' });
        return false;
      }
    };
    try {
      const redirectUri = makeRedirectUri({ scheme: 'vegtrace' });
      const token = (await getAccount().createOAuth2Token(
        OAuthProvider.Google,
        redirectUri,
        redirectUri
      )) as unknown;
      const loginUrl =
        typeof token === 'string' ? token : token instanceof URL ? token.href : null;
      if (!loginUrl) {
        return completeSignIn();
      }
      const result = await WebBrowser.openAuthSessionAsync(loginUrl, redirectUri);
      if (result.type !== 'success' || !result.url) {
        set({ signingIn: false, error: 'cancelled' });
        return false;
      }
      const params = new URL(result.url).searchParams;
      const userId = params.get('userId');
      const secret = params.get('secret');
      if (!userId || !secret) {
        set({ signingIn: false, error: 'failed' });
        return false;
      }
      await getAccount().createSession(userId, secret);
      return completeSignIn();
    } catch {
      set({ signingIn: false, error: 'failed' });
      return false;
    }
  },

  signOut: async () => {
    try {
      await getAccount().deleteSession('current');
    } catch {
      // Session already gone — still clear local state.
    }
    set({ user: null, lastSync: null, error: null });
  },

  syncNow: async () => {
    const { user } = get();
    if (!user) return;
    set({ syncing: true });
    try {
      const result = await syncOnSignIn(user.id);
      set({
        lastSync: { pushed: result.pushed, at: new Date().toISOString() },
        syncing: false,
      });
    } catch {
      set({ syncing: false });
    }
  },

  clearError: () => set({ error: null }),
}));
