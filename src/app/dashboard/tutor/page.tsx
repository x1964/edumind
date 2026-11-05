import { TutorWorkspace } from "@/components/tutor/tutor-workspace";
import { getAppMessages } from "@/lib/i18n/app-server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAiConfigured } from "@/lib/ai/provider";
import {
  tutorCitationPages,
  type TutorChatMessage,
  type TutorMessage,
  type TutorThread,
} from "@/lib/types";

export const instant = false;

interface ThreadRow extends TutorThread {
  materials?: { file_name: string } | null;
}

export default async function TutorPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string; material?: string }>;
}) {
  const { dict, lang } = await getAppMessages();
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();

  const [{ data: threadRows }, { data: materialRows }] = await Promise.all([
    supabase
      .from("tutor_threads")
      .select("*, materials(file_name)")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(40),
    supabase
      .from("materials")
      .select("id, file_name")
      .eq("user_id", user.id)
      .eq("status", "ready")
      .order("created_at", { ascending: false })
      .limit(60),
  ]);

  const threads = (threadRows ?? []) as ThreadRow[];
  const materials = (materialRows ?? []) as Array<{ id: string; file_name: string }>;

  const activeThread = params.thread
    ? (threads.find((row) => row.id === params.thread) ?? null)
    : null;
  const missingThread = Boolean(params.thread) && !activeThread;

  let initialMessages: TutorChatMessage[] = [];
  if (activeThread) {
    const { data: messageRows } = await supabase
      .from("tutor_messages")
      .select("id, role, content, citations")
      .eq("thread_id", activeThread.id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(100);

    initialMessages = (
      (messageRows ?? []) as Pick<TutorMessage, "id" | "role" | "content" | "citations">[]
    )
      .filter((row) => row.role === "user" || row.role === "assistant")
      .map((row) => {
        const pages = tutorCitationPages(row.citations);
        return {
          id: row.id,
          role: row.role as "user" | "assistant",
          parts: [{ type: "text" as const, text: row.content }],
          ...(pages.length > 0 ? { metadata: { pages } } : {}),
        };
      });
  }

  const defaultMaterialId =
    params.material && materials.some((material) => material.id === params.material)
      ? params.material
      : null;

  return (
    <div className="space-y-6">
      <TutorWorkspace
        key={activeThread?.id ?? `new-${defaultMaterialId ?? "general"}`}
        dict={dict}
        lang={lang}
        threads={threads}
        materials={materials}
        activeThread={
          activeThread
            ? {
                id: activeThread.id,
                title: activeThread.title,
                materialId: activeThread.material_id,
                materialName: activeThread.materials?.file_name ?? null,
              }
            : null
        }
        initialMessages={initialMessages}
        aiConfigured={isAiConfigured()}
        defaultMaterialId={defaultMaterialId}
        missingThread={missingThread}
      />
    </div>
  );
}
