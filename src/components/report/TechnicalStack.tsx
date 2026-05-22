import { BarChart2 } from "lucide-react";
import { Typography } from "@/components/common/Typography";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getTopFrameworks } from "@/lib/github/frameworks";
import { IReposData } from "@/types";

const LANG_COLORS = [
  "bg-primary",
  "bg-pink-400",
  "bg-blue-400",
  "bg-yellow-400",
  "bg-purple-400",
];

export const TechnicalStack = ({ reposData, frameworkMap }: IReposData) => {
  const topLanguages = Object.entries(reposData.languageBreakdown).slice(0, 5);
  const frameworks = getTopFrameworks(frameworkMap, "medium").slice(0, 8);

  return (
    <div className="p-6 rounded-xl border border-border/30 bg-card/60 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Typography
          variant="xs"
          className="uppercase tracking-widest text-muted-foreground"
        >
          Technical Stack
        </Typography>
        <BarChart2 className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Language bars */}
      <div className="space-y-3">
        {topLanguages.map(([lang, pct], i) => (
          <div key={lang} className="space-y-1">
            <div className="flex justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${LANG_COLORS[i] ?? "bg-muted"}`}
                />
                <span className="text-foreground font-medium">{lang}</span>
              </div>
              <span className="text-muted-foreground">{pct}%</span>
            </div>
            <Progress value={pct} className="h-1.5" />
          </div>
        ))}
      </div>

      {/* Frameworks */}
      {frameworks.length > 0 && (
        <div className="pt-2 border-t border-border/20">
          <Typography
            variant="xs"
            className="uppercase tracking-widest text-muted-foreground mb-3"
          >
            Detected Frameworks
          </Typography>
          <div className="flex flex-wrap gap-2">
            {frameworks.map((f) => (
              <Badge
                key={f.name}
                variant="outline"
                className="text-xs border-border/40 text-foreground"
              >
                {f.name}
                <span className="ml-1 text-muted-foreground text-[10px]">
                  {f.repoCount}r
                </span>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
