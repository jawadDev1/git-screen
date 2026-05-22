import { Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/common/Typography";
import type { IActivityClassification, IActivityData } from "@/types";

const levelConfig = {
  Active: {
    className: "bg-primary/20 text-primary border-primary/30",
    dot: "bg-primary",
  },
  Moderate: {
    className: "bg-warning/20 text-warning border-warning/30",
    dot: "bg-warning",
  },
  Inactive: {
    className: "bg-destructive/20 text-destructive border-destructive/30",
    dot: "bg-destructive",
  },
} as const;

const StatPill = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="flex flex-col items-center justify-center rounded-lg border border-border/30 bg-background/40 px-4 py-3 text-center">
    <span className="text-xl font-bold text-primary">{value}</span>
    <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
      {label}
    </span>
  </div>
);

interface Props extends IActivityData {
  classification: IActivityClassification;
}

export const ActivitySection = ({ activitySummary, classification }: Props) => {
  const cfg = levelConfig[classification.level];

  return (
    <div className="p-6 rounded-xl border border-border/30 bg-card/60 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Typography
          variant="xs"
          className="uppercase tracking-widest text-muted-foreground"
        >
          Activity & Commitment
        </Typography>
        <Badge
          className={`text-xs border flex items-center gap-1 ${cfg.className}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {classification.level}
        </Badge>
      </div>

      {/* Summary */}
      <Typography
        variant="muted"
        className="text-foreground/80 leading-relaxed"
      >
        {classification.summary}
      </Typography>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatPill
          label="Commits (30d)"
          value={activitySummary.commitEstimateLast30Days}
        />
        <StatPill
          label="Pushes (30d)"
          value={activitySummary.pushesLast30Days}
        />
        <StatPill
          label="PRs Opened"
          value={activitySummary.pullRequestsOpened}
        />
        <StatPill label="Issues Opened" value={activitySummary.issuesOpened} />
      </div>

      {/* Most active day */}
      {activitySummary.mostActiveDay && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
          <Zap className="w-3.5 h-3.5 text-primary" />
          Most active on{" "}
          <span className="text-foreground font-medium">
            {activitySummary.mostActiveDay}s
          </span>
        </div>
      )}
    </div>
  );
};
