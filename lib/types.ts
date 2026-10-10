export type TopicGroup =
  | "core1"
  | "core2"
  | "networking"
  | "weak"
  | "reference";

export type ExamCode = "220-1201" | "220-1202" | "n10-009";
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
  id: string;
  topicId: string;
  examCodes?: ExamCode[];
  prompt: string;
  choices: string[];
  answer: number | number[];
  explanation: string;
  weak?: boolean;
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
