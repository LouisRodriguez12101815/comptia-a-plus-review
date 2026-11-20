export type TopicGroup =
  | "core1"
  | "core2"
  | "networking"
  | "weak"
  | "reference"
  | "aws";

export type Concept =
  | "networking-concepts"
  | "implementation"
  | "security"
  | "troubleshooting"
  | "hardware"
  | "operating-systems"
  | "reference"
  | "cloud";

export type ExamCode = "220-1201" | "220-1202" | "n10-009" | "clf-c02" | "saa-c03" | "sy0-701" | "az-900" | "az-104";
export type StudyFocus = ExamCode | "all";

export type Block =
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "code"; text: string }
  | { type: "callout"; kind: "critical" | "warning" | "tip"; text: string }
  | { type: "image"; src: string; alt: string; caption: string };

export type Section = {
  id: string;
  title: string;
  weak?: boolean;
  blocks: Block[];
};

export type Topic = {
  id: string;
  group: TopicGroup;
  concept: Concept;
  examCodes: ExamCode[];
  title: string;
  chapter: string;
  summary: string;
  weak?: boolean;
  sections: Section[];
};

export type Flashcard = {
  id: string;
  topicId: string;
  examCodes?: ExamCode[];
  front: string;
  back: string;
  weak?: boolean;
};

export type Question = {
  /** Explicit primary scored objective per exam; chapter membership is not assessment evidence. */
  objectiveIds?: Partial<Record<ExamCode, string[]>>;
  sourceUrls?: string[];
  id: string;
  topicId: string;
  examCodes?: ExamCode[];
  prompt: string;
  choices: string[];
  answer: number | number[];
  explanation: string;
  weak?: boolean;
  /**
   * Derived from the first objectiveIds["saa-c03"] task at load (1.x→D1 … 4.x→D4).
   * Not a stored field. A stored value that disagrees with the task is rejected.
   */
  domain?: "D1" | "D2" | "D3" | "D4";
  /** Service names found in the item text. This is an index, not the answer key. */
  services?: string[];
  /** Study-navigation label from item shape. Not an AWS difficulty rating. */
  difficulty?: "easy" | "medium" | "hard";
};

export type Lab = {
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  /** Short status badge, e.g. "Part 1 of 2 · in progress". */
  status?: string;
  repoUrl?: string;
  image?: string;
  imageAlt?: string;
  imageCaption?: string;
  /** CSS object-position for the labs list card crop, e.g. "left 15%". */
  imagePosition?: string;
  /** Omit until a .pkt file is published; the download button is hidden without it. */
  pktDownload?: string;
  pktFilename?: string;
  skills: string[];
  relatedTopicIds: string[];
  sections: Section[];
};
