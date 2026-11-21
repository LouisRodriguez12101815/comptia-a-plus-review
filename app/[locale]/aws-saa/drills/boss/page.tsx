import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FactDrill } from "@/app/components/practice/FactDrill";
import { SetTrackFocus } from "@/app/components/SetTrackFocus";
import { bossDeck } from "@/lib/practice/drills";

const domains = ["D1", "D2", "D3", "D4"] as const;

function domainFrom(value: string | undefined) {
  return domains.find((domain) => domain === value) ?? "D1";
}

export async function generateMetadata({ params }: PageProps<"/[locale]/aws-saa/drills/boss">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "saaDrills" });
  return { title: t("bossTitle") };
}

export default async function Page({
  params,
  searchParams,
}: PageProps<"/[locale]/aws-saa/drills/boss">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { domain } = (await searchParams) as { domain?: string };
  return (
    <>
      <SetTrackFocus focus="saa-c03" />
      <FactDrill deck={bossDeck(domainFrom(domain))} />
    </>
  );
}
