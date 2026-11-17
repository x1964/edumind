"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Headphones, LoaderCircle, Pause, Play, Save, Square, Trash2 } from "lucide-react";
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
 * A listening source: a lesson, one of the student's summaries, or the latest
 * answer in a tutor conversation. Content is already plain text.
 */
export interface ListenSource {
  id: string;
  kind: "lesson" | "summary" | "tutor";
  titleAr: string;
  titleEn: string;
  content: string;
}

const SPEEDS = [0.75, 1, 1.25, 1.5] as const;
const MAX_SERVER_CHARS = 5000;
/** Chrome silently stops an utterance after a few sentences; keep each one short. */
const MAX_CHUNK_CHARS = 180;
/** Rough characters spoken per second, used only for the progress estimate. */
const CHARS_PER_SECOND: Record<Lang, number> = { ar: 11, en: 14 };

function formatListenSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function splitLongSegment(segment: string, maxChars: number): string[] {
  if (segment.length <= maxChars) return [segment];
  const words = segment.split(/\s+/).filter(Boolean);
  const parts: string[] = [];
  let current = "";
  for (const word of words) {
    if (!current) {
      current = word;
    } else if (`${current} ${word}`.length <= maxChars) {
      current = `${current} ${word}`;
    } else {
      parts.push(current);
      current = word;
    }
  }
  if (current) parts.push(current);
  // A single unbroken word longer than the limit still has to be split.
  return parts.flatMap((part) =>
    part.length <= maxChars ? [part] : (part.match(new RegExp(`.{1,${maxChars}}`, "gs")) ?? [])
  );
}

/**
 * Splits a transcript into short utterances so long texts are read to the end
 * instead of being truncated by the browser speech engine.
 */
