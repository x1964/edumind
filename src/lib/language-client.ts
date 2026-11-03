import { LANG_COOKIE, type Lang } from "@/lib/i18n";

/**
 * Applies the language preference to the document and persists it for the
 * server-rendered dictionary on the next request.
 */
export function applyLanguagePreference(lang: Lang) {
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
}
