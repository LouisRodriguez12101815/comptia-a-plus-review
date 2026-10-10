import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SiteHeader } from "@/app/components/SiteHeader";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://comptia-a-plus-review.vercel.app"),
  title: "CompTIA A+ Review",
  description:
    "Class notes, labs, flashcards, original practice quizzes, and Outage Ops multiplayer troubleshooting for CompTIA A+ and Network+.",
  openGraph: {
    title: "Outage Ops | CompTIA Review",
    description: "Diagnose the incident, protect uptime, and prove the repair.",
    images: [{ url: "/og-outage-ops.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Outage Ops | CompTIA Review",
    description: "A CompTIA incident-response game for guided and multiplayer study.",
    images: ["/og-outage-ops.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-950 font-sans text-slate-100">
        <SiteHeader />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
