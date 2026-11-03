"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Atom, Check, CodeXml, Dna, FlaskConical, Landmark, Sigma } from "lucide-react";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import type { Dictionary, Lang, SubjectId } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

const subjectIcons: Record<SubjectId, typeof Sigma> = {
  math: Sigma,
  physics: Atom,
  biology: Dna,
  chemistry: FlaskConical,
  history: Landmark,
  programming: CodeXml,
};

export function SubjectsSection({ dict, lang }: { dict: Dictionary; lang: Lang }) {
  const [active, setActive] = useState<SubjectId>("math");
  const reduceMotion = useReducedMotion();
  const subjects = dict.subjects;
  const subject = subjects.items.find((item) => item.id === active) ?? subjects.items[0];
  const ActiveIcon = subjectIcons[subject.id];

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, id: SubjectId) {
    const ids = subjects.items.map((item) => item.id);
    const currentIndex = ids.indexOf(id);
    let nextIndex: number | null = null;

    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % ids.length;
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + ids.length) % ids.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = ids.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    const nextId = ids[nextIndex];
    setActive(nextId);
    document.getElementById(`subject-tab-${nextId}`)?.focus();
  }

  return (
    <section id="subjects" className="em-section relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 end-0 -z-10 w-1/2 bg-[radial-gradient(ellipse_70%_50%_at_80%_50%,rgba(5,150,105,0.05),transparent_70%)]"
      />
      <div className="em-container">
        <Reveal>
          <SectionHeading
            eyebrow={subjects.eyebrow}
            title={subjects.title}
            description={subjects.description}
          />
        </Reveal>

        <div className="mt-12 grid gap-4 lg:grid-cols-[268px_minmax(0,1fr)]">
          <Reveal delay={0.05} className="min-w-0">
            <div
              role="tablist"
              aria-label={subjects.eyebrow}
              aria-orientation="vertical"
              className="em-scrollbar-none -mx-1 flex w-full min-w-0 gap-1.5 overflow-x-auto px-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0"
            >
              {subjects.items.map((item, index) => {
                const Icon = subjectIcons[item.id];
                const isActive = item.id === active;
                return (
                  <button
                    key={item.id}
                    id={`subject-tab-${item.id}`}
                    role="tab"
                    type="button"
                    aria-selected={isActive}
                    aria-controls={`subject-panel-${item.id}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => setActive(item.id)}
                    onKeyDown={(event) => onTabKeyDown(event, item.id)}
                    className={cn(
                      "group relative inline-flex shrink-0 items-center gap-3 rounded-xl border px-3.5 py-3 text-start transition-all duration-200 lg:w-full",
                      isActive
                        ? "border-brand/25 bg-brand/[0.06] text-ink"
                        : "border-hairline/70 bg-black/[0.015] text-ink-muted hover:border-hairline-strong hover:bg-black/[0.03] hover:text-ink-soft"
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-lg border transition-colors",
                        isActive
                          ? "border-brand/25 bg-brand/10 text-brand-ink"
                          : "border-hairline bg-black/[0.02] text-ink-muted"
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-medium">{item.name}</span>
                      <span className="mt-0.5 hidden truncate text-[10px] text-ink-muted lg:block">
                        {item.tagline}
                      </span>
                    </span>
                    <span className="ms-auto hidden font-mono text-[9px] text-ink-muted/60 lg:block">
                      0{index + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          </Reveal>

          <Reveal delay={0.1} className="min-w-0">
            <div className="relative min-h-[430px] min-w-0 overflow-hidden rounded-[24px] border border-hairline bg-background">
              <div
                aria-hidden="true"
                className="em-dot-grid absolute inset-0 opacity-25 [mask-image:radial-gradient(ellipse_at_70%_40%,#000,transparent_72%)]"
              />
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={subject.id}
                  id={`subject-panel-${subject.id}`}
                  role="tabpanel"
                  aria-labelledby={`subject-tab-${subject.id}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="relative grid h-full gap-6 p-5 sm:p-7 md:grid-cols-[1.02fr_0.98fr] md:items-center md:p-8"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-brand-ink/85">
                      <span className="size-1 rounded-full bg-brand" aria-hidden="true" />
                      {subjects.visualLabel}
                    </span>
                    <div className="mt-4 flex items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-hairline bg-black/[0.03] text-brand-ink">
                        <ActiveIcon className="size-5" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-[22px] font-semibold leading-tight tracking-tight text-ink">
                          {subject.name}
                        </h3>
                        <p className="text-[11.5px] text-ink-muted">{subject.tagline}</p>
                      </div>
                    </div>
                    <p className="mt-4 max-w-md text-[13px] leading-[1.9] text-ink-soft">
                      {subject.description}
                    </p>
                    <ul className="mt-4 space-y-2">
                      {subject.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="flex items-center gap-2 text-[12px] text-ink-soft"
                        >
                          <span className="grid size-4 shrink-0 place-items-center rounded-full border border-brand/25 bg-brand/[0.07] text-brand-ink">
                            <Check className="size-2.5" aria-hidden="true" />
                          </span>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="min-w-0 rounded-2xl border border-hairline/80 bg-surface-deep p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-2 pb-2">
                      <span className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-ink-muted">
                        {subject.id} / visual
                      </span>
                      <div className="flex gap-1" aria-hidden="true">
                        <span className="size-1 rounded-full bg-brand/70" />
                        <span className="size-1 rounded-full bg-black/15" />
                        <span className="size-1 rounded-full bg-black/10" />
                      </div>
                    </div>
                    <div className="rounded-xl border border-hairline/60 bg-background p-3">
                      <SubjectVisual id={subject.id} dict={dict} lang={lang} />
                    </div>
                    <p className="mt-2.5 text-center text-[9.5px] text-ink-muted">
                      {subject.visualCaption}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function SubjectVisual({ id, dict, lang }: { id: SubjectId; dict: Dictionary; lang: Lang }) {
  switch (id) {
    case "math":
      return <MathVisual />;
    case "physics":
      return <PhysicsVisual />;
    case "biology":
      return <BiologyVisual dict={dict} />;
    case "chemistry":
      return <ChemistryVisual />;
    case "history":
      return <HistoryVisual lang={lang} />;
    case "programming":
      return <ProgrammingVisual />;
  }
}

function MathVisual() {
  return (
    <div className="flex h-[172px] flex-col justify-between sm:h-[190px]">
      <div
        className="rounded-lg border border-hairline/70 bg-black/[0.02] px-3 py-2 font-mono text-[12px] text-ink"
        dir="ltr"
      >
        <span className="text-brand-ink">f(x)</span> = ax² + bx + c
      </div>
      <svg viewBox="0 0 220 120" className="mt-2 h-[112px] w-full" aria-hidden="true">
        <defs>
          <linearGradient id="subject-math-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g stroke="rgba(15,23,42,0.08)">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line key={`h${i}`} x1="14" y1={14 + i * 18} x2="206" y2={14 + i * 18} />
          ))}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <line key={`v${i}`} x1={14 + i * 38} y1="14" x2={14 + i * 38} y2="104" />
          ))}
        </g>
        <line x1="14" y1="72" x2="206" y2="72" stroke="rgba(15,23,42,0.22)" />
        <line x1="74" y1="10" x2="74" y2="110" stroke="rgba(15,23,42,0.22)" />
        <path
          d="M24 96 Q 88 10 158 96"
          fill="none"
          stroke="#059669"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M24 96 Q 88 10 158 96 L158 72 L24 72 Z"
          fill="url(#subject-math-fill)"
          opacity="0.7"
        />
        <line
          x1="86"
          y1="26"
          x2="86"
          y2="72"
          stroke="#059669"
          strokeOpacity="0.35"
          strokeDasharray="3 3"
        />
        <circle cx="86" cy="28" r="3" fill="#059669" />
        <circle cx="32" cy="72" r="2.4" fill="#334155" fillOpacity="0.8" />
        <circle cx="140" cy="72" r="2.4" fill="#334155" fillOpacity="0.8" />
        <text x="94" y="24" fill="#64748b" fontSize="7" fontFamily="monospace">
          vertex
        </text>
        <text x="182" y="66" fill="#64748b" fontSize="7" fontFamily="monospace">
          x
        </text>
        <text x="80" y="18" fill="#64748b" fontSize="7" fontFamily="monospace">
          y
        </text>
      </svg>
    </div>
  );
}

function PhysicsVisual() {
  return (
    <div className="flex h-[172px] flex-col justify-between sm:h-[190px]">
      <div
        className="flex items-center justify-between rounded-lg border border-hairline/70 bg-black/[0.02] px-3 py-2 font-mono text-[10px] text-ink-muted"
        dir="ltr"
      >
        <span className="text-brand-ink">v₀</span>
        <span>θ</span>
        <span className="text-ink">g = 9.8 m/s²</span>
      </div>
      <svg viewBox="0 0 220 120" className="mt-2 h-[112px] w-full" aria-hidden="true">
        <g stroke="rgba(15,23,42,0.08)">
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={i} x1="16" y1={30 + i * 18} x2="204" y2={30 + i * 18} />
          ))}
        </g>
        <line x1="16" y1="102" x2="204" y2="102" stroke="rgba(15,23,42,0.22)" />
        <path
          d="M28 98 Q 108 -6 190 98"
          fill="none"
          stroke="#059669"
          strokeWidth="1.8"
          strokeDasharray="5 4"
          strokeLinecap="round"
        />
        <circle cx="108" cy="38" r="4.5" fill="#059669" />
        <circle cx="108" cy="38" r="10" fill="none" stroke="#059669" strokeOpacity="0.25" />
        <path
          d="M28 98 L56 98"
          stroke="#334155"
          strokeOpacity="0.7"
          markerEnd="url(#arrow-physics)"
        />
        <path
          d="M108 38 L108 66"
          stroke="#059669"
          strokeOpacity="0.65"
          markerEnd="url(#arrow-physics)"
        />
        <path d="M108 38 L138 38" stroke="#059669" strokeOpacity="0.45" />
        <defs>
          <marker
            id="arrow-physics"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#334155" fillOpacity="0.7" />
          </marker>
        </defs>
        <text x="62" y="94" fill="#64748b" fontSize="7" fontFamily="monospace">
          v₀
        </text>
        <text x="114" y="62" fill="#059669" fontSize="7" fontFamily="monospace">
          g
        </text>
      </svg>
    </div>
  );
}

