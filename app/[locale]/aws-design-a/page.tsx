import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import styles from "./page.module.css";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  await params;
  return { title: "AWS Cloud Infrastructure — Prototype A", description: "A quiz-first cloud infrastructure learning concept." };
}

const copy = {
  eyebrow: "AWS CLF-C02 · Prototype A",
  title: "Cloud Infrastructure Network",
  description: "Practice first inside a living cloud topology. Watch compute, storage, databases, and security exchange evidence while you build exam confidence.",
  startPractice: "Start Mixed Practice",
  weakAreas: "Review Weak Areas",
  examSimulation: "Full Exam Simulation",
  loop: "Practice → feedback → concept analysis → targeted review → more practice",
  stageLabel: "Animated cloud infrastructure with connected compute, storage, database, and security nodes",
  stageCaption: "LIVE DEMO TOPOLOGY · SYNTHETIC VISUAL",
  practiceEyebrow: "Quiz-first workspace",
  practiceTitle: "Turn the topology into questions",
  practiceDescription: "The visual sets context, then the quiz does the teaching. Supporting resources stay one click away.",
  primaryMode: "PRIMARY MODE",
  mixedPractice: "Mixed Practice",
  mixedDescription: "20 varied CLF-C02 questions across the four exam domains.",
  targetedMode: "TARGETED MODE",
  weakDescription: "New questions aimed at concepts your saved attempts show need attention.",
  supportMode: "SUPPORT",
  studyResources: "Study Resources",
  resourceDescription: "Open notes, visuals, and flashcards after feedback—not before practice.",
  resultsEyebrow: "Results concept · synthetic data",
  resultsTitle: "Make improvement visible",
  demoNotice: "Example values are synthetic and demonstrate the information hierarchy only.",
  sessionAccuracy: "Session accuracy",
  synthetic: "DEMO DATA",
  nextPractice: "Recommended next practice",
  practiceNewQuestions: "Practice new questions",
} as const;
const t = (key: keyof typeof copy) => copy[key];

const nodes = [
  { id: "compute", label: "Compute", tone: "blue", position: "nodeCompute" },
  { id: "storage", label: "Storage", tone: "orange", position: "nodeStorage" },
  { id: "database", label: "Database", tone: "green", position: "nodeDatabase" },
  { id: "security", label: "Security", tone: "purple", position: "nodeSecurity" },
] as const;

export default async function AwsDesignA({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className={`${styles.page} track-shell track-aws-clf`}>
      <section className={styles.hero} aria-labelledby="aws-design-a-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{t("eyebrow")}</p>
          <h1 id="aws-design-a-title">{t("title")}</h1>
          <p className={styles.lede}>{t("description")}</p>
          <div className={styles.actions}>
            <Link className={styles.primaryAction} href="/quiz?exam=clf-c02&topic=all">{t("startPractice")}</Link>
            <Link className={styles.secondaryAction} href="/weak-areas?exam=clf-c02">{t("weakAreas")}</Link>
            <Link className={styles.textAction} href="/test?exam=clf-c02">{t("examSimulation")}</Link>
          </div>
          <p className={styles.loop}><span aria-hidden="true">●</span> {t("loop")}</p>
        </div>

        <div className={styles.networkStage} aria-label={t("stageLabel")} role="img">
          <div className={styles.stageGlow} />
          <div className={`${styles.connection} ${styles.connectionOne}`} />
          <div className={`${styles.connection} ${styles.connectionTwo}`} />
          <div className={`${styles.connection} ${styles.connectionThree}`} />
          <div className={`${styles.connection} ${styles.connectionFour}`} />
          <div className={styles.packet} />
          <div className={`${styles.packet} ${styles.packetTwo}`} />
          <div className={`${styles.packet} ${styles.packetThree}`} />
          <div className={styles.cloudMark} aria-hidden="true">☁</div>
          {nodes.map((node) => (
            <div key={node.id} className={`${styles.node} ${styles[node.position]} ${styles[node.tone]}`}>
              <span className={styles.nodeSignal} aria-hidden="true" />
              <span>{node.label}</span>
            </div>
          ))}
          <p className={styles.stageCaption}>{t("stageCaption")}</p>
        </div>
      </section>

      <section className={styles.practiceGrid} aria-labelledby="aws-design-a-practice">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>{t("practiceEyebrow")}</p>
          <h2 id="aws-design-a-practice">{t("practiceTitle")}</h2>
          <p>{t("practiceDescription")}</p>
        </div>
        <div className={styles.practiceCards}>
          <Link className={styles.practiceCard} href="/quiz?exam=clf-c02&topic=all">
            <span className={styles.cardKicker}>{t("primaryMode")}</span>
            <strong>{t("mixedPractice")}</strong>
            <span>{t("mixedDescription")}</span>
          </Link>
          <Link className={styles.practiceCard} href="/weak-areas?exam=clf-c02">
            <span className={styles.cardKicker}>{t("targetedMode")}</span>
            <strong>{t("weakAreas")}</strong>
            <span>{t("weakDescription")}</span>
          </Link>
          <Link className={styles.practiceCard} href="/aws-clf/visuals">
            <span className={styles.cardKicker}>{t("supportMode")}</span>
            <strong>{t("studyResources")}</strong>
            <span>{t("resourceDescription")}</span>
          </Link>
        </div>
      </section>

      <section className={styles.results} aria-labelledby="aws-design-a-results">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>{t("resultsEyebrow")}</p>
          <h2 id="aws-design-a-results">{t("resultsTitle")}</h2>
          <p>{t("demoNotice")}</p>
        </div>
        <div className={styles.resultGrid}>
          <div className={styles.scoreCard}><span>{t("sessionAccuracy")}</span><strong>80%</strong><small>{t("synthetic")}</small></div>
          <div className={styles.domainCard}><span>Cloud Concepts</span><strong>90%</strong><div className={styles.progress}><i style={{ width: "90%" }} /></div></div>
          <div className={styles.domainCard}><span>Security &amp; Compliance</span><strong>70%</strong><div className={styles.progress}><i style={{ width: "70%" }} /></div></div>
          <div className={styles.domainCard}><span>Technology &amp; Services</span><strong>80%</strong><div className={styles.progress}><i style={{ width: "80%" }} /></div></div>
        </div>
        <div className={styles.nextStep}><span>{t("nextPractice")}</span><Link href="/quiz?exam=clf-c02&topic=all">{t("practiceNewQuestions")}</Link></div>
      </section>
    </div>
  );
}
