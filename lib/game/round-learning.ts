import type { GuidedIncident } from "@/lib/game/types";

export type RoundLearning = { goal: string; competingExplanation: string; result: string; learned: string };
const dns: RoundLearning[] = [
  { goal: "Distinguish a local client fault from a shared outage.", competingExplanation: "A shared outage should affect the comparison workstation too.", result: "Comparison test: PC2 opens the same site while PC1 fails.", learned: "The scope favors a PC1-specific fault. Inspect its link and configuration before changing shared equipment." },
  { goal: "Choose a low-risk inspection before changing settings.", competingExplanation: "A green link alone does not prove that IP, gateway, or DNS settings are valid.", result: "Configuration inspection: PC1 is 192.168.10.20/24 with gateway 192.168.10.1. Next, compare IP connectivity with hostname lookup.", learned: "Inspect before repairing. Next, separate routed connectivity from name resolution with IP and hostname tests." },
  { goal: "Interpret IP and hostname tests to isolate the failing layer.", competingExplanation: "A routing failure would also prevent the tested server from replying by IP; a lookup failure does not prove HTTP is down.", result: "Gateway and server IP tests reply; the hostname test cannot find the host.", learned: "The tested IP path works while name resolution fails. Compare the client's resolver with the approved DNS service." },
  { goal: "Establish a probable cause from a configuration mismatch.", competingExplanation: "A gateway fault is weaker because the gateway and remote server replied.", result: "PC1 targets 192.168.20.100, but the DNS service is at 192.168.20.10.", learned: "The resolver mismatch explains the name-only failure. Change that setting rather than unrelated network services." },
  { goal: "Choose a targeted repair and verify the original symptom.", competingExplanation: "Editing a setting without repeating the lookup and browser test does not prove recovery.", result: "Lab 03's verification: after correcting DNS, repeat the hostname test and load http://instagram.com.", learned: "Close the ticket with the symptom, resolver mismatch, DNS correction, and repeated-test results. This game selects a verification plan; the Packet Tracer lab executes it." },
];
const relay: RoundLearning[] = [
  { goal: "Explain why a remote DHCP server needs a relay.", competingExplanation: "A client broadcast stays on its LAN; it does not simply cross a router.", result: "The branch relay forwards DHCP traffic toward the DC server as unicast.", learned: "Server location determines the relay requirement. Check reachability before blaming the server's scope." },
  { goal: "Compare the recorded route with the addressing plan.", competingExplanation: "Scope exhaustion is not established by a route aimed at the wrong network.", result: "The recorded route uses 194.168.50.0; the DC network is 192.168.50.0/24.", learned: "The octet mismatch supports a routing cause. Test both the outbound and return paths." },
  { goal: "Choose a test that covers the request and response paths.", competingExplanation: "An outbound Discover alone cannot prove that an Offer can return to the relay.", result: "Check branch-to-server reachability and the DC return route to the relay's LAN.", learned: "A working transaction requires both directions. Correct the proven route fault before retesting DHCP." },
  { goal: "Select the smallest repair supported by the route evidence.", competingExplanation: "Restarting DHCP servers leaves the incorrect static route in place.", result: "The log records the route correction to 192.168.50.0/24 via 10.0.2.2.", learned: "Match the destination and next hop to the addressing plan. A configuration change still needs verification." },
  { goal: "Distinguish a documented repair from a verified lease.", competingExplanation: "The lab marks Miami lease testing in progress; a corrected route is insufficient proof of lease recovery.", result: "Recheck routing and connectivity, then observe the DHCP exchange and record its actual outcome.", learned: "Report the recorded route fix and pending lease test separately. Verification and documentation prevent an unsupported success claim." },
];
export function roundLearning(incident: GuidedIncident, index: number): RoundLearning {
  const step = incident.steps[index];
  return (incident.id === "cant-reach-website-dns" ? dns : incident.id === "dhcp-relay-route" ? relay : [])[index]
    ?? { goal: step.title, competingExplanation: "Compare alternative explanations with the discovered evidence.", result: step.explanation, learned: step.explanation };
}
export function transferQuestion(incidentId: string) {
  return incidentId === "cant-reach-website-dns"
    ? "A second client resolves a hostname but cannot open the site. What would you test next, and why is DNS now a weaker explanation?"
    : "A relay's Discover reaches the server but the client receives no Offer. Which return-path evidence would distinguish routing from scope exhaustion?";
}
