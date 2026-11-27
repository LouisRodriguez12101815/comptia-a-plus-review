"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import report from "@/capstone/outputs/review_classifier_report.json";
import styles from "./ClassificationExplorer.module.css";

export function ClassificationExplorer() {
  const t = useTranslations("classificationExample");
  const locale = useLocale();
  const initial = Math.max(0, report.validation.findIndex((row) => row.threshold === report.selected_threshold));
  const [index, setIndex] = useState(initial);
  const row = report.validation[index];
  const format = (n: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(n);
  const values = [[t("flagged"), row.flagged], [t("caught"), row.tp], [t("falseAlarms"), row.fp], [t("missed"), row.fn], [t("cost"), row.illustrative_cost]] as const;
  return <section className={styles.panel} aria-labelledby="explorer-title">
    <p className={styles.eyebrow}>{t("validationLabel")}</p>
    <h2 id="explorer-title">{t("explorerTitle")}</h2>
    <p>{t("explorerIntro")}</p>
    <div className={styles.control}>
      <label htmlFor="classification-threshold">{t("threshold")}: <strong>{format(row.threshold)}</strong></label>
      <input id="classification-threshold" type="range" min="0" max={report.validation.length - 1} step="1" value={index} onChange={(event) => setIndex(Number(event.target.value))} aria-valuetext={t("thresholdValue", { value: format(row.threshold) })} />
      <div className={styles.rangeEnds}><span>{format(report.validation[0].threshold)}</span><span>{format(report.validation[report.validation.length - 1].threshold)}</span></div>
    </div>
    <dl className={styles.metrics} aria-live="polite">{values.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{format(value)}</dd></div>)}</dl>
    <p className={styles.note}>{t("validationNote", { rows: report.split.validation.rows, learners: report.split.validation.learners, threshold: format(report.selected_threshold) })}</p>
    <button className={styles.reset} type="button" onClick={() => setIndex(initial)}>{t("reset")}</button>
  </section>;
}
