"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { AppMessages } from "@/lib/i18n/app";

export function MaterialsToolbar({ dict }: { dict: AppMessages }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const hasFilters = Boolean(searchParams.get("q") || searchParams.get("type"));

  function update(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(next)) {
      if (!val) params.delete(key);
      else params.set(key, val);
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (value === current) return;
    const timer = setTimeout(() => update({ q: value || null }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <Search
          className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-muted"
          aria-hidden="true"
        />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={dict.materials.searchPlaceholder}
          className="h-11 w-full rounded-xl border border-hairline bg-black/[0.025] ps-9 pe-3 text-base text-ink transition-colors placeholder:text-ink-muted/70 focus:border-brand/50 focus:bg-surface-raised focus:outline-none sm:h-9 sm:text-[13px]"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
        <select
          value={searchParams.get("type") ?? ""}
          onChange={(event) => update({ type: event.target.value || null })}
          aria-label={dict.common.filter}
          className="h-10 min-w-0 rounded-xl border border-hairline bg-black/[0.025] px-3 text-base text-ink-soft focus:border-brand/50 focus:outline-none sm:h-9 sm:text-[12px]"
        >
          <option value="">{dict.materials.filterAll}</option>
          <option value="pdf">PDF</option>
          <option value="docx">DOCX</option>
          <option value="txt">TXT</option>
        </select>
        <select
          value={searchParams.get("sort") ?? "newest"}
          onChange={(event) => update({ sort: event.target.value })}
          aria-label={dict.materials.sortNewest}
          className="h-10 min-w-0 rounded-xl border border-hairline bg-black/[0.025] px-3 text-base text-ink-soft focus:border-brand/50 focus:outline-none sm:h-9 sm:text-[12px]"
        >
          <option value="newest">{dict.materials.sortNewest}</option>
          <option value="oldest">{dict.materials.sortOldest}</option>
          <option value="name">{dict.materials.sortName}</option>
        </select>
        {hasFilters ? (
          <button
            type="button"
            onClick={() => update({ q: null, type: null })}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-hairline px-3 text-[12.5px] font-medium text-ink-soft transition-colors hover:bg-black/[0.04]"
          >
            <X className="size-3.5" aria-hidden="true" />
            {dict.common.clearFilters}
          </button>
        ) : null}
      </div>
    </div>
  );
}
