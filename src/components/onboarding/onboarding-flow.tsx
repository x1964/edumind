"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import {
  Atom,
  AtSign,
  BookMarked,
  Brain,
  BriefcaseBusiness,
  Check,
  Code2,
  FlaskConical,
  GraduationCap,
  Languages,
  LoaderCircle,
  Landmark,
  Phone,
  Sigma,
  Sparkles,
  Target,
  UserRound,
  UserRoundCheck,
} from "lucide-react";
import type { AppMessages } from "@/lib/i18n/app";
import type { Lang } from "@/lib/i18n";
import { saveOnboardingAction } from "@/lib/actions/onboarding";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const INTEREST_ICONS = {
  math: Sigma,
  physics: Atom,
  biology: Brain,
  chemistry: FlaskConical,
  history: Landmark,
  programming: Code2,
  languages: Languages,
  other: Sparkles,
} as const;

const INTERESTS = Object.keys(INTEREST_ICONS) as Array<keyof typeof INTEREST_ICONS>;
const GOALS = ["understand", "exams", "performance", "skills", "organize"] as const;
const GOAL_ICONS = [Brain, Target, GraduationCap, BriefcaseBusiness, BookMarked] as const;

const EDUCATION = [
  { id: "school", icon: GraduationCap, label: "education_school" },
  { id: "university", icon: BookMarked, label: "education_university" },
  { id: "independent", icon: UserRoundCheck, label: "education_independent" },
] as const;

interface InitialValues {
  fullName: string;
  username: string;
  phone: string;
  educationLevel: string;
  interests: string[];
  goals: string[];
  learningLanguage: Lang;
}

