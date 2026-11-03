import type { Dictionary, Lang } from "@/lib/i18n";
import { FAQSection } from "./FAQSection";
import { FeaturesSection } from "./FeaturesSection";
import { FinalCTA } from "./FinalCTA";
import { Footer } from "./Footer";
import { HeroSection } from "./HeroSection";
import { HowItWorks } from "./HowItWorks";
import { LearningPreview } from "./LearningPreview";
import { Navbar } from "./Navbar";
import { StatisticsSection } from "./StatisticsSection";
import { SubjectsSection } from "./SubjectsSection";
import { TestimonialsSection } from "./TestimonialsSection";
import { WhyEduMind } from "./WhyEduMind";

export function LandingPage({ lang, dict }: { lang: Lang; dict: Dictionary }) {
  return (
    <>
      <Navbar lang={lang} dict={dict} />
      <main className="flex-1">
        <HeroSection dict={dict} />
        <StatisticsSection dict={dict} />
        <LearningPreview dict={dict} />
        <HowItWorks dict={dict} />
        <FeaturesSection dict={dict} />
        <SubjectsSection dict={dict} lang={lang} />
        <WhyEduMind dict={dict} />
        <TestimonialsSection dict={dict} />
        <FAQSection dict={dict} />
        <FinalCTA dict={dict} />
      </main>
      <Footer dict={dict} />
    </>
  );
}
