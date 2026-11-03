import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { UIMessage } from "ai";
import { PageHeader } from "@/components/ui/page-header";
import { TutorWorkspace } from "@/components/tutor/tutor-workspace";
import { getAppMessages } from "@/lib/i18n/app-server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAiConfigured } from "@/lib/ai/provider";
import type { TutorMessage, TutorThread } from "@/lib/types";

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

  let initialMessages: UIMessage[] = [];
  if (activeThread) {
    const { data: messageRows } = await supabase
      .from("tutor_messages")
      .select("id, role, content")
      .eq("thread_id", activeThread.id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(100);

    initialMessages = ((messageRows ?? []) as Pick<TutorMessage, "id" | "role" | "content">[])
      .filter((row) => row.role === "user" || row.role === "assistant")
      .map((row) => ({
        id: row.id,
        role: row.role as "user" | "assistant",
        parts: [{ type: "text" as const, text: row.content }],
      }));
  }

  const defaultMaterialId =
    params.material && materials.some((material) => material.id === params.material)
      ? params.material
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title={dict.tutor.title} description={dict.tutor.subtitle} />
        <Link
          href="/dashboard/materials"
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-hairline px-3 text-[12px] font-medium text-ink-soft transition-colors hover:bg-black/[0.04]"
        >
          <ArrowLeft className="size-3.5 rtl:hidden" aria-hidden="true" />
          <ArrowRight className="size-3.5 ltr:hidden" aria-hidden="true" />
          {dict.nav.materials}
        </Link>
      </div>

      <TutorWorkspace
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
