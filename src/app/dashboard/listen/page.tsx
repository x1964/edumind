import {
  ListenClient,
  type ListenSource,
  type SavedTranscript,
} from "@/components/voice/listen-client";
import { PageHeader } from "@/components/ui/page-header";
import { getAppMessages } from "@/lib/i18n/app-server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { voiceCapabilities } from "@/lib/ai/voice";

export const instant = false;

interface LessonRow {
  id: string;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  description_en: string | null;
  content: string | null;
}

interface SummaryRow {
  id: string;
  title: string;
  content: string;
}

interface TutorRow {
  id: string;
  content: string;
  thread_id: string;
  tutor_threads: { title: string } | Array<{ title: string }> | null;
}

/**
 * Markdown is great to read and terrible to listen to. Sources are flattened
 * before they ever reach the player so the voice doesn't spell out symbols.
 */
function toPlainText(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default async function ListenPage({
  searchParams,
}: {
  searchParams: Promise<{ lesson?: string; summary?: string }>;
}) {
  const { dict, lang } = await getAppMessages();
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const [{ data: audioRows }, { data: lessonRows }, { data: summaryRows }, { data: tutorRows }] =
    await Promise.all([
      supabase
        .from("audio_lessons")
        .select("id, title, transcript, language, created_at, lesson_id, thread_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("lessons")
        .select("id, title_ar, title_en, description_ar, description_en, content")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("summaries")
        .select("id, title, content")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
        .from("tutor_messages")
        .select("id, content, thread_id, tutor_threads(title)")
        .eq("user_id", user.id)
        .eq("role", "assistant")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

  const sources: ListenSource[] = [];

  for (const lesson of (lessonRows ?? []) as LessonRow[]) {
    sources.push({
      id: lesson.id,
      kind: "lesson",
      titleAr: lesson.title_ar,
      titleEn: lesson.title_en,
      content: toPlainText(
        [lang === "ar" ? lesson.description_ar : lesson.description_en, lesson.content]
          .filter(Boolean)
          .join("\n\n")
      ),
    });
  }

  for (const summary of (summaryRows ?? []) as SummaryRow[]) {
    sources.push({
      id: summary.id,
      kind: "summary",
      titleAr: summary.title,
      titleEn: summary.title,
      content: toPlainText(summary.content),
    });
  }

  // One entry per conversation: the newest answer is the most useful recap.
  const seenThreads = new Set<string>();
  for (const row of (tutorRows ?? []) as TutorRow[]) {
    if (seenThreads.has(row.thread_id)) continue;
    seenThreads.add(row.thread_id);
    const thread = Array.isArray(row.tutor_threads) ? row.tutor_threads[0] : row.tutor_threads;
    const title = thread?.title || dict.learn.sourceTutor;
    sources.push({
      id: row.thread_id,
      kind: "tutor",
      titleAr: title,
      titleEn: title,
      content: toPlainText(row.content),
    });
    if (seenThreads.size >= 12) break;
  }

  let initialText = "";
  let initialTitle = "";
  let sourceId: string | null = null;

  const requestedId = params.summary ?? params.lesson;
  if (requestedId) {
    const match = sources.find((source) => source.id === requestedId);
    if (match) {
      sourceId = match.id;
      initialTitle = lang === "ar" ? match.titleAr : match.titleEn;
      initialText = match.content;
    }
  }

  const saved: SavedTranscript[] = (
    (audioRows ?? []) as Array<{
      id: string;
      title: string;
      transcript: string;
      language: "ar" | "en";
      created_at: string;
      lesson_id: string | null;
      thread_id: string | null;
    }>
  ).map((row) => ({
    id: row.id,
    title: row.title,
    transcript: row.transcript,
    language: row.language,
    createdAt: row.created_at,
    lessonId: row.lesson_id,
    threadId: row.thread_id,
  }));

  const capabilities = voiceCapabilities();

  return (
    <div className="space-y-6">
      <PageHeader title={dict.learn.listenTitle} description={dict.learn.listenSubtitle} />
      <ListenClient
        dict={dict}
        lang={lang}
        voice={{ configured: capabilities.configured, arabic: capabilities.arabic }}
        saved={saved}
        initialText={initialText}
        initialTitle={initialTitle}
        initialSourceId={sourceId}
        sources={sources}
      />
    </div>
  );
}
