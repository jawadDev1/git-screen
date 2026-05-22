import {
  HeaderSkeleton,
  CardSkeleton,
  VerdictSkeleton,
} from "@/components/report";

export default function ReportLoading() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      <HeaderSkeleton />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CardSkeleton lines={5} />
        <CardSkeleton lines={4} />
        <CardSkeleton lines={3} />
      </div>
      <CardSkeleton lines={4} />
      <VerdictSkeleton />
    </div>
  );
}
