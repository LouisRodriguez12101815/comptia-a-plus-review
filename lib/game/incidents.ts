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
        { id: "scope", explanation: "Checking another workstation establishes whether the failure affects one user or the shared network.", label: "Test the site from a second workstation" },
        { id: "router", explanation: "Rebooting shared equipment before scoping the fault can disrupt working users without identifying the cause.", label: "Reboot the router immediately" },
        { id: "server", explanation: "A working workstation already reaches the site, so replacing the shared web server is not supported by the evidence.", label: "Replace the web server" },
        { id: "cable", explanation: "Replacing every cable changes many things at once before you know which workstation is affected.", label: "Replace every cable on the floor" },
      ],
      correctAnswerId: "scope",
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
        { id: "ipconfig", explanation: "Inspecting the IP configuration reveals the address, subnet mask, gateway, and DNS server before you change anything.", label: "Run ipconfig /all on PC1" },
        { id: "format", explanation: "Reinstalling the OS is disruptive and does not first test the local network configuration.", label: "Reinstall the operating system" },
        { id: "dns-flush", explanation: "Flushing cached records will not correct a wrong DNS server address, and you have not inspected that setting yet.", label: "Flush DNS before inspecting anything" },
        { id: "switch", explanation: "The link is up and another workstation works, so resetting the shared switch is premature.", label: "Factory-reset the switch" },
      ],
      correctAnswerId: "ipconfig",
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
        { id: "dns", explanation: "Successful IP pings with a failed hostname lookup isolate name resolution as the failing layer.", label: "The IP path works, but name resolution fails" },
        { id: "routing", explanation: "The server replies across the router by IP, demonstrating that the tested route works.", label: "The router has no path to the server" },
        { id: "link", explanation: "Successful gateway and server pings require a working physical link; the hostname-only failure points elsewhere.", label: "PC1 has a physical link failure" },
        { id: "http", explanation: "A failed hostname lookup happens before contacting the HTTP service and does not prove that service is disabled.", label: "The HTTP service is definitely disabled" },
      ],
      correctAnswerId: "dns",
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
        { id: "wrong-dns", explanation: "The configured DNS address differs from the known working server, so PC1 sends name queries to the wrong destination.", label: "PC1 points to a nonexistent DNS server" },
        { id: "wrong-mask", explanation: "The successful gateway and remote-server tests do not support a subnet-mask fault; the visible mismatch is DNS.", label: "PC1 uses the wrong subnet mask" },
        { id: "bad-gateway", explanation: "The gateway replies to ping and forwards traffic to the server, so it is not offline.", label: "The default gateway is offline" },
        { id: "bad-web", explanation: "A certificate is checked after locating and contacting a site; it cannot explain failure to resolve the hostname.", label: "The website needs a new certificate" },
      ],
      correctAnswerId: "wrong-dns",
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
          id: "fix-verify", explanation: "Correcting the DNS address and repeating both the lookup and website test confirms that the original symptom is resolved.",
          label: "Set DNS to 192.168.20.10, repeat the name test, then open the site",
        },
        { id: "fix-close", explanation: "Changing the setting without repeating the failed test leaves the repair unverified.", label: "Set DNS to 192.168.20.10 and close the ticket" },
        { id: "public-dns", explanation: "An unapproved public resolver may not resolve internal records and bypasses the known DNS configuration.", label: "Use an unapproved public DNS server" },
        { id: "reboot", explanation: "A reboot does not fix the configured DNS server address or prove that the original symptom is resolved.", label: "Reboot PC1 and assume the issue is fixed" },
      ],
      correctAnswerId: "fix-verify",
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
