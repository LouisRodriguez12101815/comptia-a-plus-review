import type { Question } from "@/lib/types";

export type N10RemediationMetadata = {
  clusterId: string;
  clusterKey: string;
  examClueKey: string;
  memoryRuleKey: string;
  whyWrongKey: string;
};

type Cluster = { questionIds: string[] };

export const n10AddressingGuidanceKeys = new Set([
  "rfc1918Ranges",
  "apipaVsPrivate",
  "rfc1918Boundary",
  "apipaPrefix",
  "privateRouting",
  "eui64BitFlip",
  "ipv4Ipv6Representation",
  "unicastMulticastBroadcast",
  "ipBroadcastVsMacBroadcast",
]);

const clusters: Record<string, Cluster> = {
  "dhcp-lifecycle": { questionIds: ["q-n10dhcp-04", "q-n10dhcp-05", "q-n10dhcp-06", "q-n10dhcp-15"] },
  "time-synchronization": { questionIds: ["q-n10dhcp-35", "q-n10dhcp-40", "q-n10dhcp-41", "q-n10dhcp-42", "q-n10dhcp-43", "q-n10dhcp-47"] },
  "ipam-ddi": { questionIds: ["q-n10dhcp-31", "q-n10dhcp-32", "q-n10dhcp-33", "q-n10dhcp-34"] },
  "ipv6-controls": { questionIds: ["q-n10dhcp-30"] },
  "ipv4-private-link-local": { questionIds: ["q-n10c7-01", "q-n10c7-02", "q-n10c7-04", "q-n10c7-06", "q-n10c7-17", "q-n10c7-18", "q-n10c7-19", "q-n10c7-26", "q-n10c7-34"] },
  "ipv6-eui64": { questionIds: ["q-n10c7-16", "q-n10c7-27", "q-n10c7-32", "q-n10c7-35"] },
  "layer2-delivery": { questionIds: ["q-n10c7-09", "q-n10c7-10", "q-n10c7-22", "q-n10c7-23", "q-n10c7-25", "q-n10c7-28"] },
};

