"use client";

import { Globe, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLanguageAction } from "@/lib/actions/preferences";
import { applyLanguagePreference } from "@/lib/language-client";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function AppLanguageSwitcher({
  lang,
  label,
  className,
  compact = false,
}: {
  lang: Lang;
  label: string;
  className?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function change(next: Lang) {
    if (next === lang || isPending) return;
    applyLanguagePreference(next);
    startTransition(async () => {
      await setLanguageAction(next);
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "relative inline-flex h-8 items-center gap-0.5 rounded-full border border-hairline bg-black/[0.03] p-0.5",
        isPending && "pointer-events-none opacity-70",
        className
      )}
      role="group"
      aria-label={label}
    >
      {!compact ? (
        <Globe className="ms-1.5 me-0.5 size-3 text-ink-muted" aria-hidden="true" />
      ) : null}
      {(["ar", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => change(code)}
          aria-pressed={code === lang}
          aria-label={code === "ar" ? "العربية" : "English"}
          className={cn(
            "relative z-10 h-6 min-w-7 rounded-full px-1.5 text-[12px] font-semibold uppercase tracking-wide transition-colors",
            code === lang ? "bg-brand/15 text-brand-ink" : "text-ink-muted hover:text-ink-soft"
          )}
        >
          {code === "ar" ? "ع" : "EN"}
        </button>
      ))}
      {isPending ? (
        <LoaderCircle className="me-1 size-3 animate-spin text-brand-ink" aria-hidden="true" />
      ) : null}
    </div>
  );
}
