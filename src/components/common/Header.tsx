import { GitBranch } from "lucide-react";
import Link from "next/link";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-border/10 bg-background/80 backdrop-blur-sm">
      <Link
        href={"/"}
        className="flex items-center gap-2 max-w-5xl mx-auto px-6 py-4"
      >
        <GitBranch className="w-6 h-6 text-primary" />
        <span className="text-lg font-bold tracking-tight text-primary">
          GitScreen
        </span>
      </Link>
    </header>
  );
};