function BiologyVisual({ dict }: { dict: Dictionary }) {
  const branches = dict.learning.mindmap.branches;
  return (
    <div className="flex h-[172px] flex-col justify-between sm:h-[190px]">
      <div className="flex items-center justify-between rounded-lg border border-hairline/70 bg-black/[0.02] px-3 py-2 text-[9.5px] text-ink-muted">
        <span>{dict.learning.lessonMeta}</span>
        <Dna className="size-3 text-brand-ink" aria-hidden="true" />
      </div>
      <svg viewBox="0 0 220 120" className="mt-2 h-[112px] w-full" aria-hidden="true">
        <circle
          cx="110"
          cy="60"
          r="46"
          fill="rgba(5,150,105,0.03)"
          stroke="#059669"
          strokeOpacity="0.4"
          strokeWidth="1.4"
        />
        <circle
          cx="110"
          cy="60"
          r="42"
          fill="none"
          stroke="#64748b"
          strokeOpacity="0.12"
          strokeDasharray="2 4"
        />
        <ellipse
          cx="104"
          cy="58"
          rx="14"
          ry="12"
          fill="rgba(5,150,105,0.08)"
          stroke="#059669"
          strokeOpacity="0.55"
        />
        <circle cx="104" cy="58" r="4" fill="#059669" fillOpacity="0.6" />
        <ellipse
          cx="140"
          cy="76"
          rx="9"
          ry="5"
          fill="none"
          stroke="#64748b"
          strokeOpacity="0.45"
          transform="rotate(-18 140 76)"
        />
        <ellipse
          cx="76"
          cy="80"
          rx="8"
          ry="4"
          fill="none"
          stroke="#64748b"
          strokeOpacity="0.35"
          transform="rotate(22 76 80)"
        />
        <ellipse
          cx="88"
          cy="34"
          rx="7"
          ry="4"
          fill="none"
          stroke="#64748b"
          strokeOpacity="0.3"
          transform="rotate(12 88 34)"
        />
        <circle cx="142" cy="38" r="2" fill="#64748b" fillOpacity="0.4" />
        <circle cx="70" cy="54" r="1.6" fill="#64748b" fillOpacity="0.35" />
        <path d="M90 52 L62 34" stroke="#64748b" strokeOpacity="0.2" />
        <path d="M118 66 L166 54" stroke="#64748b" strokeOpacity="0.2" />
        <text x="36" y="30" fill="#64748b" fontSize="6.5" fontFamily="sans-serif">
          {branches[0].label}
        </text>
        <text x="160" y="50" fill="#64748b" fontSize="6.5" fontFamily="sans-serif">
          {branches[1].label}
        </text>
        <text x="96" y="116" fill="#64748b" fontSize="6.5" fontFamily="sans-serif">
          {branches[2].label}
        </text>
      </svg>
    </div>
  );
}

