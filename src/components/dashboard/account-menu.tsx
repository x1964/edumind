"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { Settings, LogOut, ChevronDown } from "lucide-react";
import { AppLanguageSwitcher } from "@/components/dashboard/app-language-switcher";
import { InstallAppMenuItem } from "@/components/pwa/install-app";
import { signOutAction } from "@/lib/actions/auth";
import type { AppMessages } from "@/lib/i18n/app";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface AccountMenuProps {
  dict: AppMessages;
  lang: Lang;
  profile: {
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
}

export function AccountMenu({ dict, lang, profile }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function initials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "E";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-brand/25 bg-brand/10 text-[12px] font-semibold text-brand-ink">
          {initials(profile.fullName)}
        </span>
        <ChevronDown
          className={cn("size-4 text-ink-muted transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          className="absolute top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-hairline bg-surface-raised shadow-pop animate-in fade-in-0 zoom-in-95 duration-200 ltr:right-0 ltr:left-auto rtl:left-0 rtl:right-auto"
        >
          <div className="border-b border-hairline/70 px-3 py-2.5">
            <p className="truncate text-[13px] font-medium text-ink">{profile.fullName}</p>
            <p className="truncate text-[12px] text-ink-muted">{profile.email}</p>
          </div>

          <div className="p-1">
            <Link
              href="/dashboard/settings"
              role="menuitem"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] text-ink-soft transition-colors hover:bg-black/[0.04] hover:text-ink"
              onClick={() => setOpen(false)}
            >
              <Settings className="size-4 shrink-0" aria-hidden="true" />
              {dict.nav.settings}
            </Link>

            <div className="flex items-center justify-between rounded-xl px-3 py-2">
              <span className="text-[13px] text-ink-soft">{dict.common.language}</span>
              <AppLanguageSwitcher lang={lang} label={dict.common.language} compact />
            </div>

            <InstallAppMenuItem
              dict={dict}
              className="gap-2.5 rounded-xl px-3 py-2 text-[13px]"
              iconClassName="size-4 shrink-0"
            />
          </div>

          <div className="border-t border-hairline/70 p-1">
            <form action={signOutAction}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-start text-[13px] text-ink-soft transition-colors hover:bg-[#ef4444]/10 hover:text-danger"
              >
                <LogOut className="size-4 shrink-0" aria-hidden="true" />
                {dict.common.signOut}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
