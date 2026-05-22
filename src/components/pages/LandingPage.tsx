import { HeroSection, AnalyzerCard, FloatingCode } from "@/components/landing";

export const LandingPage = () => {
  return (
    <>
      <div className="relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-125 bg-primary/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 pt-11  relative">
          <HeroSection />
          <AnalyzerCard />
        </div>

        <FloatingCode />
      </div>
    </>
  );
};
