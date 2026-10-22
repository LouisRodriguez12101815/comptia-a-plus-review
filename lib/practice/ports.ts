// A+ Core 1 (220-1201) objective 2.1: TCP and UDP ports, protocols and their purposes.
export type PortEntry = {
  id: string;
  port: string;
  protocol: string;
  transport: "TCP" | "UDP" | "TCP/UDP";
  /** Short purpose, kept in English like the protocol names themselves. */
  purpose: string;
  /** Distractor-free hint shown after an answer. */
  hook: string;
};

export const corePorts: PortEntry[] = [
  { id: "ftp", port: "20/21", protocol: "FTP", transport: "TCP", purpose: "File transfer (20 data, 21 control)", hook: "FTP is the only one with two ports in the 20s: 20 moves data, 21 is control." },
  { id: "ssh", port: "22", protocol: "SSH", transport: "TCP", purpose: "Encrypted remote command line (also SFTP)", hook: "22 is Telnet's secure replacement, sitting one below it." },
  { id: "telnet", port: "23", protocol: "Telnet", transport: "TCP", purpose: "Unencrypted remote command line", hook: "23 is plaintext; SSH (22) replaced it." },
  { id: "smtp", port: "25", protocol: "SMTP", transport: "TCP", purpose: "Sends email between servers", hook: "SMTP sends; POP3 and IMAP receive." },
  { id: "dns", port: "53", protocol: "DNS", transport: "TCP/UDP", purpose: "Resolves names to IP addresses", hook: "UDP 53 for lookups, TCP 53 for zone transfers." },
  { id: "dhcp", port: "67/68", protocol: "DHCP", transport: "UDP", purpose: "Hands out IP addresses automatically", hook: "Server listens on 67, client on 68. UDP because the client has no IP yet." },
  { id: "http", port: "80", protocol: "HTTP", transport: "TCP", purpose: "Unencrypted web traffic", hook: "Plain web is 80; add TLS and it becomes HTTPS on 443." },
  { id: "pop3", port: "110", protocol: "POP3", transport: "TCP", purpose: "Downloads email to one device", hook: "POP3 pulls mail down (usually removing it from the server)." },
  { id: "netbios", port: "137–139", protocol: "NetBIOS/NetBT", transport: "TCP/UDP", purpose: "Legacy Windows name and session services", hook: "Three ports for old Windows networking: 137 name, 138 datagram, 139 session." },
  { id: "imap", port: "143", protocol: "IMAP", transport: "TCP", purpose: "Syncs email across many devices", hook: "IMAP keeps mail on the server; its port is higher than POP3's." },
  { id: "snmp", port: "161/162", protocol: "SNMP", transport: "UDP", purpose: "Monitors and manages network devices", hook: "161 for polling devices, 162 for traps (alerts)." },
  { id: "ldap", port: "389", protocol: "LDAP", transport: "TCP", purpose: "Queries directory services like Active Directory", hook: "LDAP looks up users and computers in a directory." },
  { id: "https", port: "443", protocol: "HTTPS", transport: "TCP", purpose: "Encrypted web traffic (HTTP over TLS)", hook: "443 is the secure web; 80 is the plain web." },
  { id: "smb", port: "445", protocol: "SMB/CIFS", transport: "TCP", purpose: "Windows file and printer sharing", hook: "Modern Windows file sharing runs directly on 445 (NetBIOS 137–139 is the legacy path)." },
  { id: "rdp", port: "3389", protocol: "RDP", transport: "TCP", purpose: "Remote Desktop to a Windows GUI", hook: "The only four-digit port on the list: Remote Desktop." },
];

export type PortMode = "port-to-protocol" | "protocol-to-port" | "purpose-to-protocol";

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Three wrong options plus the answer, shuffled. */
export function optionsFor(answer: PortEntry, random: () => number = Math.random): PortEntry[] {
  const others = shuffle(corePorts.filter((p) => p.id !== answer.id), random).slice(0, 3);
  return shuffle([answer, ...others], random);
}
