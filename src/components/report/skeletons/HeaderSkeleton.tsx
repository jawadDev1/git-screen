import { Skeleton } from "@/components/ui/skeleton";

export const HeaderSkeleton = () => (
  <div className="flex items-start gap-6 p-6 rounded-xl border border-border/30 bg-card/60">
    <Skeleton className="w-20 h-20 rounded-full shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-4 w-32" />
    </div>
    <Skeleton className="h-20 w-40 rounded-xl" />
  </div>
);
