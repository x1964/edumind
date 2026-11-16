"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, FilePlus2, LoaderCircle, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  addExamQuestionsAction,
  classifyExamQuestionsAction,
  createExamArchiveAction,
  importExamQuestionsAction,
  publishExamArchiveAction,
  verifyExamQuestionsAction,
} from "@/lib/actions/exams";
import type { CatalogOption } from "@/lib/learning/queries";
import type { AppMessages } from "@/lib/i18n/app";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface ArchiveRow {
  id: string;
  title_ar: string;
  title_en: string;
  academic_year: string;
  exam_type: string;
  subject_id: string | null;
  verification_status: "unverified" | "verified" | "rejected";
  published: boolean;
  questionCount: number;
}

const TYPES = ["multiple_choice", "true_false", "short_answer", "essay", "matching"] as const;
const DIFFICULTIES = ["easy", "medium", "hard"] as const;
const EXAM_TYPES = ["final", "midterm", "mock", "official", "other"] as const;

export function AdminExamManager({
  dict,
  lang,
  archives,
  subjects,
  grades,
}: {
  dict: AppMessages;
  lang: Lang;
  archives: ArchiveRow[];
  subjects: CatalogOption[];
  grades: CatalogOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [gradeId, setGradeId] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [examType, setExamType] = useState<(typeof EXAM_TYPES)[number]>("final");
  const [sourceReference, setSourceReference] = useState("");

  function createArchive() {
    setError(null);
    startTransition(async () => {
      const result = await createExamArchiveAction({
        titleAr,
        titleEn,
        subjectId: subjectId || null,
        gradeId: gradeId || null,
        academicYear,
        examType,
        sourceReference: sourceReference.trim() || null,
      });
      if (result.ok) {
        toast.success(result.message ?? dict.learn.archiveCreated);
        setTitleAr("");
        setTitleEn("");
        setAcademicYear("");
        setSourceReference("");
        router.refresh();
      } else {
        setError(result.error ?? dict.errors.saveFailed);
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-hairline bg-surface-raised/80">
        <header className="border-b border-hairline px-4 py-3 sm:px-5">
          <h2 className="text-[15px] font-semibold text-ink">{dict.learn.newArchive}</h2>
          <p className="mt-0.5 text-[12px] text-ink-muted">{dict.learn.adminSubtitle}</p>
        </header>
        <div className="space-y-4 p-4 sm:p-5">
          {error ? (
            <p className="rounded-lg border border-danger/25 bg-danger/[0.06] px-3 py-2 text-[12px] text-danger">
              {error}
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={dict.learn.archiveTitleAr} htmlFor="title-ar">
              <Input
                id="title-ar"
                value={titleAr}
                onChange={(event) => setTitleAr(event.target.value)}
                maxLength={160}
                dir="rtl"
              />
            </Field>
            <Field label={dict.learn.archiveTitleEn} htmlFor="title-en">
              <Input
                id="title-en"
                value={titleEn}
                onChange={(event) => setTitleEn(event.target.value)}
                maxLength={160}
                dir="ltr"
              />
            </Field>
            <Field label={dict.learn.roomSubject} htmlFor="archive-subject">
              <Select
                id="archive-subject"
                value={subjectId}
                onChange={(event) => setSubjectId(event.target.value)}
              >
                <option value="">{dict.learn.selectPlaceholder}</option>
                {subjects.map((option) => (
                  <option key={option.id} value={option.id}>
                    {lang === "ar" ? option.nameAr : option.nameEn}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={dict.learn.gradeLabel} htmlFor="archive-grade">
              <Select
                id="archive-grade"
                value={gradeId}
                onChange={(event) => setGradeId(event.target.value)}
              >
                <option value="">{dict.learn.selectPlaceholder}</option>
                {grades.map((option) => (
                  <option key={option.id} value={option.id}>
                    {lang === "ar" ? option.nameAr : option.nameEn}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={dict.learn.archiveYear} htmlFor="archive-year">
              <Input
                id="archive-year"
                value={academicYear}
                onChange={(event) => setAcademicYear(event.target.value)}
                maxLength={20}
                placeholder="2025/2026"
                dir="ltr"
              />
            </Field>
            <Field label={dict.learn.archiveType} htmlFor="archive-type">
              <Select
                id="archive-type"
                value={examType}
                onChange={(event) => setExamType(event.target.value as (typeof EXAM_TYPES)[number])}
              >
                {EXAM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={dict.learn.archiveSource} htmlFor="archive-source">
              <Input
                id="archive-source"
                value={sourceReference}
                onChange={(event) => setSourceReference(event.target.value)}
                maxLength={500}
                dir="auto"
              />
            </Field>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={createArchive}
              disabled={isPending}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand px-3.5 text-[13px] font-semibold text-primary-foreground hover:bg-brand-deep disabled:opacity-50"
            >
              {isPending ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <FilePlus2 className="size-4" aria-hidden="true" />
              )}
              {dict.learn.createArchive}
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold text-ink">{dict.learn.archivesList}</h2>
        {archives.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-hairline px-4 py-8 text-center text-[12px] text-ink-muted">
            {dict.learn.noArchives}
          </p>
        ) : (
          archives.map((archive) => (
            <ArchiveCard
              key={archive.id}
              archive={archive}
              dict={dict}
              lang={lang}
              expanded={expanded === archive.id}
              onToggle={() =>
                setExpanded((current) => (current === archive.id ? null : archive.id))
              }
            />
          ))
        )}
      </section>
    </div>
  );
}

function ArchiveCard({
  archive,
  dict,
  lang,
  expanded,
  onToggle,
}: {
  archive: ArchiveRow;
  dict: AppMessages;
  lang: Lang;
  expanded: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [importText, setImportText] = useState("");
  const [prompt, setPrompt] = useState("");
  const [topic, setTopic] = useState("");
  const [questionType, setQuestionType] = useState<(typeof TYPES)[number]>("multiple_choice");
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>("medium");
  const [marks, setMarks] = useState("1");
  const [error, setError] = useState<string | null>(null);

  function run(
    action: () => Promise<{ ok: boolean; error?: string; message?: string }>,
    reset?: () => void
  ) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(result.message ?? dict.common.saved);
        reset?.();
        router.refresh();
      } else {
        setError(result.error ?? dict.errors.saveFailed);
      }
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-surface-raised/80">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="min-w-0 flex-1 text-start"
        >
          <span className="block truncate text-[13.5px] font-semibold text-ink">
            {lang === "ar" ? archive.title_ar : archive.title_en}
          </span>
          <span className="mt-0.5 block text-[11.5px] text-ink-muted">
            {archive.academic_year} · {archive.exam_type} · {archive.questionCount}{" "}
            {dict.learn.questionsAnalyzed}
          </span>
        </button>
        <Badge tone={archive.published ? "brand" : "neutral"}>
          {archive.published ? dict.learn.published : dict.learn.unpublished}
        </Badge>
        <Badge tone={archive.verification_status === "verified" ? "info" : "warning"}>
          {archive.verification_status === "verified" ? dict.learn.verified : dict.learn.unverified}
        </Badge>
        <button
          type="button"
          onClick={() => run(() => publishExamArchiveAction(archive.id, !archive.published))}
          disabled={isPending}
          className="inline-flex h-8 items-center rounded-lg border border-hairline px-2.5 text-[11.5px] font-medium text-ink-soft hover:bg-black/[0.04] disabled:opacity-50"
        >
          {archive.published ? dict.learn.unpublish : dict.learn.publish}
        </button>
        <ChevronDown
          className={cn("size-4 text-ink-muted transition-transform", expanded && "rotate-180")}
          aria-hidden="true"
        />
      </div>

      {expanded ? (
        <div className="space-y-4 border-t border-hairline px-4 py-4">
          {error ? (
            <p className="rounded-lg border border-danger/25 bg-danger/[0.06] px-3 py-2 text-[12px] text-danger">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => run(() => classifyExamQuestionsAction(archive.id))}
              disabled={isPending}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-hairline px-2.5 text-[11.5px] font-medium text-ink-soft hover:bg-black/[0.04] disabled:opacity-50"
            >
              <Sparkles className="size-3.5" aria-hidden="true" />
              {dict.learn.classifyWithAi}
            </button>
            <button
              type="button"
              onClick={() => run(() => verifyExamQuestionsAction(archive.id))}
              disabled={isPending}
              className="inline-flex h-8 items-center rounded-lg border border-hairline px-2.5 text-[11.5px] font-medium text-ink-soft hover:bg-black/[0.04] disabled:opacity-50"
            >
              {dict.learn.verifyQuestions}
            </button>
          </div>

          <div className="rounded-xl border border-hairline/70 bg-black/[0.015] p-3">
            <p className="text-[12px] font-medium text-ink">{dict.learn.importText}</p>
            <p className="mt-0.5 text-[11px] text-ink-muted">{dict.learn.importTextHint}</p>
            <Textarea
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              rows={4}
              maxLength={20000}
              className="mt-2"
              dir="auto"
            />
            <button
              type="button"
              onClick={() =>
                run(
                  () => importExamQuestionsAction(archive.id, importText),
                  () => setImportText("")
                )
              }
              disabled={isPending || importText.trim().length < 40}
              className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand px-3 text-[11.5px] font-semibold text-primary-foreground hover:bg-brand-deep disabled:opacity-50"
            >
              {isPending ? (
                <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="size-3.5" aria-hidden="true" />
              )}
              {dict.learn.importCta}
            </button>
          </div>

          <div className="rounded-xl border border-hairline/70 bg-black/[0.015] p-3">
            <p className="text-[12px] font-medium text-ink">{dict.learn.addQuestions}</p>
            <div className="mt-2 space-y-2">
              <Textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={2}
                maxLength={2000}
                placeholder={dict.learn.questionPrompt}
                dir="auto"
              />
              <div className="grid gap-2 sm:grid-cols-4">
                <Input
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder={dict.learn.questionTopic}
                  maxLength={120}
                />
                <Select
                  value={questionType}
                  onChange={(event) =>
                    setQuestionType(event.target.value as (typeof TYPES)[number])
                  }
                >
                  {TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
                <Select
                  value={difficulty}
                  onChange={(event) =>
                    setDifficulty(event.target.value as (typeof DIFFICULTIES)[number])
                  }
                >
                  {DIFFICULTIES.map((value) => (
                    <option key={value} value={value}>
                      {dict.common[value]}
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={marks}
                  onChange={(event) => setMarks(event.target.value)}
                  aria-label={dict.learn.questionMarks}
                  dir="ltr"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  run(
                    () =>
                      addExamQuestionsAction(archive.id, [
                        { prompt, topic, questionType, difficulty, marks: Number(marks) || 1 },
                      ]),
                    () => {
                      setPrompt("");
                      setTopic("");
                    }
                  )
                }
                disabled={isPending || prompt.trim().length < 5 || topic.trim().length < 1}
                className="inline-flex h-8 items-center rounded-lg bg-brand px-3 text-[11.5px] font-semibold text-primary-foreground hover:bg-brand-deep disabled:opacity-50"
              >
                {dict.learn.addQuestion}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-ink-muted">{dict.learn.aiClassifiedNote}</p>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
