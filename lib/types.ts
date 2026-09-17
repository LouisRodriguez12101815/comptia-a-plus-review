export type TopicGroup =
  | "core1"
  | "core2"
  | "networking"
  | "weak"
  | "reference";

export type Block =
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "code"; text: string }
  | { type: "callout"; kind: "critical" | "warning" | "tip"; text: string };

export type Section = {
  id: string;
  title: string;
  weak?: boolean;
  blocks: Block[];
};

export type Topic = {
  id: string;
  group: TopicGroup;
  title: string;
  chapter: string;
  summary: string;
  weak?: boolean;
  sections: Section[];
};

export type Flashcard = {
  id: string;
  topicId: string;
  front: string;
  back: string;
  weak?: boolean;
};

export type Question = {
  id: string;
  topicId: string;
  prompt: string;
  choices: string[];
  answer: number;
  explanation: string;
  weak?: boolean;
};
