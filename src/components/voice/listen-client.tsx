"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Headphones, LoaderCircle, Pause, Play, Save, Square, Trash2, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { deleteAudioLessonAction, saveAudioLessonAction } from "@/lib/actions/voice";
import type { AppMessages } from "@/lib/i18n/app";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface SavedTranscript {
  id: string;
  title: string;
  transcript: string;
  language: "ar" | "en";
  createdAt: string;
  lessonId?: string | null;
  threadId?: string | null;
}

/**
 * A listening source that originates from a lesson (uploaded study material).
 */
export interface ListenLessonSource {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  content: string | null;
}

const SPEEDS = [0.75, 1, 1.25, 1.5] as const;

function formatListenSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function ListenClient({
  dict,
  lang,
  voice,
  saved,
  initialText,
  initialTitle,
  initialLessonId,
  lessons,
}: {
  dict: AppMessages;
  lang: Lang;
  voice: { configured: boolean; arabic: boolean };
  saved: SavedTranscript[];
  initialText: string;
  initialTitle: string;
  initialLessonId: string | null;
  lessons: ListenLessonSource[];
}) {
  const router = useRouter();
  const [text, setText] = useState(initialText);
  const [title, setTitle] = useState(initialTitle);
  const [speechLang, setSpeechLang] = useState<Lang>(lang);
  const [speed, setSpeed] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [usingBrowser, setUsingBrowser] = useState(!voice.configured);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [activeSaved, setActiveSaved] = useState<string | null>(null);
  const [sourceId, setSourceId] = useState<string | null>(initialLessonId);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const startTimestampRef = useRef<number | null>(null);

  const canUseServer = voice.configured && (speechLang !== "ar" || voice.arabic);

  const progress =
    durationSeconds && durationSeconds > 0 ? Math.min(1, elapsedSeconds / durationSeconds) : null;

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Browser speech keeps a monotonic clock while speaking.
  useEffect(() => {
    if (!playing || !usingBrowser) return;
    const anchor = startTimestampRef.current ?? Date.now();
    const intervalId = window.setInterval(() => {
      setElapsedSeconds((Date.now() - anchor) / 1000);
    }, 250);
    return () => window.clearInterval(intervalId);
  }, [playing, usingBrowser]);

  function stopAll() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    startTimestampRef.current = null;
    setPlaying(false);
    setElapsedSeconds(0);
    setDurationSeconds(null);
  }

  function speakWithBrowser() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setError(dict.learn.audioError);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 5000));
    utterance.lang = speechLang === "ar" ? "ar-SA" : "en-US";
    utterance.rate = speed;
    const chosen = window.speechSynthesis
      .getVoices()
      .find((voiceItem) => voiceItem.lang.toLowerCase().startsWith(speechLang));
    if (chosen) utterance.voice = chosen;
    startTimestampRef.current = Date.now();
    setElapsedSeconds(0);
    utterance.onend = () => {
      startTimestampRef.current = null;
      setPlaying(false);
      setElapsedSeconds(0);
    };
    utterance.onerror = () => {
      startTimestampRef.current = null;
      setPlaying(false);
      setError(dict.learn.audioError);
    };
    window.speechSynthesis.speak(utterance);
    setPlaying(true);
  }

  async function play() {
    if (!text.trim()) return;
    setError(null);
    setUsingBrowser(!canUseServer);

    if (!canUseServer) {
      speakWithBrowser();
      return;
    }

    setLoading(true);
    setElapsedSeconds(0);
    setDurationSeconds(null);
    try {
      const response = await fetch("/api/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 5000), lang: speechLang, speed }),
      });

      if (!response.ok) {
        // Provider failure is not a dead end: the labelled browser fallback is real.
        setUsingBrowser(true);
        setLoading(false);
        speakWithBrowser();
        return;
      }

      const blob = await response.blob();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const audio = audioRef.current;
      if (!audio) {
        const next = new Audio(url);
        next.onended = () => {
          setPlaying(false);
          setElapsedSeconds(0);
          setDurationSeconds(null);
        };
        next.ontimeupdate = () => {
          setElapsedSeconds(next.currentTime);
        };
        next.onloadedmetadata = () => {
          setDurationSeconds(Number.isFinite(next.duration) ? next.duration : null);
        };
        audioRef.current = next;
      } else {
        audio.src = url;
      }
      const playback = audioRef.current;
      if (!playback) return;
      playback.playbackRate = speed;
      await playback.play();
      setPlaying(true);
    } catch {
      setUsingBrowser(true);
      speakWithBrowser();
    } finally {
      setLoading(false);
    }
  }

  function pause() {
    if (usingBrowser) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.pause();
        startTimestampRef.current = Date.now() - elapsedSeconds * 1000;
      }
    } else {
      audioRef.current?.pause();
    }
    setPlaying(false);
  }

  function resume() {
    if (usingBrowser) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.resume();
        startTimestampRef.current = Date.now() - elapsedSeconds * 1000;
      }
    } else {
      void audioRef.current?.play();
    }
    setPlaying(true);
  }

  function saveTranscript() {
    if (!text.trim()) return;
    startSaving(async () => {
      const result = await saveAudioLessonAction({
        title: title.trim() || text.trim().slice(0, 60),
        transcript: text,
        language: speechLang,
        lessonId: sourceId,
        durationSeconds: null,
      });
      if (result.ok) {
        toast.success(result.message ?? dict.learn.transcriptSaved);
        router.refresh();
      } else {
        toast.error(result.error ?? dict.errors.saveFailed);
      }
    });
  }

  function loadSaved(item: SavedTranscript) {
    stopAll();
    setText(item.transcript);
    setTitle(item.title);
    setSpeechLang(item.language);
    setSourceId(item.lessonId ?? null);
    setActiveSaved(item.id);
    setError(null);
  }

  function deleteSaved(id: string) {
    startDeleting(async () => {
      const result = await deleteAudioLessonAction(id);
      if (result.ok) {
        toast.success(result.message ?? dict.learn.transcriptDeleted);
        if (activeSaved === id) setActiveSaved(null);
        router.refresh();
      } else {
        toast.error(result.error ?? dict.errors.deleteFailed);
      }
    });
  }

  function handleSourceChange(value: string) {
    stopAll();
    const nextId = value || null;
    setSourceId(nextId);
    setElapsedSeconds(0);
    setDurationSeconds(null);
    if (!nextId) {
      setError(null);
      return;
    }
    const lesson = lessons.find((item) => item.id === nextId) ?? null;
    if (!lesson) {
      setError(null);
      return;
    }
    setText(
      [lang === "ar" ? lesson.descriptionAr : lesson.descriptionEn, lesson.content]
        .filter(Boolean)
        .join("\n\n")
    );
    setTitle(lang === "ar" ? lesson.titleAr : lesson.titleEn);
    setError(null);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <section className="space-y-4 lg:col-span-7">
        <div className="rounded-2xl border border-hairline bg-surface-raised/80">
          <header className="flex items-center gap-2 border-b border-hairline px-4 py-3">
            <Headphones className="size-4 text-brand-ink" aria-hidden="true" />
            <h2 className="text-[14px] font-semibold text-ink">{dict.learn.listenTitle}</h2>
          </header>
          <div className="space-y-3 p-4">
            {!voice.configured ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.07] px-3 py-2.5">
                <p className="text-[12px] font-medium text-amber-800">
                  {dict.learn.voiceUnavailable}
                </p>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-soft">
                  {dict.learn.voiceUnavailableBody}
                </p>
              </div>
            ) : !voice.arabic && speechLang === "ar" ? (
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/[0.07] px-3 py-2 text-[12px] text-amber-800">
                {dict.learn.browserVoiceNote}
              </p>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="listen-lang">{dict.common.language}</Label>
                <Select
                  id="listen-lang"
                  value={speechLang}
                  onChange={(event) => {
                    stopAll();
                    setSpeechLang(event.target.value as Lang);
                  }}
                >
                  <option value="ar">{dict.learn.langAr}</option>
                  <option value="en">{dict.learn.langEn}</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="listen-speed">{dict.learn.speed}</Label>
                <Select
                  id="listen-speed"
                  value={String(speed)}
                  onChange={(event) => setSpeed(Number(event.target.value))}
                >
                  {SPEEDS.map((value) => (
                    <option key={value} value={value}>
                      {value}×
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="listen-source">{dict.learn.chooseSource}</Label>
              <Select
                id="listen-source"
                value={sourceId ?? ""}
                onChange={(event) => handleSourceChange(event.target.value)}
              >
                <option value="">{dict.learn.sourceCustom}</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lang === "ar" ? lesson.titleAr : lesson.titleEn}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="listen-title">{dict.learn.sourceLabel}</Label>
              <Input
                id="listen-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={160}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="listen-text">{dict.learn.transcriptLabel}</Label>
              <Textarea
                id="listen-text"
                value={text}
                onChange={(event) => {
                  setText(event.target.value);
                  setElapsedSeconds(0);
                  setDurationSeconds(null);
                }}
                rows={8}
                maxLength={20000}
                placeholder={dict.learn.pasteText}
                dir="auto"
              />
            </div>

            {error ? (
              <p className="rounded-lg border border-danger/25 bg-danger/[0.06] px-3 py-2 text-[12px] text-danger">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              {!playing ? (
                <button
                  type="button"
                  onClick={loading ? undefined : play}
                  disabled={loading || !text.trim()}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand px-3.5 text-[13px] font-semibold text-primary-foreground hover:bg-brand-deep disabled:opacity-50"
                >
                  {loading ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Play className="size-4" aria-hidden="true" />
                  )}
                  {loading ? dict.learn.loadingAudio : dict.learn.play}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={pause}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand px-3.5 text-[13px] font-semibold text-primary-foreground hover:bg-brand-deep"
                >
                  <Pause className="size-4" aria-hidden="true" />
                  {dict.learn.pause}
                </button>
              )}
              <button
                type="button"
                onClick={resume}
                disabled={!text.trim()}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-hairline px-3 text-[12.5px] font-medium text-ink-soft hover:bg-black/[0.04] disabled:opacity-50"
              >
                <Volume2 className="size-3.5" aria-hidden="true" />
                {dict.learn.resume}
              </button>
              <button
                type="button"
                onClick={stopAll}
                disabled={!text.trim()}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-hairline px-3 text-[12.5px] font-medium text-ink-soft hover:bg-black/[0.04] disabled:opacity-50"
              >
                <Square className="size-3.5" aria-hidden="true" />
                {dict.learn.stop}
              </button>
              <button
                type="button"
                onClick={saveTranscript}
                disabled={isSaving || !text.trim()}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-hairline px-3 text-[12.5px] font-medium text-ink-soft hover:bg-black/[0.04] disabled:opacity-50"
              >
                {isSaving ? (
                  <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="size-3.5" aria-hidden="true" />
                )}
                {dict.learn.saveForLater}
              </button>
            </div>

            {progress !== null && durationSeconds ? (
              <div className="space-y-2">
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progress * 100)}
                >
                  <div
                    className="h-full rounded-full bg-brand transition-[width] duration-200 ease-linear"
                    style={{ width: `${Math.min(100, progress * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-ink-muted">
                  <span>{formatListenSeconds(elapsedSeconds)}</span>
                  <span>{formatListenSeconds(durationSeconds)}</span>
                </div>
              </div>
            ) : null}

            <p className="text-[11px] leading-relaxed text-ink-muted">
              {canUseServer ? dict.learn.serverVoice : dict.learn.browserVoiceNote}
            </p>
          </div>
        </div>
      </section>

      <aside className="space-y-3 lg:col-span-5">
        <h2 className="text-[14px] font-semibold text-ink">{dict.learn.savedTranscripts}</h2>
        {saved.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-hairline px-4 py-8 text-center text-[12px] text-ink-muted">
            {dict.learn.noSavedTranscripts}
          </p>
        ) : (
          <ul className="space-y-2">
            {saved.map((item) => (
              <li
                key={item.id}
                className={cn(
                  "rounded-2xl border px-3 py-2.5",
                  activeSaved === item.id
                    ? "border-brand/40 bg-brand/[0.04]"
                    : "border-hairline bg-surface-raised/80"
                )}
              >
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => loadSaved(item)}
                    className="min-w-0 flex-1 text-start"
                  >
                    <span className="block truncate text-[12.5px] font-medium text-ink">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-ink-muted">
                      {item.language === "ar" ? dict.learn.langAr : dict.learn.langEn} ·{" "}
                      {item.transcript.slice(0, 60)}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSaved(item.id)}
                    disabled={isDeleting}
                    aria-label={dict.common.delete}
                    className="grid size-7 shrink-0 place-items-center rounded-lg text-ink-muted hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
