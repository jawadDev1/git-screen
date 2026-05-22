import { ShieldCheck, CheckCircle2, Clock } from "lucide-react";
import { Typography } from "@/components/common/Typography";
import { Badge } from "@/components/ui/badge";
import type { IProjectQualityClassification } from "@/types";

const gradeFromScore = (score: number) => {
  if (score >= 85) return "A+";
  if (score >= 75) return "A";
  if (score >= 65) return "A-";
  if (score >= 55) return "B+";
  if (score >= 45) return "B";
  return "C";
};

export const ProjectQuality = ({
  projectQuality,
}: {
  projectQuality: IProjectQualityClassification;
}) => {
  const grade = gradeFromScore(projectQuality.score);

  return (
    <div className="p-6 rounded-xl border border-border/30 bg-card/60 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Typography
          variant="xs"
          className="uppercase tracking-widest text-muted-foreground"
        >
          Project Quality
        </Typography>
        <ShieldCheck className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Grade */}
      <div className="text-center py-2">
        <span className="text-6xl font-bold text-primary">{grade}</span>
        <Typography
          variant="xs"
          className="uppercase tracking-widest text-muted-foreground mt-1"
        >
          Code Craftsmanship
        </Typography>
      </div>

      {/* Summary */}
      <Typography
        variant="muted"
        className="text-foreground/80 leading-relaxed text-center"
      >
        {projectQuality.summary}
      </Typography>

      {/* Top repos */}
      <div className="space-y-2 pt-2 border-t border-border/20">
        {projectQuality.topRepos.slice(0, 3).map((repo) => (
          <div
            key={repo.name}
            className="flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              {repo.hasReadme ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              )}
              <a
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-foreground hover:text-primary truncate transition-colors"
              >
                {repo.name}
              </a>
            </div>
            <Badge variant="outline" className="text-[10px] shrink-0">
              {repo.score}/100
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
};
