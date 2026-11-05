"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BrainCircuit,
  Ellipsis,
  FileText,
  LayoutDashboard,
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

const SHEET_ROUTES = [
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

export function MobileBottomNav({
  dict,
  onMore,
  moreOpen = false,
}: {
  dict: AppMessages;
  onMore: () => void;
  moreOpen?: boolean;
}) {
  const pathname = usePathname();
  const moreActive = moreOpen || SHEET_ROUTES.some((href) => isRouteActive(pathname, href));

  return (
    <div className="em-safe-x fixed inset-x-0 bottom-0 z-40 border-t border-hairline/70 bg-surface/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_0_rgba(16,35,26,0.04),0_-18px_44px_-32px_rgba(16,35,26,0.5)] backdrop-blur-2xl lg:hidden">
      <nav
        aria-label={dict.nav.main}
        className="mx-auto flex h-[64px] w-full max-w-lg items-stretch gap-0.5 px-2"
      >
        {PRIMARY_ITEMS.map((item) => {
          const active = isRouteActive(pathname, item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "em-tap group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl transition-colors duration-200",
                active ? "text-brand-ink" : "text-ink-muted active:bg-black/[0.03]"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-0 h-[2.5px] w-8 rounded-full bg-brand transition-all duration-200",
                  active ? "opacity-100" : "w-0 opacity-0"
                )}
              />
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-[10px] transition-all duration-200",
                  active
                    ? "bg-gradient-to-b from-brand/[0.18] to-brand/[0.08] shadow-[inset_0_0_0_1px_rgba(0,201,80,0.14)]"
                    : "group-active:bg-black/[0.04]"
                )}
              >
                <Icon className="size-[19px]" strokeWidth={active ? 2.4 : 1.9} aria-hidden="true" />
              </span>
              <span
                className={cn(
                  "max-w-full truncate text-[12px] leading-none",
                  active ? "font-semibold" : "font-medium"
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
          aria-expanded={moreOpen}
          aria-haspopup="dialog"
          className={cn(
            "em-tap group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl transition-colors duration-200",
            moreActive ? "text-brand-ink" : "text-ink-muted active:bg-black/[0.03]"
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "absolute top-0 h-[2.5px] w-8 rounded-full bg-brand transition-all duration-200",
              moreActive ? "opacity-100" : "w-0 opacity-0"
            )}
          />
          <span
            className={cn(
              "grid size-8 place-items-center rounded-[10px] transition-all duration-200",
              moreActive
                ? "bg-gradient-to-b from-brand/[0.18] to-brand/[0.08] shadow-[inset_0_0_0_1px_rgba(0,201,80,0.14)]"
                : "group-active:bg-black/[0.04]"
            )}
          >
            <Ellipsis
              className={cn("size-[19px]", moreOpen && "scale-95")}
              strokeWidth={moreActive ? 2.4 : 1.9}
              aria-hidden="true"
            />
          </span>
          <span
            className={cn(
              "max-w-full truncate text-[12px] leading-none",
              moreActive ? "font-semibold" : "font-medium"
            )}
          >
            {dict.nav.more}
          </span>
        </button>
      </nav>
    </div>
  );
}
