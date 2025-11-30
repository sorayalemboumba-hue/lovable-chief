export const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const item = window.localStorage?.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

export const saveToStorage = <T>(key: string, value: T): void => {
  try {
    window.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    // Silently fail if localStorage is not available
  }
};
