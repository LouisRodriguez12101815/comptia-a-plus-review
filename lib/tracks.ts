import { getFlashcards, getQuestions, getTopics, labs } from "@/lib/content";
import { visualCounts } from "@/lib/visuals";
import type { ExamCode, StudyFocus, Topic } from "@/lib/types";

export type TrackId = "core1" | "core2" | "networking" | "ccna" | "aws-clf" | "aws-saa";
export type ToolId = "notes" | "visuals" | "flashcards" | "quiz" | "labs" | "game";
export type DeviceIconName = "laptop" | "server" | "switch" | "router" | "cloud";

export type Track = {
  id: TrackId;
  /** Hub page for the track. */
  href: string;
  /** Short name for navigation. */
  short: string;
  /** Full name for headings. */
  label: string;
  /** Exam code, shown in the monospace font. */
  code: string;
  /** Exam focus stored in the browser. CCNA has no tagged study material yet. */
  focus: StudyFocus | null;
  description: string;
  icon: DeviceIconName;
};

export const tracks: Track[] = [
  {
    id: "core1",
    href: "/core1",
    short: "Core 1",
    label: "CompTIA A+ Core 1",
    code: "220-1201",
    focus: "220-1201",
    description:
      "Mobile devices, networking, hardware, virtualization, cloud, and hardware troubleshooting.",
    icon: "laptop",
  },
  {
    id: "core2",
    href: "/core2",
    short: "Core 2",
    label: "CompTIA A+ Core 2",
    code: "220-1202",
    focus: "220-1202",
    description:
      "Operating systems, security, software troubleshooting, and operational procedures.",
    icon: "server",
  },
  {
    id: "networking",
    href: "/networking",
    short: "Network+",
    label: "CompTIA Network+",
    code: "N10-009",
    focus: "n10-009",
    description:
      "Networking concepts, implementation, operations, security, and troubleshooting, with interactive visuals for chapters 9 to 11.",
    icon: "switch",
  },
  {
    id: "ccna",
    href: "/ccna",
    short: "CCNA",
    label: "Cisco CCNA",
    code: "200-301",
    focus: null,
    description:
      "Hands-on Packet Tracer labs: subnetting, static routing, DHCP relay, and break/fix troubleshooting.",
    icon: "router",
  },
  {
    id: "aws-clf",
    href: "/aws-clf",
    short: "AWS CLF",
    label: "AWS Certified Cloud Practitioner",
    code: "CLF-C02",
    focus: "clf-c02",
    description:
      "Foundational AWS cloud concepts, security and compliance, services, billing, pricing, and support.",
    icon: "cloud",
  },
  {
    id: "aws-saa",
    href: "/aws-saa",
    short: "AWS SAA",
    label: "AWS Certified Solutions Architect – Associate",
    code: "SAA-C03",
    focus: "saa-c03",
    description:
      "Architecture decisions across security, resiliency, performance, and cost optimization on AWS.",
    icon: "cloud",
  },
];

export const networkingChapters = [
  { id: "ch9", href: "/network-plus/ch9", label: "Chapter 9", title: "Introduction to IP Routing" },
  { id: "ch10", href: "/network-plus/ch10", label: "Chapter 10", title: "Routing Protocols" },
  { id: "ch11", href: "/network-plus/ch11", label: "Chapter 11", title: "Switching and Virtual LANs" },
] as const;

export const toolMeta: {
  id: ToolId;
  label: string;
  blurb: string;
  href: string;
}[] = [
  { id: "notes", label: "Notes", blurb: "Chapter summaries and key terms.", href: "/notes" },
  {
    id: "visuals",
    label: "Visuals",
    blurb: "Interactive diagrams and simulators for each chapter.",
    href: "/visuals",
  },
  {
    id: "flashcards",
    label: "Flashcards",
    blurb: "Flip, then mark known or still learning.",
    href: "/flashcards",
  },
  {
    id: "quiz",
    label: "Quizzes",
    blurb: "Original practice questions with explanations.",
    href: "/quiz",
  },
  {
    id: "labs",
    label: "Labs",
    blurb: "Packet Tracer builds with topology and configs.",
    href: "/labs",
  },
  {
    id: "game",
    label: "Practice Games",
    blurb: "Component matching, packet journeys, and Outage Ops troubleshooting.",
    href: "/practice-games",
  },
];

export type ChipText = {
  key:
    | "chapters"
    | "visuals"
    | "cards"
    | "questions"
    | "labs"
    | "comingSoon"
    | "inCcnaTrack"
    | "allTracks";
  count?: number;
};

export type ToolStatus = {
  id: ToolId;
  label: string;
  blurb: string;
  href: string;
  /** ready: has content here. soon: nothing yet. shared: same for every track. elsewhere: lives in another track. */
  state: "ready" | "soon" | "shared" | "elsewhere";
  /** Status chip text next to its icon. The UI translates the key and fills in the count. */
  chip: ChipText;
  /** Exam focus to store when the tool opens. */
  focus: StudyFocus | null;
  /** A tool marked "soon" is normally not a link. This keeps it one, because its page explains what is coming. */
  openable: boolean;
};

