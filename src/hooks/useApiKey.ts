import { invoke } from '@tauri-apps/api/core';
import { Store } from '@tauri-apps/plugin-store';
import { useEffect, useState } from 'react';

const legacyStorePromise = Store.load('settings.json');
const LEGACY_API_KEY_STORE_KEY = 'apiKey';

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadAndMigrate() {
      try {
        const stored = await invoke<string | null>('get_api_key');
        if (cancelled) return;

        if (stored) {
          setApiKeyState(stored);
          return;
        }

        // One-time migration: if older versions stored the API key in plaintext
        // in the plugin-store JSON file, move it into OS secure storage and remove it.
        const legacyStore = await legacyStorePromise;
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
      await invoke('set_api_key', { apiKey: newKey });
    } catch (error) {
      console.error('Failed to save API key to secure storage:', error);
    }
  };

  return [apiKey, setApiKey, isLoading] as const;
}

