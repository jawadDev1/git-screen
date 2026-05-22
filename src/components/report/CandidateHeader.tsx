import Image from "next/image";
import { MapPin, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/common/Typography";
import { IProfileData } from "@/types";

const tierConfig = {
  Strong: {
    label: "Strong Hire",
    className: "bg-primary/20 text-primary border-primary/30",
  },
  Promising: {
    label: "Promising",
    className: "bg-warning/20 text-warning border-warning/30",
  },
  Weak: {
    label: "Weak Match",
    className: "bg-destructive/20 text-destructive border-destructive/30",
  },
} as const;

export const CandidateHeader = ({ profile, score }: IProfileData) => {
  const tier = tierConfig[score.tier];

  return (
    <div className="flex flex-col sm:flex-row items-start gap-6 p-6 rounded-xl border border-border/30 bg-card/60">
      {/* Avatar */}
      <div className="relative shrink-0">
        <Image
          src={profile.avatarUrl}
          alt={profile.displayName}
          width={80}
          height={80}
          className="rounded-full ring-2 ring-primary/20"
        />
        <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5">
          <CheckCircle className="w-3.5 h-3.5 text-primary-foreground fill-primary-foreground" />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Typography variant="h2" className="text-foreground">
          {profile.displayName}
        </Typography>
        {profile.bio && (
          <Typography
            variant="muted"
            className="mt-0.5 text-primary line-clamp-1"
          >
            {profile.bio}
          </Typography>
        )}
        <div className="flex flex-wrap items-center gap-3 mt-2">
          {profile.location && (
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <MapPin className="w-3.5 h-3.5" />
              <span>{profile.location}</span>
            </div>
          )}
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {profile.yearsActive}y on GitHub
          </Badge>
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {profile.followers} followers
          </Badge>
        </div>
      </div>

      {/* Score */}
      <div className="shrink-0 rounded-xl border border-border/30 bg-background/40 p-4 text-center min-w-30">
        <Typography
          variant="xs"
          className="uppercase tracking-widest text-muted-foreground"
        >
          Impact Score
        </Typography>
        <div className="flex items-end justify-center gap-1 my-1">
          <span className="text-4xl font-bold text-primary">
            {score.overall}
          </span>
          <span className="text-muted-foreground text-sm mb-1">/100</span>
        </div>
        <Badge className={`text-xs border ${tier.className}`}>
          {tier.label}
        </Badge>
      </div>
    </div>
  );
};