export function OnboardingFlow({
  dict,
  lang,
  initial,
}: {
  dict: AppMessages;
  lang: Lang;
  initial: InitialValues;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState(initial.fullName);
  const [username, setUsername] = useState(initial.username);
  const [phone, setPhone] = useState(initial.phone);
  const [educationLevel, setEducationLevel] = useState(initial.educationLevel);
  const [interests, setInterests] = useState<string[]>(initial.interests);
  const [goals, setGoals] = useState<string[]>(initial.goals);
  const [learningLanguage, setLearningLanguage] = useState<Lang>(initial.learningLanguage ?? lang);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalSteps = 7;
  const progress = ((step + 1) / totalSteps) * 100;

  function validateDetails() {
    if (fullName.trim().length < 2) {
      setError(dict.errors.invalidInput);
      return false;
    }
    if (!/^[a-z0-9_]{3,30}$/.test(username.trim().toLowerCase())) {
      setError(dict.onboarding.invalidUsername);
      return false;
    }
    if (!/^\+?[0-9][0-9\s-]{7,18}$/.test(phone.trim())) {
      setError(dict.onboarding.invalidPhone);
      return false;
    }
    return true;
  }

  function toggle(list: string[], value: string, setter: (next: string[]) => void, max: number) {
    if (list.includes(value)) {
      setter(list.filter((item) => item !== value));
    } else if (list.length < max) {
      setter([...list, value]);
    }
  }

  function persist(completed: boolean) {
    if (!validateDetails()) return;
    if (!educationLevel) {
      setError(dict.errors.invalidInput);
      return;
    }
    if (interests.length === 0 || goals.length === 0) {
      setError(dict.errors.invalidInput);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await saveOnboardingAction({
        fullName,
        username,
        phone,
        educationLevel,
        interests,
        goals,
        learningLanguage,
        completed,
      });
      if (!result.ok) {
        setError(result.error ?? dict.onboarding.saveFailed);
        return;
      }

      if (completed) {
        // Hard navigation after the RPC commits. This avoids reusing a
        // prefetched dashboard payload that still has onboarding_completed
        // set to false (which used to bounce students back to onboarding).
        const target = result.redirectTo ?? "/dashboard";
        router.refresh();
        window.location.assign(target);
        return;
      }

      setStep((value) => Math.min(value + 1, totalSteps - 1));
    });
  }

  function next() {
    if (step === 0) {
      setStep(1);
      return;
    }

    if (step === 1) {
      if (!validateDetails()) return;
      setError(null);
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!educationLevel) {
        setError(dict.errors.invalidInput);
        return;
      }
      setError(null);
      setStep(3);
      return;
    }

    if (step === 3) {
      if (interests.length === 0) {
        setError(dict.errors.invalidInput);
        return;
      }
      setError(null);
      setStep(4);
      return;
    }

    if (step === 4) {
      if (goals.length === 0) {
        setError(dict.errors.invalidInput);
        return;
      }
      setError(null);
      setStep(5);
      return;
    }

    if (step === 6) {
      persist(true);
      return;
    }

    // Keep the intermediate steps local. Persist only after the student
    // confirms the final completion screen, so a transient database/session
    // issue cannot block progress at the language step.
    setError(null);
    setStep(6);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            <Sparkles className="size-3.5 text-brand-ink" aria-hidden="true" />
            EduMind
          </span>
          <span className="text-[12px] text-ink-muted">
            {dict.onboarding.stepOf
              .replace("{current}", String(step + 1))
              .replace("{total}", String(totalSteps))}
          </span>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-black/[0.06]">
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-[#ef4444]/25 bg-[#ef4444]/[0.07] px-4 py-3 text-[13px] text-danger"
        >
          {error}
        </div>
      ) : null}

      <div className="flex-1">
        {step === 0 ? (
          <section className="space-y-5">
            <div className="grid size-14 place-items-center rounded-2xl border border-brand/25 bg-brand/10 text-brand-ink">
              <Sparkles className="size-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-[28px] font-semibold tracking-[-0.035em] text-ink">
                {dict.onboarding.welcomeTitle}
              </h1>
              <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-ink-soft">
                {dict.onboarding.welcomeBody}
              </p>
            </div>
          </section>
        ) : null}

        {step === 1 ? (
          <section className="space-y-5">
            <StepHeading title={dict.onboarding.profileTitle} body={dict.onboarding.profileBody} />
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="onboardingFullName"
                  className="block text-[13px] font-medium text-ink-soft"
                >
                  {dict.auth.fullName}
                </label>
                <div className="relative">
                  <UserRound
                    className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
                    aria-hidden="true"
                  />
                  <Input
                    id="onboardingFullName"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    autoComplete="name"
                    minLength={2}
                    maxLength={80}
                    required
                    dir="auto"
                    className="px-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="onboardingUsername"
                  className="block text-[13px] font-medium text-ink-soft"
                >
                  {dict.onboarding.username}
                </label>
                <div className="relative">
                  <AtSign
                    className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
                    aria-hidden="true"
                  />
                  <Input
                    id="onboardingUsername"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    minLength={3}
                    maxLength={30}
                    required
                    dir="ltr"
                    className="px-9"
                  />
                </div>
                <p className="text-[11.5px] leading-relaxed text-ink-muted">
                  {dict.onboarding.usernameHint}
                </p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="onboardingPhone"
                  className="block text-[13px] font-medium text-ink-soft"
                >
                  {dict.onboarding.phone}
                </label>
                <div className="relative">
                  <Phone
                    className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
                    aria-hidden="true"
                  />
                  <Input
                    id="onboardingPhone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    required
                    dir="ltr"
                    className="px-9"
                  />
                </div>
                <p className="text-[11.5px] leading-relaxed text-ink-muted">
                  {dict.onboarding.phoneHint}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="space-y-5">
            <StepHeading
              title={dict.onboarding.educationTitle}
              body={dict.onboarding.educationBody}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              {EDUCATION.map(({ id, icon: Icon, label }) => {
                const active = educationLevel === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setEducationLevel(id)}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col items-start gap-3 rounded-2xl border p-4 text-start transition-colors",
                      active
                        ? "border-brand/50 bg-brand/[0.08]"
                        : "border-hairline bg-surface-raised/60 hover:border-hairline-strong hover:bg-black/[0.03]"
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-9 place-items-center rounded-xl border",
                        active
                          ? "border-brand/30 bg-brand/15 text-brand-ink"
                          : "border-hairline bg-black/[0.03] text-ink-soft"
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="text-[13px] font-medium text-ink">
                      {
                        dict.onboarding[
                          label.replace("education_", "") as "school" | "university" | "independent"
                        ]
                      }
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="space-y-5">
            <StepHeading
              title={dict.onboarding.interestsTitle}
              body={dict.onboarding.interestsBody}
            />
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {INTERESTS.map((id) => {
                const Icon = INTEREST_ICONS[id];
                const active = interests.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggle(interests, id, setInterests, 8)}
                    aria-pressed={active}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-3 text-start transition-colors",
                      active
                        ? "border-brand/50 bg-brand/[0.08] text-ink"
                        : "border-hairline bg-surface-raised/60 text-ink-soft hover:border-hairline-strong hover:bg-black/[0.03]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        active ? "text-brand-ink" : "text-ink-muted"
                      )}
                      aria-hidden="true"
                    />
                    <span className="truncate text-[13px] font-medium">
                      {
                        dict.onboarding[
                          `subject_${id}` as keyof AppMessages["onboarding"]
                        ] as string
                      }
                    </span>
                    {active ? (
                      <Check
                        className="ms-auto size-3.5 shrink-0 text-brand-ink"
                        aria-hidden="true"
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {step === 4 ? (
          <section className="space-y-5">
            <StepHeading title={dict.onboarding.goalsTitle} body={dict.onboarding.goalsBody} />
            <div className="space-y-2.5">
              {GOALS.map((id, index) => {
                const Icon = GOAL_ICONS[index];
                const active = goals.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggle(goals, id, setGoals, 5)}
                    aria-pressed={active}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-start transition-colors",
                      active
                        ? "border-brand/50 bg-brand/[0.08]"
                        : "border-hairline bg-surface-raised/60 hover:border-hairline-strong hover:bg-black/[0.03]"
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-lg border",
                        active
                          ? "border-brand/30 bg-brand/15 text-brand-ink"
                          : "border-hairline bg-black/[0.03] text-ink-muted"
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="text-[13px] font-medium text-ink">
                      {dict.onboarding[`goal_${id}` as keyof AppMessages["onboarding"]] as string}
                    </span>
                    <span
                      className={cn(
                        "ms-auto grid size-5 shrink-0 place-items-center rounded-full border",
                        active
                          ? "border-brand bg-brand text-primary-foreground"
                          : "border-hairline-strong"
                      )}
                    >
                      {active ? <Check className="size-3" aria-hidden="true" /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {step === 5 ? (
          <section className="space-y-5">
            <StepHeading
              title={dict.onboarding.languageTitle}
              body={dict.onboarding.languageBody}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {(["ar", "en"] as const).map((code) => {
                const active = learningLanguage === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLearningLanguage(code)}
                    aria-pressed={active}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-2xl border p-5 text-start transition-colors",
                      active
                        ? "border-brand/50 bg-brand/[0.08]"
                        : "border-hairline bg-surface-raised/60 hover:border-hairline-strong"
                    )}
                  >
                    <span>
                      <span className="block text-[15px] font-semibold text-ink">
                        {code === "ar" ? dict.common.arabic : dict.common.english}
                      </span>
                      <span className="mt-0.5 block text-[12px] text-ink-muted">
                        {code === "ar" ? "RTL" : "LTR"}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "grid size-6 place-items-center rounded-full border",
                        active
                          ? "border-brand bg-brand text-primary-foreground"
                          : "border-hairline-strong"
                      )}
                    >
                      {active ? <Check className="size-3.5" aria-hidden="true" /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {step === 6 ? (
          <section className="space-y-5">
            <div className="grid size-14 place-items-center rounded-2xl border border-brand/25 bg-brand/10 text-brand-ink">
              <Check className="size-7" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-[28px] font-semibold tracking-[-0.035em] text-ink">
                {dict.onboarding.completeTitle}
              </h1>
              <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-ink-soft">
                {dict.onboarding.completeBody}
              </p>
            </div>
            <div className="space-y-3 rounded-2xl border border-hairline bg-surface-raised/60 p-4">
              <ReviewRow label={dict.auth.fullName}>{fullName}</ReviewRow>

              <ReviewRow label={dict.onboarding.username}>
                <span dir="ltr">@{username}</span>
              </ReviewRow>

              <ReviewRow label={dict.onboarding.phone}>
                <span dir="ltr">{phone}</span>
              </ReviewRow>

              <ReviewRow label={dict.onboarding.educationTitle}>
                {dict.onboarding[educationLevel as "school" | "university" | "independent"]}
              </ReviewRow>

              <ReviewRow label={dict.onboarding.interestsTitle}>
                <ChipList
                  items={interests.map(
                    (id) =>
                      dict.onboarding[`subject_${id}` as keyof AppMessages["onboarding"]] as string
                  )}
                />
              </ReviewRow>

              <ReviewRow label={dict.onboarding.goalsTitle}>
                <ChipList
                  items={goals.map(
                    (id) =>
                      dict.onboarding[`goal_${id}` as keyof AppMessages["onboarding"]] as string
                  )}
                />
              </ReviewRow>

              <ReviewRow label={dict.onboarding.languageTitle}>
                {learningLanguage === "ar" ? dict.common.arabic : dict.common.english}
              </ReviewRow>
            </div>
          </section>
        ) : null}
      </div>

      <div className="mt-10 flex items-center justify-between gap-3 border-t border-hairline pt-5">
        <button
          type="button"
          onClick={() => setStep((value) => Math.max(value - 1, 0))}
          disabled={step === 0 || isPending}
          className="h-10 rounded-xl px-4 text-[13px] font-medium text-ink-muted transition-colors hover:bg-black/[0.04] hover:text-ink disabled:invisible"
        >
          {dict.onboarding.back}
        </button>
        <button
          type="button"
          onClick={next}
          disabled={isPending}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-5 text-[13.5px] font-semibold text-primary-foreground transition-colors hover:bg-brand-deep disabled:opacity-60"
        >
          {isPending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
          {isPending
            ? dict.onboarding.saving
            : step === 0
              ? dict.onboarding.start
              : step === 6
                ? dict.onboarding.toDashboard
                : dict.onboarding.continue}
        </button>
      </div>
    </div>
  );
}

function StepHeading({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h1 className="text-[24px] font-semibold tracking-[-0.03em] text-ink sm:text-[26px]">
        {title}
      </h1>
      <p className="mt-2 max-w-lg text-[13.5px] leading-relaxed text-ink-muted">{body}</p>
    </div>
  );
}

function ReviewRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-hairline/70 pb-3 text-[13px] last:border-b-0 last:pb-0 sm:flex-row sm:items-start sm:gap-3">
      <span className="flex items-center gap-2 font-medium text-ink-muted sm:w-40 sm:shrink-0">
        <Check className="size-3.5 text-brand-ink" aria-hidden="true" />
        {label}
      </span>
      <span className="min-w-0 flex-1 text-ink-soft">{children}</span>
    </div>
  );
}

function ChipList({ items }: { items: string[] }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-brand/20 bg-brand/[0.07] px-2.5 py-0.5 text-[12px] font-medium text-brand-ink"
        >
          {item}
        </span>
      ))}
    </span>
  );
}
