"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Check,
  Copy,
  CornerDownLeft,
  Eraser,
  LoaderCircle,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  SlidersHorizontal,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { AiSetupNotice } from "@/components/shared/setup-notice";
import { MarkdownMessage } from "@/components/tutor/markdown-message";
import {
  clearTutorThreadAction,
  createTutorThreadAction,
  deleteTutorThreadAction,
} from "@/lib/actions/tutor";
import type { AppMessages } from "@/lib/i18n/app";
import type { Lang } from "@/lib/i18n";
import type { TutorChatMessage, TutorThread } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ThreadRow extends TutorThread {
  materials?: { file_name: string } | null;
}

interface MaterialOption {
  id: string;
  file_name: string;
}

interface ActiveThread {
  id: string;
  title: string;
  materialId: string | null;
  materialName: string | null;
}

export function TutorWorkspace({
  dict,
  lang,
  threads,
  materials,
  activeThread,
  initialMessages,
  aiConfigured,
  defaultMaterialId,
  missingThread,
}: {
  dict: AppMessages;
  lang: Lang;
  threads: ThreadRow[];
  materials: MaterialOption[];
  activeThread: ActiveThread | null;
  initialMessages: TutorChatMessage[];
  aiConfigured: boolean;
  defaultMaterialId: string | null;
  missingThread: boolean;
}) {
  const router = useRouter();
  const [threadId, setThreadId] = useState<string | null>(activeThread?.id ?? null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(
    activeThread?.materialId ?? defaultMaterialId ?? null
  );
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<TutorChatMessage>({
        api: "/api/ai/tutor",
      }),
    []
  );

  const { messages, sendMessage, setMessages, status, stop, error, regenerate } =
    useChat<TutorChatMessage>({
      id: activeThread?.id,
      messages: initialMessages,
      transport,
      onFinish: () => router.refresh(),
    });

  const busy = status === "submitted" || status === "streaming";
  const canSend = aiConfigured && !busy;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  // Grow the composer with the draft, up to a comfortable maximum height.
  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
  }, [input]);

  async function ensureThread(): Promise<string | null> {
    if (threadId) return threadId;
    setCreating(true);
    const result = await createTutorThreadAction(selectedMaterial);
    setCreating(false);
    if (!result.ok || !result.id) {
      setLocalError(result.error ?? dict.errors.saveFailed);
      return null;
    }
    setThreadId(result.id);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("thread", result.id);
      window.history.replaceState(null, "", url.toString());
    }
    return result.id;
  }

  async function submitText(raw: string) {
    const text = raw.trim();
    if (!text || !canSend || creating) return;
    setLocalError(null);
    const id = await ensureThread();
    if (!id) return;
    setInput("");
    try {
      await sendMessage(
        { text },
        {
          body: {
            threadId: id,
            materialId: selectedMaterial,
            lang,
          },
        }
      );
    } catch {
      setLocalError(dict.tutor.error);
    }
  }

  function retry() {
    if (!threadId) return;
    void regenerate({
      body: { threadId, materialId: selectedMaterial, lang },
    });
  }

  async function copyMessage(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch {
      toast.error(dict.errors.generic);
    }
  }

  const heading = activeThread?.title ?? dict.tutor.newChat;
  const sourceLabel = activeThread?.materialName ?? null;

  return (
    <div className="grid gap-5 xl:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="hidden min-w-0 xl:block">
        <div className="sticky top-24 rounded-2xl border border-hairline/80 bg-surface-raised/80 p-2.5 shadow-card">
          <Link
            href="/dashboard/tutor"
            className="group flex h-10 items-center justify-center gap-2 rounded-xl bg-brand px-3 text-[13px] font-semibold text-primary-foreground shadow-[0_10px_24px_-14px_rgba(4,120,87,0.9)] transition-all hover:-translate-y-0.5 hover:bg-brand-deep"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            {dict.tutor.newChat}
          </Link>

          <div className="mt-2 flex items-center justify-between px-2 pb-1 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              {dict.tutor.conversations}
            </p>
            <span className="rounded-full bg-brand/[0.08] px-1.5 py-0.5 text-[10px] font-semibold text-brand-ink">
              {threads.length}
            </span>
          </div>

          {threads.length === 0 ? (
            <p className="px-2 py-4 text-[12px] text-ink-muted">{dict.tutor.noConversations}</p>
          ) : (
            <ul className="max-h-[42dvh] space-y-0.5 overflow-y-auto xl:max-h-[calc(100dvh-22rem)]">
              {threads.map((thread) => {
                const active = thread.id === threadId;
                return (
                  <li key={thread.id} className="group relative">
                    <Link
                      href={`/dashboard/tutor?thread=${thread.id}`}
                      className={cn(
                        "block rounded-lg px-2.5 py-2 pe-8 transition-colors",
                        active ? "bg-black/[0.055]" : "hover:bg-black/[0.035]"
                      )}
                    >
                      <span
                        className={cn(
                          "block truncate text-[12px] font-medium",
                          active ? "text-ink" : "text-ink-soft"
                        )}
                      >
                        {thread.title || dict.tutor.untitled}
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] text-ink-muted">
                        {thread.materials?.file_name ?? dict.tutor.generalKnowledge}
                      </span>
                    </Link>
                    <div className="absolute end-1 top-1.5">
                      <ConfirmAction
                        action={() => deleteTutorThreadAction(thread.id)}
                        title={dict.tutor.deleteThread}
                        description={dict.tutor.deleteThreadBody}
                        confirmLabel={dict.common.delete}
                        cancelLabel={dict.common.cancel}
                        successMessage={dict.tutor.threadDeleted}
                        iconOnly
                        className="size-7 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 items-center gap-2 xl:hidden">
        <Link
          href="/dashboard/tutor"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-brand/[0.1] px-3 text-[12px] font-semibold text-brand-ink transition-colors hover:bg-brand/[0.16]"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          {dict.tutor.newChat}
        </Link>
        {threads.length > 0 ? (
          <div className="em-scrollbar-none flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
            {threads.map((thread) => {
              const active = thread.id === threadId;
              return (
                <Link
                  key={thread.id}
                  href={`/dashboard/tutor?thread=${thread.id}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block max-w-[150px] shrink-0 truncate rounded-xl border px-2.5 py-2 text-[12px] transition-colors",
                    active
                      ? "border-brand/30 bg-brand/[0.08] font-medium text-brand-ink"
                      : "border-hairline text-ink-muted hover:bg-black/[0.04]"
                  )}
                >
                  {thread.title || dict.tutor.untitled}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>

      <section className="em-window-shadow relative flex min-h-[70dvh] min-w-0 flex-col overflow-hidden rounded-[1.35rem] border border-hairline/80 bg-surface-raised/90">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.13),transparent_62%)]" />
        <header className="relative flex flex-wrap items-center justify-between gap-3 border-b border-hairline/80 px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="relative grid size-9 shrink-0 place-items-center rounded-xl border border-brand/25 bg-brand/[0.1] text-brand-ink shadow-[0_8px_18px_-12px_rgba(4,120,87,0.9)]">
              <Sparkles className="size-4" aria-hidden="true" />
              <span className="absolute -end-0.5 -top-0.5 size-2 rounded-full border-2 border-surface-raised bg-brand" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-[13.5px] font-semibold text-ink">{heading}</h1>
              <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-ink-muted">
                <span className="size-1.5 shrink-0 rounded-full bg-brand" />
                <p className="truncate">
                  {sourceLabel
                    ? `${dict.tutor.selectMaterial}: ${sourceLabel}`
                    : dict.tutor.noMaterial}
                </p>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-1.5">
            {!activeThread ? (
              <label className="flex min-w-0 items-center gap-2 rounded-xl border border-hairline/80 bg-surface/70 px-2.5 py-1 text-[12px] text-ink-muted">
                <SlidersHorizontal
                  className="size-3.5 shrink-0 text-brand-ink"
                  aria-hidden="true"
                />
                <select
                  value={selectedMaterial ?? ""}
                  onChange={(event) => setSelectedMaterial(event.target.value || null)}
                  className="h-7 max-w-[220px] min-w-0 bg-transparent text-[12px] text-ink-soft focus:outline-none"
                >
                  <option value="">{dict.tutor.noMaterial}</option>
                  {materials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.file_name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {threadId && messages.length > 0 ? (
              <ConfirmAction
                action={() => clearTutorThreadAction(threadId)}
                title={dict.tutor.clear}
                description={dict.tutor.clearBody}
                confirmLabel={dict.tutor.clear}
                cancelLabel={dict.common.cancel}
                triggerLabel={dict.tutor.clear}
                successMessage={dict.tutor.cleared}
                icon={Eraser}
                onSuccess={() => {
                  setMessages([]);
                  setLocalError(null);
                }}
                className="h-8 shrink-0 px-2.5"
              />
            ) : null}
          </div>
        </header>

        {missingThread ? (
          <div className="border-b border-hairline bg-[#ef4444]/[0.06] px-4 py-2 text-[12px] text-danger">
            {dict.tutor.loadError}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5" aria-busy={busy}>
          {!aiConfigured ? (
            <AiSetupNotice title={dict.tutor.notConfigured} body={dict.tutor.notConfiguredBody} />
          ) : messages.length === 0 ? (
            <div className="relative mx-auto flex max-w-lg flex-col items-center py-12 text-center sm:py-16">
              <div className="absolute inset-x-1/2 top-10 h-24 w-48 -translate-x-1/2 rounded-full bg-brand/[0.08] blur-3xl" />
              <div className="relative grid size-16 place-items-center rounded-[1.4rem] border border-brand/25 bg-brand/[0.1] text-brand-ink shadow-[0_18px_42px_-22px_rgba(4,120,87,0.75)]">
                <BrainCircuit className="size-7" aria-hidden="true" />
              </div>
              <div className="relative mt-5 inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-ink">
                <ShieldCheck className="size-3" aria-hidden="true" />
                {dict.tutor.sources}
              </div>
              <h2 className="relative mt-4 text-[18px] font-semibold tracking-[-0.025em] text-ink">
                {dict.tutor.emptyTitle}
              </h2>
              <p className="relative mt-2 max-w-sm text-[13px] leading-relaxed text-ink-muted">
                {dict.tutor.emptyBody}
              </p>
              <div className="relative mt-7 grid w-full gap-2 sm:grid-cols-3">
                {[dict.tutor.suggestion_1, dict.tutor.suggestion_2, dict.tutor.suggestion_3].map(
                  (suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void submitText(suggestion)}
                      disabled={!canSend || creating}
                      className="group rounded-xl border border-hairline/80 bg-surface/80 px-3.5 py-3 text-start text-[12px] leading-relaxed text-ink-soft transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:bg-brand/[0.05] hover:shadow-card disabled:opacity-50"
                    >
                      <span className="mb-2 block size-1.5 rounded-full bg-brand/60 transition-transform group-hover:scale-150" />
                      {suggestion}
                    </button>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-5">
              {messages.map((message) => {
                const text = message.parts
                  .filter((part): part is { type: "text"; text: string } => part.type === "text")
                  .map((part) => part.text)
                  .join("\n");
                if (!text) return null;
                const isUser = message.role === "user";
                const pages = isUser ? [] : (message.metadata?.pages ?? []);
                return (
                  <div key={message.id} className={cn("flex gap-3", isUser && "flex-row-reverse")}>
                    <span
                      className={cn(
                        "mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border",
                        isUser
                          ? "border-hairline bg-black/[0.04] text-ink-soft"
                          : "border-brand/20 bg-brand/[0.08] text-brand-ink"
                      )}
                      aria-hidden="true"
                    >
                      {isUser ? (
                        <User className="size-3.5" />
                      ) : (
                        <BrainCircuit className="size-3.5" />
                      )}
                    </span>
                    <div className={cn("min-w-0 max-w-[92%]", isUser && "text-end")}>
                      <div
                        className={cn(
                          "rounded-2xl px-3.5 py-2.5",
                          isUser
                            ? "border border-brand/15 bg-brand/[0.07] text-start text-[13px] leading-relaxed text-ink"
                            : "border border-hairline/60 bg-surface-deep/50"
                        )}
                      >
                        {isUser ? (
                          <p className="break-words whitespace-pre-wrap [overflow-wrap:anywhere]">
                            {text}
                          </p>
                        ) : (
                          <MarkdownMessage content={text} />
                        )}
                      </div>
                      {!isUser ? (
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          {pages.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-muted">
                                <BookOpen className="size-3" aria-hidden="true" />
                                {dict.tutor.sources}:
                              </span>
                              <span className="rounded-md border border-brand/20 bg-brand/[0.06] px-1.5 py-0.5 text-[11px] font-medium text-brand-ink">
                                {dict.tutor.page}{" "}
                                {pages.length === 1
                                  ? pages[0]
                                  : `${pages[0]}-${pages[pages.length - 1]}`}
                              </span>
                            </div>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => void copyMessage(message.id, text)}
                            aria-label={dict.tutor.copy}
                            className="grid size-6 place-items-center rounded-md text-ink-muted opacity-70 transition-all hover:bg-black/[0.05] hover:text-ink hover:opacity-100"
                          >
                            {copiedId === message.id ? (
                              <Check className="size-3" aria-hidden="true" />
                            ) : (
                              <Copy className="size-3" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}

              {busy ? (
                <div className="flex items-center gap-2 text-[12px] text-ink-muted">
                  <LoaderCircle
                    className="size-3.5 animate-spin text-brand-ink"
                    aria-hidden="true"
                  />
                  {dict.tutor.thinking}
                </div>
              ) : null}

              {error || localError ? (
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#ef4444]/25 bg-[#ef4444]/[0.06] px-3.5 py-2.5 text-[12px] text-danger">
                  <span>{localError ?? dict.tutor.error}</span>
                  <button
                    type="button"
                    onClick={retry}
                    disabled={!threadId || busy}
                    className="inline-flex items-center gap-1 rounded-md border border-[#ef4444]/30 px-2 py-1 text-[12px] font-medium disabled:opacity-50"
                  >
                    <RefreshCw className="size-3" aria-hidden="true" />
                    {dict.tutor.retry}
                  </button>
                </div>
              ) : null}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="border-t border-hairline/80 bg-surface/60 p-3 sm:p-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submitText(input);
            }}
            className="em-brand-glow flex items-end gap-2 rounded-2xl border border-brand/20 bg-surface-raised p-1.5 transition-colors focus-within:border-brand/45"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void submitText(input);
                }
              }}
              rows={1}
              disabled={!aiConfigured}
              placeholder={dict.tutor.placeholder}
              aria-label={dict.tutor.placeholder}
              className="max-h-40 min-h-[44px] flex-1 resize-none rounded-xl bg-transparent px-3 text-base leading-relaxed text-ink placeholder:text-ink-muted/70 focus:outline-none disabled:opacity-60 sm:text-[13px]"
            />
            {busy ? (
              <button
                type="button"
                onClick={() => stop()}
                className="inline-flex h-[42px] items-center gap-1.5 rounded-xl border border-hairline px-3 text-[12px] font-medium text-ink-soft transition-colors hover:bg-black/[0.05]"
              >
                <Square className="size-3.5" aria-hidden="true" />
                {dict.tutor.stop}
              </button>
            ) : (
              <button
                type="submit"
                disabled={!canSend || !input.trim() || creating}
                className="inline-flex h-[42px] items-center gap-1.5 rounded-xl bg-brand px-3.5 text-[13px] font-semibold text-primary-foreground shadow-[0_10px_22px_-14px_rgba(4,120,87,0.9)] transition-all hover:-translate-y-0.5 hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-40"
              >
                {creating ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="size-4 rtl:-scale-x-100" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">{dict.tutor.send}</span>
              </button>
            )}
          </form>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-[12px] text-ink-muted">
            <CornerDownLeft className="size-3" aria-hidden="true" />
            {dict.tutor.composerHint}
          </p>
        </div>
      </section>

      <div className="flex items-center justify-between gap-2 text-[12px] text-ink-muted xl:hidden">
        <Link href="/dashboard/materials" className="inline-flex items-center gap-1">
          <ArrowLeft className="size-3 rtl:hidden" aria-hidden="true" />
          <ArrowRight className="size-3 ltr:hidden" aria-hidden="true" />
          {dict.nav.materials}
        </Link>
        <span className="inline-flex items-center gap-1">
          <Trash2 className="size-3" aria-hidden="true" />
          {dict.mindMaps.autosaveNote}
        </span>
      </div>
    </div>
  );
}
