"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  CalendarClock,
  FileText,
  LoaderCircle,
  Network,
  NotebookPen,
  Search,
  ListChecks,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import type { AppMessages } from "@/lib/i18n/app";
import { cn } from "@/lib/utils";

interface SearchItem {
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
  kind: "material" | "summary" | "quiz" | "mind_map" | "task";
}

const ICONS = {
  material: FileText,
  summary: NotebookPen,
  quiz: ListChecks,
  mind_map: Network,
  task: CalendarClock,
};

export function GlobalSearch({ dict, className }: { dict: AppMessages; className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      requestId.current += 1;
      return;
    }

    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("search failed");
        const data = (await response.json()) as { items: SearchItem[] };
        if (id === requestId.current) setResults(data.items);
      } catch {
        if (id === requestId.current) {
          setResults([]);
          setError(true);
        }
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  function changeQuery(next: string) {
    setQuery(next);
    if (next.trim().length < 2) {
      requestId.current += 1;
      setResults([]);
      setLoading(false);
      setError(false);
    }
  }

  function go(href: string) {
    setOpen(false);
    changeQuery("");
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-9 min-w-0 items-center gap-2 rounded-xl border border-hairline bg-black/[0.025] px-3 text-start text-ink-muted transition-colors hover:border-hairline-strong hover:bg-black/[0.04]",
          className
        )}
        aria-label={dict.nav.searchPlaceholder}
      >
        <Search className="size-3.5 shrink-0" aria-hidden="true" />
        <span className="hidden truncate text-[12px] sm:inline">{dict.nav.searchPlaceholder}</span>
        <kbd className="ms-auto hidden shrink-0 rounded border border-hairline bg-surface-deep px-1.5 py-0.5 font-mono text-[12px] text-ink-muted sm:inline">
          ⌘K
        </kbd>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={dict.nav.searchPlaceholder}
        closeLabel={dict.common.close}
        className="sm:max-w-xl"
      >
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-ink-muted ltr:start-3 ltr:right-auto rtl:end-3 rtl:left-auto"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => changeQuery(event.target.value)}
            placeholder={dict.nav.searchPlaceholder}
            className="h-11 w-full rounded-xl border border-hairline bg-surface-deep px-9 text-sm text-ink placeholder:text-ink-muted/70 focus:border-brand/50 focus:outline-none"
          />
          {loading ? (
            <LoaderCircle
              className="absolute top-1/2 size-4 -translate-y-1/2 animate-spin text-brand-ink ltr:end-3 ltr:left-auto rtl:start-3 rtl:right-auto"
              aria-hidden="true"
            />
          ) : null}
        </div>

        <div className="mt-3 max-h-[50dvh] overflow-y-auto">
          {query.trim().length < 2 ? (
            <p className="px-1 py-6 text-center text-[13px] text-ink-muted">
              {dict.nav.searchPlaceholder}
            </p>
          ) : error ? (
            <p className="px-1 py-6 text-center text-[13px] text-danger">
              {dict.errors.loadFailed}
            </p>
          ) : !loading && results.length === 0 ? (
            <p className="px-1 py-6 text-center text-[13px] text-ink-muted">{dict.common.noData}</p>
          ) : (
            <ul className="space-y-1">
              {results.map((item) => {
                const Icon = ICONS[item.kind];
                return (
                  <li key={`${item.kind}-${item.id}`}>
                    <Link
                      href={item.href}
                      onClick={() => go(item.href)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-black/[0.04]"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-hairline bg-black/[0.03] text-ink-soft">
                        <Icon className="size-3.5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-ink">
                          {item.title}
                        </span>
                        {item.subtitle ? (
                          <span className="block truncate text-[12px] text-ink-muted">
                            {item.subtitle}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Modal>
    </>
  );
}
