import type { Metadata } from "next";
import { Suspense } from "react";
import { LandingPage } from "@/components/landing/LandingPage";
import { Logo } from "@/components/landing/Logo";
import { getDictionary, getLang } from "@/lib/lang";

const title = "EduMind — Learn Smarter. Understand Deeper.";
const description =
  "EduMind turns your study documents into AI tutoring, smart summaries, interactive quizzes, mind maps, and personalized learning experiences. ارفع ملفاتك وافهم كل حاجة بطريقتك.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "EduMind",
    title,
    description,
    locale: "ar_EG",
    alternateLocale: "en_US",
    url: "/",
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
};

export default function Home() {
  return (
    <Suspense fallback={<LandingSkeleton />}>
      <LandingContent />
    </Suspense>
  );
}

async function LandingContent() {
  const lang = await getLang();
  const dict = getDictionary(lang);

  return <LandingPage lang={lang} dict={dict} />;
}

function LandingSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="border-b border-hairline/60">
        <div className="em-container flex h-16 items-center md:h-[72px]">
          <Logo />
        </div>
      </div>
      <div className="em-container flex flex-1 flex-col items-center justify-center gap-6 py-24 text-center">
        <span className="size-2 rounded-full bg-brand em-animate-pulse-soft" aria-hidden="true" />
        <div className="h-2 w-40 animate-pulse rounded-full bg-black/[0.06]" aria-hidden="true" />
        <span className="sr-only">EduMind</span>
      </div>
    </div>
  );
}