function ChemistryVisual() {
  return (
    <div className="flex h-[172px] flex-col justify-between sm:h-[190px]">
      <div
        className="flex items-center justify-between rounded-lg border border-hairline/70 bg-black/[0.02] px-3 py-2 font-mono text-[10px] text-ink"
        dir="ltr"
      >
        <span>2H₂ + O₂</span>
        <span className="text-brand-ink">→</span>
        <span>2H₂O</span>
      </div>
      <svg viewBox="0 0 220 120" className="mt-2 h-[112px] w-full" aria-hidden="true">
        <defs>
          <radialGradient id="chem-o" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#16a875" />
          </radialGradient>
        </defs>
        <line
          x1="86"
          y1="58"
          x2="56"
          y2="86"
          stroke="#64748b"
          strokeOpacity="0.3"
          strokeWidth="3"
        />
        <line
          x1="86"
          y1="58"
          x2="116"
          y2="86"
          stroke="#64748b"
          strokeOpacity="0.3"
          strokeWidth="3"
        />
        <line
          x1="86"
          y1="58"
          x2="52"
          y2="36"
          stroke="#64748b"
          strokeOpacity="0.2"
          strokeWidth="2"
        />
        <circle cx="86" cy="58" r="14" fill="url(#chem-o)" />
        <circle cx="86" cy="58" r="14" fill="none" stroke="#10b981" strokeOpacity="0.3" />
        <circle
          cx="54"
          cy="88"
          r="8"
          fill="rgba(245,248,245,0.08)"
          stroke="#64748b"
          strokeOpacity="0.4"
        />
        <circle
          cx="118"
          cy="88"
          r="8"
          fill="rgba(245,248,245,0.08)"
          stroke="#64748b"
          strokeOpacity="0.4"
        />
        <text x="82" y="62" fill="#04130c" fontSize="10" fontFamily="monospace" fontWeight="bold">
          O
        </text>
        <text x="51" y="91" fill="#64748b" fontSize="7" fontFamily="monospace">
          H
        </text>
        <text x="115" y="91" fill="#64748b" fontSize="7" fontFamily="monospace">
          H
        </text>
        <circle cx="166" cy="52" r="5" fill="#059669" fillOpacity="0.18" />
        <circle cx="180" cy="70" r="3.5" fill="#059669" fillOpacity="0.1" />
        <circle cx="160" cy="80" r="2.5" fill="#059669" fillOpacity="0.1" />
        <path
          d="M142 58 C 152 52, 158 46, 166 46"
          fill="none"
          stroke="#059669"
          strokeOpacity="0.25"
        />
      </svg>
    </div>
  );
}

