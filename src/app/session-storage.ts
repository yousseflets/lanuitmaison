const STORAGE_KEY = 'lanuitmaison_user';

export function hasStoredUserEmail(): boolean {
  try {
    const storage = typeof window === 'undefined' ? undefined : window.localStorage;
    return !!storage?.getItem(STORAGE_KEY)?.trim();
  } catch {
    return false;
  }
}

export function getStoredUserEmail(): string {
  try {
    const storage = typeof window === 'undefined' ? undefined : window.localStorage;
    const storedValue = storage?.getItem(STORAGE_KEY);
    return storedValue?.trim() || 'Administrador';
  } catch {
    return 'Administrador';
  }
}

export function setStoredUserEmail(email: string): void {
  try {
    const storage = typeof window === 'undefined' ? undefined : window.localStorage;
    if (storage) {
      storage.setItem(STORAGE_KEY, email);
    }
  } catch {
    // Ignore storage failures in restricted browser contexts.
  }
}

export function clearStoredUserEmail(): void {
  try {
    const storage = typeof window === 'undefined' ? undefined : window.localStorage;
    if (storage) {
      storage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage failures in restricted browser contexts.
  }
}
