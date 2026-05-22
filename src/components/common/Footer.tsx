import React from "react";

export const Footer = () => {
  return (
    <footer className="border-t border-border/10 bg-background">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-center items-center gap-2">
        <p className="text-xs text-muted-foreground/60 ">
          © {new Date().getFullYear()} GitScreen . Precise Candidate
          Intelligence for Technical Teams.
        </p>
      </div>
    </footer>
  );
};
