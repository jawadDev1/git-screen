import { MessageSquare } from "lucide-react";
import { Typography } from "@/components/common/Typography";
import { Badge } from "@/components/ui/badge";
import type { IGeminiReport } from "@/types";
import type { ICandidateScore } from "@/types";

const tierConfig = {
  Strong: {
    label: "Strong Hire",
    accent: "border-primary",
    badge: "bg-primary/20 text-primary border-primary/30",
  },
  Promising: {
    label: "Promising",
    accent: "border-warning",
    badge: "bg-warning/20 text-warning border-warning/30",
  },
  Weak: {
    label: "Weak Match",
    accent: "border-destructive",
    badge: "bg-destructive/20 text-destructive border-destructive/30",
  },
} as const;

const SectionBlock = ({
  title,
  content,
}: {
  title: string;
  content: string;
}) =>
  content ? (
    <div className="space-y-1">
      <Typography
        variant="xs"
        className="uppercase tracking-widest text-muted-foreground"
      >
        {title}
      </Typography>
      <Typography
        variant="muted"
        className="text-foreground/80 leading-relaxed"
      >
        {content}
      </Typography>
    </div>
  ) : null;

const BulletList = ({ title, items }: { title: string; items: string[] }) =>
  items.length > 0 ? (
    <div className="space-y-2">
      <Typography
        variant="xs"
        className="uppercase tracking-widest text-muted-foreground"
      >
        {title}
      </Typography>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm text-foreground/80"
          >
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  ) : null;

export const RecruiterVerdict = ({
  report,
  score,
}: {
  report: IGeminiReport;
  score: ICandidateScore;
}) => {
  const tier = tierConfig[score.tier];
  const { sections, hasJD } = report;

  return (
    <div
      className={`p-6 rounded-xl border-l-4 bg-card/60 border border-border/30 ${tier.accent} space-y-5`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <Typography variant="h3" className="text-foreground">
            Recruiter Verdict
          </Typography>
        </div>
        <Badge className={`border ${tier.badge}`}>{tier.label}</Badge>
      </div>

      {/* Snapshot */}
      <SectionBlock title="Candidate Snapshot" content={sections.snapshot} />

      {/* JD-specific or general sections */}
      {hasJD ? (
        <>
          <SectionBlock
            title="JD Fit Assessment"
            content={sections.jdFitAssessment ?? ""}
          />
          <SectionBlock
            title="Technical Match"
            content={sections.technicalMatch ?? ""}
          />
          <SectionBlock
            title="Role Suitability"
            content={sections.roleSuitability ?? ""}
          />
          <BulletList
            title="Strengths for Role"
            items={sections.strengthsForRole ?? []}
          />
          <BulletList
            title="Gaps for Role"
            items={sections.gapsForRole ?? []}
          />
        </>
      ) : (
        <>
          <SectionBlock
            title="Technical Expertise"
            content={sections.technicalExpertise}
          />
          <SectionBlock title="Work Style" content={sections.workStyle} />
          <SectionBlock
            title="Project Quality"
            content={sections.projectQuality}
          />
          <BulletList title="Strengths" items={sections.strengths} />
          <BulletList title="Concerns" items={sections.concerns} />
        </>
      )}

      {/* Verdict */}
      <div className={`pt-4 border-t border-border/20`}>
        <Typography
          variant="muted"
          className="text-foreground leading-relaxed font-medium"
        >
          {sections.verdict}
        </Typography>
      </div>
    </div>
  );
};
