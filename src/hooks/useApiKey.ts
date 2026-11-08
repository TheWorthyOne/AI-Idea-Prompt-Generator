import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';
import { getStore, isTauriRuntime } from './useStore';

const LEGACY_API_KEY_STORE_KEY = 'apiKey';
const SESSION_API_KEY = 'idea_session_api_key';

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAndMigrate() {
      try {
        if (!isTauriRuntime()) {
          const sessionKey = sessionStorage.getItem(SESSION_API_KEY);
          if (!cancelled && sessionKey) {
            setApiKeyState(sessionKey);
          }
          return;
        }

        const stored = await invoke<string | null>('get_api_key');
        if (cancelled) return;

        if (stored) {
          setApiKeyState(stored);
          return;
        }

        // One-time migration: if older versions stored the API key in plaintext
        // in the plugin-store JSON file, move it into OS secure storage and remove it.
        const legacyStore = await getStore();
        const legacy = await legacyStore.get<string>(LEGACY_API_KEY_STORE_KEY);
        if (cancelled) return;

        if (legacy && legacy.trim()) {
          await invoke('set_api_key', { apiKey: legacy });
          await legacyStore.delete(LEGACY_API_KEY_STORE_KEY);
          await legacyStore.save();
          if (!cancelled) setApiKeyState(legacy);
        }
      } catch (error) {
        console.error('Failed to load/migrate API key:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadAndMigrate();

    return () => {
      cancelled = true;
    };
  }, []);

  const setApiKey = async (newKey: string) => {
    setApiKeyState(newKey);
    try {
      if (isTauriRuntime()) {
        await invoke('set_api_key', { apiKey: newKey });
      } else if (newKey.trim()) {
        sessionStorage.setItem(SESSION_API_KEY, newKey.trim());
      } else {
        sessionStorage.removeItem(SESSION_API_KEY);
      }
    } catch (error) {
      console.error('Failed to save API key to secure storage:', error);
    }
  };

  return [apiKey, setApiKey, isLoading] as const;
}
