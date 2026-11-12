import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import styles from "./page.module.css";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  await params;
  return { title: "AWS Operations Command Center — Prototype B", description: "A quiz-first AWS command center learning concept." };
}

const copy = {
  eyebrow: "AWS CLF-C02 · Prototype B",
  title: "Cloud Operations Command Center",
  description: "A calm operations dashboard for turning weak concepts into the next useful question.",
  start: "Start Mixed Practice",
  weak: "Launch Weakness Challenge",
  exam: "Open Exam Simulation",
  demo: "DEMONSTRATION DATA · NOT A LEARNER ACCOUNT",
  telemetry: "LIVE STUDY TELEMETRY",
  activity: "Question activity",
  activityText: "Synthetic stream shows how the workspace can surface feedback without fabricating learner history.",
  performance: "Domain pulse",
  performanceText: "Real progress cards can replace these labeled examples when evidence exists.",
  concept: "Concept review queue",
  conceptText: "Security groups vs NACLs · CloudTrail vs CloudWatch · S3 vs EBS",
  next: "Next best action",
  nextText: "Answer a new question in the weakest domain before opening a reference.",
  results: "Session results concept",
  resultsText: "Keep the learner oriented: show accuracy, domains, concepts, and the next varied practice set.",
  reviewed: "Questions reviewed",
  accuracy: "Accuracy",
} as const;
const t = (key: keyof typeof copy) => copy[key];

const domains = [
  ["Cloud Concepts", "90%", "90%"],
  ["Security & Compliance", "70%", "70%"],
  ["Technology & Services", "80%", "80%"],
  ["Billing, Pricing & Support", "80%", "80%"],
] as const;

export default async function AwsDesignB({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className={`${styles.page} track-shell track-aws-clf`}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{t("eyebrow")}</p>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>
        <span className={styles.demoBadge}>{t("demo")}</span>
      </header>
      <nav className={styles.commandBar} aria-label="AWS practice actions">
        <Link className={styles.primary} href="/quiz?exam=clf-c02&topic=all">{t("start")}</Link>
        <Link href="/weak-areas?exam=clf-c02">{t("weak")}</Link>
        <Link href="/test?exam=clf-c02">{t("exam")}</Link>
      </nav>
      <main className={styles.grid}>
        <section className={styles.telemetry} aria-labelledby="telemetry-title">
          <div className={styles.sectionTop}><div><p className={styles.eyebrow}>{t("telemetry")}</p><h2 id="telemetry-title">{t("activity")}</h2></div><span className={styles.live}><i /> live demo</span></div>
          <p className={styles.muted}>{t("activityText")}</p>
          <div className={styles.signalMap} aria-hidden="true">
            <span className={styles.signalLine} /><span className={`${styles.signalLine} ${styles.signalLineTwo}`} /><span className={styles.signalDot} /><span className={`${styles.signalDot} ${styles.signalDotTwo}`} />
            <div className={styles.signalCore}>CLF<br /><small>practice</small></div>
          </div>
          <ol className={styles.activityList}>
            <li><span className={styles.good}>✓</span><div><strong>New question answered</strong><small>Cloud Concepts · synthetic event</small></div><time>now</time></li>
            <li><span className={styles.review}>!</span><div><strong>Concept needs review</strong><small>Security and Compliance · synthetic event</small></div><time>2m</time></li>
            <li><span className={styles.good}>↗</span><div><strong>Transfer evidence recorded</strong><small>Different question · synthetic event</small></div><time>5m</time></li>
          </ol>
        </section>
        <section className={styles.sideStack} aria-label="Performance and recommendations">
          <div className={styles.panel}><p className={styles.eyebrow}>{t("performance")}</p><h2>Four-domain pulse</h2><p className={styles.muted}>{t("performanceText")}</p><div className={styles.domains}>{domains.map(([name, value, width]) => <div key={name} className={styles.domain}><div><span>{name}</span><strong>{value}</strong></div><div className={styles.bar}><i style={{ width }} /></div></div>)}</div></div>
          <div className={styles.panel}><p className={styles.eyebrow}>{t("concept")}</p><h2>Weak concepts</h2><p className={styles.muted}>{t("conceptText")}</p><Link className={styles.inlineAction} href="/weak-areas?exam=clf-c02">Review with new questions →</Link></div>
        </section>
      </main>
      <section className={styles.next} aria-labelledby="next-title"><div><p className={styles.eyebrow}>{t("next")}</p><h2 id="next-title">{t("nextText")}</h2></div><Link className={styles.primary} href="/quiz?exam=clf-c02&topic=all">Practice next question</Link></section>
      <section className={styles.results} aria-labelledby="results-title"><div><p className={styles.eyebrow}>{t("results")}</p><h2 id="results-title">Session complete · synthetic example</h2><p className={styles.muted}>{t("resultsText")}</p></div><div className={styles.resultTiles}><div><span>{t("reviewed")}</span><strong>16 / 20</strong></div><div><span>{t("accuracy")}</span><strong>80%</strong></div><div><span>Next practice</span><strong>Security challenge</strong></div></div></section>
    </div>
  );
}
