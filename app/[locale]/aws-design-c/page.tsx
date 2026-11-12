import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import styles from "./page.module.css";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  await params;
  return { title: "AWS Learning Journey — Prototype C", description: "A quiz-first AWS learning journey concept." };
}

const copy = {
  eyebrow: "AWS CLF-C02 · Prototype C",
  title: "Cloud Learning Journey",
  description: "A connected path through the exam domains. Every checkpoint opens a new question set, while improvement evidence stays honest and visible.",
  start: "Start Mixed Practice",
  weak: "Review Weak Concepts",
  exam: "Try Exam Simulation",
  journey: "YOUR PRACTICE PATH",
  journeyText: "Synthetic journey preview · progress is only real when supported by saved attempts.",
  next: "Next checkpoint",
  nextText: "Security and Compliance challenge",
  nextAction: "Practice new questions",
  domains: "Four CLF-C02 domains",
  domainsText: "Each path node stays clickable, readable, and useful on a small screen.",
  results: "Journey results · synthetic example",
  resultsText: "Show reviewed questions, domain accuracy, strong concepts, and what to revisit without claiming mastery from one answer.",
  strong: "Strong concepts",
  revisit: "Concepts to revisit",
  synthetic: "DEMO DATA",
} as const;
const t = (key: keyof typeof copy) => copy[key];

const domainCards = [
  ["01", "Cloud Concepts", "24%", "Benefits, global infrastructure, and cloud economics", "90%"],
  ["02", "Security & Compliance", "30%", "Identity, shared responsibility, and governance", "70%"],
  ["03", "Technology & Services", "34%", "Core services, access paths, networking, and storage", "80%"],
  ["04", "Billing, Pricing & Support", "12%", "Pricing models, support plans, and cost tools", "80%"],
] as const;

export default async function AwsDesignC({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className={`${styles.page} track-shell track-aws-clf`}>
      <header className={styles.hero}>
        <div><p className={styles.eyebrow}>{t("eyebrow")}</p><h1>{t("title")}</h1><p>{t("description")}</p></div>
        <div className={styles.heroActions}><Link className={styles.primary} href="/quiz?exam=clf-c02&topic=all">{t("start")}</Link><Link href="/weak-areas?exam=clf-c02">{t("weak")}</Link><Link href="/test?exam=clf-c02">{t("exam")}</Link></div>
      </header>
      <section className={styles.journey} aria-labelledby="journey-title">
        <div className={styles.sectionHeading}><p className={styles.eyebrow}>{t("journey")}</p><h2 id="journey-title">Practice is the path</h2><p>{t("journeyText")}</p></div>
        <div className={styles.path} aria-label="Animated four-domain practice path">
          <div className={styles.pathLine} />
          <div className={styles.pathLineActive} />
          <div className={`${styles.pathNode} ${styles.complete}`}><span>✓</span><small>START</small></div>
          <div className={`${styles.pathNode} ${styles.current}`}><span>02</span><small>NOW</small></div>
          <div className={`${styles.pathNode} ${styles.locked}`}><span>03</span><small>NEXT</small></div>
          <div className={`${styles.pathNode} ${styles.locked}`}><span>04</span><small>UP NEXT</small></div>
          <div className={styles.pathPacket} />
        </div>
        <div className={styles.nextCheckpoint}><div><p className={styles.eyebrow}>{t("next")}</p><h3>{t("nextText")}</h3></div><Link className={styles.primary} href="/quiz?exam=clf-c02&topic=all">{t("nextAction")}</Link></div>
      </section>
      <section className={styles.domains} aria-labelledby="domains-title"><div className={styles.sectionHeading}><p className={styles.eyebrow}>{t("domains")}</p><h2 id="domains-title">Follow the exam blueprint</h2><p>{t("domainsText")}</p></div><div className={styles.domainGrid}>{domainCards.map(([number, name, weight, detail, score]) => <Link href="/quiz?exam=clf-c02&topic=all" key={number} className={styles.domainCard}><span className={styles.domainNumber}>{number}</span><div><h3>{name}</h3><p>{detail}</p></div><div className={styles.domainMeta}><span>{weight}</span><strong>{score}</strong></div><div className={styles.domainBar}><i style={{ width: score }} /></div></Link>)}</div></section>
      <section className={styles.results} aria-labelledby="journey-results"><div><p className={styles.eyebrow}>{t("results")}</p><h2 id="journey-results">16 / 20 reviewed · 80% accuracy</h2><p>{t("resultsText")}</p></div><div className={styles.resultsColumns}><div><span>{t("strong")}</span><ul><li>Cloud Computing Advantages</li><li>AWS Global Infrastructure</li><li>IAM roles</li></ul></div><div><span>{t("revisit")}</span><ul><li>Security Groups vs NACLs</li><li>CloudTrail vs CloudWatch</li><li>S3 vs EBS</li></ul></div></div><small className={styles.synthetic}>{t("synthetic")}</small></section>
    </div>
  );
}
