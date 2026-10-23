import type { ReactNode } from "react";
import WorkflowExplorer from "./WorkflowExplorer";
import styles from "./guide.module.css";

export type GuideBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "callout"; title: string; text: string; tone?: "note" | "caution" }
  | { type: "code"; title: string; language: string; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "links"; items: { label: string; url: string }[] };

export type GuideContent = {
  title: string;
  subtitle: string;
  intro: string;
  flow: { id: string; title: string; detail: string; href: string }[];
  sections: { id: string; title: string; summary: string; blocks: GuideBlock[] }[];
  sources: { id: string; title: string; url: string; note: string }[];
};

type GuideBodyProps = {
  guide: GuideContent;
  locale?: string;
  eyebrow?: string;
  title?: string;
  englishNotice?: string;
  navigation?: ReactNode;
};

function ContentBlock({ block, sectionTitle }: { block: GuideBlock; sectionTitle: string }) {
  switch (block.type) {
    case "paragraph":
      return <p className={styles.paragraph}>{block.text}</p>;
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return <List className={block.ordered ? styles.orderedList : styles.list}>
        {block.items.map((item, index) => <li key={index}>{item}</li>)}
      </List>;
    }
    case "callout":
      return <aside className={`${styles.callout} ${block.tone === "caution" ? styles.caution : styles.note}`} aria-label={block.title}>
        <h3>{block.title}</h3>
        <p>{block.text}</p>
      </aside>;
    case "code":
      return <figure className={styles.codeBlock}>
        <figcaption><span>{block.title}</span><span className={styles.language}>{block.language}</span></figcaption>
        <pre tabIndex={0} aria-label={block.title}><code>{block.text}</code></pre>
      </figure>;
    case "table":
      return <div className={styles.tableRegion} role="region" aria-label={`${sectionTitle} comparison`} tabIndex={0}>
        <table>
          <caption className={styles.visuallyHidden}>{sectionTitle} comparison</caption>
          <thead><tr>{block.headers.map((header, index) => <th key={index} scope="col">{header}</th>)}</tr></thead>
          <tbody>{block.rows.map((row, index) => <tr key={index}>{row.map((cell, column) => column === 0
            ? <th key={column} scope="row">{cell}</th>
            : <td key={column}>{cell}</td>)}</tr>)}</tbody>
        </table>
      </div>;
    case "links":
      return <ul className={styles.relatedLinks}>
        {block.items.map((item) => <li key={item.url}><a href={item.url}>{item.label}<span aria-hidden="true"> ↗</span></a></li>)}
      </ul>;
  }
}

/** Server-rendered documentation with a local, simulated workflow explorer. */
export function GuideBody({ guide, locale = "en", eyebrow = "Behind the scenes", title = guide.title, englishNotice, navigation }: GuideBodyProps) {
  return <article className={styles.guide} lang="en" aria-labelledby="assessment-workflow-heading">
    {navigation && <div className={styles.breadcrumb} lang={locale}>{navigation}</div>}
    <header className={styles.hero}>
      <div className={styles.heroTop}><p className={styles.eyebrow} lang={locale}>{eyebrow}</p><span className={styles.guideTag}>Contributor guide</span></div>
      <h1 id="assessment-workflow-heading" lang={locale}>{title}</h1>
      <p className={styles.subtitle}>{guide.subtitle}</p>
      <p className={styles.intro}>{guide.intro}</p>
      {englishNotice && <p className={styles.translationNotice} lang={locale}>{englishNotice}</p>}
      <a className={styles.graphButton} href="#workflow-explorer">Explore the LangGraph<span aria-hidden="true"> ↓</span></a>
    </header>

    <nav className={styles.overview} aria-label="Workflow overview">
      <ol>{guide.flow.map((step, index) => <li key={step.id}>
        <a href={step.href} className={styles.flowCard}>
          <span className={styles.stepNumber}>Step {String(index + 1).padStart(2, "0")}</span>
          <strong>{step.title}</strong>
          <span className={styles.stepDetail}>{step.detail}</span>
          <span className={styles.stepArrow} aria-hidden="true">↓</span>
        </a>
      </li>)}</ol>
    </nav>

    <section id="workflow-explorer" className={styles.explorerSection} aria-labelledby="workflow-explorer-heading">
      <div className={styles.explorerHeading}>
        <div><p className={styles.eyebrow}>See the workflow</p><h2 id="workflow-explorer-heading">Interactive LangGraph</h2></div>
        <a className={styles.explorerLink} href="/guides/assessment-workflow/langgraph.html" target="_blank" rel="noopener noreferrer">Open full-size explorer<span aria-hidden="true"> ↗</span><span className={styles.visuallyHidden}> (new tab)</span></a>
      </div>
      <p className={styles.explorerIntro}>Choose a scenario, advance through the stages, or select a node to inspect its inputs, outputs, and checks.</p>
      <p id="workflow-explorer-note" className={styles.explorerNote}>This is an interactive demonstration of the assessment workflow. It does not run a model, read your repository, or produce coverage scores.</p>
      <WorkflowExplorer />
      <a className={styles.explorerLink} href="#scope">Continue to the guide<span aria-hidden="true"> ↓</span></a>
    </section>

    <div className={styles.readingLayout}>
      <aside className={styles.sidebar}>
        <nav aria-label="On this page" className={styles.contents}>
          <h2>On this page</h2>
          <ol>{guide.sections.map((section, index) => <li key={section.id}><a href={`#${section.id}`}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{section.title}</a></li>)}</ol>
          <a className={styles.sourcesJump} href="#implementation-sources">Sources &amp; implementation<span aria-hidden="true"> ↓</span></a>
        </nav>
        <p className={styles.sidebarNote}>Follow the source, review the teaching, then assess its coverage.</p>
      </aside>

      <div className={styles.readingColumn}>
        {guide.sections.map((section, index) => <section id={section.id} key={section.id} className={styles.section} aria-labelledby={`${section.id}-heading`}>
          <div className={styles.sectionHeading}><span className={styles.sectionNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><h2 id={`${section.id}-heading`}>{section.title}</h2></div>
          <p className={styles.summary}>{section.summary}</p>
          <div className={styles.blocks}>{section.blocks.map((block, blockIndex) => <ContentBlock key={blockIndex} block={block} sectionTitle={section.title} />)}</div>
        </section>)}

        <section id="implementation-sources" className={styles.sourcesSection} aria-labelledby="implementation-sources-heading">
          <p className={styles.eyebrow}>Read the source</p>
          <h2 id="implementation-sources-heading">Sources &amp; implementation</h2>
          <p className={styles.sourcesIntro}>Use the repository for this workflow’s behavior and the official documentation for the services it uses.</p>
          <ul className={styles.sourceList}>{guide.sources.map((source) => <li key={source.id} id={`source-${source.id}`}>
            <a href={source.url}>{source.title}<span aria-hidden="true"> ↗</span></a>
            <p>{source.note}</p>
          </li>)}</ul>
        </section>
        <a href="#assessment-workflow-heading" className={styles.backToTop}>Back to top<span aria-hidden="true"> ↑</span></a>
      </div>
    </div>
  </article>;
}
