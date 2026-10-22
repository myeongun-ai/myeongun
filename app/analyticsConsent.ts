// Only an explicit opt-in allows optional analytics. Storage failures default to no consent.
export const ANALYTICS_CONSENT_KEY = "myeongun_analytics_consent_v1";

export function isAnalyticsAllowed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ANALYTICS_CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}
