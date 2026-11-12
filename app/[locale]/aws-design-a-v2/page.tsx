import type { Metadata } from "next";
import Link from "next/link";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import styles from "./page.module.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]/aws-design-a-v2">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  return {
    title: "AWS Cloud Practitioner · Concept A V2",
    description: "An immersive, quiz-first AWS Cloud Practitioner learning environment prototype.",
  };
}

const domains = [
  { name: "Cloud Concepts", weight: "24%", score: "86%", width: "86%", tone: "cyan" },
  { name: "Security & Compliance", weight: "30%", score: "68%", width: "68%", tone: "violet" },
  { name: "Technology & Services", weight: "34%", score: "74%", width: "74%", tone: "amber" },
  { name: "Billing, Pricing & Support", weight: "12%", score: "91%", width: "91%", tone: "green" },
];

const weakConcepts = [
  ["Security Groups vs Network ACLs", "Review", "security"],
  ["CloudTrail vs CloudWatch", "Practice", "observability"],
  ["S3 vs EBS vs EFS", "Review", "storage"],
  ["AWS Shared Responsibility", "Recovering", "governance"],
];

export default async function AwsDesignAV2Page({ params }: PageProps<"/[locale]/aws-design-a-v2">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.atmosphere} aria-hidden="true"><span /><span /><span /></div>
        <div className={styles.network} aria-hidden="true">
          <svg viewBox="0 0 1200 620" role="presentation">
            <defs>
              <linearGradient id="line" x1="0" x2="1"><stop stopColor="#38bdf8" stopOpacity=".1" /><stop offset=".5" stopColor="#a78bfa" stopOpacity=".8" /><stop offset="1" stopColor="#22d3ee" stopOpacity=".1" /></linearGradient>
              <filter id="glow"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <g className={styles.routes} fill="none" stroke="url(#line)" strokeWidth="2">
              <path d="M50 410 C240 330 230 140 430 170 S650 330 780 210 S1010 120 1160 200" />
              <path d="M50 410 C280 520 390 500 520 360 S790 280 900 420 S1060 520 1160 470" />
              <path d="M180 80 C300 210 370 210 430 170 M430 170 C500 80 590 90 650 160 M650 160 C720 240 760 230 780 210" />
              <path d="M520 360 C560 270 610 230 650 160 M780 210 C830 280 850 350 900 420" />
            </g>
            <g className={styles.packets} fill="#67e8f9" filter="url(#glow)">
              <circle r="5"><animateMotion dur="6s" repeatCount="indefinite" path="M50 410 C240 330 230 140 430 170 S650 330 780 210 S1010 120 1160 200" /></circle>
              <circle r="4" fill="#c4b5fd"><animateMotion dur="8s" begin="-3s" repeatCount="indefinite" path="M50 410 C280 520 390 500 520 360 S790 280 900 420 S1060 520 1160 470" /></circle>
              <circle r="3" fill="#fbbf24"><animateMotion dur="5s" begin="-1.5s" repeatCount="indefinite" path="M180 80 C300 210 370 210 430 170 M430 170 C500 80 590 90 650 160 M650 160 C720 240 760 230 780 210" /></circle>
              <circle r="3"><animateMotion dur="7s" begin="-4s" repeatCount="indefinite" path="M520 360 C560 270 610 230 650 160 M780 210 C830 280 850 350 900 420" /></circle>
            </g>
            <g className={styles.nodes}>
              <g transform="translate(82 382)"><circle r="28" /><text y="52">EDGE</text></g>
              <g transform="translate(180 80)"><circle r="30" /><text y="56">IDENTITY</text></g>
              <g transform="translate(430 170)"><circle r="38" /><text y="68">COMPUTE</text></g>
              <g transform="translate(520 360)"><circle r="34" /><text y="64">STORAGE</text></g>
              <g transform="translate(650 160)"><circle r="34" /><text y="64">DATABASE</text></g>
              <g transform="translate(780 210)"><circle r="34" /><text y="64">SECURITY</text></g>
              <g transform="translate(900 420)"><circle r="28" /><text y="52">LOGS</text></g>
              <g transform="translate(1120 200)"><circle r="31" /><text y="58">APPS</text></g>
            </g>
          </svg>
          <div className={styles.networkLabel}><span className={styles.liveDot} /> LIVE INFRASTRUCTURE SIMULATION <span>· packets flowing</span></div>
        </div>

        <div className={styles.heroContent}>
          <div className={styles.eyebrow}><span className={styles.awsMark}>⌁</span> AWS CERTIFIED CLOUD PRACTITIONER <b>CLF-C02</b></div>
          <h1 id="hero-title">Build confidence in<br /><em>the cloud.</em></h1>
          <p className={styles.subtitle}>Practice the questions that move your certification forward. One focused session at a time.</p>
          <div className={styles.primaryActions}>
            <Link className={styles.primaryButton} href="/quiz?exam=clf-c02&topic=all"><span>START MIXED PRACTICE</span><span aria-hidden="true">↗</span></Link>
            <Link className={styles.secondaryButton} href="/weak-areas?exam=clf-c02">Review weak areas <span aria-hidden="true">→</span></Link>
            <Link className={styles.tertiaryButton} href="/test?exam=clf-c02">Full exam simulation</Link>
          </div>
          <p className={styles.sessionNote}><span className={styles.pulse} /> Ready for your next 10 questions <span>·</span> no setup required</p>
        </div>
        <div className={styles.scrollCue} aria-hidden="true">SCROLL TO EXPLORE <span>↓</span></div>
      </section>

      <main className={styles.content}>
        <section className={styles.overview} aria-labelledby="overview-title">
          <div className={styles.sectionHeading}><div><p className={styles.kicker}>YOUR LEARNING SIGNAL</p><h2 id="overview-title">Small sessions.<br /><em>Real momentum.</em></h2></div><span className={styles.demoBadge}>DEMO DATA · NOT A LEARNER ACCOUNT</span></div>
          <div className={styles.statsGrid}>
            <article className={styles.stat}><span>QUESTIONS ATTEMPTED</span><strong>128</strong><small>+18 this week</small></article>
            <article className={styles.stat}><span>SESSION ACCURACY</span><strong>78<small>%</small></strong><small className={styles.positive}>↑ 6% vs last session</small></article>
            <article className={styles.stat}><span>RECENT PRACTICE</span><strong>4<small> days</small></strong><small>Best streak: 9 days</small></article>
            <article className={`${styles.stat} ${styles.statAccent}`}><span>CONCEPT RECOVERY</span><strong>7<small>/ 10</small></strong><small>Transfer answers correct</small></article>
          </div>
        </section>

        <section className={styles.performance} aria-labelledby="performance-title">
          <div className={styles.sectionHeading}><div><p className={styles.kicker}>CLF-C02 COVERAGE</p><h2 id="performance-title">Know where to <em>focus.</em></h2></div><span className={styles.legend}><i /> Learner performance <i className={styles.outline} /> Official exam weight</span></div>
          <div className={styles.domainList}>{domains.map((domain) => <div className={styles.domain} key={domain.name}><div className={styles.domainMeta}><span>{domain.name}</span><span><b>{domain.score}</b> <small>exam weight {domain.weight}</small></span></div><div className={styles.track} aria-label={`${domain.name}: synthetic performance ${domain.score}, official exam weight ${domain.weight}`}><span className={`${styles.fill} ${styles[domain.tone]}`} style={{ width: domain.width }} /><span className={styles.weight} style={{ width: domain.weight }} /></div></div>)}</div>
        </section>

        <section className={styles.reviewGrid} aria-labelledby="review-title">
          <div className={styles.weakPanel}><p className={styles.kicker}>NEXT BEST MOVE</p><h2 id="review-title">Your next challenge:<br /><em>Security & Networking</em></h2><p>Strengthen the concepts that unlock the most questions across the exam.</p><Link className={styles.inlineAction} href="/weak-areas?exam=clf-c02">Practice this focus <span>↗</span></Link></div>
          <div className={styles.concepts}><div className={styles.conceptsHeading}><p className={styles.kicker}>CONCEPTS TO REVISIT</p><span>4 signals</span></div>{weakConcepts.map(([name, state, icon]) => <Link className={styles.concept} href="/weak-areas?exam=clf-c02" key={name}><span className={`${styles.conceptIcon} ${styles[icon]}`} aria-hidden="true">{icon === "security" ? "◈" : icon === "storage" ? "▦" : icon === "governance" ? "◌" : "⌁"}</span><span><b>{name}</b><small>{state}</small></span><span aria-hidden="true">→</span></Link>)}</div>
        </section>

        <section className={styles.results} id="results" aria-labelledby="results-title"><div className={styles.resultsHeader}><div><p className={styles.kicker}>SESSION SNAPSHOT</p><h2 id="results-title">Keep the signal <em>moving.</em></h2></div><span className={styles.demoBadge}>SYNTHETIC RESULTS VIEW</span></div><div className={styles.resultsBody}><div className={styles.scoreRing}><strong>78<small>%</small></strong><span>SESSION ACCURACY</span></div><div className={styles.resultColumns}><div><span>ANSWERED</span><b>18</b><small>14 correct · 4 incorrect</small></div><div><span>RECOVERED</span><b>3</b><small>concepts improved</small></div><div><span>RECOMMENDED</span><b>10</b><small>new questions next</small></div></div><div className={styles.resultActions}><Link className={styles.primaryButton} href="/quiz?exam=clf-c02&topic=all">Practice new questions <span aria-hidden="true">↗</span></Link><Link className={styles.resultLink} href="/weak-areas?exam=clf-c02">Review weak concepts →</Link><Link className={styles.resultLink} href="/en/aws-design-a-v2">Return to AWS dashboard →</Link></div></div></section>

        <section className={styles.resources} aria-labelledby="resources-title"><div><p className={styles.kicker}>SUPPORTING RESOURCES</p><h2 id="resources-title">Go deeper when<br /><em>you’re ready.</em></h2></div><div className={styles.resourceLinks}><Link href="/notes?exam=clf-c02">Study notes <span>↗</span></Link><Link href="/flashcards?exam=clf-c02">Flashcards <span>↗</span></Link><Link href="/labs?exam=clf-c02">Hands-on labs <span>↗</span></Link><Link href="/aws-clf/visuals">Visual resources <span>↗</span></Link></div></section>
      </main>
    </div>
  );
}
