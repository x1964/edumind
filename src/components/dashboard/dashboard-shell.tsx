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
  LogOut,
  Menu,
  Network,
  NotebookPen,
  Settings,
  X,
} from "lucide-react";
import { Logo } from "@/components/landing/Logo";
import { AppLanguageSwitcher } from "@/components/dashboard/app-language-switcher";
import { GlobalSearch } from "@/components/dashboard/global-search";
import { InstallAppMenuItem } from "@/components/pwa/install-app";
import { signOutAction } from "@/lib/actions/auth";
import type { AppMessages } from "@/lib/i18n/app";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ShellProfile {
  fullName: string;
  email: string;
  avatarUrl: string | null;
}

const NAV_ITEMS: Array<{
  href: string;
  labelKey: keyof AppMessages["nav"];
  icon: typeof LayoutDashboard;
  exact?: boolean;
}> = [
  { href: "/dashboard", labelKey: "overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/materials", labelKey: "materials", icon: FileText },
  { href: "/dashboard/tutor", labelKey: "tutor", icon: BrainCircuit },
  { href: "/dashboard/summaries", labelKey: "summaries", icon: NotebookPen },
  { href: "/dashboard/quizzes", labelKey: "quizzes", icon: ListChecks },
  { href: "/dashboard/mind-maps", labelKey: "mindMaps", icon: Network },
  { href: "/dashboard/study-plan", labelKey: "studyPlan", icon: CalendarClock },
  { href: "/dashboard/progress", labelKey: "progress", icon: LineChart },
  { href: "/dashboard/settings", labelKey: "settings", icon: Settings },
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
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleCollapsed() {
    const next = !collapsed;
    window.localStorage.setItem("edumind_sidebar", next ? "collapsed" : "expanded");
    window.dispatchEvent(new Event(SIDEBAR_EVENT));
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  function isActive(item: (typeof NAV_ITEMS)[number]) {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  const navigation = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label={dict.nav.main}>
      {NAV_ITEMS.map((item) => {
        const active = isActive(item);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={closeMobile}
            aria-current={active ? "page" : undefined}
            title={collapsed ? dict.nav[item.labelKey] : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors",
              active
                ? "bg-brand/[0.09] text-brand-ink"
                : "text-ink-muted hover:bg-black/[0.035] hover:text-ink",
              collapsed && "justify-center px-2"
            )}
          >
            {active ? (
              <span
                aria-hidden="true"
                className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-brand"
              />
            ) : null}
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {collapsed ? null : <span className="truncate">{dict.nav[item.labelKey]}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-surface">
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
              <span className="rounded-md border border-hairline bg-black/[0.03] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ink-muted">
                beta
              </span>
            )}
          </div>

          {navigation}

          <div className="border-t border-hairline/70 p-3">
            <div
              className={cn(
                "mb-2 flex items-center gap-2.5 rounded-xl px-1.5 py-1.5",
                collapsed && "justify-center"
              )}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full border border-brand/25 bg-brand/10 text-[11px] font-semibold text-brand-ink">
                {initials(profile.fullName)}
              </span>
              {collapsed ? null : (
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium text-ink">
                    {profile.fullName}
                  </span>
                  <span className="block truncate text-[10.5px] text-ink-muted">
                    {profile.email}
                  </span>
                </span>
              )}
            </div>
            <div
              className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}
            >
              {collapsed ? null : (
                <AppLanguageSwitcher lang={lang} label={dict.common.language} compact />
              )}
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label={collapsed ? dict.nav.expand : dict.nav.collapse}
                className="grid size-8 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-black/[0.05] hover:text-ink"
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
          <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-hairline/70 bg-surface/85 px-4 backdrop-blur-xl sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={dict.nav.openMenu}
              className="grid size-9 shrink-0 place-items-center rounded-xl border border-hairline text-ink-soft transition-colors hover:bg-black/[0.04] lg:hidden"
            >
              <Menu className="size-4" aria-hidden="true" />
            </button>

            <GlobalSearch dict={dict} className="w-full max-w-sm" />

            <div className="ms-auto flex items-center gap-2">
              <AppLanguageSwitcher
                lang={lang}
                label={dict.common.language}
                className="hidden sm:inline-flex"
              />
              <Link
                href="/dashboard/settings"
                aria-label={dict.nav.settings}
                className="hidden size-9 place-items-center rounded-xl border border-hairline text-ink-muted transition-colors hover:bg-black/[0.04] hover:text-ink sm:grid"
              >
                <Settings className="size-4" aria-hidden="true" />
              </Link>

              <details className="group relative">
                <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-xl border border-hairline bg-black/[0.02] pe-2 ps-2 transition-colors hover:bg-black/[0.04] [&::-webkit-details-marker]:hidden">
                  <span className="grid size-6 place-items-center rounded-full bg-brand/12 text-[10px] font-semibold text-brand-ink">
                    {initials(profile.fullName)}
                  </span>
                  <span className="hidden max-w-28 truncate text-[12px] font-medium text-ink-soft sm:block">
                    {profile.fullName}
                  </span>
                </summary>
                <div className="absolute end-0 top-11 z-40 w-56 overflow-hidden rounded-xl border border-hairline bg-surface-raised shadow-2xl">
                  <div className="border-b border-hairline px-3.5 py-3">
                    <p className="truncate text-[12.5px] font-medium text-ink">
                      {profile.fullName}
                    </p>
                    <p className="truncate text-[11px] text-ink-muted">{profile.email}</p>
                  </div>
                  <div className="p-1.5">
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] text-ink-soft transition-colors hover:bg-black/[0.05] hover:text-ink"
                    >
                      <Settings className="size-3.5" aria-hidden="true" />
                      {dict.nav.settings}
                    </Link>
                    <InstallAppMenuItem dict={dict} />
                    <form action={signOutAction}>
                      <button
                        type="submit"
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-[12.5px] text-ink-soft transition-colors hover:bg-[#ef4444]/10 hover:text-[#b91c1c]"
                      >
                        <LogOut className="size-3.5" aria-hidden="true" />
                        {dict.common.signOut}
                      </button>
                    </form>
                  </div>
                </div>
              </details>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1420px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={dict.nav.closeMenu}
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 start-0 flex w-[280px] max-w-[85vw] flex-col border-e border-hairline bg-surface-deep shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-hairline px-4">
              <Logo />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label={dict.nav.closeMenu}
                className="grid size-8 place-items-center rounded-lg text-ink-muted hover:bg-black/[0.05] hover:text-ink"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            {navigation}
            <div className="border-t border-hairline p-3">
              <div className="mb-2 flex items-center gap-2.5 px-1.5">
                <span className="grid size-8 place-items-center rounded-full border border-brand/25 bg-brand/10 text-[11px] font-semibold text-brand-ink">
                  {initials(profile.fullName)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-medium text-ink">
                    {profile.fullName}
                  </span>
                  <span className="block truncate text-[10.5px] text-ink-muted">
                    {profile.email}
                  </span>
                </span>
              </div>
              <AppLanguageSwitcher lang={lang} label={dict.common.language} />
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
