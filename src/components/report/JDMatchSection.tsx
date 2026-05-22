import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Typography } from "@/components/common/Typography";
import type { IJDMatchResult, ISkillMatch } from "@/types";

const statusConfig = {
  found: { icon: CheckCircle2, className: "text-primary", label: "Found" },
  partial: { icon: AlertTriangle, className: "text-warning", label: "Partial" },
  missing: { icon: XCircle, className: "text-destructive", label: "Not Found" },
} as const;

const SkillChip = ({ skill }: { skill: ISkillMatch }) => {
  const { icon: Icon, className } = statusConfig[skill.status];
  return (
    <div className="flex flex-col gap-1 p-3 rounded-lg border border-border/30 bg-background/40 min-w-25">
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 shrink-0 ${className}`} />
        <span className="text-xs font-medium text-foreground truncate">
          {skill.skill}
        </span>
      </div>
      <span className={`text-[10px] uppercase tracking-widest ${className}`}>
        {skill.evidence ?? statusConfig[skill.status].label}
      </span>
    </div>
  );
};

const scoreColor = (score: number) =>
  score >= 75
    ? "text-primary"
    : score >= 45
      ? "text-warning"
      : "text-destructive";

export const JDMatchSection = ({ jdMatch }: { jdMatch: IJDMatchResult }) => (
  <div className="p-6 rounded-xl border border-border/30 bg-card/60 space-y-5">
    {/* Header */}
    <div className="flex items-center justify-between">
      <Typography
        variant="xs"
        className="uppercase tracking-widest text-muted-foreground"
      >
        Job Description Match
      </Typography>
      <span className={`text-2xl font-bold ${scoreColor(jdMatch.score)}`}>
        {jdMatch.score}% Match
      </span>
    </div>

    {/* Summary */}
    <Typography variant="muted" className="text-foreground/80">
      {jdMatch.summary}
    </Typography>

    {/* Skill grid */}
    <div className="flex flex-wrap gap-2">
      {jdMatch.breakdown.map((skill) => (
        <SkillChip key={skill.skill} skill={skill} />
      ))}
    </div>

    {/* Counts */}
    <div className="flex gap-4 text-xs text-muted-foreground pt-1 border-t border-border/20">
      <span>
        <strong className="text-primary">{jdMatch.matched}</strong> found
      </span>
      <span>
        <strong className="text-warning">{jdMatch.partial}</strong> partial
      </span>
      <span>
        <strong className="text-destructive">{jdMatch.missing}</strong> missing
      </span>
      <span className="ml-auto">{jdMatch.totalSkills} skills analyzed</span>
    </div>
  </div>
);
