import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const bodySchema = z.object({
  materialId: z.string().uuid().nullable().optional(),
  activity: z.enum(["material", "tutor", "quiz", "summary", "mind_map"]).default("material"),
  seconds: z.number().int().min(0).max(14400),
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const supabase = await createSupabaseServerClient();

  if (parsed.data.materialId) {
    const { data: material } = await supabase
      .from("materials")
      .select("id")
      .eq("id", parsed.data.materialId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!material) return NextResponse.json({ ok: false }, { status: 404 });

    await supabase
      .from("materials")
      .update({ last_opened_at: new Date().toISOString() })
      .eq("id", parsed.data.materialId)
      .eq("user_id", user.id);
  }

  if (parsed.data.seconds >= 5) {
    const endedAt = new Date();
    const startedAt = new Date(endedAt.getTime() - parsed.data.seconds * 1000);
    const { error } = await supabase.from("study_sessions").insert({
      user_id: user.id,
      material_id: parsed.data.materialId ?? null,
      activity: parsed.data.activity,
      duration_seconds: parsed.data.seconds,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
    });
    if (error) return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
