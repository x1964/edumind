"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAppMessages } from "@/lib/i18n/app-server";
import {
  challengeAnswerSchema,
  roomCreateSchema,
  roomJoinSchema,
  roomReportSchema,
} from "@/lib/validation";
import type { ActionResult } from "@/lib/actions/types";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function createRoomCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
}

function revalidateRooms(roomId?: string) {
  revalidatePath("/dashboard/study-rooms");
  if (roomId) revalidatePath(`/dashboard/study-rooms/${roomId}`);
  revalidatePath("/dashboard");
}

function mapRoomError(message: string, dict: Awaited<ReturnType<typeof getAppMessages>>["dict"]) {
  if (message.includes("room_not_found")) return dict.learn.roomNotFound;
  if (message.includes("room_full")) return dict.learn.roomFull;
  if (message.includes("room_closed")) return dict.learn.roomClosed;
  if (message.includes("already_submitted")) return dict.learn.alreadySubmitted;
  if (message.includes("challenge_not_active")) return dict.learn.challengeNotActive;
  if (message.includes("not_a_member")) return dict.errors.forbidden;
  return dict.errors.saveFailed;
}

export async function createStudyRoomAction(input: {
  name: string;
  subjectId: string | null;
  lessonId: string | null;
}): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const parsed = roomCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: dict.errors.invalidInput };

  const supabase = await createSupabaseServerClient();

  if (parsed.data.lessonId) {
    const { data: lesson } = await supabase
      .from("lessons")
      .select("id")
      .eq("id", parsed.data.lessonId)
      .eq("published", true)
      .maybeSingle();
    if (!lesson) return { ok: false, error: dict.errors.notFound };
  }

  let room: { id: string; code: string } | null = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await supabase
      .from("study_rooms")
      .insert({
        code: createRoomCode(),
        name: parsed.data.name,
        subject_id: parsed.data.subjectId,
        lesson_id: parsed.data.lessonId,
        owner_id: user.id,
      })
      .select("id, code")
      .single();
    if (!error && data) {
      room = data as { id: string; code: string };
      break;
    }
    if (error && error.code !== "23505") return { ok: false, error: dict.errors.saveFailed };
  }

  if (!room) return { ok: false, error: dict.errors.saveFailed };

  const { error: participantError } = await supabase.from("study_room_participants").insert({
    room_id: room.id,
    user_id: user.id,
    role: "owner",
  });

  if (participantError) {
    await supabase.from("study_rooms").delete().eq("id", room.id).eq("owner_id", user.id);
    return { ok: false, error: dict.errors.saveFailed };
  }

  revalidateRooms(room.id);
  return { ok: true, id: room.id, message: dict.learn.roomCreated };
}

export async function joinStudyRoomAction(code: string): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const parsed = roomJoinSchema.safeParse({ code });
  if (!parsed.success) return { ok: false, error: dict.learn.roomNotFound };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("join_study_room", { p_code: parsed.data.code });
  if (error) return { ok: false, error: mapRoomError(error.message, dict) };

  const roomId =
    data && typeof data === "object" && "roomId" in data ? String(data.roomId) : undefined;
  revalidateRooms(roomId);
  return { ok: true, id: roomId, message: dict.learn.roomJoined };
}

export async function leaveStudyRoomAction(roomId: string): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("study_room_participants")
    .update({ status: "left" })
    .eq("room_id", roomId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: dict.errors.saveFailed };

  revalidateRooms(roomId);
  return { ok: true, message: dict.learn.roomLeft };
}

