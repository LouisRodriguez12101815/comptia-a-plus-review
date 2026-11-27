"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import styles from "./EditorialHome.module.css";

const repository = "https://github.com/LouisRodriguez12101815/comptia-a-plus-review";
const rows = [
  { key: "application", href: "/certifications" },
  { key: "process", href: "/methodology" },
  { key: "pilot", href: "/workplace-demo" },
] as const;

/** Decorative motion uses no learner data and stops on request or in hidden tabs. */
export function EditorialHome() {
  const t = useTranslations("editorialHome");
  const [dark, setDark] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const sync = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  return (
    <div className={styles.home} data-theme={dark ? "dark" : "light"} data-paused={userPaused || hidden}>
      <header className={styles.top}>
        <strong className={styles.brand}>GapLift.</strong>
        <div className={styles.topLinks}>
          <a href={repository} className={styles.repository}>{t("repository")} <span aria-hidden="true">↗</span></a>
          <button type="button" aria-pressed={dark} onClick={() => setDark((value) => !value)}>
            {dark ? t("lightMode") : t("darkMode")}
          </button>
          <button type="button" aria-pressed={userPaused} onClick={() => setUserPaused((value) => !value)}>
            {userPaused ? t("resumeMotion") : t("pauseMotion")}
          </button>
        </div>
      </header>
      <div className={styles.spread}>
        <section className={styles.lead} aria-labelledby="editorial-title">
          <p className={styles.kicker}>{t("eyebrow")}</p>
          <h1 id="editorial-title">{t("title")}</h1>
          <p className={styles.intro}>{t("intro")}</p>
          <Link className={styles.primary} href="/certifications">{t("primaryAction")} <span aria-hidden="true">→</span></Link>
        </section>
        <aside className={styles.margin} aria-label={t("marginLabel")}>
          <svg className={styles.signal} viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <path className={styles.route} d="M45 285 C105 215 170 240 225 160 S315 125 365 55" />
            <circle className={styles.node} cx="45" cy="285" r="7" />
            <circle className={styles.node} cx="365" cy="55" r="7" />
            <circle className={styles.glow} cx="365" cy="55" r="19" />
            <circle className={styles.traveler} cx="0" cy="0" r="5" />
          </svg>
          <p className={styles.marginLabel}>{t("marginLabel")}</p>
          <p className={styles.quote}>{t("quoteFirst")}<br />{t("quoteSecond")}</p>
          <p className={styles.marginBody}>{t("marginBody")}</p>
          <p className={styles.marginFoot}>{t("marginFoot")}</p>
        </aside>
      </div>
      <section className={styles.ledger} aria-labelledby="ledger-title">
        <h2 id="ledger-title">{t("ledgerTitle")}</h2>
        <div className={styles.rows}>
          {rows.map(({ key, href }, index) => (
            <Link className={styles.row} href={href} key={key}>
              <strong>{String(index + 1).padStart(2, "0")} / {t(`rows.${key}.title`)}</strong>
              <span>{t(`rows.${key}.body`)}</span>
              <span className={styles.arrow} aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </section>
      <footer className={styles.support}>
        <span>{t("supporting")}</span>{" "}
        <Link href="/workplace-demo">{t("workplaceLink")}</Link>
        <span aria-hidden="true"> · </span>
        <Link href="/game">Outage Ops</Link>
        <span aria-hidden="true"> · </span>
        <Link href="/methodology">{t("limitsLink")}</Link>
      </footer>
    </div>
  );
}