function splitIntoChunks(text: string, maxChars = MAX_CHUNK_CHARS): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const segments = normalized
    .split(/(?<=[.!?ØŸâ€¦\n])\s+/u)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .flatMap((segment) => splitLongSegment(segment, maxChars));

  const chunks: string[] = [];
  let current = "";
  for (const segment of segments) {
    if (!current) {
      current = segment;
    } else if (`${current} ${segment}`.length <= maxChars) {
      current = `${current} ${segment}`;
    } else {
      chunks.push(current);
      current = segment;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/** Small indirection so event-driven helpers stay outside React's purity checks. */
function timeNow(): number {
  return Date.now();
}

function pickDefaultVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  return (
    voices.find((voice) => /natural|neural|google|premium|enhanced/i.test(voice.name)) ??
    voices.find((voice) => !voice.localService) ??
    voices[0] ??
    null
  );
}

interface BrowserPlayback {
  chunks: string[];
  index: number;
  charsDone: number;
  chunkStartedAt: number;
  pausedAt: number | null;
  cancelled: boolean;
}

export function ListenClient({
  dict,
  lang,
  voice,
  saved,
  initialText,
  initialTitle,
  initialSourceId,
  sources,
}: {
  dict: AppMessages;
  lang: Lang;
  voice: { configured: boolean; arabic: boolean };
  saved: SavedTranscript[];
  initialText: string;
  initialTitle: string;
  initialSourceId: string | null;
  sources: ListenSource[];
}) {
  const router = useRouter();
  const [text, setText] = useState(initialText);
  const [title, setTitle] = useState(initialTitle);
  const [speechLang, setSpeechLang] = useState<Lang>(lang);
  const [speed, setSpeed] = useState<number>(1);
  const [preferServer, setPreferServer] = useState(voice.configured);
  const [voiceName, setVoiceName] = useState("");
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [usingBrowser, setUsingBrowser] = useState(!voice.configured);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [activeSaved, setActiveSaved] = useState<string | null>(null);
  const [sourceId, setSourceId] = useState<string | null>(initialSourceId);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const browserRef = useRef<BrowserPlayback | null>(null);
  const speedRef = useRef(speed);
  const charsPerSecondRef = useRef(CHARS_PER_SECOND[lang]);

  const serverAvailable = voice.configured && (speechLang !== "ar" || voice.arabic);
  const canUseServer = serverAvailable && preferServer;

  const languageVoices = useMemo(
    () => systemVoices.filter((item) => item.lang.toLowerCase().startsWith(speechLang)),
    [systemVoices, speechLang]
  );

  const progress =
    durationSeconds && durationSeconds > 0 ? Math.min(1, elapsedSeconds / durationSeconds) : null;

  const sourceGroups = useMemo(
    () =>
      [
        { kind: "lesson" as const, label: dict.learn.sourceLesson },
        { kind: "summary" as const, label: dict.learn.sourceSummary },
        { kind: "tutor" as const, label: dict.learn.sourceTutor },
      ]
        .map((group) => ({
          ...group,
          items: sources.filter((source) => source.kind === group.kind),
        }))
        .filter((group) => group.items.length > 0),
    [dict.learn.sourceLesson, dict.learn.sourceSummary, dict.learn.sourceTutor, sources]
  );

  // The browser exposes its voice list asynchronously (and again once the
  // system voices finish loading), so it must be subscribed to, not read once.
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const load = () => setSystemVoices(synth.getVoices());
    load();
    synth.addEventListener?.("voiceschanged", load);
    return () => synth.removeEventListener?.("voiceschanged", load);
  }, []);

  useEffect(() => {
    return () => {
      const state = browserRef.current;
      if (state) state.cancelled = true;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, []);

  // Progress clock for the browser voice. Server audio reports its own time.
  useEffect(() => {
    if (!playing || !usingBrowser) return;
    const intervalId = window.setInterval(() => {
      const state = browserRef.current;
      if (!state || state.pausedAt !== null) return;
      const rate = charsPerSecondRef.current * speedRef.current;
      const elapsed = state.charsDone / rate + (timeNow() - state.chunkStartedAt) / 1000;
      const total = state.chunks.reduce((sum, chunk) => sum + chunk.length, 0) / rate;
      setElapsedSeconds(Math.min(elapsed, Math.max(total, 0.1)));
    }, 250);
    return () => window.clearInterval(intervalId);
  }, [playing, usingBrowser]);

  function ensureAudio(): HTMLAudioElement {
    if (audioRef.current) return audioRef.current;
    const audio = new Audio();
    audio.onended = () => {
      setPlaying(false);
      setPaused(false);
    };
    audio.ontimeupdate = () => setElapsedSeconds(audio.currentTime);
    audio.onloadedmetadata = () => {
      setDurationSeconds(Number.isFinite(audio.duration) ? audio.duration : null);
    };
    audio.onerror = () => setError(dict.learn.audioError);
    audioRef.current = audio;
    return audio;
  }

  function stopAll() {
    const state = browserRef.current;
    if (state) {
      state.cancelled = true;
      browserRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPlaying(false);
    setPaused(false);
    setElapsedSeconds(0);
    setDurationSeconds(null);
  }

  function speakChunk() {
    const state = browserRef.current;
    if (!state || state.cancelled) return;
    if (state.index >= state.chunks.length) {
      const rate = charsPerSecondRef.current * speedRef.current;
      const total = state.chunks.reduce((sum, chunk) => sum + chunk.length, 0) / rate;
      setElapsedSeconds(total);
      setDurationSeconds(total);
      setPlaying(false);
      setPaused(false);
      browserRef.current = null;
      return;
    }

    const chunk = state.chunks[state.index];
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.lang = speechLang === "ar" ? "ar-SA" : "en-US";
    utterance.rate = speedRef.current;
    const chosen =
      languageVoices.find((item) => item.name === voiceName) ?? pickDefaultVoice(languageVoices);
    if (chosen) utterance.voice = chosen;

    state.chunkStartedAt = timeNow();
    state.pausedAt = null;

    utterance.onend = () => {
      const current = browserRef.current;
      if (!current || current.cancelled) return;
      current.charsDone += chunk.length;
      current.index += 1;
      speakChunk();
    };
    utterance.onerror = (event) => {
      const current = browserRef.current;
      // Cancelling playback on purpose must not surface as an error.
      if (
        !current ||
        current.cancelled ||
        event.error === "interrupted" ||
        event.error === "canceled"
      ) {
        return;
      }
      current.cancelled = true;
      browserRef.current = null;
      setPlaying(false);
      setPaused(false);
      setError(dict.learn.audioError);
    };

    window.speechSynthesis.speak(utterance);
  }

  function speakWithBrowser() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setError(dict.learn.audioError);
      return;
    }
    stopAll();
    const chunks = splitIntoChunks(text.slice(0, 20_000));
    if (chunks.length === 0) return;

    charsPerSecondRef.current = CHARS_PER_SECOND[speechLang];
    const rate = charsPerSecondRef.current * speed;
    const estimated = chunks.reduce((sum, chunk) => sum + chunk.length, 0) / rate;

    window.speechSynthesis.cancel();
    browserRef.current = {
      chunks,
      index: 0,
      charsDone: 0,
      chunkStartedAt: timeNow(),
      pausedAt: null,
      cancelled: false,
    };
    setUsingBrowser(true);
    setDurationSeconds(estimated);
    setElapsedSeconds(0);
    setPlaying(true);
    setPaused(false);
    setError(null);
    speakChunk();
  }

  async function play() {
    if (!text.trim()) return;
    setError(null);

    if (!canUseServer) {
      speakWithBrowser();
      return;
    }

    stopAll();
    setLoading(true);
    try {
      const response = await fetch("/api/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, MAX_SERVER_CHARS), lang: speechLang, speed }),
      });

      if (!response.ok) {
        if (response.status === 429) toast.error(dict.errors.rateLimited);
        throw new Error(`voice_${response.status}`);
      }

      const blob = await response.blob();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;

      const audio = ensureAudio();
      if (audio.src !== url) audio.src = url;
      audio.playbackRate = speed;
      await audio.play();
      setUsingBrowser(false);
      setPlaying(true);
      setPaused(false);
    } catch {
      // A provider failure is not a dead end: the browser voice is a real fallback.
      speakWithBrowser();
    } finally {
      setLoading(false);
    }
  }

  function pause() {
    if (usingBrowser) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.pause();
      }
      const state = browserRef.current;
      if (state) state.pausedAt = timeNow();
    } else {
      audioRef.current?.pause();
    }
    setPlaying(false);
    setPaused(true);
  }

  function resume() {
    if (usingBrowser) {
      const state = browserRef.current;
      if (!state) {
        void play();
        return;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.resume();
      }
      if (state.pausedAt !== null) {
        state.chunkStartedAt += timeNow() - state.pausedAt;
        state.pausedAt = null;
      }
      // Some Chromium builds leave the engine paused forever; if nothing is
      // speaking shortly after resuming, replay the current chunk instead.
      window.setTimeout(() => {
        const current = browserRef.current;
        if (!current || current.cancelled) return;
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
            speakChunk();
          }
        }
      }, 600);
    } else {
      void audioRef.current?.play();
    }
    setPlaying(true);
    setPaused(false);
  }

  function changeSpeed(next: number) {
    setSpeed(next);
    speedRef.current = next;
    const audio = audioRef.current;
    if (audio && !usingBrowser) audio.playbackRate = next;
  }

  function saveTranscript() {
    if (!text.trim()) return;
    const measured =
      durationSeconds && Number.isFinite(durationSeconds) ? Math.round(durationSeconds) : null;
    startSaving(async () => {
      const result = await saveAudioLessonAction({
        title: title.trim() || text.trim().slice(0, 60),
        transcript: text,
        language: speechLang,
        lessonId: sourceId,
        durationSeconds: measured,
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
    setVoiceName("");
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
    const lesson = sources.find((item) => item.id === nextId) ?? null;
    if (!lesson) {
      setError(null);
      return;
    }
    setText(lesson.content);
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

            {voice.configured ? (
              <div className="space-y-1.5">
                <Label htmlFor="listen-voice-mode">{dict.learn.voiceMode}</Label>
                <Select
                  id="listen-voice-mode"
                  value={preferServer ? "server" : "browser"}
                  onChange={(event) => {
                    stopAll();
                    setPreferServer(event.target.value === "server");
                  }}
                >
                  <option value="server" disabled={!serverAvailable}>
                    {dict.learn.serverVoice}
                  </option>
                  <option value="browser">{dict.learn.browserVoice}</option>
                </Select>
              </div>
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
                    setVoiceName("");
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
                  onChange={(event) => changeSpeed(Number(event.target.value))}
                >
                  {SPEEDS.map((value) => (
                    <option key={value} value={value}>
                      {value}Ã—
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {!canUseServer ? (
              <div className="space-y-1.5">
                <Label htmlFor="listen-voice">{dict.learn.voiceSelect}</Label>
                <Select
                  id="listen-voice"
                  value={voiceName}
                  onChange={(event) => setVoiceName(event.target.value)}
                >
                  <option value="">{dict.learn.voiceAuto}</option>
                  {languageVoices.map((item) => (
                    <option key={`${item.name}-${item.lang}`} value={item.name}>
                      {item.name} ({item.lang})
                    </option>
                  ))}
                </Select>
                {languageVoices.length === 0 ? (
                  <p className="text-[11.5px] leading-relaxed text-amber-700">
                    {dict.learn.voiceMissing}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="listen-source">{dict.learn.chooseSource}</Label>
              <Select
                id="listen-source"
                value={sourceId ?? ""}
                onChange={(event) => handleSourceChange(event.target.value)}
              >
                <option value="">{dict.learn.sourceCustom}</option>
                {sourceGroups.map((group) => (
                  <optgroup key={group.kind} label={group.label}>
                    {group.items.map((source) => (
                      <option key={source.id} value={source.id}>
                        {lang === "ar" ? source.titleAr : source.titleEn}
                      </option>
                    ))}
                  </optgroup>
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
                  if (playing || paused) stopAll();
                  setText(event.target.value);
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
              {!playing && !paused ? (
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
              ) : paused ? (
                <button
                  type="button"
                  onClick={resume}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand px-3.5 text-[13px] font-semibold text-primary-foreground hover:bg-brand-deep"
                >
                  <Play className="size-4" aria-hidden="true" />
                  {dict.learn.resume}
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
                onClick={stopAll}
                disabled={(!playing && !paused) || !text.trim()}
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
                      {item.language === "ar" ? dict.learn.langAr : dict.learn.langEn} Â·{" "}
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