export async function startRoomChallengeAction(
  roomId: string,
  quizId: string
): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const supabase = await createSupabaseServerClient();

  const { data: room } = await supabase
    .from("study_rooms")
    .select("id, owner_id, status")
    .eq("id", roomId)
    .maybeSingle();
  if (!room) return { ok: false, error: dict.learn.roomNotFound };
  if (room.owner_id !== user.id) return { ok: false, error: dict.errors.forbidden };
  if (room.status === "closed") return { ok: false, error: dict.learn.roomClosed };

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id")
    .eq("id", quizId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!quiz) return { ok: false, error: dict.learn.quizRequired };

  const { data: existing } = await supabase
    .from("study_challenges")
    .select("id")
    .eq("room_id", roomId)
    .in("status", ["pending", "active"])
    .maybeSingle();
  if (existing) return { ok: false, error: dict.learn.challengeAlreadyOpen };

  const now = new Date();
  const ends = new Date(now.getTime() + 20 * 60 * 1000);
  const { data: challenge, error } = await supabase
    .from("study_challenges")
    .insert({
      room_id: roomId,
      quiz_id: quizId,
      status: "active",
      started_at: now.toISOString(),
      ends_at: ends.toISOString(),
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !challenge) return { ok: false, error: dict.errors.saveFailed };

  await supabase.from("study_rooms").update({ status: "in_progress" }).eq("id", roomId);

  revalidateRooms(roomId);
  return { ok: true, id: challenge.id as string, message: dict.learn.challengeStarted };
}

export async function submitChallengeAnswersAction(
  challengeId: string,
  answers: Record<string, string>
): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const parsed = challengeAnswerSchema.safeParse(answers);
  if (!parsed.success) return { ok: false, error: dict.errors.invalidInput };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("submit_challenge_answers", {
    p_challenge_id: challengeId,
    p_answers: parsed.data,
  });

  if (error || !data) return { ok: false, error: mapRoomError(error?.message ?? "", dict) };

  revalidateRooms();
  return {
    ok: true,
    id: challengeId,
    message:
      typeof data === "object" && data && "score" in data
        ? `${dict.learn.challengeScore}: ${String(data.score)}%`
        : dict.learn.challengeSubmitted,
  };
}

export async function finishRoomChallengeAction(
  roomId: string,
  challengeId: string
): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const supabase = await createSupabaseServerClient();
  const { data: room } = await supabase
    .from("study_rooms")
    .select("owner_id")
    .eq("id", roomId)
    .maybeSingle();
  if (!room || room.owner_id !== user.id) return { ok: false, error: dict.errors.forbidden };

  const { error } = await supabase
    .from("study_challenges")
    .update({ status: "finished" })
    .eq("id", challengeId)
    .eq("room_id", roomId)
    .eq("created_by", user.id);
  if (error) return { ok: false, error: dict.errors.saveFailed };

  await supabase.from("study_rooms").update({ status: "open" }).eq("id", roomId);
  revalidateRooms(roomId);
  return { ok: true, message: dict.learn.challengeFinished };
}

export async function closeStudyRoomAction(roomId: string): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const supabase = await createSupabaseServerClient();
  const { data: room } = await supabase
    .from("study_rooms")
    .select("owner_id, status")
    .eq("id", roomId)
    .maybeSingle();

  if (!room) return { ok: false, error: dict.learn.roomNotFound };
  if (room.owner_id !== user.id) return { ok: false, error: dict.errors.forbidden };
  if (room.status === "closed") return { ok: true, message: dict.learn.roomClosed };

  const { error } = await supabase
    .from("study_rooms")
    .update({ status: "closed" })
    .eq("id", roomId)
    .eq("owner_id", user.id);
  if (error) return { ok: false, error: dict.errors.saveFailed };

  // Close any open challenge so members don't keep answering into a dead room.
  await supabase
    .from("study_challenges")
    .update({ status: "finished" })
    .eq("room_id", roomId)
    .in("status", ["pending", "active"]);

  revalidateRooms(roomId);
  return { ok: true, message: dict.learn.roomEnded };
}

export async function reportStudyRoomAction(input: {
  roomId: string;
  reason: string;
}): Promise<ActionResult> {
  const { dict } = await getAppMessages();
  if (!isSupabaseConfigured()) return { ok: false, error: dict.setup.body };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: dict.errors.unauthorized };

  const parsed = roomReportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: dict.errors.invalidInput };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("study_room_reports").insert({
    room_id: parsed.data.roomId,
    reporter_id: user.id,
    reason: parsed.data.reason,
  });

  if (error) return { ok: false, error: dict.errors.saveFailed };
  return { ok: true, message: dict.learn.reportSent };
}
