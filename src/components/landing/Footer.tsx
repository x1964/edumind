import type { ReactNode } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { Logo } from "./Logo";
import Link from "next/link";

export function Footer({ dict }: { dict: Dictionary }) {
  const footer = dict.footer;

  return (
    <footer className="relative border-t border-hairline bg-background">
      <div className="em-container py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <a href="#top" aria-label={dict.nav.home} className="inline-flex">
              <Logo />
            </a>
            <p className="mt-4 text-[12px] leading-[1.9] text-ink-muted">{footer.description}</p>
            <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-hairline bg-black/[0.02] px-3 py-1.5 text-[10px] text-ink-muted">
              <span
                className="size-1.5 rounded-full bg-brand em-animate-pulse-soft"
                aria-hidden="true"
              />
              {footer.status}
            </span>

            <div className="mt-6">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-muted/70">
                {footer.socialTitle}
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                {footer.socials.map((social) => (
                  <span
                    key={social}
                    title={`${social} — ${footer.soon}`}
                    aria-disabled="true"
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-hairline bg-black/[0.015] px-3 text-[10px] text-ink-muted/70"
                  >
                    <span aria-hidden="true" className="font-semibold">
                      {social === "X" ? "𝕏" : social === "LinkedIn" ? "in" : "▶"}
                    </span>
                    {social}
                    <span className="rounded bg-black/[0.04] px-1 py-px text-[8px] text-ink-muted/60">
                      {footer.soon}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <FooterColumn title={footer.productTitle}>
            {footer.productLinks.map((link) => (
              <li key={link.href + link.label}>
                <a
                  href={link.href}
                  className="text-[12px] text-ink-muted transition-colors hover:text-ink"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title={footer.toolsTitle}>
            {footer.toolsLinks.map((label) => (
              <li key={label}>
                <a
                  href="#learning-preview"
                  className="text-[12px] text-ink-muted transition-colors hover:text-ink"
                >
                  {label}
                </a>
              </li>
            ))}
          </FooterColumn>

          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-1">
            <FooterColumn title={footer.companyTitle}>
              {footer.companyLinks.map((link) => (
                <li key={link.href + link.label}>
                  <a
                    href={link.href}
                    className="text-[12px] text-ink-muted transition-colors hover:text-ink"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </FooterColumn>

            <FooterColumn title={footer.legalTitle}>
              <li>
                <Link
                  href={footer.privacyHref || "#"}
                  className="text-[12px] text-ink-muted transition-colors hover:text-ink"
                >
                  {footer.privacy}
                </Link>
              </li>
              <li>
                <Link
                  href={footer.termsHref || "#"}
                  className="text-[12px] text-ink-muted transition-colors hover:text-ink"
                >
                  {footer.terms}
                </Link>
              </li>
            </FooterColumn>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10.5px] text-ink-muted/80">
            <span>{footer.rights}</span>
            <span
              className="hidden size-0.5 rounded-full bg-hairline-strong sm:block"
              aria-hidden="true"
            />
            <span>{footer.madeFor}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] text-ink-muted/70">
              <Sparkles className="size-2.5 text-brand-ink/60" aria-hidden="true" />
              Learn smarter. Understand deeper.
            </span>
            <a
              href="#top"
              aria-label={dict.nav.home}
              className="grid size-8 place-items-center rounded-full border border-hairline bg-black/[0.02] text-ink-muted transition-colors hover:border-brand/30 hover:text-brand-ink"
            >
              <ArrowUp className="size-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-muted/70">
        {title}
      </h3>
      <ul className="mt-3.5 space-y-2.5">{children}</ul>
    </div>
  );
}
