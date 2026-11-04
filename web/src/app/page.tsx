import {
  AiRulesSection,
  ClosingSection,
  FeaturesSection,
  HeroSection,
} from '@/components/landing/landing-sections';

export default function HomePage() {
  return (
    <main className="overflow-clip bg-canvas text-foreground">
      <HeroSection />
      <FeaturesSection />
      <AiRulesSection />
      <ClosingSection />
    </main>
  );
}
