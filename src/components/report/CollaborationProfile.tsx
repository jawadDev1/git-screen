import { Users } from "lucide-react";
import { Typography } from "@/components/common/Typography";
import { Badge } from "@/components/ui/badge";
import type { ICollaborationClassification } from "@/types";

const profileConfig = {
  "Team Player": {
    icon: "👥",
    className: "bg-primary/20 text-primary border-primary/30",
  },
  Mixed: {
    icon: "⚖️",
    className: "bg-warning/20 text-warning border-warning/30",
  },
  "Solo Builder": {
    icon: "🔨",
    className: "bg-muted text-muted-foreground border-border",
  },
} as const;

export const CollaborationProfile = ({
  collaboration,
}: {
  collaboration: ICollaborationClassification;
}) => {
  const cfg = profileConfig[collaboration.profile];

  return (
    <div className="p-6 rounded-xl border border-border/30 bg-card/60 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Typography
          variant="xs"
          className="uppercase tracking-widest text-muted-foreground"
        >
          Collaboration Profile
        </Typography>
        <Users className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Profile type */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
          {cfg.icon}
        </div>
        <div>
          <Typography variant="h3" className="text-foreground">
            {collaboration.profile}
          </Typography>
          <Badge className={`text-xs border mt-1 ${cfg.className}`}>
            {Math.round(collaboration.forkRatio * 100)}% fork ratio
          </Badge>
        </div>
      </div>

      {/* Summary */}
      <Typography
        variant="muted"
        className="text-foreground/80 leading-relaxed"
      >
        {collaboration.summary}
      </Typography>

      {/* Stats */}
      <div className="flex gap-4 pt-1 border-t border-border/20 text-xs text-muted-foreground">
        <span>
          <strong className="text-foreground">
            {collaboration.ownedRepoCount}
          </strong>{" "}
          original repos
        </span>
        <span>
          <strong className="text-foreground">
            {collaboration.forkedRepoCount}
          </strong>{" "}
          forks
        </span>
      </div>
    </div>
  );
};
