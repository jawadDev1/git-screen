import { Skeleton } from "@/components/ui/skeleton";

export const CardSkeleton = ({ lines = 4 }: { lines?: number }) => (
  <div className="p-6 rounded-xl border border-border/30 bg-card/60 space-y-3">
    <Skeleton className="h-4 w-32" />
    <div className="space-y-2 pt-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3 w-full"
          style={{ width: `${100 - i * 10}%` }}
        />
      ))}
    </div>
  </div>
);
