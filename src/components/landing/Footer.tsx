import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUp } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { Logo } from "./Logo";

const socialIcons: Record<string, ReactNode> = {
  X: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  LinkedIn: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
    </svg>
  ),
  YouTube: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
};

export function Footer({ dict }: { dict: Dictionary }) {
  const footer = dict.footer;

  return (
    <footer className="relative overflow-hidden border-t border-hairline bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent" />
        <div className="absolute -bottom-24 end-0 size-[420px] rounded-full bg-[radial-gradient(circle,rgba(5,150,105,0.07),transparent_70%)]" />
        <span className="absolute -bottom-8 start-1/2 -translate-x-1/2 select-none font-mono text-[clamp(4rem,14vw,10rem)] font-semibold leading-none tracking-tighter text-black/[0.018]">
          EDUMIND
        </span>
      </div>

      <div className="em-container py-14 md:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr] lg:gap-8">
          <div className="max-w-sm sm:col-span-2 lg:col-span-1">
            <a
              href="#top"
              aria-label={dict.nav.home}
              className="inline-flex rounded-lg transition-opacity duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              <Logo />
            </a>
            <p className="mt-4 text-[13px] leading-[1.9] text-ink-muted">{footer.description}</p>

            <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-hairline bg-black/[0.02] px-3 py-1.5 text-[12px] text-ink-muted">
              <span
                className="size-1.5 rounded-full bg-brand shadow-[0_0_0_3px_rgba(5,150,105,0.12)] em-animate-pulse-soft"
                aria-hidden="true"
              />
              {footer.status}
            </span>

            <div className="mt-6">
              <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-ink-muted/70">
                {footer.socialTitle}
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                {footer.socials.map((social) => {
                  if (social.href) {
                    return (
                      <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        title={social.label}
                        className="grid size-9 place-items-center rounded-full border border-hairline bg-black/[0.015] text-ink-muted transition-colors hover:border-brand/30 hover:bg-brand/[0.05] hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                      >
                        {socialIcons[social.label] ?? social.label}
                      </a>
                    );
                  }

                  return (
                    <span
                      key={social.label}
                      title={`${social.label} — ${footer.soon}`}
                      aria-label={`${social.label} — ${footer.soon}`}
                      aria-disabled="true"
                      className="relative grid size-9 place-items-center rounded-full border border-hairline bg-black/[0.015] text-ink-muted/45"
                    >
                      {socialIcons[social.label] ?? social.label}
                      <span
                        className="absolute -end-0.5 -top-0.5 size-1.5 rounded-full bg-hairline-strong"
                        aria-hidden="true"
                      />
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <FooterColumn title={footer.productTitle} label={footer.productTitle}>
            {footer.productLinks.map((link) => (
              <FooterLink key={link.href + link.label} href={link.href}>
                {link.label}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title={footer.toolsTitle} label={footer.toolsTitle}>
            {footer.toolsLinks.map((link) => (
              <FooterLink key={link.href + link.label} href={link.href}>
                {link.label}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title={footer.companyTitle} label={footer.companyTitle}>
            {footer.companyLinks.map((link) => (
              <FooterLink key={link.href + link.label} href={link.href}>
                {link.label}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title={footer.legalTitle} label={footer.legalTitle}>
            <li>
              <Link
                href={footer.privacyHref || "#"}
                className="text-[12.5px] text-ink-muted transition-colors hover:text-ink"
              >
                {footer.privacy}
              </Link>
            </li>
            <li>
              <Link
                href={footer.termsHref || "#"}
                className="text-[12.5px] text-ink-muted transition-colors hover:text-ink"
              >
                {footer.terms}
              </Link>
            </li>
          </FooterColumn>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-ink-muted/80">
            <span>{footer.rights}</span>
            <span
              className="hidden size-0.5 rounded-full bg-hairline-strong sm:block"
              aria-hidden="true"
            />
            <span>{footer.madeFor}</span>
          </div>
          <a
            href="#top"
            aria-label={dict.nav.home}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-hairline bg-black/[0.02] px-3 py-1.5 text-[12px] text-ink-muted transition-colors hover:border-brand/30 hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <ArrowUp className="size-3" aria-hidden="true" />
            {dict.nav.home}
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  label,
  children,
}: {
  title: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <nav aria-label={label}>
      <h3 className="text-[12px] font-medium uppercase tracking-[0.18em] text-ink-muted/70">
        {title}
      </h3>
      <ul className="mt-3.5 space-y-2.5">{children}</ul>
    </nav>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  const className =
    "group inline-flex items-center gap-1.5 text-[12.5px] text-ink-muted transition-colors hover:text-ink";

  const content = (
    <>
      <span
        aria-hidden="true"
        className="h-px w-0 bg-brand/60 transition-all duration-300 group-hover:w-3"
      />
      {children}
    </>
  );

  if (href.startsWith("/") && !href.startsWith("//")) {
    return (
      <li>
        <Link href={href} className={className}>
          {content}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <a href={href} className={className}>
        {content}
      </a>
    </li>
  );
}
