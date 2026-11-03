"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BrainCircuit,
  FileText,
  LayoutDashboard,
  LayoutGrid,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import type { AppMessages } from "@/lib/i18n/app";
import { cn } from "@/lib/utils";

const PRIMARY_ITEMS: Array<{
  href: string;
  labelKey: keyof AppMessages["nav"];
  icon: LucideIcon;
  exact?: boolean;
}> = [
  { href: "/dashboard", labelKey: "overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/materials", labelKey: "materials", icon: FileText },
  { href: "/dashboard/tutor", labelKey: "tutor", icon: BrainCircuit },
  { href: "/dashboard/quizzes", labelKey: "quizzes", icon: ListChecks },
];

const DRAWER_ROUTES = [
  "/dashboard/summaries",
  "/dashboard/mind-maps",
  "/dashboard/study-plan",
  "/dashboard/progress",
  "/dashboard/settings",
];

function isRouteActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBottomNav({ dict, onMore }: { dict: AppMessages; onMore: () => void }) {
  const pathname = usePathname();
  const moreActive = DRAWER_ROUTES.some((href) => isRouteActive(pathname, href));

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 lg:hidden">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface via-surface/90 to-transparent"
      />
      <nav
        aria-label={dict.nav.main}
        className="pointer-events-auto relative mx-auto mb-[calc(env(safe-area-inset-bottom)+10px)] flex w-[calc(100%-1.25rem)] max-w-md items-stretch gap-0.5 rounded-[26px] border border-hairline/70 bg-surface-raised/90 p-1.5 shadow-[0_18px_45px_-18px_rgba(16,38,44,0.45),0_2px_10px_-4px_rgba(16,38,44,0.12)] backdrop-blur-xl"
      >
        {PRIMARY_ITEMS.map((item) => {
          const active = isRouteActive(pathname, item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="group flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[20px] px-0.5 py-1.5 transition-colors"
            >
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-[13px] transition-all duration-200",
                  active
                    ? "bg-brand text-[#04130c] shadow-[0_8px_18px_-8px_rgba(0,201,80,0.95)]"
                    : "text-ink-muted group-hover:bg-black/[0.05] group-hover:text-ink-soft"
                )}
              >
                <Icon className="size-[18px]" strokeWidth={active ? 2.4 : 1.9} aria-hidden="true" />
              </span>
              <span
                className={cn(
                  "max-w-full truncate text-[9.5px] leading-none transition-colors",
                  active ? "font-semibold text-brand-ink" : "font-medium text-ink-muted"
                )}
              >
                {dict.nav[item.labelKey]}
              </span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onMore}
          aria-label={dict.nav.more}
          aria-haspopup="dialog"
          className="group flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[20px] px-0.5 py-1.5 transition-colors"
        >
          <span
            className={cn(
              "grid size-9 place-items-center rounded-[13px] transition-all duration-200",
              moreActive
                ? "bg-brand text-[#04130c] shadow-[0_8px_18px_-8px_rgba(0,201,80,0.95)]"
                : "text-ink-muted group-hover:bg-black/[0.05] group-hover:text-ink-soft"
            )}
          >
            <LayoutGrid
              className="size-[18px]"
              strokeWidth={moreActive ? 2.4 : 1.9}
              aria-hidden="true"
            />
          </span>
          <span
            className={cn(
              "max-w-full truncate text-[9.5px] leading-none transition-colors",
              moreActive ? "font-semibold text-brand-ink" : "font-medium text-ink-muted"
            )}
          >
            {dict.nav.more}
          </span>
        </button>
      </nav>
    </div>
  );
}
