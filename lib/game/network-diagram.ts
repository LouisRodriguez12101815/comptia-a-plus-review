import type { RoomSnapshot, StudySource } from "@/lib/game/room-types";

export type NetworkDiagram = {
  title: string; description: string; path: string;
  nodes: { id: string; label: string; kind: "client" | "switch" | "router" | "server"; details: string[] }[];
  links: string[]; context: string[]; sources: StudySource[];
  annotations: { id: string; label: string; text: string }[];
};

/** Infrastructure from Lab 02/03; fault text comes ONLY from the viewer's revealed cards. */
export function networkDiagramFor(incidentId: string, cards: NonNullable<RoomSnapshot["step"]>["assignedEvidence"], sources: StudySource[]): NetworkDiagram | null {
  const annotations = cards.filter((c) => c.discovered && c.text).map((c) => ({ id: c.id, label: c.label, text: c.text! }));
  if (incidentId === "cant-reach-website-dns") return {
    title: "Lab 03 · Client to server path",
    description: "PC1 connects through SW1, R1 and SW2 to SRV1. PC2 shares SW1. R1 routes between the user and server subnets. Highlighting indicates the path under investigation, not a verified result.",
    path: "PC1 → SW1 → R1 → SW2 → SRV1; test the gateway, then the routed server path and name resolution.",
    nodes: [
      { id: "pc1", label: "PC1", kind: "client", details: ["Fa0 · 192.168.10.20/24", "Gateway 192.168.10.1"] },
      { id: "sw1", label: "SW1 · User LAN", kind: "switch", details: ["192.168.10.0/24", "Fa0/1: PC1 · Fa0/2: PC2", "Gi0/1: R1"] },
      { id: "r1", label: "R1", kind: "router", details: ["Gi0/0 · 192.168.10.1", "Gi0/1 · 192.168.20.1"] },
      { id: "sw2", label: "SW2 · Server LAN", kind: "switch", details: ["192.168.20.0/24", "Gi0/1: R1 · Fa0/1: SRV1"] },
      { id: "srv1", label: "SRV1 · DNS / HTTP", kind: "server", details: ["Fa0 · 192.168.20.10/24", "Gateway 192.168.20.1"] },
    ],
    links: ["PC1 Fa0 ↔ SW1 Fa0/1", "SW1 Gi0/1 ↔ R1 Gi0/0", "R1 Gi0/1 ↔ SW2 Gi0/1", "SW2 Fa0/1 ↔ SRV1 Fa0"],
    context: ["Comparison branch: PC2 Fa0 (192.168.10.21/24; gateway 192.168.10.1) ↔ SW1 Fa0/2.", "Client DNS settings and test outcomes remain private until their assigned cards are discovered."],
    sources: sources.map((s) => s.path === "content/labs.json" ? { ...s, sections: ["quickstart", "setup", "step-2", "step-4", "step-5"] } : s), annotations,
  };
  if (incidentId === "dhcp-relay-route") return {
    title: "Lab 02 · Miami DHCP relay path",
    description: "Miami clients connect through SW-MIA, Router-MIA, the 10.0.2.0/30 WAN link, Router-DC and SW-DC to DHCP-MIA. New York is a separate branch connected to both routers. The highlighted links are an investigation path; discovered cards supply the test results.",
    path: "Miami clients → SW-MIA → Router-MIA → Router-DC → SW-DC → DHCP-MIA; investigate request and return paths.",
    nodes: [
      { id: "clients", label: "Miami clients", kind: "client", details: ["LAN 192.168.0.0/26", "Gateway 192.168.0.1", "Client addresses: verify from evidence"] },
      { id: "sw-mia", label: "SW-MIA", kind: "switch", details: ["Gi0/1 ↔ branch router", "Local client broadcast segment"] },
      { id: "mia", label: "Router-MIA", kind: "router", details: ["Gi0/0/0 · 192.168.0.1", "Gi0/0/2 · 10.0.2.1", "WAN to Router-DC"] },
      { id: "dc", label: "Router-DC", kind: "router", details: ["Gi0/0/1 · 10.0.2.2", "Gi0/0/0 · 192.168.50.1", "WAN 10.0.2.0/30"] },
      { id: "sw-dc", label: "SW-DC", kind: "switch", details: ["Gi0/1 ↔ DC router", "DC LAN 192.168.50.0/24"] },
      { id: "dhcp", label: "DHCP-MIA", kind: "server", details: ["192.168.50.10/24", "Gateway 192.168.50.1", "DHCP service for Miami"] },
    ],
    links: ["Clients ↔ SW-MIA", "SW-MIA Gi0/1 ↔ Router-MIA Gi0/0/0", "Router-MIA Gi0/0/2 ↔ Router-DC Gi0/0/1", "Router-DC Gi0/0/0 ↔ SW-DC Gi0/1", "SW-DC ↔ DHCP-MIA"],
    context: ["Other branch: New York clients → SW-NY Gi0/1 → Router-NY Gi0/0/0 (192.168.0.65); LAN 192.168.0.64/26.", "MIA Gi0/0/1 (10.0.1.1) ↔ NY Gi0/0/1 (10.0.1.2), subnet 10.0.1.0/30.", "NY Gi0/0/2 (10.0.3.1) ↔ DC Gi0/0/2 (10.0.3.2), subnet 10.0.3.0/30.", "DHCP-NY 192.168.50.20 also connects to SW-DC; serves the New York branch.", "Highlighting identifies the investigation path; it does not certify routing or a successful lease."],
    sources: sources.map((s) => s.path === "content/labs.json" ? { ...s, sections: ["scenario", "addressing", "how-it-works", "terminal-commands"] } : s), annotations,
  };
  return null;
}
