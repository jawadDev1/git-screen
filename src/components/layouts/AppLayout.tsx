import { Noto_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { Header } from "../common/Header";
import { Footer } from "../common/Footer";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "700", "800", "500"],
  variable: "--font-sans",
});

export const AppLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html
      lang="en"
      className={cn(
        "h-full dark",
        "antialiased",
        "font-sans",
        notoSans.variable,
        notoSans.className,
      )}
    >
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
};
