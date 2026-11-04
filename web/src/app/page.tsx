import {
  AiRulesSection,
  ClosingSection,
  FeaturesSection,
  HeroSection,
} from '@/components/landing/landing-sections';

export default function HomePage() {
  return (
    <main className="overflow-clip bg-[#faf9f6] text-[#1e2636]">
      <HeroSection />
      <FeaturesSection />
      <AiRulesSection />
      <ClosingSection />
    </main>
  );
}