export function getTrack(id: TrackId): Track {
  const track = tracks.find((item) => item.id === id);
  if (!track) throw new Error(`Unknown track: ${id}`);
  return track;
}

export function trackForFocus(focus: StudyFocus): Track | undefined {
  return tracks.find((track) => track.focus === focus);
}

const hubPaths = tracks.map((track) => track.href);

export function isHubPath(pathname: string): boolean {
  return hubPaths.includes(pathname.replace(/\/$/, ""));
}

/** Which track a page belongs to, using the URL first and the saved exam focus second. */
export function trackForPath(pathname: string, focus: StudyFocus): Track | undefined {
  const direct = tracks.find(
    (track) => pathname === track.href || pathname.startsWith(`${track.href}/`),
  );
  if (direct) return direct;
  if (pathname.startsWith("/practice-games/component-match")) return getTrack("core1");
  if (pathname.startsWith("/practice-games/subnet-architect")) return getTrack("networking");
  if (pathname.startsWith("/subnet-sources")) return getTrack("networking");
  if (pathname.startsWith("/practice-games/next-hop-mission")) return getTrack("networking");
  if (pathname.startsWith("/practice-games/follow-packet")) return getTrack("networking");
  if (pathname.startsWith("/network-plus")) return getTrack("networking");
  if (pathname.startsWith("/labs")) return getTrack("ccna");
  if (["/notes", "/flashcards", "/quiz", "/game", "/practice-games"].some((p) => pathname.startsWith(p))) {
    return trackForFocus(focus);
  }
  return undefined;
}

export function trackCounts(track: Track) {
  const focus = track.focus;
  const topicIds = new Set(focus ? getTopics(focus).map((topic) => topic.id) : []);
  const awsLabCount = track.id.startsWith("aws-")
    ? labs.filter((lab) => lab.relatedTopicIds.some((id) => topicIds.has(id))).length
    : 0;
  return {
    topics: focus ? getTopics(focus).length : 0,
    cards: focus ? getFlashcards("all", focus).length : 0,
    questions: focus ? getQuestions("all", focus).length : 0,
    labs: track.id === "ccna" ? labs.length : awsLabCount,
  };
}

export function toolStatuses(track: Track): ToolStatus[] {
  const counts = trackCounts(track);
  return toolMeta.map((tool): ToolStatus => {
    const base = {
      id: tool.id,
      label: tool.label,
      blurb: tool.blurb,
      href: tool.href,
      focus: track.focus,
      openable: false,
    };
    switch (tool.id) {
      case "notes":
        return counts.topics > 0
          ? { ...base, state: "ready", chip: { key: "chapters", count: counts.topics } }
          : { ...base, state: "soon", chip: { key: "comingSoon" } };
      case "visuals": {
        const visuals = visualCounts(track.focus);
        const href = `${track.href}/visuals`;
        return visuals.visuals > 0
          ? { ...base, href, openable: true, state: "ready", chip: { key: "visuals", count: visuals.visuals } }
          : { ...base, href, openable: true, state: "soon", chip: { key: "comingSoon" } };
      }
      case "flashcards":
        return counts.cards > 0
          ? { ...base, state: "ready", chip: { key: "cards", count: counts.cards } }
          : { ...base, state: "soon", chip: { key: "comingSoon" } };
      case "quiz":
        return counts.questions > 0
          ? { ...base, state: "ready", chip: { key: "questions", count: counts.questions } }
          : { ...base, state: "soon", chip: { key: "comingSoon" } };
      case "labs":
        if (track.id === "ccna") {
          return { ...base, state: "ready", chip: { key: "labs", count: counts.labs } };
        }
        if (track.id.startsWith("aws-") && counts.labs > 0) {
          return { ...base, href: "/labs", state: "ready", chip: { key: "labs", count: counts.labs } };
        }
        return {
          ...base,
          href: "/ccna",
          focus: null,
          state: "elsewhere",
          chip: { key: "inCcnaTrack" },
        };
      case "game":
        return { ...base, state: "shared", chip: { key: "allTracks" } };
    }
  });
}

/**
 * Splits a track's chapters into the ones that belong to it alone and the ones it
 * shares with other tracks (for example DNS and DHCP appear in both Core 1 and
 * Network+). Shared chapters stay visible but are labeled, so nothing is hidden.
 */
export function splitTopics(track: Track): {
  own: Topic[];
  shared: { topic: Topic; alsoIn: string[] }[];
} {
  if (!track.focus) return { own: [], shared: [] };
  const own: Topic[] = [];
  const shared: { topic: Topic; alsoIn: string[] }[] = [];
  for (const topic of getTopics(track.focus)) {
    const others = topic.examCodes.filter((code: ExamCode) => code !== track.focus);
    if (others.length === 0) {
      own.push(topic);
    } else {
      const alsoIn = others.map(
        (code) => tracks.find((item) => item.focus === code)?.short ?? code,
      );
      shared.push({ topic, alsoIn });
    }
  }
  return { own, shared };
}
