import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AwsClfWorkspace } from "@/app/components/AwsClfWorkspace";

export async function generateMetadata({ params }: PageProps<"/[locale]/aws-clf">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tracks" });
  return {
    title: t("pageTitle", { label: t("aws-clf.label") }),
    description: t("aws-clf.description"),
  };
}

export default async function Page({ params }: PageProps<"/[locale]/aws-clf">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AwsClfWorkspace />;
}
