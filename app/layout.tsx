import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SiteHeader } from "@/app/components/SiteHeader";
import { TrackBar } from "@/app/components/TrackBar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "CompTIA Review",
  description:
    "Notes, flashcards, practice quizzes, labs, and the Outage Ops game for CompTIA A+ Core 1, Core 2, Network+, and CCNA.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-950 font-sans text-slate-100">
        <SiteHeader />
        <TrackBar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
