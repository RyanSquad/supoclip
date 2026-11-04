export const SITE_NAME = "GungleClips";
export const COMPANY_NAME = "Gungle.ai";
export const COMPANY_REGISTRATION_NUMBER = "";
export const COMPANY_REGISTERED_ADDRESS = "";
export const DEFAULT_SITE_URL = "https://clips.gungle.ai";
export const HOSTED_APP_URL = DEFAULT_SITE_URL;
export const GITHUB_URL = "https://github.com/gungle-ai/gungleclips";
export const APP_STORE_ID = "";
export const APP_STORE_URL = "";
export const PRODUCT_HUNT_URL = "";
/** Product Hunt's launch badge; empty until a GungleClips launch is live. */
export const PRODUCT_HUNT_BADGE_URL = "";

/** Opens the App Store's offer-code redemption for a creator's custom code (the "Creator offer"). */
export function appStoreRedeemUrl(code: string) {
  if (!APP_STORE_ID) return "";
  return `https://apps.apple.com/redeem?ctx=offercodes&id=${APP_STORE_ID}&code=${encodeURIComponent(code.toUpperCase())}`;
}

export function getSiteUrl() {
  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL || DEFAULT_SITE_URL).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}
