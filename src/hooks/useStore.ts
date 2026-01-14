import { Store } from '@tauri-apps/plugin-store';
import { useState, useEffect } from 'react';

// NOTE: @tauri-apps/plugin-store persists values in a JSON file on disk and is not encrypted.
// Use this only for non-sensitive app data (e.g., UI preferences, idea history).
const storePromise = Store.load('settings.json');

export function useStore<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadValue() {
      try {
        const store = await storePromise;
        const stored = await store.get<T>(key);
        if (stored !== null && stored !== undefined) {
          setValue(stored as T);
        }
      } catch (error) {
        console.error('Failed to load from store:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadValue();
  }, [key]);

  const updateValue = async (newValue: T) => {
    setValue(newValue);
    try {
      const store = await storePromise;
      await store.set(key, newValue);
      await store.save();
    } catch (error) {
      console.error('Failed to save to store:', error);
    }
  };

  return [value, updateValue, isLoading] as const;
}
