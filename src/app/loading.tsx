import { Logo } from "@/components/landing/Logo";

export default function RootLoading() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <div className="border-b border-hairline/60">
        <div className="em-container flex h-16 items-center md:h-[72px]">
          <Logo />
        </div>
      </div>
      <div className="em-container flex flex-1 flex-col items-center justify-center gap-5 py-24">
        <span className="size-2 rounded-full bg-brand em-animate-pulse-soft" aria-hidden="true" />
        <span className="sr-only">Loading…</span>
      </div>
    </div>
  );
}
