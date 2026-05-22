import { Sparkles } from "lucide-react";
import { Typography } from "../common/Typography";

export const HeroSection = () => (
  <section className="text-center mb-10">
    {/* Badge */}
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6">
      <Sparkles className="w-4 h-4 fill-primary" />
      <span className="text-xs font-bold uppercase tracking-widest">
        AI-Powered Repository Analysis
      </span>
    </div>

    {/* Headline */}
    <Typography
      variant="h1"
      className="text-4xl md:text-5xl  font-bold tracking-tight leading-tight mb-4 max-w-3xl mx-auto"
    >
      Unlock Candidate <span className="text-primary">Intelligence</span>
    </Typography>

    {/* Subtext */}
    <Typography
      variant="p"
      className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
    >
      Stop reading code. Start understanding engineers. Paste a GitHub URL and
      get a human-readable screening report in seconds.
    </Typography>
  </section>
);
