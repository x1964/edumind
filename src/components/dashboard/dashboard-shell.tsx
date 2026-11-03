"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import {
  BrainCircuit,
  CalendarClock,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  LayoutDashboard,
  LineChart,
  ListChecks,
  Network,
  NotebookPen,
  Settings,
} from "lucide-react";
import { Logo } from "@/components/landing/Logo";
import { AppLanguageSwitcher } from "@/components/dashboard/app-language-switcher";
import { AccountMenu } from "@/components/dashboard/account-menu";
import { GlobalSearch } from "@/components/dashboard/global-search";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";
import { MobileMoreSheet } from "@/components/dashboard/mobile-more-sheet";
import type { AppMessages } from "@/lib/i18n/app";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ShellProfile {
  fullName: string;
  email: string;
  avatarUrl: string | null;
}

interface NavItem {
  href: string;
  labelKey: keyof AppMessages["nav"];
  icon: typeof LayoutDashboard;
  exact?: boolean;
}

const NAV_GROUPS: Array<{ labelKey: keyof AppMessages["nav"]; items: NavItem[] }> = [
  {
    labelKey: "workspace",
    items: [
      { href: "/dashboard", labelKey: "overview", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/materials", labelKey: "materials", icon: FileText },
      { href: "/dashboard/tutor", labelKey: "tutor", icon: BrainCircuit },
    ],
  },
  {
    labelKey: "create",
    items: [
      { href: "/dashboard/summaries", labelKey: "summaries", icon: NotebookPen },
      { href: "/dashboard/quizzes", labelKey: "quizzes", icon: ListChecks },
      { href: "/dashboard/mind-maps", labelKey: "mindMaps", icon: Network },
    ],
  },
  {
    labelKey: "plan",
    items: [
      { href: "/dashboard/study-plan", labelKey: "studyPlan", icon: CalendarClock },
      { href: "/dashboard/progress", labelKey: "progress", icon: LineChart },
    ],
  },
  {
    labelKey: "account",
    items: [{ href: "/dashboard/settings", labelKey: "settings", icon: Settings }],
  },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "E";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

const SIDEBAR_EVENT = "edumind:sidebar";

function subscribeSidebar(callback: () => void) {
  window.addEventListener(SIDEBAR_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(SIDEBAR_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getSidebarSnapshot() {
  return window.localStorage.getItem("edumind_sidebar") === "collapsed";
}

function getSidebarServerSnapshot() {
  return false;
}

export function DashboardShell({
  children,
  dict,
  lang,
  profile,
}: {
  children: ReactNode;
  dict: AppMessages;
  lang: Lang;
  profile: ShellProfile;
}) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(
    subscribeSidebar,
    getSidebarSnapshot,
    getSidebarServerSnapshot
  );
  const [moreOpen, setMoreOpen] = useState(false);

  function toggleCollapsed() {
    const next = !collapsed;
    window.localStorage.setItem("edumind_sidebar", next ? "collapsed" : "expanded");
    window.dispatchEvent(new Event(SIDEBAR_EVENT));
  }

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  const currentItem = NAV_GROUPS.flatMap((group) => group.items).find(isActive);

  const navigation = (
    <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label={dict.nav.main}>
      <div className="space-y-5">
        {NAV_GROUPS.map((group, groupIndex) => (
          <div key={group.labelKey}>
            {collapsed ? (
              groupIndex > 0 ? (
                <div className="mx-3 mb-2 h-px bg-hairline/70" aria-hidden="true" />
              ) : null
            ) : (
              <p className="px-3 pb-1.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                {dict.nav[group.labelKey]}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? dict.nav[item.labelKey] : undefined}
                    className={cn(
                      "group relative flex min-h-9 items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-brand/[0.08] text-brand-ink"
                        : "text-ink-muted hover:bg-black/[0.03] hover:text-ink",
                      collapsed && "justify-center px-2"
                    )}
                  >
                    {active ? (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-1.5 start-0 w-0.5 rounded-full bg-brand"
                      />
                    ) : null}
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    {collapsed ? null : <span className="truncate">{dict.nav[item.labelKey]}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-surface">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
      >
        {dict.nav.skipToContent}
      </a>
      <div className="flex min-h-dvh">
        <aside
          className={cn(
            "sticky top-0 hidden h-dvh shrink-0 flex-col border-e border-hairline/70 bg-surface-deep/60 transition-[width] duration-300 lg:flex",
            collapsed ? "w-[76px]" : "w-[258px]"
          )}
        >
          <div
            className={cn(
              "flex h-16 items-center border-b border-hairline/70 px-4",
              collapsed ? "justify-center px-2" : "justify-between"
            )}
          >
            <Link href="/dashboard" aria-label={dict.common.appName}>
              <Logo compact={collapsed} />
            </Link>
            {collapsed ? null : (
              <span className="rounded-md border border-hairline bg-black/[0.03] px-1.5 py-0.5 font-mono text-[12px] uppercase tracking-wider text-ink-muted">
                beta
              </span>
            )}
          </div>

          {navigation}

          <div className="border-t border-hairline/70 p-3">
            <div
              className={cn(
                "flex items-center gap-1.5",
                collapsed ? "flex-col" : "justify-between"
              )}
            >
              <Link
                href="/dashboard/settings"
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-black/[0.04]",
                  collapsed && "flex-none justify-center"
                )}
                title={collapsed ? dict.nav.settings : undefined}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-brand/25 bg-brand/10 text-[12px] font-semibold text-brand-ink">
                  {initials(profile.fullName)}
                </span>
                {collapsed ? null : (
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink">
                      {profile.fullName}
                    </span>
                    <span className="block truncate text-[12px] text-ink-muted">
                      {profile.email}
                    </span>
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label={collapsed ? dict.nav.expand : dict.nav.collapse}
                title={collapsed ? dict.nav.expand : dict.nav.collapse}
                className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-black/[0.05] hover:text-ink"
              >
                {collapsed ? (
                  <ChevronsRight className="size-4 rtl:hidden" aria-hidden="true" />
                ) : (
                  <ChevronsLeft className="size-4 rtl:hidden" aria-hidden="true" />
                )}
                {collapsed ? (
                  <ChevronsLeft className="hidden size-4 rtl:block" aria-hidden="true" />
                ) : (
                  <ChevronsRight className="hidden size-4 rtl:block" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex min-h-16 items-center gap-2 border-b border-hairline/70 bg-surface/80 px-6 pt-[env(safe-area-inset-top)] backdrop-blur-2xl sm:px-8 lg:px-12 xl:px-16">
            <Link href="/dashboard" aria-label={dict.common.appName} className="shrink-0 lg:hidden">
              <Logo compact />
            </Link>

            <div className="hidden min-w-0 items-center gap-2.5 lg:flex">
              <span className="text-[12px] font-medium uppercase tracking-[0.16em] text-ink-muted/80">
                {dict.common.appName}
              </span>
              <span className="size-1 rounded-full bg-hairline-strong" aria-hidden="true" />
              <span className="truncate text-[13px] font-semibold text-ink">
                {currentItem ? dict.nav[currentItem.labelKey] : dict.nav.overview}
              </span>
            </div>

            <div className="ms-auto flex min-w-0 items-center gap-2">
              <GlobalSearch
                dict={dict}
                className="w-9 shrink-0 justify-center px-0 sm:w-52 sm:justify-start sm:px-3 md:w-64"
              />
              <AppLanguageSwitcher
                lang={lang}
                label={dict.common.language}
                className="hidden sm:inline-flex"
              />
              <AccountMenu dict={dict} lang={lang} profile={profile} />
            </div>
          </header>

          <main
            id="main-content"
            tabIndex={-1}
            className="em-safe-x mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 pb-[calc(env(safe-area-inset-bottom)+92px)] outline-none sm:px-8 sm:py-7 lg:px-12 lg:py-9 lg:pb-10 xl:px-16"
          >
            {children}
          </main>
        </div>
      </div>

      <MobileBottomNav dict={dict} moreOpen={moreOpen} onMore={() => setMoreOpen(true)} />

      {moreOpen ? (
        <MobileMoreSheet dict={dict} lang={lang} onClose={() => setMoreOpen(false)} />
      ) : null}
    </div>
  );
}
