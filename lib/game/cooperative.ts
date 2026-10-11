import { cantReachWebsiteIncident } from "@/lib/game/incidents";
import type { GuidedIncident } from "@/lib/game/types";
import type { StudySource } from "@/lib/game/room-types";
import labs from "../../content/labs.json" with { type: "json" };
import topics from "../../content/topics.json" with { type: "json" };

export const roles = [
  { id: "coordinator", name: "Incident coordinator", responsibility: "Establish scope and combine the team's findings.", actionId: "compare-scope", action: "Compare the affected and working users" },
  { id: "network", name: "Network technician", responsibility: "Check addressing, connectivity, and the network path.", actionId: "check-path", action: "Check the link and addressing against the evidence" },
  { id: "analyst", name: "Evidence analyst", responsibility: "Interpret test results and challenge unsupported diagnoses.", actionId: "correlate-tests", action: "Correlate the test results with the team" },
  { id: "verifier", name: "Recovery verifier", responsibility: "Plan a safe change and repeat the original failed test.", actionId: "plan-verification", action: "Record the original test to repeat after repair" },
  { id: "endpoint", name: "Endpoint specialist", responsibility: "Compare the affected client's settings with the working baseline.", actionId: "compare-client", action: "Compare the client settings with the working baseline" },
  { id: "change", name: "Change steward", responsibility: "Limit changes to the proven fault and prepare a rollback.", actionId: "prepare-rollback", action: "Check the approved change and rollback plan" },
  { id: "scribe", name: "Incident scribe", responsibility: "Record the evidence, diagnostic sequence, and repair verification.", actionId: "record-evidence", action: "Record the team's evidence in the incident timeline" },
  { id: "liaison", name: "User liaison", responsibility: "Confirm the user's symptoms and define what restored service means.", actionId: "confirm-symptom", action: "Confirm the original symptom and recovery criteria" },
] as const;
export type RoleId = typeof roles[number]["id"];
export type Contributions = { evidence: number; answers: number; actions: number; resolution: number };
export const emptyContributions = (): Contributions => ({ evidence: 0, answers: 0, actions: 0, resolution: 0 });
export const roleFor = (seat: number, incidentIndex: number) => roles[(seat + incidentIndex) % roles.length];
export const HINT_PENALTY = 25;

