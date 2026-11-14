import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { HomeStory } from "@/app/components/HomeStory";
import styles from "@/app/components/ToolkitHome.module.css";

const repository = "https://github.com/LouisRodriguez12101815/comptia-a-plus-review";
const scopeNotes = ["example", "authoring", "recommendations", "profiles", "limits"] as const;

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "toolkitHome" });
  return { title: "GapLift | " + t("descriptor"), description: t("intro") };
}

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("homeStory");
  return (
    <div className={styles.home}>
      <HomeStory>
        <div className={styles.support}>
          <a href={repository} className={styles.repository}>{t("repositoryLink")} <span aria-hidden="true">→</span></a>
          <details className={styles.details}>
            <summary>{t("scopeHeading")}</summary>
            <ul className={styles.scopeNotes}>
              {scopeNotes.map((key) => <li key={key}>{t(`scope.${key}`)}</li>)}
            </ul>
          </details>
          <Link id="game-heading" href="/game" className={styles.compatibility}>Outage Ops <span aria-hidden="true">→</span></Link>
        </div>
      </HomeStory>
    </div>
  );
}
