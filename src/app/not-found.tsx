import Link from "next/link";
import { Compass } from "lucide-react";
import { Logo } from "@/components/landing/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <div className="border-b border-hairline/60">
        <div className="em-container flex h-16 items-center">
          <Logo />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-md rounded-2xl border border-hairline bg-surface-raised p-7 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-brand/25 bg-brand/10 text-brand-ink">
            <Compass className="size-5" aria-hidden="true" />
          </div>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
            404
          </p>
          <h1 className="mt-1 text-lg font-semibold text-ink">الصفحة غير موجودة</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
            الرابط الذي فتحته غير صحيح أو تم نقل الصفحة. Page not found.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Link
              href="/"
              className="inline-flex h-9 items-center rounded-xl bg-brand px-4 text-[13px] font-semibold text-[#04130c] hover:bg-brand-deep"
            >
              الصفحة الرئيسية
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center rounded-xl border border-hairline px-4 text-[13px] font-medium text-ink-soft hover:bg-black/[0.04]"
            >
              لوحة التحكم
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
