import { cookies } from "next/headers";
import { DEFAULT_LANG, dictionaries, isLang, LANG_COOKIE, type Lang } from "@/lib/i18n";

export async function getLang(): Promise<Lang> {
  const store = await cookies();
  const value = store.get(LANG_COOKIE)?.value;
  return isLang(value) ? value : DEFAULT_LANG;
}

export function getDictionary(lang: Lang) {
  return dictionaries[lang];
}
