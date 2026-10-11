import { cantReachWebsiteIncident } from "@/lib/game/incidents";
import type { GuidedIncident } from "@/lib/game/types";

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

export const multiplayerIncidents = [cantReachWebsiteIncident, dhcp];
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
};
export function evidenceFor(incident: GuidedIncident, stepIndex: number, seat: number, playerCount: number): string[] {
  const clues = evidence[incident.id]?.[stepIndex] ?? [incident.steps[stepIndex].evidence ?? incident.ticket, incident.steps[stepIndex].prompt];
  // A solo player covers both responsibilities. Teams must communicate their fragments.
  return playerCount === 1 ? clues : [clues[seat % clues.length]];
}
export function learningFor(incident: GuidedIncident) {
  return {
    objectives: ["A+ Core 1: troubleshoot network connectivity and addressing", "A+ Core 2: use a structured troubleshooting process and document changes", "Network+: interpret diagnostic tools and verify network recovery"],
    reviewTopics: incident.id === "missing-dhcp-lease"
      ? ["DHCP leases and APIPA", "Access VLANs and DHCP paths", "Verification and change documentation"]
      : ["DNS configuration and name resolution", "IP connectivity versus hostname tests", "Scope, verification, and documentation"],
  };
}
