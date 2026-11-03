"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { navLinks, type Dictionary, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { CtaLink } from "./CtaLink";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";

interface NavbarProps {
  lang: Lang;
  dict: Dictionary;
}

export function Navbar({ lang, dict }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const links = navLinks(dict);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled || open
          ? "border-b border-hairline/80 bg-background/95 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="em-container flex h-16 items-center justify-between gap-3 md:h-[72px]">
        <a
          href="#top"
          aria-label={dict.nav.home}
          className="rounded-lg transition-opacity hover:opacity-90"
        >
          <Logo />
        </a>

        <nav aria-label={dict.nav.tools} className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group relative rounded-full px-3.5 py-2 text-[13.5px] font-medium text-ink-soft transition-colors duration-200 hover:text-ink"
            >
              {link.label}
              <span
                aria-hidden="true"
                className="absolute inset-x-3.5 -bottom-0.5 h-px scale-x-0 bg-brand/70 transition-transform duration-300 group-hover:scale-x-100"
              />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher lang={lang} label={dict.nav.language} />
          <CtaLink
            href="/login"
            variant="ghost"
            size="md"
            className="hidden h-9 px-3 text-[13px] sm:inline-flex"
          >
            {dict.nav.signIn}
          </CtaLink>
          <CtaLink
            href="/signup"
            size="md"
            className="hidden h-9 px-4 text-[13px] sm:inline-flex"
            withArrow
          >
            {dict.nav.getStarted}
          </CtaLink>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? dict.nav.closeMenu : dict.nav.openMenu}
            className="grid size-9 place-items-center rounded-full border border-hairline bg-black/[0.03] text-ink transition-colors hover:bg-black/[0.06] lg:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id="mobile-menu"
            key="mobile-menu"
            initial={reduceMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-hairline/70 bg-background/96 backdrop-blur-xl lg:hidden"
          >
            <nav
              aria-label={dict.nav.home}
              className="em-container flex max-h-[calc(100dvh-4rem)] flex-col gap-1 overflow-y-auto py-5"
            >
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-3 text-[15px] font-medium text-ink-soft transition-colors hover:bg-black/[0.04] hover:text-ink"
                >
                  {link.label}
                  <span className="text-[10px] tracking-[0.2em] text-ink-muted" aria-hidden="true">
                    ↗
                  </span>
                </a>
              ))}
              <CtaLink href="/signup" size="lg" className="mt-3 w-full" withArrow>
                {dict.nav.getStarted}
              </CtaLink>
              <CtaLink href="/login" variant="secondary" size="lg" className="mt-2 w-full">
                {dict.nav.signIn}
              </CtaLink>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
