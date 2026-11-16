"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, DoorOpen, KeyRound, LoaderCircle, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createStudyRoomAction, joinStudyRoomAction } from "@/lib/actions/rooms";
import type { CatalogOption } from "@/lib/learning/queries";
import type { AppMessages } from "@/lib/i18n/app";
import type { Lang } from "@/lib/i18n";

export interface RoomSummary {
  id: string;
  code: string;
  name: string;
  status: "open" | "in_progress" | "closed";
  subjectName: string | null;
  participants: number;
  isOwner: boolean;
}

export function RoomsClient({
  dict,
  lang,
  subjects,
  rooms,
}: {
  dict: AppMessages;
  lang: Lang;
  subjects: CatalogOption[];
  rooms: RoomSummary[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function createRoom() {
    setError(null);
    startTransition(async () => {
      const result = await createStudyRoomAction({
        name,
        subjectId: subjectId || null,
        lessonId: null,
      });
      if (result.ok && result.id) {
        toast.success(result.message ?? dict.learn.roomCreated);
        router.push(`/dashboard/study-rooms/${result.id}`);
      } else {
        setError(result.error ?? dict.errors.saveFailed);
      }
    });
  }

  function joinRoom() {
    setError(null);
    startTransition(async () => {
      const result = await joinStudyRoomAction(code);
      if (result.ok && result.id) {
        toast.success(result.message ?? dict.learn.roomJoined);
        router.push(`/dashboard/study-rooms/${result.id}`);
      } else {
        setError(result.error ?? dict.learn.roomNotFound);
      }
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      <section className="space-y-5 lg:col-span-7">
        {error ? (
          <p className="rounded-lg border border-danger/25 bg-danger/[0.06] px-3 py-2 text-[12px] text-danger">
            {error}
          </p>
        ) : null}

        <div className="rounded-2xl border border-hairline bg-surface-raised/80">
          <header className="border-b border-hairline px-4 py-3">
            <h2 className="text-[14px] font-semibold text-ink">{dict.learn.createRoom}</h2>
          </header>
          <div className="space-y-3 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="room-name">{dict.learn.roomName}</Label>
              <Input
                id="room-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={60}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="room-subject">{dict.learn.roomSubject}</Label>
              <Select
                id="room-subject"
                value={subjectId}
                onChange={(event) => setSubjectId(event.target.value)}
              >
                <option value="">{dict.common.none}</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {lang === "ar" ? subject.nameAr : subject.nameEn}
                  </option>
                ))}
              </Select>
            </div>
            <button
              type="button"
              onClick={createRoom}
              disabled={isPending || name.trim().length < 2}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-brand px-3.5 text-[13px] font-semibold text-primary-foreground hover:bg-brand-deep disabled:opacity-50"
            >
              {isPending ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="size-4" aria-hidden="true" />
              )}
              {dict.learn.createRoomCta}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-hairline bg-surface-raised/80">
          <header className="border-b border-hairline px-4 py-3">
            <h2 className="text-[14px] font-semibold text-ink">{dict.learn.joinRoom}</h2>
            <p className="mt-0.5 text-[12px] text-ink-muted">{dict.learn.joinRoomBody}</p>
          </header>
          <div className="flex flex-wrap items-end gap-2 p-4">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label htmlFor="room-code">{dict.learn.enterCode}</Label>
              <Input
                id="room-code"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                maxLength={6}
                placeholder="ABC123"
                dir="ltr"
                className="uppercase tracking-[0.3em]"
              />
            </div>
            <button
              type="button"
              onClick={joinRoom}
              disabled={isPending || code.length !== 6}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-hairline px-4 text-[13px] font-semibold text-ink-soft hover:bg-black/[0.04] disabled:opacity-50"
            >
              <KeyRound className="size-4" aria-hidden="true" />
              {dict.learn.join}
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-3 lg:col-span-5">
        <h2 className="text-[14px] font-semibold text-ink">{dict.learn.myRooms}</h2>
        {rooms.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-hairline px-4 py-8 text-center">
            <DoorOpen className="mx-auto size-6 text-brand-ink" aria-hidden="true" />
            <p className="mt-2 text-[13px] font-medium text-ink">{dict.learn.noRoomsTitle}</p>
            <p className="mt-1 text-[12px] text-ink-muted">{dict.learn.noRoomsBody}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {rooms.map((room) => (
              <li key={room.id}>
                <Link
                  href={`/dashboard/study-rooms/${room.id}`}
                  className="block rounded-2xl border border-hairline bg-surface-raised/80 px-4 py-3 transition-colors hover:border-brand/40"
                >
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
                      {room.name}
                    </span>
                    <span className="font-mono text-[11.5px] text-ink-muted" dir="ltr">
                      {room.code}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-muted">
                    {room.subjectName ? <span>{room.subjectName}</span> : null}
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3" aria-hidden="true" />
                      {room.participants}
                    </span>
                    {room.isOwner ? <span>{dict.learn.ownerLabel}</span> : null}
                    <span>
                      {room.status === "closed"
                        ? dict.learn.roomClosed
                        : room.status === "in_progress"
                          ? dict.learn.challengeActive
                          : dict.learn.pendingLabel}
                    </span>
                  </div>
                  <span className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-medium text-brand-ink">
                    {dict.common.viewAll}
                    <ArrowRight className="size-3 rtl:hidden" aria-hidden="true" />
                    <ArrowLeft className="size-3 ltr:hidden" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
