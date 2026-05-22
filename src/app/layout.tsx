import { AppLayout } from "@/components/layouts";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitScreen - Your GitHub Profile Analyzer",
  description: "Analyze your GitHub profile with GitScreen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppLayout>{children}</AppLayout>;
}
