import type { Question } from "@/lib/types";

export type N10RemediationMetadata = {
  clusterId: string;
  clusterLabel: string;
  examClue: string;
  memoryRule: string;
  whyWrong: string;
};

type Cluster = {
  label: string;
  questionIds: string[];
};

const clusters: Record<string, Cluster> = {
  "dhcp-lifecycle": {
    label: "DHCP lifecycle and network services",
    questionIds: ["q-n10dhcp-04", "q-n10dhcp-05", "q-n10dhcp-06", "q-n10dhcp-15"],
  },
  "time-synchronization": {
    label: "Network time synchronization",
    questionIds: ["q-n10dhcp-35", "q-n10dhcp-40", "q-n10dhcp-41", "q-n10dhcp-42", "q-n10dhcp-43", "q-n10dhcp-47"],
  },
  "ipam-ddi": {
    label: "IPAM and DDI",
    questionIds: ["q-n10dhcp-31", "q-n10dhcp-32", "q-n10dhcp-33", "q-n10dhcp-34"],
  },
  "ipv6-controls": {
    label: "IPv6 controls",
    questionIds: ["q-n10dhcp-30"],
  },
};

const metadata: Record<string, N10RemediationMetadata> = {
  "q-n10dhcp-04": {
    clusterId: "dhcp-lifecycle",
    clusterLabel: clusters["dhcp-lifecycle"].label,
    examClue: "A DHCP Request broadcast means the client is choosing an offer and notifying the other servers.",
    memoryRule: "DORA: Discover, Offer, Request, Acknowledge.",
    whyWrong: "This is a lease-selection message, not a DNS, routing, or address-encryption decision.",
  },
  "q-n10dhcp-05": {
    clusterId: "dhcp-lifecycle",
    clusterLabel: clusters["dhcp-lifecycle"].label,
    examClue: "T1 means the client is halfway through its lease and first tries the issuing DHCP server.",
    memoryRule: "T1 = 50%: renew with the original server.",
    whyWrong: "The distractor pattern confuses the first unicast renewal with the later rebinding stage.",
  },
  "q-n10dhcp-06": {
    clusterId: "dhcp-lifecycle",
    clusterLabel: clusters["dhcp-lifecycle"].label,
    examClue: "T2 / 87.5% means the client is rebinding and can ask any DHCP server.",
    memoryRule: "T2 = 87.5%: broadcast to any DHCP server.",
    whyWrong: "T2 is not the initial lease request or ordinary T1 renewal; it is the later any-server fallback.",
  },
  "q-n10dhcp-15": {
    clusterId: "dhcp-lifecycle",
    clusterLabel: clusters["dhcp-lifecycle"].label,
    examClue: "Network boot wording points to DHCP options that identify the TFTP server and boot file.",
    memoryRule: "66 = TFTP server; 67 = boot file.",
    whyWrong: "The wrong choices solve ordinary addressing or name resolution, not network-boot provisioning.",
  },
  "q-n10dhcp-35": {
    clusterId: "time-synchronization",
    clusterLabel: clusters["time-synchronization"].label,
    examClue: "A question asking what NTP uses is asking for its transport port, not a DHCP option or DNS record.",
    memoryRule: "NTP = UDP 123.",
    whyWrong: "The selected technology is network-related but does not provide clock synchronization.",
  },
  "q-n10dhcp-40": {
    clusterId: "time-synchronization",
    clusterLabel: clusters["time-synchronization"].label,
    examClue: "Active Directory logon plus clock skew points to Kerberos time tolerance.",
    memoryRule: "Kerberos + clock skew = fix time synchronization.",
    whyWrong: "The scenario is an authentication-ticket timing failure, not a lease, DNS, or encryption failure.",
  },
  "q-n10dhcp-41": {
    clusterId: "time-synchronization",
    clusterLabel: clusters["time-synchronization"].label,
    examClue: "Several NTP sources provide an agreement check so an outlier can be rejected.",
    memoryRule: "Three or more sources let NTP identify an outlier.",
    whyWrong: "Adding a second source alone cannot resolve a disagreement between two clocks.",
  },
  "q-n10dhcp-42": {
    clusterId: "time-synchronization",
    clusterLabel: clusters["time-synchronization"].label,
    examClue: "Sub-microsecond accuracy points to PTP, not ordinary NTP.",
    memoryRule: "PTP = precision timestamps with hardware-assisted clocks.",
    whyWrong: "The selected service does not provide the precision required by the scenario.",
  },
  "q-n10dhcp-43": {
    clusterId: "time-synchronization",
    clusterLabel: clusters["time-synchronization"].label,
    examClue: "PTP port questions point to its event and general-message UDP pair.",
    memoryRule: "PTP = UDP 319 and 320.",
    whyWrong: "The wrong port pair belongs to a different service and cannot carry PTP timing messages.",
  },
  "q-n10dhcp-47": {
    clusterId: "time-synchronization",
    clusterLabel: clusters["time-synchronization"].label,
    examClue: "Log events with different timestamps point to unsynchronized device clocks.",
    memoryRule: "Correlate logs only after synchronizing time with NTP.",
    whyWrong: "The symptom is a timestamp-correlation problem, not a name-resolution or access-control problem.",
  },
  "q-n10dhcp-31": {
    clusterId: "ipam-ddi",
    clusterLabel: clusters["ipam-ddi"].label,
    examClue: "Duplicate-IP tracking or address ownership points to IPAM.",
    memoryRule: "IPAM = authoritative IP address assignments and utilization.",
    whyWrong: "A DHCP lease setting does not provide the historical, centralized address record described here.",
  },
  "q-n10dhcp-32": {
    clusterId: "ipam-ddi",
    clusterLabel: clusters["ipam-ddi"].label,
    examClue: "DDI wording names the combined DNS, DHCP, and IPAM service set.",
    memoryRule: "DDI = DNS + DHCP + IPAM.",
    whyWrong: "The selected service covers only one network function instead of the integrated management set.",
  },
  "q-n10dhcp-33": {
    clusterId: "ipam-ddi",
    clusterLabel: clusters["ipam-ddi"].label,
    examClue: "A centralized view of address assignments and subnet utilization points to IPAM.",
    memoryRule: "IPAM shows who has which address and how much space remains.",
    whyWrong: "The distractors may configure clients, but they do not provide centralized address inventory.",
  },
  "q-n10dhcp-34": {
    clusterId: "ipam-ddi",
    clusterLabel: clusters["ipam-ddi"].label,
    examClue: "A spreadsheet causing duplicate assignments calls for an authoritative IPAM system.",
    memoryRule: "Replace the spreadsheet with IPAM conflict checks and history.",
    whyWrong: "Changing lease timing does not solve the record-keeping and duplicate-assignment problem.",
  },
  "q-n10dhcp-30": {
    clusterId: "ipv6-controls",
    clusterLabel: clusters["ipv6-controls"].label,
    examClue: "Rogue IPv6 router advertisements point directly to RA Guard.",
    memoryRule: "RA Guard = block rogue IPv6 router advertisements.",
    whyWrong: "DNS encryption and DHCP controls do not filter unauthorized IPv6 router advertisements on access ports.",
  },
};

export function n10RemediationForQuestion(questionId: string): N10RemediationMetadata | undefined {
  return metadata[questionId];
}

export function n10ClusterQuestionIds(clusterId: string, questions: Question[], excludeId?: string): string[] {
  const ids = clusters[clusterId]?.questionIds ?? [];
  const known = new Set(questions.map((question) => question.id));
  return ids.filter((id) => id !== excludeId && known.has(id));
}
