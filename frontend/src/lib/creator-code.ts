"use client";

/**
 * Remembers a creator code (from a `?ref=` link or typed by the user) so
 * checkout can apply the creator offer. Only codes the server confirmed as an
 * approved creator are stored. Storage is a convenience: the server still
 * applies a signup `?ref=` on its own and re-validates every code at checkout.
 */
import { getStorageItem, removeStorageItem, setStorageItem } from "@/lib/storage-migrate";

export const CREATOR_OFFER_TEXT = "20% off your first 3 months";

const STORAGE_KEY = "gungleclips:creator-code:v1";
const LEGACY_STORAGE_KEY = "supoclip:creator-code:v1";
const TTL_MS = 90 * 24 * 60 * 60 * 1000;

type StoredCode = { code: string; saved_at: string };

export function getStoredCreatorCode(): string | null {
  try {
    const raw = getStorageItem(STORAGE_KEY, LEGACY_STORAGE_KEY);
    const stored = JSON.parse(raw ?? "null") as StoredCode | null;
    if (!stored?.code || Date.now() - new Date(stored.saved_at).getTime() > TTL_MS) return null;
    return stored.code;
  } catch {
    return null;
  }
}

export function storeCreatorCode(code: string) {
  setStorageItem(
    STORAGE_KEY,
    JSON.stringify({ code, saved_at: new Date().toISOString() }),
    LEGACY_STORAGE_KEY,
  );
}

export function clearCreatorCode() {
  removeStorageItem(STORAGE_KEY, LEGACY_STORAGE_KEY);
}

/** The normalized code (e.g. `MAYA`) when it belongs to an approved creator, else null. */
export async function lookupCreatorCode(raw: string): Promise<string | null> {
  const code = raw.trim();
  if (!code) return null;
  try {
    const response = await fetch(`/api/affiliates/offer?code=${encodeURIComponent(code)}`);
    if (!response.ok) return null;
    const data = (await response.json()) as { code?: string };
    return data.code ?? null;
  } catch {
    return null;
  }
}

let urlCapture: Promise<string | null> | null = null;

/**
 * Validates and stores a creator code from this page's `?ref=`/`?via=` once per
 * page load, then resolves to the code that applies (new or previously stored).
 */
export function captureCreatorCodeFromUrl(): Promise<string | null> {
  if (!urlCapture) {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref") ?? params.get("via");
    urlCapture = (ref ? lookupCreatorCode(ref) : Promise.resolve(null)).then((code) => {
      if (code) storeCreatorCode(code);
      return code ?? getStoredCreatorCode();
    });
  }
  return urlCapture;
}
