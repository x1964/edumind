"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  Check,
  ClipboardCopy,
  Flag,
  LoaderCircle,
  LogOut,
  MessageCircle,
  Play,
  RefreshCw,
  Send,
  Share2,
  Timer,
  Trophy,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  closeStudyRoomAction,
  finishRoomChallengeAction,
  leaveStudyRoomAction,
  reportStudyRoomAction,
  startRoomChallengeAction,
  submitChallengeAnswersAction,
} from "@/lib/actions/rooms";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import type { AppMessages } from "@/lib/i18n/app";
import { cn } from "@/lib/utils";

export interface RoomInfo {
  id: string;
  code: string;
  name: string;
  status: "open" | "in_progress" | "closed";
  subjectName: string | null;
  ownerId: string;
  expiresAt: string | null;
}

export interface ChallengeInfo {
  id: string;
  status: "pending" | "active" | "finished";
  endsAt: string | null;
  quizId: string;
  quizTitle: string;
  timeLimitMinutes: number | null;
  questions: Array<{
    id: string;
    type: string;
    prompt: string;
    options: string[] | null;
  }>;
}

function formatRemaining(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  return hours > 0 ? `${hours}h ${String(minutes).padStart(2, "0")}m` : `${minutes}m`;
}

export function RoomClient({
  dict,
  room,
  isOwner,
  participants,
  challenge,
  quizOptions,
  attempts,
  myScore,
}: {
  dict: AppMessages;
  room: RoomInfo;
  isOwner: boolean;
  participants: Array<{ userId: string; name: string; role: string }>;
  challenge: ChallengeInfo | null;
  quizOptions: Array<{ id: string; title: string }>;
  attempts: Array<{ userId: string; name: string; score: number }>;
  myScore: number | null;
}) {
  const router = useRouter();
  const refresh = useAutoRefresh(12_000, room.status !== "closed");
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, startRefresh] = useTransition();
  const [quizId, setQuizId] = useState(quizOptions[0]?.id ?? "");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!challenge || challenge.status !== "active") return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [challenge]);

  // Keep the "ends in…" label honest even when there is no active challenge.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const remaining = useMemo(() => {
    if (!challenge?.endsAt) return null;
    return Math.max(0, Math.floor((new Date(challenge.endsAt).getTime() - now) / 1000));
  }, [challenge, now]);

  const expiresIn = useMemo(() => {
    if (!room.expiresAt) return null;
    return Math.max(0, Math.floor((new Date(room.expiresAt).getTime() - now) / 1000));
  }, [room.expiresAt, now]);

  const answered = Object.values(answers).filter((value) => value.trim().length > 0).length;

  function run(
    action: () => Promise<{ ok: boolean; error?: string; message?: string }>,
    onSuccess?: () => void
  ) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(result.message ?? dict.common.saved);
        if (onSuccess) onSuccess();
        else router.refresh();
      } else {
        setError(result.error ?? dict.errors.saveFailed);
      }
    });
  }

  function copyCode() {
    void navigator.clipboard.writeText(room.code).then(
      () => toast.success(dict.learn.codeCopied),
      () => toast.error(dict.errors.generic)
    );
  }

  function inviteUrl() {
    if (typeof window === "undefined") return "";
    const url = new URL("/dashboard/study-rooms", window.location.origin);
    url.searchParams.set("code", room.code);
    return url.toString();
  }

  function copyInvite() {
    const url = inviteUrl();
    if (!url) return;
    void navigator.clipboard.writeText(url).then(
      () => toast.success(dict.learn.inviteCopied),
      () => toast.error(dict.errors.generic)
    );
  }

  function shareWhatsApp() {
    const url = inviteUrl();
    if (!url) return;
    const message = `${room.name} — ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-hairline bg-surface-raised/80 px-4 py-3">
        <div className="flex flex-wrap items-start gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[16px] font-semibold text-ink">{room.name}</h2>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink-muted">
              <span>{room.subjectName ?? dict.learn.roomSubject}</span>
              <span aria-hidden="true">·</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-medium",
                  room.status === "closed" ? "text-danger" : "text-brand-ink"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-1.5 rounded-full",
                    room.status === "closed" ? "bg-danger" : "animate-pulse bg-brand"
                  )}
                />
                {room.status === "closed"
                  ? dict.learn.roomClosed
                  : room.status === "in_progress"
                    ? dict.learn.challengeActive
                    : dict.learn.roomOpen}
              </span>
              {expiresIn !== null && room.status !== "closed" ? (
                <span className="text-ink-muted">
                  · {dict.learn.roomExpiresIn.replace("{time}", formatRemaining(expiresIn))}
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => startRefresh(() => refresh())}
              disabled={isRefreshing}
              title={dict.learn.liveUpdates}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-hairline px-2.5 text-[12px] text-ink-soft hover:bg-black/[0.04] disabled:opacity-50"
            >
              <RefreshCw
                className={cn("size-3.5", isRefreshing && "animate-spin")}
                aria-hidden="true"
              />
              {dict.common.refresh}
            </button>
            <button
              type="button"
              onClick={copyCode}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-hairline px-2.5 font-mono text-[12px] text-ink-soft hover:bg-black/[0.04]"
              dir="ltr"
              title={dict.learn.copyCode}
            >
              <ClipboardCopy className="size-3.5" aria-hidden="true" />
              {room.code}
            </button>
            <button
              type="button"
              onClick={copyInvite}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-hairline px-2.5 text-[12px] text-ink-soft hover:bg-black/[0.04]"
            >
              <Share2 className="size-3.5" aria-hidden="true" />
              {dict.learn.inviteFriends}
            </button>
            <button
              type="button"
              onClick={shareWhatsApp}
              aria-label={dict.learn.shareWhatsapp}
              title={dict.learn.shareWhatsapp}
              className="grid size-8 place-items-center rounded-lg border border-hairline text-ink-soft hover:bg-black/[0.04]"
            >
              <MessageCircle className="size-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() =>
                run(
                  () => leaveStudyRoomAction(room.id),
                  () => router.push("/dashboard/study-rooms")
                )
              }
              disabled={isPending}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-hairline px-2.5 text-[12px] text-ink-soft hover:bg-black/[0.04] disabled:opacity-50"
            >
              <LogOut className="size-3.5" aria-hidden="true" />
              {dict.learn.leaveRoom}
            </button>
            {isOwner && room.status !== "closed" ? (
              <button
                type="button"
                onClick={() => run(() => closeStudyRoomAction(room.id))}
                disabled={isPending}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-danger/30 px-2.5 text-[12px] text-danger hover:bg-danger/[0.06] disabled:opacity-50"
              >
                {dict.learn.closeRoom}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-danger/25 bg-danger/[0.06] px-3 py-2 text-[12px] text-danger">
          {error}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-12">
        <section className="space-y-5 lg:col-span-8">
          {challenge && challenge.status !== "finished" ? (
            <div className="rounded-2xl border border-hairline bg-surface-raised/80">
              <header className="flex flex-wrap items-center gap-2 border-b border-hairline px-4 py-3">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[14px] font-semibold text-ink">
                    {challenge.quizTitle}
                  </h3>
                  <p className="text-[12px] text-ink-muted">
                    {dict.learn.challengeActive} ·{" "}
                    {dict.learn.tasksDone
                      .replace("{done}", String(answered))
                      .replace("{total}", String(challenge.questions.length))}
                  </p>
                </div>
                {remaining !== null ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[12px] font-medium",
                      remaining <= 60
                        ? "border-danger/30 bg-danger/[0.08] text-danger"
                        : "border-hairline bg-black/[0.03] text-ink-soft"
                    )}
                    dir="ltr"
                  >
                    <Timer className="size-3.5" aria-hidden="true" />
                    {String(Math.floor(remaining / 60)).padStart(2, "0")}:
                    {String(remaining % 60).padStart(2, "0")}
                  </span>
                ) : null}
              </header>
              <div className="space-y-4 p-4">
                {myScore !== null ? (
                  <p className="rounded-xl border border-brand/25 bg-brand/[0.06] px-3 py-2 text-[13px] font-medium text-brand-ink">
                    {dict.learn.challengeScore}: {myScore}%
                  </p>
                ) : (
                  <>
                    <ol className="space-y-3">
                      {challenge.questions.map((question, index) => {
                        const options =
                          question.type === "true_false"
                            ? ["true", "false"]
                            : (question.options ?? []);
                        return (
                          <li
                            key={question.id}
                            className="rounded-xl border border-hairline/70 p-3"
                          >
                            <p className="text-[12.5px] font-medium text-ink">
                              {index + 1}. {question.prompt}
                            </p>
                            <div className="mt-2 grid gap-1.5">
                              {options.length > 0 ? (
                                options.map((option) => (
                                  <label
                                    key={option}
                                    className={cn(
                                      "flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[12px] transition-colors",
                                      answers[question.id] === option
                                        ? "border-brand/40 bg-brand/[0.07] text-ink"
                                        : "border-hairline text-ink-soft hover:bg-black/[0.03]"
                                    )}
                                  >
                                    <input
                                      type="radio"
                                      name={question.id}
                                      value={option}
                                      checked={answers[question.id] === option}
                                      onChange={() =>
                                        setAnswers((current) => ({
                                          ...current,
                                          [question.id]: option,
                                        }))
                                      }
                                      className="size-3.5 accent-[var(--brand)]"
                                    />
                                    {option === "true"
                                      ? (dict.common.yes ?? option)
                                      : option === "false"
                                        ? (dict.common.no ?? option)
                                        : option}
                                  </label>
                                ))
                              ) : (
                                <Input
                                  value={answers[question.id] ?? ""}
                                  onChange={(event) =>
                                    setAnswers((current) => ({
                                      ...current,
                                      [question.id]: event.target.value,
                                    }))
                                  }
                                  maxLength={4000}
                                  dir="auto"
                                />
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                    <button
                      type="button"
                      onClick={() => run(() => submitChallengeAnswersAction(challenge.id, answers))}
                      disabled={isPending || answered < challenge.questions.length}
                      className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand px-3.5 text-[13px] font-semibold text-primary-foreground hover:bg-brand-deep disabled:opacity-50"
                    >
                      {isPending ? (
                        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Send className="size-4" aria-hidden="true" />
                      )}
                      {dict.learn.submitChallenge}
                    </button>
                  </>
                )}
                {isOwner ? (
                  <button
                    type="button"
                    onClick={() => run(() => finishRoomChallengeAction(room.id, challenge.id))}
                    disabled={isPending}
                    className="inline-flex h-8 items-center rounded-lg border border-hairline px-3 text-[12px] font-medium text-ink-soft hover:bg-black/[0.04] disabled:opacity-50"
                  >
                    {dict.learn.challengeFinished}
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-hairline bg-surface-raised/60 px-4 py-8 text-center">
              <Play className="mx-auto size-6 text-brand-ink" aria-hidden="true" />
              <p className="mt-2 text-[13px] font-medium text-ink">{dict.learn.noChallenge}</p>
              {isOwner ? (
                <div className="mx-auto mt-3 max-w-sm space-y-2 text-start">
                  <Label htmlFor="challenge-quiz">{dict.learn.selectQuiz}</Label>
                  {quizOptions.length === 0 ? (
                    <p className="text-[12px] text-ink-muted">{dict.learn.noQuizOption}</p>
                  ) : (
                    <>
                      <Select
                        id="challenge-quiz"
                        value={quizId}
                        onChange={(event) => setQuizId(event.target.value)}
                      >
                        {quizOptions.map((quiz) => (
                          <option key={quiz.id} value={quiz.id}>
                            {quiz.title}
                          </option>
                        ))}
                      </Select>
                      <button
                        type="button"
                        onClick={() => run(() => startRoomChallengeAction(room.id, quizId))}
                        disabled={isPending || !quizId}
                        className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-brand px-3.5 text-[13px] font-semibold text-primary-foreground hover:bg-brand-deep disabled:opacity-50"
                      >
                        <Play className="size-4" aria-hidden="true" />
                        {dict.learn.startChallenge}
                      </button>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {challenge && challenge.status === "finished" ? (
            <p className="rounded-xl border border-hairline bg-black/[0.02] px-3 py-2 text-[12px] text-ink-muted">
              {dict.learn.challengeFinished}
            </p>
          ) : null}

          <div className="rounded-2xl border border-hairline bg-surface-raised/80 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[13px] font-semibold text-ink">{dict.learn.reportRoom}</h3>
              <button
                type="button"
                onClick={() => setShowReport((value) => !value)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-hairline px-2.5 text-[11.5px] text-ink-soft hover:bg-black/[0.04]"
              >
                <Flag className="size-3.5" aria-hidden="true" />
                {dict.learn.reportRoom}
              </button>
            </div>
            {showReport ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder={dict.learn.reportReason}
                />
                <button
                  type="button"
                  onClick={() =>
                    run(() => reportStudyRoomAction({ roomId: room.id, reason: reportReason }))
                  }
                  disabled={isPending || reportReason.trim().length < 3}
                  className="inline-flex h-8 items-center rounded-lg bg-brand px-3 text-[11.5px] font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {dict.learn.reportRoom}
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="space-y-5 lg:col-span-4">
          <div className="rounded-2xl border border-hairline bg-surface-raised/80">
            <header className="flex items-center gap-2 border-b border-hairline px-4 py-3">
              <Users className="size-4 text-brand-ink" aria-hidden="true" />
              <h3 className="text-[13px] font-semibold text-ink">
                {dict.learn.activeParticipants}
              </h3>
            </header>
            <ul className="divide-y divide-hairline/60">
              {participants.map((participant) => (
                <li key={participant.userId} className="flex items-center gap-2 px-4 py-2.5">
                  <span className="grid size-7 place-items-center rounded-full border border-brand/25 bg-brand/10 text-[11px] font-semibold text-brand-ink">
                    {participant.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-soft">
                    {participant.name}
                  </span>
                  {participant.role === "owner" ? (
                    <Badge tone="brand">{dict.learn.ownerLabel}</Badge>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-hairline bg-surface-raised/80">
            <header className="flex items-center gap-2 border-b border-hairline px-4 py-3">
              <Trophy className="size-4 text-brand-ink" aria-hidden="true" />
              <h3 className="text-[13px] font-semibold text-ink">{dict.learn.challengeResults}</h3>
            </header>
            {attempts.length === 0 ? (
              <p className="px-4 py-4 text-center text-[12px] text-ink-muted">
                {dict.learn.noChallenge}
              </p>
            ) : (
              <ul className="divide-y divide-hairline/60">
                {attempts
                  .slice()
                  .sort((a, b) => b.score - a.score)
                  .map((attempt) => (
                    <li key={attempt.userId} className="flex items-center gap-2 px-4 py-2.5">
                      <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-soft">
                        {attempt.name}
                      </span>
                      <Badge tone={attempt.score >= 80 ? "brand" : "warning"}>
                        {attempt.score}%
                      </Badge>
                      {attempt.userId === room.ownerId ? (
                        <Check className="size-3.5 text-brand" aria-hidden="true" />
                      ) : null}
                    </li>
                  ))}
              </ul>
            )}
          </div>

          <Link
            href="/dashboard/study-rooms"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-brand-ink hover:opacity-80"
          >
            <ArrowLeft className="size-3 rtl:hidden" aria-hidden="true" />
            <ArrowLeft className="hidden size-3 rotate-180 ltr:block" aria-hidden="true" />
            {dict.learn.myRooms}
          </Link>
        </aside>
      </div>
    </div>
  );
}
