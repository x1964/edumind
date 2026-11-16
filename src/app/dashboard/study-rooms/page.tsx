import { RoomsClient, type RoomSummary } from "@/components/rooms/rooms-client";
import { PageHeader } from "@/components/ui/page-header";
import { getAppMessages } from "@/lib/i18n/app-server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCatalog } from "@/lib/learning/queries";

export const instant = false;

interface ParticipationRow {
  room_id: string;
  role: "owner" | "member";
  study_rooms:
    | {
        id: string;
        code: string;
        name: string;
        status: "open" | "in_progress" | "closed";
        owner_id: string;
        subjects:
          { name_ar: string; name_en: string } | Array<{ name_ar: string; name_en: string }> | null;
      }
    | Array<{
        id: string;
        code: string;
        name: string;
        status: "open" | "in_progress" | "closed";
        owner_id: string;
        subjects:
          { name_ar: string; name_en: string } | Array<{ name_ar: string; name_en: string }> | null;
      }>
    | null;
}

export default async function StudyRoomsPage() {
  const { dict, lang } = await getAppMessages();
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const [{ data: participationRows }, catalog] = await Promise.all([
    supabase
      .from("study_room_participants")
      .select(
        "room_id, role, study_rooms(id, code, name, status, owner_id, subjects(name_ar, name_en))"
      )
      .eq("user_id", user.id)
      .eq("status", "active"),
    getCatalog(),
  ]);

  const rows = (participationRows ?? []) as unknown as ParticipationRow[];
  const normalized: Array<{
    room: {
      id: string;
      code: string;
      name: string;
      status: "open" | "in_progress" | "closed";
      owner_id: string;
      subjects:
        { name_ar: string; name_en: string } | Array<{ name_ar: string; name_en: string }> | null;
    };
    role: "owner" | "member";
  }> = [];

  for (const row of rows) {
    const room = Array.isArray(row.study_rooms) ? row.study_rooms[0] : row.study_rooms;
    if (room) normalized.push({ room, role: row.role });
  }

  const roomIds = normalized.map((row) => row.room.id);
  const { data: participantRows } = roomIds.length
    ? await supabase
        .from("study_room_participants")
        .select("room_id")
        .in("room_id", roomIds)
        .eq("status", "active")
    : { data: [] };

  const counts = new Map<string, number>();
  for (const row of (participantRows ?? []) as Array<{ room_id: string }>) {
    counts.set(row.room_id, (counts.get(row.room_id) ?? 0) + 1);
  }

  const rooms: RoomSummary[] = normalized.map(({ room, role }) => {
    const subject = Array.isArray(room.subjects) ? room.subjects[0] : room.subjects;
    return {
      id: room.id,
      code: room.code,
      name: room.name,
      status: room.status,
      subjectName: subject ? (lang === "ar" ? subject.name_ar : subject.name_en) : null,
      participants: counts.get(room.id) ?? 0,
      isOwner: role === "owner" || room.owner_id === user.id,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader title={dict.learn.roomsTitle} description={dict.learn.roomsSubtitle} />
      <RoomsClient dict={dict} lang={lang} subjects={catalog.subjects} rooms={rooms} />
    </div>
  );
}
