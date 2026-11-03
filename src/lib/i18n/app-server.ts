import { cookies } from "next/headers";
import { DEFAULT_LANG, isLang, LANG_COOKIE, type Lang } from "@/lib/i18n";
import { appDictionaries, type AppMessages } from "@/lib/i18n/app";

export async function getAppLang(): Promise<Lang> {
  const store = await cookies();
  const value = store.get(LANG_COOKIE)?.value;
  return isLang(value) ? value : DEFAULT_LANG;
}

export async function getAppMessages(): Promise<{ lang: Lang; dict: AppMessages }> {
  const lang = await getAppLang();
  return { lang, dict: appDictionaries[lang] };
}

export function dirFor(lang: Lang): "rtl" | "ltr" {
  return lang === "ar" ? "rtl" : "ltr";
}
