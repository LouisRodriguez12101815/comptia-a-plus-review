import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SiteHeader } from "@/app/components/SiteHeader";
import { TrackBar } from "@/app/components/TrackBar";
import { TrackTheme } from "@/app/components/TrackTheme";
import { routing } from "@/i18n/routing";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: "Certification Review",
    description: t("description"),
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${inter.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-950 font-sans text-slate-100">
        <NextIntlClientProvider>
          <TrackTheme>
            <SiteHeader />
            <TrackBar />
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>
            <SiteFooter />
          </TrackTheme>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
