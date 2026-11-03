import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ items: [] });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim().slice(0, 80);
  if (query.length < 2) return NextResponse.json({ items: [] });

  const term = `%${query.replace(/[%_]/g, "")}%`;
  const supabase = await createSupabaseServerClient();

  const [materials, summaries, quizzes, maps, tasks] = await Promise.all([
    supabase
      .from("materials")
      .select("id, file_name, status")
      .eq("user_id", user.id)
      .ilike("file_name", term)
      .limit(5),
    supabase
      .from("summaries")
      .select("id, title, style")
      .eq("user_id", user.id)
      .ilike("title", term)
      .limit(5),
    supabase
      .from("quizzes")
      .select("id, title, difficulty")
      .eq("user_id", user.id)
      .ilike("title", term)
      .limit(5),
    supabase
      .from("mind_maps")
      .select("id, title")
      .eq("user_id", user.id)
      .ilike("title", term)
      .limit(5),
    supabase
      .from("study_tasks")
      .select("id, title, due_date")
      .eq("user_id", user.id)
      .ilike("title", term)
      .limit(5),
  ]);

  const items = [
    ...(materials.data ?? []).map((row) => ({
      id: row.id,
      title: row.file_name,
      subtitle: row.status,
      href: `/dashboard/materials/${row.id}`,
      kind: "material" as const,
    })),
    ...(summaries.data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      subtitle: row.style,
      href: `/dashboard/summaries/${row.id}`,
      kind: "summary" as const,
    })),
    ...(quizzes.data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      subtitle: row.difficulty,
      href: `/dashboard/quizzes/${row.id}`,
      kind: "quiz" as const,
    })),
    ...(maps.data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      subtitle: null,
      href: `/dashboard/mind-maps/${row.id}`,
      kind: "mind_map" as const,
    })),
    ...(tasks.data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      subtitle: row.due_date,
      href: `/dashboard/study-plan`,
      kind: "task" as const,
    })),
  ].slice(0, 20);

  return NextResponse.json({ items });
}
