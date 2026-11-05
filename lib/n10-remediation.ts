import type { Question } from "@/lib/types";

export type N10RemediationMetadata = {
  clusterId: string;
  clusterKey: string;
  examClueKey: string;
  memoryRuleKey: string;
  whyWrongKey: string;
};

type Cluster = { questionIds: string[] };

const clusters: Record<string, Cluster> = {
  "dhcp-lifecycle": { questionIds: ["q-n10dhcp-04", "q-n10dhcp-05", "q-n10dhcp-06", "q-n10dhcp-15"] },
  "time-synchronization": { questionIds: ["q-n10dhcp-35", "q-n10dhcp-40", "q-n10dhcp-41", "q-n10dhcp-42", "q-n10dhcp-43", "q-n10dhcp-47"] },
  "ipam-ddi": { questionIds: ["q-n10dhcp-31", "q-n10dhcp-32", "q-n10dhcp-33", "q-n10dhcp-34"] },
  "ipv6-controls": { questionIds: ["q-n10dhcp-30"] },
};

const metadata: Record<string, N10RemediationMetadata> = {
  "q-n10dhcp-04": { clusterId: "dhcp-lifecycle", clusterKey: "dhcpLifecycle", examClueKey: "dhcpRequestBroadcast", memoryRuleKey: "dora", whyWrongKey: "dhcpRequestBroadcast" },
  "q-n10dhcp-05": { clusterId: "dhcp-lifecycle", clusterKey: "dhcpLifecycle", examClueKey: "dhcpT1", memoryRuleKey: "dhcpT1", whyWrongKey: "dhcpT1" },
  "q-n10dhcp-06": { clusterId: "dhcp-lifecycle", clusterKey: "dhcpLifecycle", examClueKey: "dhcpT2", memoryRuleKey: "dhcpT2", whyWrongKey: "dhcpT2" },
  "q-n10dhcp-15": { clusterId: "dhcp-lifecycle", clusterKey: "dhcpLifecycle", examClueKey: "dhcpOptions", memoryRuleKey: "dhcpOptions", whyWrongKey: "dhcpOptions" },
  "q-n10dhcp-35": { clusterId: "time-synchronization", clusterKey: "timeSynchronization", examClueKey: "ntpPort", memoryRuleKey: "ntpPort", whyWrongKey: "ntpPort" },
  "q-n10dhcp-40": { clusterId: "time-synchronization", clusterKey: "timeSynchronization", examClueKey: "kerberosClock", memoryRuleKey: "kerberosClock", whyWrongKey: "kerberosClock" },
  "q-n10dhcp-41": { clusterId: "time-synchronization", clusterKey: "timeSynchronization", examClueKey: "ntpSources", memoryRuleKey: "ntpSources", whyWrongKey: "ntpSources" },
  "q-n10dhcp-42": { clusterId: "time-synchronization", clusterKey: "timeSynchronization", examClueKey: "ptpPrecision", memoryRuleKey: "ptpPrecision", whyWrongKey: "ptpPrecision" },
  "q-n10dhcp-43": { clusterId: "time-synchronization", clusterKey: "timeSynchronization", examClueKey: "ptpPorts", memoryRuleKey: "ptpPorts", whyWrongKey: "ptpPorts" },
  "q-n10dhcp-47": { clusterId: "time-synchronization", clusterKey: "timeSynchronization", examClueKey: "logTime", memoryRuleKey: "logTime", whyWrongKey: "logTime" },
  "q-n10dhcp-31": { clusterId: "ipam-ddi", clusterKey: "ipamDdi", examClueKey: "ipamOwnership", memoryRuleKey: "ipamOwnership", whyWrongKey: "ipamOwnership" },
  "q-n10dhcp-32": { clusterId: "ipam-ddi", clusterKey: "ipamDdi", examClueKey: "ddi", memoryRuleKey: "ddi", whyWrongKey: "ddi" },
  "q-n10dhcp-33": { clusterId: "ipam-ddi", clusterKey: "ipamDdi", examClueKey: "ipamView", memoryRuleKey: "ipamView", whyWrongKey: "ipamView" },
  "q-n10dhcp-34": { clusterId: "ipam-ddi", clusterKey: "ipamDdi", examClueKey: "ipamSpreadsheet", memoryRuleKey: "ipamSpreadsheet", whyWrongKey: "ipamSpreadsheet" },
  "q-n10dhcp-30": { clusterId: "ipv6-controls", clusterKey: "ipv6Controls", examClueKey: "raGuard", memoryRuleKey: "raGuard", whyWrongKey: "raGuard" },
};

export function n10RemediationForQuestion(questionId: string): N10RemediationMetadata | undefined {
  return metadata[questionId];
}

export function n10ClusterQuestionIds(clusterId: string, questions: Question[], excludeId?: string): string[] {
  const ids = clusters[clusterId]?.questionIds ?? [];
  const known = new Set(questions.map((question) => question.id));
  return ids.filter((id) => id !== excludeId && known.has(id));
}