const dhcp: GuidedIncident = {
  id: "missing-dhcp-lease", title: "The lease that never arrived",
  ticket: "A newly moved workstation cannot reach the intranet. Existing users on that floor still work.",
  objective: "Identify an APIPA address, compare VLAN evidence, restore DHCP access, and verify the lease.",
  steps: [
    { phase: "investigate", title: "Scope the move", prompt: "What should the team establish first?", choices: [
      { id: "compare", label: "Compare the moved workstation with a working user", explanation: "A controlled comparison isolates what changed without disrupting working users." },
      { id: "restart", label: "Restart every floor switch", explanation: "Restarting shared equipment adds disruption before establishing scope." },
    ], correctAnswerId: "compare", hint: "Focus on what changed and who is affected.", explanation: "Only the moved workstation is affected." },
    { phase: "investigate", title: "Inspect the lease", prompt: "What does the workstation's address indicate?", choices: [
      { id: "apipa", label: "DHCP failed and Windows assigned an APIPA address", explanation: "169.254.0.0/16 is link-local fallback addressing, not the expected DHCP lease." },
      { id: "dns", label: "The address proves a DNS-only failure", explanation: "A link-local address and missing gateway indicate addressing failure before DNS." },
    ], correctAnswerId: "apipa", hint: "Compare the address with the expected subnet.", explanation: "The workstation did not receive the intended DHCP lease." },
    { phase: "interpret", title: "Trace the access path", prompt: "Which finding best explains the failed lease?", choices: [
      { id: "vlan", label: "The moved port belongs to the wrong access VLAN", explanation: "VLAN 99 isolates the client from the intended VLAN 10 DHCP path." },
      { id: "server", label: "All DHCP scopes are exhausted", explanation: "Other VLAN 10 clients receive leases and the scope has free addresses." },
    ], correctAnswerId: "vlan", hint: "Combine the port configuration with the working client's VLAN.", explanation: "The moved workstation's port is in VLAN 99 rather than VLAN 10." },
    { phase: "repair", title: "Restore the intended segment", prompt: "Which change is justified by the evidence?", choices: [
      { id: "restore", label: "Restore the approved VLAN 10 port configuration and renew the lease", explanation: "Correcting the observed VLAN mismatch restores the intended DHCP path." },
      { id: "static", label: "Assign an arbitrary static address and disable DHCP", explanation: "An arbitrary static address can conflict and leaves the VLAN cause unresolved." },
    ], correctAnswerId: "restore", hint: "Repair the proven mismatch rather than masking it.", explanation: "Apply the approved VLAN configuration, then request a fresh lease." },
    { phase: "verify", title: "Prove recovery", prompt: "What closes this incident safely?", choices: [
      { id: "verify", label: "Confirm the lease, gateway, intranet access, and document the change", explanation: "Checking the lease and original symptom proves recovery; documentation preserves the fix." },
      { id: "close", label: "Close the incident because the link light is green", explanation: "A physical link does not prove successful addressing or application access." },
    ], correctAnswerId: "verify", hint: "Repeat the original symptom and verify the new configuration.", explanation: "Successful lease, gateway, and intranet checks demonstrate recovery." },
  ].map((step, index) => ({ ...step, eyebrow: `Step ${index + 1}` })) as GuidedIncident["steps"],
  debrief: ["APIPA signals a missing lease.", "Use working-client comparisons to trace VLAN and DHCP paths.", "Verify the original symptom and document the approved change."],
};