function HistoryVisual({ lang }: { lang: Lang }) {
  const labels =
    lang === "ar"
      ? ["بداية الطباعة", "الثورة الصناعية", "الثورة الفرنسية", "الهبوط على القمر"]
      : ["Printing press", "Industrial Revolution", "French Revolution", "Moon landing"];
  const years = ["1440", "1760", "1789", "1969"];

  return (
    <div className="flex h-[172px] flex-col justify-between sm:h-[190px]">
      <div className="flex items-center justify-between rounded-lg border border-hairline/70 bg-black/[0.02] px-3 py-2 text-[9.5px] text-ink-muted">
        <span>{lang === "ar" ? "خط زمني مترابط" : "Connected timeline"}</span>
        <Landmark className="size-3 text-brand-ink" aria-hidden="true" />
      </div>
      <div className="relative mt-3 flex-1">
        <div
          className="absolute inset-y-1 start-[3px] w-px bg-gradient-to-b from-brand/50 via-hairline-strong to-transparent"
          aria-hidden="true"
        />
        <div className="flex h-full flex-col justify-between">
          {labels.map((label, index) => (
            <div key={label} className="flex items-center gap-2">
              <span
                className={cn(
                  "relative z-10 size-[7px] shrink-0 rounded-full border",
                  index === 2
                    ? "border-brand bg-brand shadow-[0_0_0_3px_rgba(5,150,105,0.1)]"
                    : "border-hairline-strong bg-surface"
                )}
                aria-hidden="true"
              />
              <span className="font-mono text-[8.5px] text-ink-muted" dir="ltr">
                {years[index]}
              </span>
              <span
                className={cn("h-px flex-1 bg-black/[0.06]", index === 2 && "bg-brand/20")}
                aria-hidden="true"
              />
              <span
                className={cn("text-[8.5px]", index === 2 ? "text-brand-ink/90" : "text-ink-soft")}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProgrammingVisual() {
  const lines: { n: number; content: ReactNode }[] = [
    {
      n: 1,
      content: (
        <>
          <span className="text-[#c792ea]">function</span>{" "}
          <span className="text-[#82aaff]">study</span>
          <span className="text-ink-soft">(topic) {"{"}</span>
        </>
      ),
    },
    {
      n: 2,
      content: (
        <>
          <span className="ms-3 text-[#c792ea]">const</span>{" "}
          <span className="text-ink">lesson</span> <span className="text-ink-muted">=</span>{" "}
          <span className="text-[#82aaff]">explain</span>
          <span className="text-ink-muted">(topic);</span>
        </>
      ),
    },
    {
      n: 3,
      content: (
        <>
          <span className="ms-3 text-[#c792ea]">return</span>{" "}
          <span className="text-ink-muted">lesson.</span>
          <span className="text-[#82aaff]">quiz</span>
          <span className="text-ink-muted">();</span>
        </>
      ),
    },
    { n: 4, content: <span className="text-ink-soft">{"}"}</span> },
  ];

  return (
    <div className="flex h-[172px] flex-col justify-between sm:h-[190px]">
      <div
        className="flex items-center justify-between rounded-lg border border-hairline/70 bg-black/[0.02] px-3 py-2 font-mono text-[9px] text-ink-muted"
        dir="ltr"
      >
        <span>study.js</span>
        <div className="flex gap-1" aria-hidden="true">
          <span className="size-1.5 rounded-full bg-brand/70" />
          <span className="size-1.5 rounded-full bg-black/10" />
        </div>
      </div>
      <div
        className="mt-2.5 rounded-lg border border-hairline/60 bg-surface-deep p-2.5 font-mono text-[9px] leading-[2]"
        dir="ltr"
      >
        {lines.map((line) => (
          <div key={line.n} className="flex gap-2.5">
            <span className="w-3 shrink-0 select-none text-end text-ink-muted/50">{line.n}</span>
            <span className="min-w-0 flex-1 whitespace-nowrap">{line.content}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1.5 rounded-md border border-brand/15 bg-brand/[0.04] px-2 py-1 text-[8px] text-brand-ink/80">
        <Check className="size-2.5" aria-hidden="true" />
        <span dir="ltr">lesson.quiz()</span>
      </div>
    </div>
  );
}
