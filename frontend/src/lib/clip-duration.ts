export const CLIP_LENGTHS = ["auto", "short", "medium", "long", "extra_long"] as const;
export type ClipLength = (typeof CLIP_LENGTHS)[number];

export function isClipLength(value: unknown): value is ClipLength {
  return typeof value === "string" && CLIP_LENGTHS.includes(value as ClipLength);
}

export function isClipLengths(value: unknown): value is ClipLength[] {
  return Array.isArray(value) && value.length > 0 && value.every(isClipLength);
}

/** De-duplicate valid presets; never empty (falls back to auto). */
export function normalizeClipLengths(value: unknown, fallback: ClipLength = "auto"): ClipLength[] {
  const defaultLength = isClipLength(fallback) ? fallback : "auto";
  let candidates: unknown[] = [];
  if (typeof value === "string") {
    candidates = value.includes(",")
      ? value.split(",").map((part) => part.trim()).filter(Boolean)
      : [value];
  } else if (Array.isArray(value)) {
    candidates = value;
  }

  const lengths: ClipLength[] = [];
  for (const item of candidates) {
    if (isClipLength(item) && !lengths.includes(item)) {
      lengths.push(item);
    }
  }
  return lengths.length > 0 ? lengths : [defaultLength];
}

export function serializeClipLengths(lengths: ClipLength[]): string {
  return normalizeClipLengths(lengths).join(",");
}

export function parseClipLengths(value: unknown): ClipLength[] {
  return normalizeClipLengths(value);
}
