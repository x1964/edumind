"use client";

import { useMemo, useState, useTransition } from "react";
import {
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  LoaderCircle,
  Plus,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { createTeacherStudentAction } from "@/lib/actions/teacher";
import type { Lang } from "@/lib/i18n";

interface Plan {
  id: string;
  title: string;
  subject: string;
  grade_level: string | null;
  duration_minutes: number;
  objectives: string[];
  activities: Array<{ title: string; minutes: number; instructions: string }>;
  assessment: string;
  created_at: string;
}
interface Report {
  id: string;
  report_date: string;
  summary: string;
  highlights: string[];
  risks: string[];
  recommendations: string[];
}

export function TeacherStudio({
  lang,
  aiConfigured,
  studentCount,
  activityCount,
  averageScore,
  completionRate,
  recentPlans,
  latestReport,
}: {
  lang: Lang;
  aiConfigured: boolean;
  studentCount: number;
  activityCount: number;
  averageScore: number | null;
  completionRate: number | null;
  recentPlans: Plan[];
  latestReport: Report | null;
}) {
  const ar = lang === "ar";
  const copy = ar
    ? {
        title: "استوديو المعلم",
        subtitle: "خطط دروس أذكى، ومتابعة أوضح لكل طالب.",
        planner: "مخطط الدروس",
        analytics: "تحليلات الطلاب",
        report: "التقرير اليومي",
        generate: "توليد الخطة",
        generating: "جارٍ بناء الخطة…",
        subject: "المادة",
        grade: "الصف أو المستوى",
        topic: "موضوع الدرس",
        duration: "المدة بالدقائق",
        context: "ملاحظات إضافية (اختياري)",
        students: "الطلاب النشطون",
        activities: "أنشطة اليوم",
        score: "متوسط الاختبارات",
        completion: "نسبة الإنجاز",
        noStudents: "لا توجد بيانات طلاب بعد",
        noStudentsBody: "أضف طلابك وسجّل نشاطهم اليومي لتظهر التحليلات والتوصيات.",
        addStudent: "إضافة طالب",
        name: "اسم الطالب",
        email: "البريد الإلكتروني (اختياري)",
        saveStudent: "حفظ الطالب",
        reportCta: "إنشاء تقرير اليوم",
        reportEmpty: "أنشئ تقريرًا مبنيًا على نشاط الطلاب المسجل اليوم.",
        latestPlans: "آخر الخطط",
        objectives: "أهداف التعلّم",
        planReady: "تم حفظ خطة الدرس بنجاح.",
        studentReady: "تمت إضافة الطالب.",
        genericError: "تعذر إكمال العملية. حاول مرة أخرى.",
        aiOff: "فعّل مزود الذكاء الاصطناعي لتوليد الخطط والتقارير.",
      }
    : {
        title: "Teacher studio",
        subtitle: "Smarter lesson plans and a clearer view of every learner.",
        planner: "Lesson planner",
        analytics: "Student analytics",
        report: "Daily report",
        generate: "Generate plan",
        generating: "Building plan…",
        subject: "Subject",
        grade: "Grade or level",
        topic: "Lesson topic",
        duration: "Duration in minutes",
        context: "Additional notes (optional)",
        students: "Active students",
        activities: "Today's activity",
        score: "Average quiz score",
        completion: "Completion rate",
        noStudents: "No student data yet",
        noStudentsBody:
          "Add students and record daily activity to unlock analytics and recommendations.",
        addStudent: "Add student",
        name: "Student name",
        email: "Email (optional)",
        saveStudent: "Save student",
        reportCta: "Create today's report",
        reportEmpty: "Create a report based on activity recorded today.",
        latestPlans: "Recent plans",
        objectives: "Learning objectives",
        planReady: "Lesson plan saved.",
        studentReady: "Student added.",
        genericError: "Could not complete the action. Try again.",
        aiOff: "Configure the AI provider to generate plans and reports.",
      };

  const [tab, setTab] = useState<"planner" | "analytics" | "report">("planner");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("45");
  const [context, setContext] = useState("");
  const [plan, setPlan] = useState<Plan | null>(recentPlans[0] ?? null);
  const [report, setReport] = useState<Report | null>(latestReport);
  const [busy, setBusy] = useState(false);
  const [studentOpen, setStudentOpen] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  async function generatePlan() {
    if (!aiConfigured || !subject.trim() || !topic.trim()) return;
    setBusy(true);
    try {
      const response = await fetch("/api/ai/teacher-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "lesson_plan",
          lang,
          subject,
          grade,
          topic,
          duration: Number(duration),
          context,
        }),
      });
      const payload = (await response.json()) as { plan?: Plan };
      if (!response.ok || !payload.plan) throw new Error();
      setPlan(payload.plan);
      toast.success(copy.planReady);
    } catch {
      toast.error(copy.genericError);
    } finally {
      setBusy(false);
    }
  }

  async function generateReport() {
    if (!aiConfigured) return;
    setBusy(true);
    try {
      const response = await fetch("/api/ai/teacher-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "daily_report", lang, date: today }),
      });
      const payload = (await response.json()) as { report?: Report };
      if (!response.ok || !payload.report) throw new Error();
      setReport(payload.report);
      toast.success(copy.report);
    } catch {
      toast.error(copy.genericError);
    } finally {
      setBusy(false);
    }
  }

  function addStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createTeacherStudentAction({
        fullName: studentName,
        email: studentEmail,
      });
      if (!result.ok) {
        toast.error(result.error ?? copy.genericError);
        return;
      }
      setStudentName("");
      setStudentEmail("");
      setStudentOpen(false);
      toast.success(copy.studentReady);
    });
  }

  const tabs = [
    { id: "planner" as const, label: copy.planner, icon: ClipboardList },
    { id: "analytics" as const, label: copy.analytics, icon: BarChart3 },
    { id: "report" as const, label: copy.report, icon: FileText },
  ];

  return (
    <section className="overflow-hidden rounded-[1.35rem] border border-hairline/80 bg-surface-raised/90 shadow-card">
      <div className="border-b border-hairline/80 bg-[radial-gradient(circle_at_90%_0%,rgba(16,185,129,0.12),transparent_34%)] px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-ink">
              <Sparkles className="size-3" aria-hidden="true" /> EduMind AI
            </div>
            <h2 className="text-[18px] font-semibold tracking-[-0.025em] text-ink">{copy.title}</h2>
            <p className="mt-1 text-[13px] text-ink-muted">{copy.subtitle}</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-brand/15 bg-brand/[0.05] px-3 py-2 text-[12px] text-brand-ink">
            <BookOpenCheck className="size-4" aria-hidden="true" />
            {aiConfigured ? (ar ? "الذكاء الاصطناعي جاهز" : "AI ready") : copy.aiOff}
          </div>
        </div>
        <div className="mt-5 flex gap-1 overflow-x-auto border-b border-hairline/60 pb-px">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-[12px] font-semibold transition-colors ${tab === id ? "border-brand text-brand-ink" : "border-transparent text-ink-muted hover:text-ink"}`}
            >
              <Icon className="size-3.5" aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {tab === "planner" ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-[12px] font-medium text-ink-soft">
                  <span className="mb-1.5 block">{copy.subject}</span>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="h-10 w-full rounded-xl border border-hairline bg-surface-deep/60 px-3 text-sm text-ink outline-none focus:border-brand/50"
                    placeholder={ar ? "مثال: الرياضيات" : "e.g. Mathematics"}
                  />
                </label>
                <label className="text-[12px] font-medium text-ink-soft">
                  <span className="mb-1.5 block">{copy.grade}</span>
                  <input
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="h-10 w-full rounded-xl border border-hairline bg-surface-deep/60 px-3 text-sm text-ink outline-none focus:border-brand/50"
                    placeholder={ar ? "الصف الثالث" : "Grade 3"}
                  />
                </label>
              </div>
              <label className="block text-[12px] font-medium text-ink-soft">
                <span className="mb-1.5 block">{copy.topic}</span>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="h-10 w-full rounded-xl border border-hairline bg-surface-deep/60 px-3 text-sm text-ink outline-none focus:border-brand/50"
                  placeholder={ar ? "مثال: الكسور المتكافئة" : "e.g. Equivalent fractions"}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-[12px] font-medium text-ink-soft">
                  <span className="mb-1.5 flex items-center gap-1.5">
                    <Clock3 className="size-3.5 text-brand-ink" />
                    {copy.duration}
                  </span>
                  <input
                    type="number"
                    min="10"
                    max="240"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="h-10 w-full rounded-xl border border-hairline bg-surface-deep/60 px-3 text-sm text-ink outline-none focus:border-brand/50"
                  />
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => void generatePlan()}
                    disabled={busy || !aiConfigured || !subject.trim() || !topic.trim()}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-[12px] font-semibold text-primary-foreground transition-colors hover:bg-brand-deep disabled:opacity-40"
                  >
                    <Sparkles className="size-3.5" />
                    {busy ? copy.generating : copy.generate}
                  </button>
                </div>
              </div>
              <label className="block text-[12px] font-medium text-ink-soft">
                <span className="mb-1.5 block">{copy.context}</span>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-hairline bg-surface-deep/60 px-3 py-2.5 text-sm text-ink outline-none focus:border-brand/50"
                />
              </label>
            </div>
            <div className="rounded-2xl border border-hairline/80 bg-surface-deep/40 p-4 sm:p-5">
              {plan ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-medium text-brand-ink">
                        {plan.subject} · {plan.duration_minutes} min
                      </p>
                      <h3 className="mt-1 text-[17px] font-semibold text-ink">{plan.title}</h3>
                    </div>
                    <span className="grid size-9 place-items-center rounded-xl border border-brand/20 bg-brand/[0.08] text-brand-ink">
                      <Target className="size-4" />
                    </span>
                  </div>
                  <div className="mt-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                      {copy.objectives}
                    </p>
                    <ul className="mt-2 space-y-2">
                      {plan.objectives.map((item) => (
                        <li
                          key={item}
                          className="flex gap-2 text-[13px] leading-relaxed text-ink-soft"
                        >
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-ink" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-5 grid gap-2">
                    {plan.activities.map((activity) => (
                      <div
                        key={activity.title}
                        className="rounded-xl border border-hairline/70 bg-surface-raised px-3 py-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[13px] font-semibold text-ink">{activity.title}</p>
                          <span className="text-[11px] font-medium text-brand-ink">
                            {activity.minutes} min
                          </span>
                        </div>
                        <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
                          {activity.instructions}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-xl border border-brand/15 bg-brand/[0.05] p-3">
                    <p className="text-[11px] font-semibold text-brand-ink">
                      {ar ? "التقييم السريع" : "Quick assessment"}
                    </p>
                    <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
                      {plan.assessment}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex min-h-72 flex-col items-center justify-center text-center">
                  <Sparkles className="size-6 text-brand-ink" />
                  <p className="mt-3 text-[14px] font-semibold text-ink">
                    {ar ? "ابدأ ببناء أول خطة" : "Build your first plan"}
                  </p>
                  <p className="mt-1 max-w-xs text-[12px] leading-relaxed text-ink-muted">
                    {ar
                      ? "أدخل المادة وموضوع الدرس، وسيحوّلها الذكاء الاصطناعي إلى خطوات قابلة للتنفيذ."
                      : "Enter a subject and topic, and AI will turn them into classroom-ready steps."}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {tab === "analytics" ? (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-4">
              <Metric icon={Users} label={copy.students} value={studentCount} />
              <Metric icon={CalendarDays} label={copy.activities} value={activityCount} />
              <Metric
                icon={Target}
                label={copy.score}
                value={averageScore === null ? "—" : `${averageScore}%`}
              />
              <Metric
                icon={CheckCircle2}
                label={copy.completion}
                value={completionRate === null ? "—" : `${completionRate}%`}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-brand/30 bg-brand/[0.04] p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-brand/20 bg-brand/[0.08] text-brand-ink">
                  <Users className="size-4" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-ink">
                    {studentCount
                      ? ar
                        ? "بيانات طلابك تتحدث هنا"
                        : "Your student data lives here"
                      : copy.noStudents}
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">
                    {copy.noStudentsBody}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStudentOpen((value) => !value)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-3.5 text-[12px] font-semibold text-primary-foreground hover:bg-brand-deep"
              >
                <Plus className="size-3.5" />
                {copy.addStudent}
              </button>
            </div>
            {studentOpen ? (
              <form
                onSubmit={addStudent}
                className="grid gap-3 rounded-2xl border border-hairline bg-surface-deep/40 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
              >
                <label className="text-[12px] font-medium text-ink-soft">
                  <span className="mb-1.5 block">{copy.name}</span>
                  <input
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="h-10 w-full rounded-xl border border-hairline bg-surface-raised px-3 text-sm outline-none focus:border-brand/50"
                  />
                </label>
                <label className="text-[12px] font-medium text-ink-soft">
                  <span className="mb-1.5 block">{copy.email}</span>
                  <input
                    type="email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className="h-10 w-full rounded-xl border border-hairline bg-surface-raised px-3 text-sm outline-none focus:border-brand/50"
                  />
                </label>
                <button
                  disabled={isPending}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-brand/25 px-4 text-[12px] font-semibold text-brand-ink hover:bg-brand/[0.06]"
                >
                  {isPending ? (
                    <LoaderCircle className="size-3.5 animate-spin" />
                  ) : (
                    <Plus className="size-3.5" />
                  )}
                  {copy.saveStudent}
                </button>
              </form>
            ) : null}
          </div>
        ) : null}

        {tab === "report" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline bg-surface-deep/40 p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl border border-brand/20 bg-brand/[0.08] text-brand-ink">
                  <FileText className="size-4" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-ink">{copy.report}</p>
                  <p className="mt-0.5 text-[12px] text-ink-muted">{today}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void generateReport()}
                disabled={busy || !aiConfigured}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-3.5 text-[12px] font-semibold text-primary-foreground hover:bg-brand-deep disabled:opacity-40"
              >
                {busy ? (
                  <LoaderCircle className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                {copy.reportCta}
              </button>
            </div>
            {report ? (
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-brand/20 bg-brand/[0.05] p-4 lg:col-span-3">
                  <p className="text-[13px] leading-relaxed text-ink">{report.summary}</p>
                </div>
                <ReportList
                  title={ar ? "نقاط القوة" : "Highlights"}
                  items={report.highlights}
                  tone="green"
                />
                <ReportList
                  title={ar ? "تحتاج متابعة" : "Needs attention"}
                  items={report.risks}
                  tone="amber"
                />
                <ReportList
                  title={ar ? "الخطوات المقترحة" : "Next actions"}
                  items={report.recommendations}
                  tone="blue"
                />
              </div>
            ) : (
              <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-hairline text-center">
                <FileText className="size-6 text-ink-muted" />
                <p className="mt-3 text-[13px] font-semibold text-ink">{copy.reportEmpty}</p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-hairline/80 bg-surface-deep/40 p-3">
      <Icon className="size-4 text-brand-ink" />
      <p className="mt-3 text-[11px] text-ink-muted">{label}</p>
      <p className="mt-1 text-[20px] font-semibold tracking-[-0.04em] text-ink" dir="auto">
        {value}
      </p>
    </div>
  );
}

function ReportList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "green" | "amber" | "blue";
}) {
  const colors = {
    green: "border-emerald-500/20 bg-emerald-500/[0.05]",
    amber: "border-amber-500/20 bg-amber-500/[0.05]",
    blue: "border-sky-500/20 bg-sky-500/[0.05]",
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[tone]}`}>
      <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
      {items.length ? (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li key={item} className="flex gap-2 text-[12px] leading-relaxed text-ink-soft">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[12px] text-ink-muted">—</p>
      )}
    </div>
  );
}
