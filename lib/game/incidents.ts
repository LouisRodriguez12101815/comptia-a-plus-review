import type { GuidedIncident } from "@/lib/game/types";

export const cantReachWebsiteIncident: GuidedIncident = {
  id: "cant-reach-website-dns",
  title: "The website that vanished",
  ticket:
    "PC1 cannot open instagram.com, but a coworker at PC2 can. The user says the network icon looks normal.",
  objective:
    "Work from scope to verification. Prove each layer before changing a setting.",
  steps: [
    {
      phase: "investigate",
      eyebrow: "Step 1 · Scope",
      title: "Find the blast radius",
      prompt: "What should you do first?",
      choices: [
        { id: "scope", label: "Test the site from a second workstation" },
        { id: "router", label: "Reboot the router immediately" },
        { id: "server", label: "Replace the web server" },
        { id: "cable", label: "Replace every cable on the floor" },
      ],
      correctChoiceId: "scope",
      hint: "Before touching equipment, determine whether this is one user or everyone.",
      explanation:
        "PC2 reaches the site, so the shared router, switch path, and server are probably healthy. The fault is likely local to PC1.",
    },
    {
      phase: "investigate",
      eyebrow: "Step 2 · Link and addressing",
      title: "Check the local foundation",
      prompt: "Which check gives the best next evidence?",
      evidence: "PC1 link light: green",
      choices: [
        { id: "ipconfig", label: "Run ipconfig /all on PC1" },
        { id: "format", label: "Reinstall the operating system" },
        { id: "dns-flush", label: "Flush DNS before inspecting anything" },
        { id: "switch", label: "Factory-reset the switch" },
      ],
      correctChoiceId: "ipconfig",
      hint: "Confirm the address, mask, gateway, and DNS server before testing beyond the PC.",
      explanation:
        "The local link is up. ipconfig /all shows whether PC1 has valid Layer 3 settings and where it sends DNS queries.",
    },
    {
      phase: "interpret",
      eyebrow: "Step 3 · Interpret",
      title: "Read the test results",
      prompt: "What do these results prove?",
      evidence:
        "ping 192.168.10.1: replies\nping 192.168.20.10: replies\nping instagram.com: could not find host",
      choices: [
        { id: "dns", label: "The IP path works, but name resolution fails" },
        { id: "routing", label: "The router has no path to the server" },
        { id: "link", label: "PC1 has a physical link failure" },
        { id: "http", label: "The HTTP service is definitely disabled" },
      ],
      correctChoiceId: "dns",
      hint: "Compare what succeeds by IP address with what fails by hostname.",
      explanation:
        "The gateway and server answer by IP, proving the local link and routed path. Only the name fails, which isolates the problem to DNS.",
    },
    {
      phase: "diagnose",
      eyebrow: "Step 4 · Diagnose",
      title: "Identify the root cause",
      prompt: "Which setting is responsible?",
      evidence:
        "PC1 DNS server: 192.168.20.100\nKnown DNS server: 192.168.20.10",
      choices: [
        { id: "wrong-dns", label: "PC1 points to a nonexistent DNS server" },
        { id: "wrong-mask", label: "PC1 uses the wrong subnet mask" },
        { id: "bad-gateway", label: "The default gateway is offline" },
        { id: "bad-web", label: "The website needs a new certificate" },
      ],
      correctChoiceId: "wrong-dns",
      hint: "One address differs by a single zero, and nothing answers there.",
      explanation:
        "PC1 sends DNS requests to 192.168.20.100, which does not host DNS. The valid server is 192.168.20.10.",
    },
    {
      phase: "repair",
      eyebrow: "Step 5 · Repair and verify",
      title: "Close the ticket correctly",
      prompt: "Which action fixes and proves the repair?",
      choices: [
        {
          id: "fix-verify",
          label: "Set DNS to 192.168.20.10, repeat the name test, then open the site",
        },
        { id: "fix-close", label: "Set DNS to 192.168.20.10 and close the ticket" },
        { id: "public-dns", label: "Use an unapproved public DNS server" },
        { id: "reboot", label: "Reboot PC1 and assume the issue is fixed" },
      ],
      correctChoiceId: "fix-verify",
      hint: "A repair is not complete until you repeat the exact test that failed.",
      explanation:
        "Correct the DNS server, repeat the hostname test, and load the website. Verification turns a likely fix into a proven resolution.",
    },
  ],
  debrief: [
    "Scope the issue before changing anything.",
    "Verify link and IP configuration before moving up the stack.",
    "If IP succeeds but a hostname fails, investigate DNS.",
    "Change one setting, then repeat the failed test to prove the fix.",
  ],
};
