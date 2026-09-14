"use client";

import { useEffect } from "react";

const LEGACY_PERSONAL_KEYS = [
  "myeongun_saju",
  "myeongun_saju_result",
  "myeongun_paid_saju",
  "myeongun_active_saju",
  "myeongun_premium_result",
  "myeongun_my_saju_registered",
  "myeongun_recent_saju",
  "myeongun_recent_ai",
  "myeongun_recent_business",
  "myeongun_recent_compatibility",
  "myeongun_recent_2026",
  "myeongun_reopen_code",
];

export default function SessionPrivacyCleanup() {
  useEffect(() => {
    for (const key of LEGACY_PERSONAL_KEYS) {
      localStorage.removeItem(key);
    }
  }, []);

  return null;
}