// Retained only for rooms already running the previous campaign at deployment.
export const legacyDhcpIncident = dhcp;
const relay: GuidedIncident = {
  id: "dhcp-relay-route", title: "Miami cannot reach its DHCP server",
  ticket: "Lab 02 reports that Miami cannot reach the DHCP server's subnet. Inspect the recorded routing fault before changing shared services.",
  objective: "Explain DHCP relay, diagnose the lab's static-route typo, and verify the network path before testing leases.",
  steps: [
    { phase: "investigate", title: "Establish the relay path", prompt: "Why does Miami need a DHCP relay?", choices: [
      { id: "relay", label: "The DHCP server is in the data center; the router relays the broadcast as unicast", explanation: "Lab 02 places Miami's server at 192.168.50.10. Routers do not forward the client's DHCP broadcast; ip helper-address relays it." },
      { id: "dns", label: "DNS automatically forwards DHCP broadcasts between sites", explanation: "DNS resolves names. The branch router's DHCP relay forwards these requests." },
    ], correctAnswerId: "relay", hint: "Compare the client LAN and the server location.", explanation: "Miami needs relay to reach the remote DHCP server." },
    { phase: "investigate", title: "Read the routing evidence", prompt: "What is the documented mismatch?", choices: [
      { id: "typo", label: "The static route uses 194.168.50.0 instead of the DC subnet 192.168.50.0", explanation: "The Lab 02 troubleshooting log records this exact octet typo as the root cause of Miami's unreachable server subnet." },
      { id: "scope", label: "The evidence proves that every DHCP scope is exhausted", explanation: "The log identifies an incorrect network in the static route; it does not establish scope exhaustion." },
    ], correctAnswerId: "typo", hint: "Read each octet of the route and the addressing plan.", explanation: "The route points to the wrong network." },
    { phase: "interpret", title: "Explain the lease path", prompt: "What must work for a relayed lease to complete?", choices: [
      { id: "both", label: "Routing from the branch to the server and a return route back to the relay", explanation: "Lab 02 warns that Discover can arrive while Offer is lost if the server's side has no return route." },
      { id: "one", label: "Only the outbound Discover path; the Offer needs no route", explanation: "The DHCP exchange must return through the relay to the client." },
    ], correctAnswerId: "both", hint: "A request and its response travel in opposite directions.", explanation: "Check routing in both directions before blaming DHCP." },
    { phase: "repair", title: "Correct the documented fault", prompt: "Which repair matches the Lab 02 troubleshooting log?", choices: [
      { id: "route", label: "Remove the incorrect route and add ip route 192.168.50.0 255.255.255.0 10.0.2.2", explanation: "This is the log's recorded Miami repair: the correct DC network and the MIA–DC next hop." },
      { id: "restart", label: "Restart all DHCP servers before correcting the route", explanation: "A server restart does not correct the documented static-route typo." },
    ], correctAnswerId: "route", hint: "Match the addressing plan and the logged correction.", explanation: "Correct the proven routing error rather than changing unrelated services." },
    { phase: "verify", title: "Verify without overclaiming", prompt: "How should the team report the result?", choices: [
      { id: "verify", label: "Verify the corrected route and connectivity, then test the relay lease and document the actual result", explanation: "The lab labels Miami's lease test in progress. A route correction alone does not prove a lease; verify the exchange before reporting success." },
      { id: "claim", label: "Declare all leases successful because the route was edited", explanation: "The source does not establish completed Miami lease testing. Verify and record results instead of assuming them." },
    ], correctAnswerId: "verify", hint: "Separate the recorded repair from the lease test still in progress.", explanation: "Verify, document, and distinguish proven recovery from pending tests." },
  ].map((step, index) => ({ ...step, eyebrow: `Step ${index + 1}` })) as GuidedIncident["steps"],
  debrief: ["A remote DHCP server requires a relay.", "Read network octets carefully and verify both routing directions.", "The source lab's Miami lease test remains in progress; do not claim an unperformed test passed."],
};
export const multiplayerIncidents = [cantReachWebsiteIncident, relay];
const evidence: Record<string, string[][]> = {
  "cant-reach-website-dns": [
    ["PC1 cannot open instagram.com; the user reports no other change.", "PC2 opens instagram.com successfully on the same floor."],
    ["PC1's link light is green and the NIC reports connected.", "No IP configuration has been recorded yet; compare address, mask, gateway, and DNS."],
    ["ping 192.168.10.1: replies; ping 192.168.20.10: replies", "ping instagram.com: could not find host"],
    ["PC1 DNS server: 192.168.20.100", "Approved DNS server: 192.168.20.10; no DNS service exists at .100."],
    ["Approved repair: DNS 192.168.20.10; change only the proven mismatch.", "Original failed tests: resolve instagram.com and open the website; repeat both."],
  ],
  "missing-dhcp-lease": [
    ["The workstation was moved to a different switch port this morning.", "Existing users on the floor still reach the intranet."],
    ["Moved PC: 169.254.18.24/16, no default gateway.", "Working PC: DHCP lease 192.168.10.42/24, gateway 192.168.10.1."],
    ["Moved port: access VLAN 99; working client: access VLAN 10.", "VLAN 10 receives new leases; the DHCP scope still has free addresses."],
    ["The approved desktop port template specifies access VLAN 10.", "After restoring the port configuration, release and renew the workstation's DHCP lease."],
    ["New lease: 192.168.10.57/24; gateway 192.168.10.1 replies.", "The intranet now opens. Record the VLAN correction and verification results."],
  ],
  "dhcp-relay-route": [
    ["Lab 02: Miami LAN 192.168.0.0/26; gateway 192.168.0.1.", "Miami DHCP server is in the DC LAN at 192.168.50.10; the branch router uses ip helper-address."],
    ["Troubleshooting log: Miami static route was typed as 194.168.50.0.", "Addressing plan: DC LAN is 192.168.50.0/24; Miami could not reach the DHCP server's subnet."],
    ["The relay sends Discover as unicast to the helper address with its LAN address in giaddr.", "Lab warning: Discover may arrive but Offer is lost without a return route."],
    ["The documented fix removes the incorrect route and uses network 192.168.50.0, mask 255.255.255.0.", "MIA–DC link: 10.0.2.0/30; DC next hop 10.0.2.2. Logged command: ip route 192.168.50.0 255.255.255.0 10.0.2.2."],
    ["The lab method is identify, theorize, test, fix, verify, and document; check the route and reachability again.", "Source status: Miami lease test in progress. Test the DHCP exchange before claiming a successful lease."],
  ],
};
const evidenceLabels: Record<string, string[][]> = {
  "cant-reach-website-dns": [
    ["Reported symptom", "Working-client comparison"],
    ["Physical link status", "IP configuration checklist"],
    ["IP connectivity tests", "Hostname test"],
    ["Client DNS setting", "Approved DNS baseline"],
    ["Targeted repair", "Original tests to repeat"],
  ],
  "dhcp-relay-route": [
    ["Branch addressing", "Server location and relay"],
    ["Recorded static route", "DC addressing plan"],
    ["Outbound relay path", "Return-path requirement"],
    ["Correct destination network", "Next hop and repair command"],
    ["Verification method", "Lease test status"],
  ],
};
export function evidenceItemsFor(incident: GuidedIncident, stepIndex: number) {
  const step = incident.steps[stepIndex];
  if (!step) return [];
  const clues = evidence[incident.id]?.[stepIndex] ?? (step.evidence ? [step.evidence] : []);
  return clues.map((text, index) => ({ id: `${incident.id}:${stepIndex}:${index}`, label: evidenceLabels[incident.id]?.[stepIndex]?.[index] ?? `Evidence ${index + 1}`, text })).filter((item) => item.text.trim().length > 0);
}
export function evidenceFor(incident: GuidedIncident, stepIndex: number, seat: number, playerCount: number): string[] {
  const clues = evidenceItemsFor(incident, stepIndex).map((i) => i.text);
  // A solo player covers both responsibilities. Teams must communicate their fragments.
  return playerCount === 1 || !clues.length ? clues : [clues[seat % clues.length]];
}
export function learningFor(incident: GuidedIncident) {
  const labSlug = incident.id === "cant-reach-website-dns" ? "cant-reach-website" : "dhcp-relay-three-site";
  const lab = labs.find((l) => l.slug === labSlug)!;
  const note = topics.find((t) => t.id === "networking-dns-dhcp")!;
  const sources: StudySource[] = [
    { path: "content/topics.json", href: `/notes/${note.id}`, title: note.title, sections: [incident.id === "cant-reach-website-dns" ? "dns" : "dhcp"] },
    ...(incident.id === legacyDhcpIncident.id
      ? [{ path: "content/network-plus/ch11.json", href: "/network-plus/ch11", title: "Network+ Chapter 11: VLANs", sections: ["ch11-vlan-broadcast-domains.html", "ch11-static-dynamic-vlans.html"] }]
      : [{ path: "content/labs.json", href: `/labs/${lab.slug}`, title: lab.title,
        sections: incident.id === "cant-reach-website-dns" ? ["method", "step-1", "step-2", "step-3", "step-4", "step-5", "step-6"] : ["addressing", "how-it-works", "troubleshooting"] }]),
  ];
  return {
    sources,
    objectives: ["A+ Core 1: troubleshoot network connectivity and addressing", "A+ Core 2: use a structured troubleshooting process and document changes", "Network+: interpret diagnostic tools and verify network recovery"],
    reviewTopics: incident.id === "dhcp-relay-route"
      ? ["DHCP relay and giaddr", "Static route network and next-hop validation", "Bidirectional routing and verified lease testing"]
      : incident.id === "missing-dhcp-lease"
      ? ["DHCP leases and APIPA", "Access VLANs and DHCP paths", "Verification and change documentation"]
      : ["DNS configuration and name resolution", "IP connectivity versus hostname tests", "Scope, verification, and documentation"],
  };
}
