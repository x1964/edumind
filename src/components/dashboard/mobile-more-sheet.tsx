"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  CalendarClock,
  LineChart,
  LogOut,
  Network,
  NotebookPen,
  Settings,
  X,
  type LucideIcon,
} from "lucide-react";
import { AppLanguageSwitcher } from "@/components/dashboard/app-language-switcher";
import { InstallAppMenuItem } from "@/components/pwa/install-app";
import { signOutAction } from "@/lib/actions/auth";
import type { AppMessages } from "@/lib/i18n/app";
import type { Lang } from "@/lib/i18n";

const TOOLS: Array<{
  href: string;
  labelKey: keyof AppMessages["nav"];
  icon: LucideIcon;
}> = [
  { href: "/dashboard/summaries", labelKey: "summaries", icon: NotebookPen },
  { href: "/dashboard/mind-maps", labelKey: "mindMaps", icon: Network },
  { href: "/dashboard/study-plan", labelKey: "studyPlan", icon: CalendarClock },
  { href: "/dashboard/progress", labelKey: "progress", icon: LineChart },
];

export function MobileMoreSheet({
  dict,
  lang,
  onClose,
}: {
  dict: AppMessages;
  lang: Lang;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label={dict.nav.closeMenu}
        onClick={onClose}
        className="animate-in fade-in-0 absolute inset-0 bg-[#10262c]/45 backdrop-blur-[2px] duration-200"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={dict.nav.more}
        className="animate-in slide-in-from-bottom-8 absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col overflow-hidden rounded-t-[26px] border-t border-hairline bg-surface shadow-pop duration-300"
      >
        <div className="shrink-0 px-5 pt-2.5">
          <span
            aria-hidden="true"
            className="mx-auto block h-1.5 w-10 rounded-full bg-hairline-strong/70"
          />
          <div className="flex items-center justify-between pb-3 pt-3">
            <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-ink">
              {dict.nav.more}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={dict.nav.closeMenu}
              className="grid size-8 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-black/[0.05] hover:text-ink"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <p className="px-1 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
            {dict.nav.tools}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  onClick={onClose}
                  className="em-tap flex min-w-0 items-center gap-2.5 rounded-2xl border border-hairline/70 bg-surface px-3 py-3 transition-colors active:border-brand/30 active:bg-brand/[0.05]"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-brand/15 bg-gradient-to-br from-brand/[0.16] to-brand/[0.04] text-brand-ink">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 truncate text-[12px] font-medium text-ink">
                    {dict.nav[tool.labelKey]}
                  </span>
                </Link>
              );
            })}
          </div>

          <p className="mt-5 px-1 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
            {dict.nav.account}
          </p>
          <div className="overflow-hidden rounded-2xl border border-hairline/80 bg-black/[0.015]">
            <Link
              href="/dashboard/settings"
              onClick={onClose}
              className="flex items-center gap-2.5 border-b border-hairline/70 px-3.5 py-3 text-[12.5px] text-ink-soft transition-colors hover:bg-black/[0.04] hover:text-ink"
            >
              <Settings className="size-4 shrink-0" aria-hidden="true" />
              {dict.nav.settings}
            </Link>

            <div className="flex items-center justify-between border-b border-hairline/70 px-3.5 py-2.5">
              <span className="text-[12.5px] text-ink-soft">{dict.common.language}</span>
              <AppLanguageSwitcher lang={lang} label={dict.common.language} compact />
            </div>

            <InstallAppMenuItem
              dict={dict}
              className="gap-2.5 rounded-none border-b border-hairline/70 px-3.5 py-3 text-[12.5px]"
              iconClassName="size-4 shrink-0"
            />

            <form action={signOutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 px-3.5 py-3 text-start text-[12.5px] text-ink-soft transition-colors hover:bg-[#ef4444]/10 hover:text-danger"
              >
                <LogOut className="size-4 shrink-0" aria-hidden="true" />
                {dict.common.signOut}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
