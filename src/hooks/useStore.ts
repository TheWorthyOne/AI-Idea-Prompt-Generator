import { Store } from '@tauri-apps/plugin-store';
import { useState, useEffect } from 'react';

let storePromise: Promise<Store> | undefined;

function getStore() {
  storePromise ??= Store.load('settings.json');
  return storePromise;
}

export function useStore<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadValue() {
      try {
        const store = await getStore();
        const stored = await store.get<T>(key);
        if (stored != null) {
          setValue(stored);
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
      const store = await getStore();
      await store.set(key, newValue);
      await store.save();
    } catch (error) {
      console.error('Failed to save to store:', error);
    }
  };

  return [value, updateValue, isLoading] as const;
}
