"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Bell,
  Check,
  KeyRound,
  LoaderCircle,
  LogOut,
  Mail,
  Palette,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { InstallAppCard } from "@/components/pwa/install-app";
import { requestPasswordChangeAction, updateProfileAction } from "@/lib/actions/settings";
import { signOutAction } from "@/lib/actions/auth";
import { deleteAllMaterialsAction } from "@/lib/actions/materials";
import type { AppMessages } from "@/lib/i18n/app";
import type { Lang } from "@/lib/i18n";
import type { Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

const INTERESTS = [
  "math",
  "physics",
  "biology",
  "chemistry",
  "history",
  "programming",
  "languages",
  "other",
] as const;

const GOALS = ["understand", "exams", "performance", "skills", "organize"] as const;

const EDUCATION = ["school", "university", "independent"] as const;

const THEMES = ["dark", "light", "system"] as const;

type Theme = (typeof THEMES)[number];

export function SettingsClient({
  dict,
  initial,
  email,
  memberSince,
}: {
  dict: AppMessages;
  initial: Profile;
  email: string;
  memberSince: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initial.full_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url ?? "");
  const [educationLevel, setEducationLevel] = useState<string>(initial.education_level ?? "");
  const [interests, setInterests] = useState<string[]>(initial.learning_interests ?? []);
  const [goals, setGoals] = useState<string[]>(initial.learning_goals ?? []);
  const [learningLanguage, setLearningLanguage] = useState<Lang>(initial.learning_language);
  const [theme, setTheme] = useState<Theme>(initial.theme);
  const [emailNotifications, setEmailNotifications] = useState(
    Boolean(initial.notifications?.email)
  );
  const [studyReminders, setStudyReminders] = useState(
    Boolean(initial.notifications?.study_reminders)
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [isSigningOut, startSignOutTransition] = useTransition();

  function toggle(list: string[], value: string, setter: (next: string[]) => void, max: number) {
    if (list.includes(value)) {
      setter(list.filter((item) => item !== value));
    } else if (list.length < max) {
      setter([...list, value]);
    }
  }

  function save() {
    if (fullName.trim().length < 2) {
      setError(dict.errors.invalidInput);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateProfileAction({
        fullName,
        avatarUrl,
        educationLevel: educationLevel || null,
        interests,
        goals,
        learningLanguage,
        theme,
        emailNotifications,
        studyReminders,
      });
      if (result.ok) {
        toast.success(result.message ?? dict.settings.saved);
        router.refresh();
      } else {
        setError(result.error ?? dict.settings.failed);
      }
    });
  }

  function requestPassword() {
    startPasswordTransition(async () => {
      const result = await requestPasswordChangeAction();
      if (result.ok) {
        toast.success(result.message ?? dict.settings.passwordUpdated);
      } else {
        toast.error(result.error ?? dict.errors.generic);
      }
    });
  }

  function signOut() {
    startSignOutTransition(async () => {
      await signOutAction();
    });
  }

  const initialLetter = (fullName.trim() || email || "E").slice(0, 1).toUpperCase();

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserRound className="size-4 text-brand-ink" aria-hidden="true" />
                <CardTitle>{dict.settings.profile}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="flex flex-wrap items-center gap-4">
                <span
                  className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-brand/25 bg-brand/[0.08] text-[20px] font-semibold text-brand-ink"
                  aria-hidden="true"
                >
                  {initialLetter}
                </span>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <label
                    htmlFor="settings-avatar"
                    className="block text-[12px] font-medium text-ink-soft"
                  >
                    {dict.settings.avatar}
                  </label>
                  <input
                    id="settings-avatar"
                    value={avatarUrl}
                    onChange={(event) => setAvatarUrl(event.target.value)}
                    placeholder="https://…"
                    dir="ltr"
                    className="h-10 w-full rounded-xl border border-hairline bg-surface-deep px-3 text-[12.5px] text-ink placeholder:text-ink-muted/70 focus:border-brand/50 focus:outline-none"
                  />
                  <p className="text-[10.5px] text-ink-muted">{dict.settings.avatarHint}</p>
                </div>
              </div>

              <Field label={dict.settings.fullName} htmlFor="settings-name">
                <input
                  id="settings-name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  maxLength={80}
                  className="h-10 w-full rounded-xl border border-hairline bg-surface-deep px-3 text-[13px] text-ink focus:border-brand/50 focus:outline-none"
                />
              </Field>

              <div className="space-y-1.5">
                <span className="block text-[12px] font-medium text-ink-soft">
                  {dict.settings.educationLevel}
                </span>
                <div className="grid gap-2 sm:grid-cols-3">
                  {EDUCATION.map((option) => {
                    const active = educationLevel === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setEducationLevel(active ? "" : option)}
                        aria-pressed={active}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-[12px] font-medium transition-colors",
                          active
                            ? "border-brand/50 bg-brand/[0.08] text-ink"
                            : "border-hairline bg-black/[0.02] text-ink-soft hover:border-hairline-strong"
                        )}
                      >
                        {dict.onboarding[option]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="block text-[12px] font-medium text-ink-soft">
                  {dict.settings.interests}
                </span>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((option) => {
                    const active = interests.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggle(interests, option, setInterests, 8)}
                        aria-pressed={active}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-medium transition-colors",
                          active
                            ? "border-brand/50 bg-brand/[0.08] text-brand-ink"
                            : "border-hairline bg-black/[0.02] text-ink-soft hover:border-hairline-strong"
                        )}
                      >
                        {active ? <Check className="size-3" aria-hidden="true" /> : null}
                        {dict.onboarding[`subject_${option}`]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="block text-[12px] font-medium text-ink-soft">
                  {dict.settings.goals}
                </span>
                <div className="flex flex-wrap gap-2">
                  {GOALS.map((option) => {
                    const active = goals.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggle(goals, option, setGoals, 5)}
                        aria-pressed={active}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-medium transition-colors",
                          active
                            ? "border-brand/50 bg-brand/[0.08] text-brand-ink"
                            : "border-hairline bg-black/[0.02] text-ink-soft hover:border-hairline-strong"
                        )}
                      >
                        {active ? <Check className="size-3" aria-hidden="true" /> : null}
                        {dict.onboarding[`goal_${option}`]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="size-4 text-brand-ink" aria-hidden="true" />
                <CardTitle>{dict.settings.preferences}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="space-y-1.5">
                <span className="block text-[12px] font-medium text-ink-soft">
                  {dict.settings.language}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(["ar", "en"] as const).map((code) => {
                    const active = learningLanguage === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setLearningLanguage(code)}
                        aria-pressed={active}
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-[12.5px] font-medium transition-colors",
                          active
                            ? "border-brand/50 bg-brand/[0.08] text-ink"
                            : "border-hairline bg-black/[0.02] text-ink-soft hover:border-hairline-strong"
                        )}
                      >
                        {code === "ar" ? "العربية" : "English"}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="block text-[12px] font-medium text-ink-soft">
                  {dict.settings.theme}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {THEMES.map((option) => {
                    const active = theme === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setTheme(option)}
                        aria-pressed={active}
                        className={cn(
                          "rounded-xl border px-2 py-2 text-[12px] font-medium transition-colors",
                          active
                            ? "border-brand/50 bg-brand/[0.08] text-ink"
                            : "border-hairline bg-black/[0.02] text-ink-soft hover:border-hairline-strong"
                        )}
                      >
                        {dict.settings[option]}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10.5px] text-ink-muted">{dict.settings.themeNote}</p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-[12px] font-medium text-ink-soft">
                  <Bell className="size-3.5 text-ink-muted" aria-hidden="true" />
                  {dict.settings.notifications}
                </div>
                <ToggleRow
                  label={dict.settings.emailNotifications}
                  checked={emailNotifications}
                  onChange={setEmailNotifications}
                />
                <ToggleRow
                  label={dict.settings.studyReminders}
                  checked={studyReminders}
                  onChange={setStudyReminders}
                />
                <p className="text-[10.5px] text-ink-muted">{dict.settings.notifyNote}</p>
              </div>

              {error ? (
                <p className="rounded-lg border border-[#ef4444]/25 bg-[#ef4444]/[0.06] px-3 py-2 text-[11.5px] text-danger">
                  {error}
                </p>
              ) : null}

              <div className="flex justify-end border-t border-hairline/60 pt-4">
                <button
                  type="button"
                  onClick={save}
                  disabled={isPending}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand px-4 text-[12.5px] font-semibold text-primary-foreground transition-colors hover:bg-brand-deep disabled:opacity-50"
                >
                  {isPending ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Save className="size-4" aria-hidden="true" />
                  )}
                  {isPending ? dict.settings.saving : dict.settings.save}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-brand-ink" aria-hidden="true" />
                <CardTitle>{dict.settings.account}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3.5 pt-5">
              <div>
                <p className="text-[10.5px] uppercase tracking-wide text-ink-muted">
                  {dict.settings.emailLabel}
                </p>
                <p
                  className="mt-0.5 flex items-center gap-1.5 break-all text-[12.5px] text-ink"
                  dir="ltr"
                >
                  <Mail className="size-3 shrink-0 text-ink-muted" aria-hidden="true" />
                  {email}
                </p>
                <p className="mt-1 text-[10.5px] text-ink-muted">{dict.settings.emailReadonly}</p>
              </div>
              <div className="border-t border-hairline/60 pt-3">
                <p className="text-[10.5px] uppercase tracking-wide text-ink-muted">
                  {dict.settings.memberSince}
                </p>
                <p className="mt-0.5 text-[12.5px] text-ink">{memberSince}</p>
              </div>
              <p className="rounded-lg border border-hairline/70 bg-black/[0.015] px-2.5 py-2 text-[10.5px] leading-relaxed text-ink-muted">
                {dict.settings.adminNotice}
              </p>
            </CardContent>
          </Card>

          <InstallAppCard dict={dict} />

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-brand-ink" aria-hidden="true" />
                <CardTitle>{dict.settings.security}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              <p className="text-[11.5px] leading-relaxed text-ink-muted">
                {dict.settings.sessionsBody}
              </p>
              <button
                type="button"
                onClick={requestPassword}
                disabled={isPasswordPending}
                className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-hairline px-3 text-[12px] font-medium text-ink-soft transition-colors hover:bg-black/[0.04] disabled:opacity-50"
              >
                {isPasswordPending ? (
                  <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <KeyRound className="size-3.5" aria-hidden="true" />
                )}
                {dict.settings.updatePassword}
              </button>
              <button
                type="button"
                onClick={signOut}
                disabled={isSigningOut}
                className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-hairline px-3 text-[12px] font-medium text-ink-soft transition-colors hover:bg-black/[0.04] disabled:opacity-50"
              >
                {isSigningOut ? (
                  <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <LogOut className="size-3.5 rtl:-scale-x-100" aria-hidden="true" />
                )}
                {dict.settings.signOut}
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-brand-ink" aria-hidden="true" />
                <CardTitle>{dict.settings.privacy}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              <p className="text-[11.5px] leading-relaxed text-ink-muted">
                {dict.settings.privacyBody}
              </p>
              <p className="text-[11.5px] leading-relaxed text-ink-muted">
                {dict.settings.privacyFilesBody}
              </p>
              <div className="rounded-xl border border-[#ef4444]/20 bg-[#ef4444]/[0.035] p-3">
                <p className="text-[11px] font-medium text-danger">{dict.settings.dangerZone}</p>
                <p className="mt-1 text-[10.5px] leading-relaxed text-ink-muted">
                  {dict.settings.deleteAllBody}
                </p>
                <div className="mt-2.5">
                  <ConfirmAction
                    action={deleteAllMaterialsAction}
                    title={dict.settings.deleteAllTitle}
                    description={`${dict.settings.deleteAllBody} ${dict.settings.deleteAllConfirm}`}
                    confirmLabel={dict.settings.deleteAll}
                    cancelLabel={dict.common.cancel}
                    triggerLabel={dict.settings.deleteAll}
                    successMessage={dict.settings.deleteAllSuccess}
                    className="h-8 border border-[#ef4444]/25 px-2.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="flex items-center justify-center gap-1.5 pb-2 text-[10.5px] text-ink-muted">
        <Trash2 className="size-3 text-ink-muted" aria-hidden="true" />
        {dict.settings.privacyFilesBody}
      </p>
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
      <label htmlFor={htmlFor} className="block text-[12px] font-medium text-ink-soft">
        {label}
      </label>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-hairline bg-black/[0.02] px-3 py-2">
      <span className="text-[12px] text-ink-soft">{label}</span>
      <span className="relative inline-flex">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span
          className={cn(
            "relative h-5 w-9 rounded-full transition-colors",
            checked ? "bg-brand" : "bg-black/15"
          )}
          aria-hidden="true"
        >
          <span
            className={cn(
              "absolute top-0.5 size-4 rounded-full bg-primary-foreground transition-all",
              checked ? "start-[18px]" : "start-0.5"
            )}
          />
        </span>
      </span>
    </label>
  );
}
