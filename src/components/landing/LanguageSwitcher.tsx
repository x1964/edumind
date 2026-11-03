"use client";

import { Globe, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Lang } from "@/lib/i18n";
import { applyLanguagePreference } from "@/lib/language-client";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  lang: Lang;
  label: string;
  className?: string;
}

export function LanguageSwitcher({ lang, label, className }: LanguageSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function changeLanguage(next: Lang) {
    if (next === lang) return;
    applyLanguagePreference(next);
    startTransition(() => router.refresh());
  }

  return (
    <div
      className={cn(
        "relative inline-flex h-9 items-center gap-0.5 rounded-full border border-hairline bg-black/[0.03] p-0.5",
        isPending && "pointer-events-none",
        className
      )}
      role="group"
      aria-label={label}
    >
      <Globe className="ms-2 me-1 size-3.5 text-ink-muted" aria-hidden="true" />
      {(["ar", "en"] as const).map((code) => {
        const active = code === lang;
        return (
          <button
            key={code}
            type="button"
            onClick={() => changeLanguage(code)}
            aria-pressed={active}
            aria-label={code === "ar" ? "العربية" : "English"}
            className={cn(
              "relative z-10 h-7 min-w-8 rounded-full px-2 text-[12px] font-semibold uppercase tracking-wide transition-colors duration-200",
              active ? "bg-brand/15 text-brand-ink" : "text-ink-muted hover:text-ink-soft"
            )}
          >
            {code === "ar" ? "ع" : "EN"}
          </button>
        );
      })}
      {isPending ? (
        <LoaderCircle className="me-1.5 size-3 animate-spin text-brand-ink" aria-hidden="true" />
      ) : null}
    </div>
  );
}
