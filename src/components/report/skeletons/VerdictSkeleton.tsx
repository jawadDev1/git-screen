import { Skeleton } from "@/components/ui/skeleton";

export const VerdictSkeleton = () => (
  <div className="p-6 rounded-xl border-l-4 border-primary bg-card/60 space-y-4">
    <Skeleton className="h-6 w-40" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  </div>
);
