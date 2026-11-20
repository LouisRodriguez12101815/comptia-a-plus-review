import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const locales = ["en", "es", "fr", "pt"];
const required = {
  header: ["capstone"],
  capstonePage: ["metadataTitle", "title", "author", "problemBody", "datasetBody", "analysisBody", "toolsBody", "findingsSummary", "limitsBody"],
  coverageSnapshot: ["caption", "track", "objectives", "questions", "cards", "labs", "estimate", "noMatrix", "noObjectiveEstimate", "trackNotes"],
  homeStory: ["graderPath", "graderInsights", "graderExample", "graderStudy", "graderPractice", "graderReview"],
  methodologyPage: ["currentMethodHeading", "currentMethodBody", "currentMethodRules", "currentMethodWeak", "currentMethodTools", "currentMethodWeights", "weightDomain", "weightValue", "currentMethodInsights", "currentMethodCoverage"],
  insightsPage: ["noObjectiveEstimate", "emptyTrack", "noMatrixTrack", "exploreTitle", "catalogLink", "studyExampleLink", "practiceLink", "reviewLink"],
  capstonePage: ["examplesTitle", "examplesBody", "exampleLinks"],
  coverageDashboard: ["noObjectiveEstimate", "emptyMatrixDetails"],
};

test("capstone, methodology, snapshot, and grader path are complete in every locale", () => {
  for (const locale of locales) {
    const messages = JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), "utf8"));
    for (const [namespace, keys] of Object.entries(required)) {
      for (const key of keys) {
        const value = messages[namespace]?.[key];
        if (typeof value === "object" && value !== null) {
          assert.ok(Object.keys(value).length > 0, `${locale}.${namespace}.${key} must not be empty`);
          assert.ok(Object.values(value).every((item) => typeof item === "string" && item.trim()), `${locale}.${namespace}.${key} values must be translated`);
        } else {
          assert.equal(typeof value, "string", `${locale}.${namespace}.${key}`);
          assert.ok(value.trim().length > 0, `${locale}.${namespace}.${key} must not be empty`);
        }
      }
    }
  }
});

test("capstone reuses project summary and adds only the intended route and accessible snapshot", () => {
  const capstone = readFileSync(new URL("../app/[locale]/capstone/page.tsx", import.meta.url), "utf8");
  const methodology = readFileSync(new URL("../app/[locale]/methodology/page.tsx", import.meta.url), "utf8");
  const project = readFileSync(new URL("../lib/project-insights.ts", import.meta.url), "utf8");
  const snapshot = readFileSync(new URL("../app/components/CoverageSnapshot.tsx", import.meta.url), "utf8");
  const sitemap = readFileSync(new URL("../app/sitemap.ts", import.meta.url), "utf8");
  assert.match(capstone, /getProjectInsights/);
  assert.match(methodology, /getProjectInsights/);
  assert.match(project, /buildCoverageFromContent/);
  assert.match(project, /buildInsightsFromCoverage/);
  assert.doesNotMatch(project, /Progress|telemetry|learner-history|phone/i);
  assert.match(snapshot, /<caption/);
  assert.match(snapshot, /scope="col"/);
  assert.match(snapshot, /scope="row"/);
  assert.match(snapshot, /noObjectiveEstimate/);
  assert.match(methodology, /domain\.weight \/ 100/);
  assert.match(capstone, /content\/track-visuals\.json/);
  for (const locale of locales) {
    const messages = JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), "utf8"));
    assert.match(messages.capstonePage.datasetBody, /calculation|cálculo|calcul|cálculo/iu);
  }
  assert.match(capstone, /lib\/objective-coverage\.mjs/);
  assert.match(capstone, /"\/performance"/);
  assert.match(capstone, /"\/weak-areas"/);
  const insights = readFileSync(new URL("../app/[locale]/insights/page.tsx", import.meta.url), "utf8");
  assert.match(insights, /exam\.total === 0 \? t\("noObjectiveEstimate"\)/);
  assert.match(insights, /track\.weighted! \/ 100/);
  assert.match(sitemap, /"\/capstone"/);
});
