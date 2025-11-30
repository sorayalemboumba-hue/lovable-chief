import { useState } from 'react';
import { loadFromStorage, saveToStorage } from '@/lib/storage';

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(() => loadFromStorage(key, defaultValue));

  const setValue = (value: T | ((prev: T) => T)) => {
    const nextValue = typeof value === 'function' ? (value as (prev: T) => T)(state) : value;
    setState(nextValue);
    saveToStorage(key, nextValue);
  };

  return [state, setValue] as const;
}