const metadata: Record<string, N10RemediationMetadata> = {
  "q-n10dhcp-04": { clusterId: "dhcp-lifecycle", clusterKey: "dhcpLifecycle", examClueKey: "dhcpRequestBroadcast", memoryRuleKey: "dora", whyWrongKey: "dhcpRequestBroadcast" },
  "q-n10dhcp-05": { clusterId: "dhcp-lifecycle", clusterKey: "dhcpLifecycle", examClueKey: "dhcpT1", memoryRuleKey: "dhcpT1", whyWrongKey: "dhcpT1" },
  "q-n10dhcp-06": { clusterId: "dhcp-lifecycle", clusterKey: "dhcpLifecycle", examClueKey: "dhcpT2", memoryRuleKey: "dhcpT2", whyWrongKey: "dhcpT2" },
  "q-n10dhcp-15": { clusterId: "dhcp-lifecycle", clusterKey: "dhcpLifecycle", examClueKey: "dhcpOptions", memoryRuleKey: "dhcpOptions", whyWrongKey: "dhcpOptions" },
  "q-n10dhcp-35": { clusterId: "time-synchronization", clusterKey: "timeSynchronization", examClueKey: "ntpPort", memoryRuleKey: "ntpPort", whyWrongKey: "ntpPort" },
  "q-n10dhcp-40": { clusterId: "time-synchronization", clusterKey: "timeSynchronization", examClueKey: "kerberosClock", memoryRuleKey: "kerberosClock", whyWrongKey: "kerberosClock" },
  "q-n10dhcp-41": { clusterId: "time-synchronization", clusterKey: "timeSynchronization", examClueKey: "ntpConsensus", memoryRuleKey: "ntpConsensus", whyWrongKey: "ntpConsensus" },
  "q-n10dhcp-42": { clusterId: "time-synchronization", clusterKey: "timeSynchronization", examClueKey: "ptpPrecision", memoryRuleKey: "ptpPrecision", whyWrongKey: "ptpPrecision" },
  "q-n10dhcp-43": { clusterId: "time-synchronization", clusterKey: "timeSynchronization", examClueKey: "ptpPorts", memoryRuleKey: "ptpPorts", whyWrongKey: "ptpPorts" },
  "q-n10dhcp-47": { clusterId: "time-synchronization", clusterKey: "timeSynchronization", examClueKey: "logTime", memoryRuleKey: "logTime", whyWrongKey: "logTime" },
  "q-n10dhcp-31": { clusterId: "ipam-ddi", clusterKey: "ipamDdi", examClueKey: "ipamOwnership", memoryRuleKey: "ipamOwnership", whyWrongKey: "ipamOwnership" },
  "q-n10dhcp-32": { clusterId: "ipam-ddi", clusterKey: "ipamDdi", examClueKey: "ddi", memoryRuleKey: "ddi", whyWrongKey: "ddi" },
  "q-n10dhcp-33": { clusterId: "ipam-ddi", clusterKey: "ipamDdi", examClueKey: "ipamView", memoryRuleKey: "ipamView", whyWrongKey: "ipamView" },
  "q-n10dhcp-34": { clusterId: "ipam-ddi", clusterKey: "ipamDdi", examClueKey: "ipamSpreadsheet", memoryRuleKey: "ipamSpreadsheet", whyWrongKey: "ipamSpreadsheet" },
  "q-n10dhcp-30": { clusterId: "ipv6-controls", clusterKey: "ipv6Controls", examClueKey: "raGuard", memoryRuleKey: "raGuard", whyWrongKey: "raGuard" },
  "q-n10c7-01": { clusterId: "ipv4-private-link-local", clusterKey: "ipv4PrivateLinkLocal", examClueKey: "rfc1918Ranges", memoryRuleKey: "rfc1918Ranges", whyWrongKey: "rfc1918Ranges" },
  "q-n10c7-02": { clusterId: "ipv4-private-link-local", clusterKey: "ipv4PrivateLinkLocal", examClueKey: "apipaVsPrivate", memoryRuleKey: "apipaVsPrivate", whyWrongKey: "apipaVsPrivate" },
  "q-n10c7-04": { clusterId: "ipv4-private-link-local", clusterKey: "ipv4PrivateLinkLocal", examClueKey: "rfc1918Ranges", memoryRuleKey: "rfc1918Ranges", whyWrongKey: "rfc1918Ranges" },
  "q-n10c7-06": { clusterId: "ipv4-private-link-local", clusterKey: "ipv4PrivateLinkLocal", examClueKey: "rfc1918Boundary", memoryRuleKey: "rfc1918Boundary", whyWrongKey: "rfc1918Boundary" },
  "q-n10c7-17": { clusterId: "ipv4-private-link-local", clusterKey: "ipv4PrivateLinkLocal", examClueKey: "rfc1918Boundary", memoryRuleKey: "rfc1918Boundary", whyWrongKey: "rfc1918Boundary" },
  "q-n10c7-18": { clusterId: "ipv4-private-link-local", clusterKey: "ipv4PrivateLinkLocal", examClueKey: "apipaPrefix", memoryRuleKey: "apipaPrefix", whyWrongKey: "apipaPrefix" },
  "q-n10c7-19": { clusterId: "ipv4-private-link-local", clusterKey: "ipv4PrivateLinkLocal", examClueKey: "privateRouting", memoryRuleKey: "privateRouting", whyWrongKey: "privateRouting" },
  "q-n10c7-26": { clusterId: "ipv4-private-link-local", clusterKey: "ipv4PrivateLinkLocal", examClueKey: "apipaVsPrivate", memoryRuleKey: "apipaVsPrivate", whyWrongKey: "apipaVsPrivate" },
  "q-n10c7-34": { clusterId: "ipv4-private-link-local", clusterKey: "ipv4PrivateLinkLocal", examClueKey: "rfc1918Ranges", memoryRuleKey: "rfc1918Ranges", whyWrongKey: "rfc1918Ranges" },
  "q-n10c7-16": { clusterId: "ipv6-eui64", clusterKey: "ipv6Eui64", examClueKey: "eui64BitFlip", memoryRuleKey: "eui64BitFlip", whyWrongKey: "eui64BitFlip" },
  "q-n10c7-27": { clusterId: "ipv6-eui64", clusterKey: "ipv6Eui64", examClueKey: "ipv4Ipv6Representation", memoryRuleKey: "ipv4Ipv6Representation", whyWrongKey: "ipv4Ipv6Representation" },
  "q-n10c7-32": { clusterId: "ipv6-eui64", clusterKey: "ipv6Eui64", examClueKey: "ipv4Ipv6Representation", memoryRuleKey: "ipv4Ipv6Representation", whyWrongKey: "ipv4Ipv6Representation" },
  "q-n10c7-35": { clusterId: "ipv6-eui64", clusterKey: "ipv6Eui64", examClueKey: "eui64BitFlip", memoryRuleKey: "eui64BitFlip", whyWrongKey: "eui64BitFlip" },
  "q-n10c7-09": { clusterId: "layer2-delivery", clusterKey: "layer2Delivery", examClueKey: "unicastMulticastBroadcast", memoryRuleKey: "unicastMulticastBroadcast", whyWrongKey: "unicastMulticastBroadcast" },
  "q-n10c7-10": { clusterId: "layer2-delivery", clusterKey: "layer2Delivery", examClueKey: "unicastMulticastBroadcast", memoryRuleKey: "unicastMulticastBroadcast", whyWrongKey: "unicastMulticastBroadcast" },
  "q-n10c7-22": { clusterId: "layer2-delivery", clusterKey: "layer2Delivery", examClueKey: "ipBroadcastVsMacBroadcast", memoryRuleKey: "ipBroadcastVsMacBroadcast", whyWrongKey: "ipBroadcastVsMacBroadcast" },
  "q-n10c7-23": { clusterId: "layer2-delivery", clusterKey: "layer2Delivery", examClueKey: "ipBroadcastVsMacBroadcast", memoryRuleKey: "ipBroadcastVsMacBroadcast", whyWrongKey: "ipBroadcastVsMacBroadcast" },
  "q-n10c7-25": { clusterId: "layer2-delivery", clusterKey: "layer2Delivery", examClueKey: "unicastMulticastBroadcast", memoryRuleKey: "unicastMulticastBroadcast", whyWrongKey: "unicastMulticastBroadcast" },
  "q-n10c7-28": { clusterId: "layer2-delivery", clusterKey: "layer2Delivery", examClueKey: "unicastMulticastBroadcast", memoryRuleKey: "unicastMulticastBroadcast", whyWrongKey: "unicastMulticastBroadcast" },
};

export function n10RemediationForQuestion(questionId: string): N10RemediationMetadata | undefined {
  return metadata[questionId];
}

export function n10ClusterQuestionIds(clusterId: string, questions: Question[], excludeId?: string): string[] {
  const ids = clusters[clusterId]?.questionIds ?? [];
  const known = new Set(questions.map((question) => question.id));
  return ids.filter((id) => id !== excludeId && known.has(id));
}
