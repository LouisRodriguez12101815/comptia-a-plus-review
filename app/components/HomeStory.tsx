"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { NetworkEnvironment } from "@/app/components/NetworkEnvironment";
import styles from "./HomeStory.module.css";

const story = ["problem", "transformation", "evidence", "solution"] as const;
const interval = 8000;
const subscribeMotion = (callback: () => void) => {
  const query = matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};
const reducedSnapshot = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const subscribeVisibility = (callback: () => void) => {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
};
const visibleSnapshot = () => !document.hidden;
const serverReduced = () => true;
const serverVisible = () => true;

/** Expose one phrase to assistive technology; the visual glyphs are decorative. */
function LetterHeadline({ text }: { text: string }) {
  let letterIndex = 0;
  return <h1 id="toolkit-heading" aria-label={text}>
    <span aria-hidden="true">
      {text.split(/(\s+)/).map((word, index) => /\s/.test(word) ? word : (
        <span key={index} className={styles.word}>
          {Array.from(word).map((letter) => {
            const position = letterIndex++;
            return <span key={position} data-letter className={styles.letter} style={{ "--letter-index": position } as CSSProperties}>{letter}</span>;
          })}
        </span>
      ))}
    </span>
  </h1>;
}

/** A local illustration. Does not read progress or call authoring/assessment services. */
export function HomeStory({ children }: { children?: ReactNode }) {
  const t = useTranslations("homeStory");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visualHovered, setVisualHovered] = useState(false);
  const [visualFocused, setVisualFocused] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const reducedMotion = useSyncExternalStore(subscribeMotion, reducedSnapshot, serverReduced);
  const visible = useSyncExternalStore(subscribeVisibility, visibleSnapshot, serverVisible);
  const motionPaused = paused || reducedMotion || hovered || focused || !visible;
  const stage = story[index];
  const detailOpen = selectedDetail || visualHovered || visualFocused;
  const heading = t(`${stage}.title`);
  const detail = t(`${stage}.detail`);
  const letterCount = Array.from(heading.replace(/\s/g, "")).length;
  const revealStyle = {
    "--letter-step": `${Math.min(20, 800 / Math.max(1, letterCount))}ms`,
    "--headline-time": `${Math.min(letterCount * 20, 800) + 160}ms`,
  } as CSSProperties;

  useEffect(() => {
    if (motionPaused) return;
    // A fresh full interval after an interaction/tab change avoids surprise advances.
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % story.length);
      setSelectedDetail(false);
    }, interval);
    return () => window.clearTimeout(timer);
  }, [index, motionPaused]);

  function goTo(next: number) {
    const target = (next + story.length) % story.length;
    setIndex(target);
    setSelectedDetail(false);
    setAnnouncement(t("position", { current: target + 1, total: story.length }) + ": " + t(`${story[target]}.title`));
  }

  return (
    <div
      onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(true); }}
      onPointerLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    >
      <section
        className={styles.hero}
        aria-label={t("label")}
        aria-roledescription={t("carousel")}
        data-story-state={stage}
        data-motion-paused={motionPaused}
      >
        <NetworkEnvironment paused={motionPaused} />
        <p className={styles.eyebrow}>{t("eyebrow")}</p>
        <div key={stage} style={revealStyle} className={styles.stage} role="group" aria-roledescription={t("slide")} aria-label={t("position", { current: index + 1, total: story.length })}>
          <div className={styles.copy}>
            <p className={styles.stageLabel}>{t(`${stage}.label`)}</p>
            <LetterHeadline text={heading} />
            <p className={styles.sentence}>{t(`${stage}.body`)}</p>
          </div>
          <div className={styles.visual}>
            <button
              type="button"
              className={styles.diagram}
              aria-labelledby="story-visual-label"
              title={t("inspectVisual", { state: t(`${stage}.label`) })}
              aria-describedby="story-visual-detail"
              onPointerEnter={(event) => { if (event.pointerType === "mouse") setVisualHovered(true); }}
              onPointerLeave={() => setVisualHovered(false)}
              onFocus={() => setVisualFocused(true)}
              onBlur={() => setVisualFocused(false)}
              onClick={() => setSelectedDetail(true)}
            >
              <svg viewBox="0 0 400 150" aria-hidden="true" className={styles.illustration} data-scene={stage}>
                {stage === "solution" ? <>
                  <path d="M75 65H325 M325 96Q200 160 75 96" className={styles.connection} />
                  <path d="M75 65H325" className={styles.flow} />
                  <path d="M325 96Q200 160 75 96" className={styles.completion} />
                  <path d="M325 96Q200 160 75 96" className={styles.loopFlow} />
                  <circle cx="75" cy="65" r="31" className={styles.node} />
                  <circle cx="200" cy="65" r="36" className={styles.node} />
                  <circle cx="325" cy="65" r="31" className={styles.node} />
                  <circle cx="200" cy="65" r="42" className={styles.conclusion} />
                  <g className={styles.glyph}>
                    <path d="M64 48h22v33H64z M69 56h12 M69 63h12 M69 70h7" />
                    <path d="M200 50q-12-6-22-2v32q10-4 22 3 12-7 22-3V48q-10-4-22 2v33 M184 57h10 M206 57h10 M184 64h10 M206 64h10" />
                    <path d="M313 49h24v33h-24z M317 58l3 3 5-6 M328 59h5 M317 71l3 3 5-6 M328 72h5" />
                  </g>
                  <circle cx="100" cy="65" r="3.5" className={styles.traveler} />
                </> : <>

                <path d="M100 75 H300" className={styles.connection} />
                <path d="M110 75 H290" className={styles.flow} />
                <circle cx="85" cy="75" r="43" className={styles.node} />
                <circle cx="315" cy="75" r="43" className={styles.node} />
                <circle cx="110" cy="75" r="3.5" className={`${styles.traveler} ${stage === "problem" ? styles.searching : ""}`} />
                {stage === "problem" ? <>
                  <g className={styles.glyph}>
                    <path d="M65 51h32v43H65z M71 45h32v43 M73 61h16 M73 69h16 M73 77h10" />
                    <circle cx="315" cy="61" r="9" /><path d="M298 95v-7a17 17 0 0 1 34 0v7" />
                  </g>
                  <circle cx="200" cy="75" r="20" className={styles.question} />
                  <path d="M194 69a6 6 0 0 1 12 0c0 6-6 5-6 11 M200 86v1" className={styles.glyph} />
                </> : stage === "transformation" ? <>
                  <g className={styles.glyph}>
                    <path d="M65 51h36v48H65z M73 62h20 M73 71h20 M73 80h12" />
                    <path d="M293 51h44v48h-44z M300 63l3 3 5-6 M314 64h14 M300 79l3 3 5-6 M314 80h14" />
                  </g>
                  <path d="M192 63l13 12-13 12" className={styles.arrow} />
                </> : <>
                  <g className={styles.glyph}>
                    <path d="M64 56h14 M64 75h14 M64 94h14 M87 54l7 7 11-13 M88 72l14 14 M102 72L88 86 M87 92l7 7 11-13" />
                    <path d="M315 56q-13-8-24-3v40q11-5 24 3 13-8 24-3V53q-11-5-24 3v40 M298 64h10 M322 64h10 M298 73h10 M322 73h10" />
                  </g>
                  <path d="M192 63l13 12-13 12" className={styles.arrow} />
                </>}
                </>}
              </svg>
              <span id="story-visual-label" className={styles.visualLabels}><span>{t(`${stage}.input`)}</span>{stage === "solution" ? <span>{t("solution.middle")}</span> : null}<span>{t(`${stage}.output`)}</span></span>
            </button>
            <button type="button" className={styles.detailToggle} aria-expanded={detailOpen} aria-controls="story-visual-detail" onClick={() => setSelectedDetail((value) => !value)}>
              {t("aboutStep")} <span aria-hidden="true">{detailOpen ? "−" : "+"}</span>
            </button>
            <p id="story-visual-detail" className={styles.detail} data-detail-open={detailOpen} hidden={!detailOpen}>{detail}</p>
          </div>
        </div>
        <nav aria-label={t("destinations")} className={styles.actions}>
          <Link href="/methodology" className={styles.primary}>{t("methodologyLink")} <span aria-hidden="true">→</span></Link>
          <Link id="tracks-heading" href="/certifications" className={styles.secondary}>{t("certificationsLink")} <span aria-hidden="true">→</span></Link>
        </nav>
        <div className={styles.footer}>
          <div className={styles.controls} role="group" aria-label={t("controls")} onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              goTo(index + (event.key === "ArrowLeft" ? -1 : 1));
            }
          }}>
            <button type="button" onClick={() => goTo(index - 1)} aria-label={t("previous")}><span aria-hidden="true">←</span></button>
            <span className={styles.position} aria-label={t("position", { current: index + 1, total: story.length })}>0{index + 1}<span aria-hidden="true"> / </span>{String(story.length).padStart(2, "0")}</span>
            <button type="button" onClick={() => goTo(index + 1)} aria-label={t("next")}><span aria-hidden="true">→</span></button>
            <button type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused} disabled={reducedMotion} aria-describedby="story-timing">{paused ? t("resume") : t("pause")}</button>
          </div>
          <p id="story-timing" className={styles.timing}>{reducedMotion ? t("motionOff") : paused ? t("paused") : hovered || focused ? t("interactionPause") : t("timing")}</p>
          <p className={styles.caption}>{t("illustrative")}</p>
        </div>
        <span className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</span>
      </section>
      {children}
    </div>
  );
}
