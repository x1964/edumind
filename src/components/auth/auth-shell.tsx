import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/landing/Logo";
import type { AppMessages } from "@/lib/i18n/app";
import type { Lang } from "@/lib/i18n";

export function AuthShell({
  children,
  dict,
  lang,
}: {
  children: ReactNode;
  dict: AppMessages;
  lang: Lang;
}) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-surface">
      <div
        aria-hidden="true"
        className="em-grid-lines pointer-events-none absolute inset-0 opacity-30"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 start-1/4 size-[36rem] rounded-full bg-brand/[0.07] blur-[120px]"
      />

      <div className="relative mx-auto grid min-h-dvh w-full max-w-6xl lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="flex min-w-0 flex-col px-5 py-7 sm:px-10 lg:px-12">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="rounded-lg" aria-label={dict.common.appName}>
              <Logo />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition-colors hover:text-ink"
            >
              <ArrowLeft className="size-3.5 rtl:hidden" aria-hidden="true" />
              <ArrowRight className="size-3.5 ltr:hidden" aria-hidden="true" />
              {dict.common.goHome}
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center py-10">
            <div className="w-full max-w-[400px]">{children}</div>
          </div>

          <p className="text-center text-[11px] text-ink-muted">
            © 2026 EduMind · {dict.common.tagline}
          </p>
        </div>

        <aside className="relative hidden min-w-0 border-s border-hairline/60 bg-surface-deep/50 p-12 lg:flex lg:flex-col lg:justify-between">
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/[0.06] px-3 py-1 text-[11px] font-medium text-brand-ink">
              <span
                className="size-1.5 rounded-full bg-brand em-animate-pulse-soft"
                aria-hidden="true"
              />
              AI-Powered Personalized Learning
            </div>
            <h2 className="mt-6 text-4xl font-semibold leading-[1.15] tracking-[-0.04em] text-ink">
              {lang === "ar" ? (
                <>
                  تعلّم أذكى.
                  <br />
                  <span className="em-text-gradient">افهم أعمق.</span>
                </>
              ) : (
                <>
                  Learn smarter.
                  <br />
                  <span className="em-text-gradient">Understand deeper.</span>
                </>
              )}
            </h2>
            <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-ink-soft">
              {lang === "ar"
                ? "حوّل ملفاتك الدراسية إلى شرح تفاعلي، ملخصات منظمة، اختبارات، وخرائط ذهنية — كل ذلك داخل مساحة خاصة بك."
                : "Turn your study files into interactive explanations, structured summaries, quizzes and mind maps — all in your private workspace."}
            </p>
          </div>

          <div className="relative mt-10 space-y-3">
            {[
              {
                icon: FileText,
                ar: "ارفع PDF أو DOCX أو TXT بأمان في مخزن خاص",
                en: "Upload PDF, DOCX or TXT securely to a private bucket",
              },
              {
                icon: BrainCircuit,
                ar: "مدرّس ذكي يشرح من محتوى ملفاتك ويوضح المراجع",
                en: "An AI tutor that grounds answers in your own documents",
              },
              {
                icon: BookOpenCheck,
                ar: "ملخصات واختبارات وخرائط ذهنية مرتبطة بكل مادة",
                en: "Summaries, quizzes and mind maps tied to each material",
              },
              {
                icon: ShieldCheck,
                ar: "عزل كامل للبيانات وصلاحيات على مستوى الصفوف",
                en: "Strict row-level isolation for every account",
              },
            ].map(({ icon: Icon, ar, en }) => (
              <div
                key={ar}
                className="flex items-start gap-3 rounded-xl border border-hairline/70 bg-black/[0.02] px-4 py-3"
              >
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border border-brand/20 bg-brand/[0.07] text-brand-ink">
                  <Icon className="size-3.5" aria-hidden="true" />
                </span>
                <p className="text-[12.5px] leading-relaxed text-ink-soft">
                  {lang === "ar" ? ar : en}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
