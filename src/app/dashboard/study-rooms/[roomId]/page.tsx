import { notFound } from "next/navigation";
import { RoomClient, type ChallengeInfo, type RoomInfo } from "@/components/rooms/room-client";
import { PageHeader } from "@/components/ui/page-header";
import { getAppMessages } from "@/lib/i18n/app-server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const instant = false;

interface RoomRow {
  id: string;
  code: string;
  name: string;
  status: "open" | "in_progress" | "closed";
  owner_id: string;
  lesson_id: string | null;
  expires_at: string;
  subjects:
    { name_ar: string; name_en: string } | Array<{ name_ar: string; name_en: string }> | null;
}

interface ChallengeRow {
  id: string;
  status: "pending" | "active" | "finished";
  ends_at: string | null;
  quiz_id: string;
  quizzes:
    | { title: string; time_limit_minutes: number | null }
    | Array<{ title: string; time_limit_minutes: number | null }>
    | null;
}

interface ChallengeRpc {
  challengeId: string;
  status: "pending" | "active" | "finished";
  endsAt: string | null;
  quiz: {
    id: string;
    title: string;
    timeLimitMinutes: number | null;
    questions: Array<{
      id: string;
      type: string;
      prompt: string;
      options: string[] | null;
      position: number;
    }>;
  };
}

export default async function StudyRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { dict, lang } = await getAppMessages();
  const { roomId } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();

  const [{ data: roomData }, { data: participantData }] = await Promise.all([
    supabase
      .from("study_rooms")
      .select("id, code, name, status, owner_id, lesson_id, expires_at, subjects(name_ar, name_en)")
      .eq("id", roomId)
      .maybeSingle(),
    supabase.rpc("get_room_participants", { p_room_id: roomId }),
  ]);

  if (!roomData) notFound();
  const row = roomData as unknown as RoomRow;
  const subject = Array.isArray(row.subjects) ? row.subjects[0] : row.subjects;

  const participants = (
    (participantData ?? []) as Array<{
      user_id: string;
      full_name: string;
      role: string;
    }>
  ).map((participant) => ({
    userId: participant.user_id,
    name: participant.full_name,
    role: participant.role,
  }));

  const { data: challengeData } = await supabase
    .from("study_challenges")
    .select("id, status, ends_at, quiz_id, quizzes(title, time_limit_minutes)")
    .eq("room_id", row.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const challengeRow = challengeData as unknown as ChallengeRow | null;
  const quizRow = challengeRow
    ? Array.isArray(challengeRow.quizzes)
      ? challengeRow.quizzes[0]
      : challengeRow.quizzes
    : null;

  let challenge: ChallengeInfo | null = null;
  let attempts: Array<{ userId: string; name: string; score: number }> = [];

  if (challengeRow) {
    const { data: rpcData } = await supabase.rpc("get_room_challenge", {
      p_challenge_id: challengeRow.id,
    });
    const rpc = rpcData as unknown as ChallengeRpc | null;

    const { data: attemptRows } = await supabase
      .from("challenge_attempts")
      .select("user_id, score")
      .eq("challenge_id", challengeRow.id);

    const nameById = new Map(
      participants.map((participant) => [participant.userId, participant.name])
    );
    attempts = ((attemptRows ?? []) as Array<{ user_id: string; score: number }>).map(
      (attempt) => ({
        userId: attempt.user_id,
        name: nameById.get(attempt.user_id) ?? "—",
        score: attempt.score,
      })
    );

    if (rpc) {
      challenge = {
        id: rpc.challengeId,
        status: rpc.status,
        endsAt: rpc.endsAt,
        quizId: rpc.quiz.id,
        quizTitle: rpc.quiz.title,
        timeLimitMinutes: rpc.quiz.timeLimitMinutes,
        questions: (rpc.quiz.questions ?? []).map((question) => ({
          id: question.id,
          type: question.type,
          prompt: question.prompt,
          options: question.options,
        })),
      };
    } else if (challengeRow.status !== "finished") {
      challenge = {
        id: challengeRow.id,
        status: challengeRow.status,
        endsAt: challengeRow.ends_at,
        quizId: challengeRow.quiz_id,
        quizTitle: quizRow?.title ?? "",
        timeLimitMinutes: quizRow?.time_limit_minutes ?? null,
        questions: [],
      };
    }
  }

  const { data: quizRows } = await supabase
    .from("quizzes")
    .select("id, title")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const myAttempt = attempts.find((attempt) => attempt.userId === user.id);

  const room: RoomInfo = {
    id: row.id,
    code: row.code,
    name: row.name,
    status: row.status,
    subjectName: subject ? (lang === "ar" ? subject.name_ar : subject.name_en) : null,
    ownerId: row.owner_id,
    expiresAt: row.expires_at,
  };

  return (
    <div className="space-y-6">
      <PageHeader title={dict.learn.roomsTitle} description={dict.learn.roomsSubtitle} />
      <RoomClient
        dict={dict}
        room={room}
        isOwner={row.owner_id === user.id}
        participants={participants}
        challenge={challenge}
        quizOptions={(quizRows ?? []) as Array<{ id: string; title: string }>}
        attempts={attempts}
        myScore={myAttempt?.score ?? null}
      />
    </div>
  );
}
