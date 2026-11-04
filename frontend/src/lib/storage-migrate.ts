/**
 * One-shot localStorage migration for the GungleClips rebrand.
 * Reads the new key first; if missing, copies any legacy SupoClip key.
 */
export function migrateStorageKey(newKey: string, legacyKey: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const existing = window.localStorage.getItem(newKey);
    if (existing != null) return existing;
    const legacy = window.localStorage.getItem(legacyKey);
    if (legacy == null) return null;
    window.localStorage.setItem(newKey, legacy);
    window.localStorage.removeItem(legacyKey);
    return legacy;
  } catch {
    return null;
  }
}

export function getStorageItem(newKey: string, legacyKey: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return migrateStorageKey(newKey, legacyKey) ?? window.localStorage.getItem(newKey);
  } catch {
    return null;
  }
}

export function setStorageItem(newKey: string, value: string, legacyKey?: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(newKey, value);
    if (legacyKey) window.localStorage.removeItem(legacyKey);
  } catch {
    /* ignore quota / private mode */
  }
}

export function removeStorageItem(newKey: string, legacyKey?: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(newKey);
    if (legacyKey) window.localStorage.removeItem(legacyKey);
  } catch {
    /* ignore */
  }
}
