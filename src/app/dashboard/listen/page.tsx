import { ListenClient, type SavedTranscript } from "@/components/voice/listen-client";
import { PageHeader } from "@/components/ui/page-header";
import { getAppMessages } from "@/lib/i18n/app-server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { voiceCapabilities } from "@/lib/ai/voice";

export const instant = false;

export default async function ListenPage({
  searchParams,
}: {
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { dict, lang } = await getAppMessages();
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data: audioRows } = await supabase
    .from("audio_lessons")
    .select("id, title, transcript, language, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  let initialText = "";
  let initialTitle = "";
  let lessonId: string | null = null;

  if (params.lesson) {
    const { data: lesson } = await supabase
      .from("lessons")
      .select("id, title_ar, title_en, description_ar, description_en, content")
      .eq("id", params.lesson)
      .eq("published", true)
      .maybeSingle();
    if (lesson) {
      lessonId = lesson.id as string;
      initialTitle = (lang === "ar" ? lesson.title_ar : lesson.title_en) as string;
      initialText = [lang === "ar" ? lesson.description_ar : lesson.description_en, lesson.content]
        .filter(Boolean)
        .join("\n\n");
    }
  }

  const saved: SavedTranscript[] = (
    (audioRows ?? []) as Array<{
      id: string;
      title: string;
      transcript: string;
      language: "ar" | "en";
      created_at: string;
    }>
  ).map((row) => ({
    id: row.id,
    title: row.title,
    transcript: row.transcript,
    language: row.language,
    createdAt: row.created_at,
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
        lessonId={lessonId}
      />
    </div>
  );
}
