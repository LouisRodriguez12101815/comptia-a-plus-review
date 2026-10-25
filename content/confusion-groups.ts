/**
 * Look-alike answers that are easy to mix up. Each term's `match` is a
 * case-insensitive regular expression tested against an answer choice; a choice
 * that names exactly one term counts as that term. Rules are one-line reminders
 * shown side by side when a learner picks one term for another.
 */
export type ConfusionTerm = { id: string; label: string; match: string; rule: string };
export type ConfusionGroup = { id: string; title: string; terms: ConfusionTerm[] };

export const confusionGroups: ConfusionGroup[] = [
  {
    "id": "social-engineering",
    "title": "Social engineering attacks",
    "terms": [
      {
        "id": "phishing",
        "label": "Phishing",
        "match": "(?<!spear )(?<!spear-)\\bphishing\\b",
        "rule": "Fraudulent email sent broadly to trick people into clicking a link or giving up data."
      },
      {
        "id": "spear-phishing",
        "label": "Spear phishing",
        "match": "\\bspear[- ]phishing\\b",
        "rule": "Phishing aimed at a specific person or group, using details about them."
      },
      {
        "id": "whaling",
        "label": "Whaling",
        "match": "\\bwhaling\\b",
        "rule": "Spear phishing aimed at executives or other high-value targets."
      },
      {
        "id": "vishing",
        "label": "Vishing",
        "match": "\\bvishing\\b",
        "rule": "Voice phishing: the scam happens over a phone call or voicemail."
      },
      {
        "id": "smishing",
        "label": "Smishing",
        "match": "\\bsmishing\\b",
        "rule": "SMS phishing: the scam arrives as a text message."
      },
      {
        "id": "tailgating",
        "label": "Tailgating",
        "match": "\\btailgating\\b",
        "rule": "Following an authorized person through a secure door without their knowledge or consent."
      },
      {
        "id": "piggybacking",
        "label": "Piggybacking",
        "match": "\\bpiggybacking\\b",
        "rule": "Entering a secure area with the authorized person's consent, for example they hold the door."
      },
      {
        "id": "shoulder-surfing",
        "label": "Shoulder surfing",
        "match": "\\bshoulder[- ]surfing\\b",
        "rule": "Watching someone's screen or keypad to steal what they type or view; privacy screens stop it."
      },
      {
        "id": "dumpster-diving",
        "label": "Dumpster diving",
        "match": "\\bdumpster diving\\b",
        "rule": "Searching discarded trash for documents or media with useful information; shredding stops it."
      },
      {
        "id": "impersonation",
        "label": "Impersonation",
        "match": "\\bimpersonat",
        "rule": "Pretending to be someone trusted, such as IT support or a vendor, to gain access."
      },
      {
        "id": "evil-twin",
        "label": "Evil twin",
        "match": "\\bevil twin\\b",
        "rule": "A rogue wireless access point that copies a legitimate network's SSID to capture traffic."
      }
    ]
  },
  {
    "id": "malware",
    "title": "Malware types",
    "terms": [
      {
        "id": "virus",
        "label": "Virus",
        "match": "(?<!anti)(?<!anti-)(?<!sector )\\bvirus\\b",
        "rule": "Attaches to a file or program and spreads when a user runs it."
      },
      {
        "id": "worm",
        "label": "Worm",
        "match": "\\bworm\\b",
        "rule": "Spreads by itself across a network without user action."
      },
      {
        "id": "trojan",
        "label": "Trojan",
        "match": "\\btrojan\\b",
        "rule": "Malware disguised as legitimate software that the user installs."
      },
      {
        "id": "ransomware",
        "label": "Ransomware",
        "match": "\\bransomware\\b",
        "rule": "Encrypts the user's files and demands payment for the key."
      },
      {
        "id": "rootkit",
        "label": "Rootkit",
        "match": "\\brootkit\\b",
        "rule": "Hides deep in the OS or boot process to keep privileged access; often needs a boot-time scan or reimage."
      },
      {
        "id": "spyware",
        "label": "Spyware",
        "match": "\\bspyware\\b",
        "rule": "Secretly collects information about the user's activity and sends it out."
      },
      {
        "id": "keylogger",
        "label": "Keylogger",
        "match": "\\bkeylogger\\b",
        "rule": "Records keystrokes to capture passwords and other typed data."
      },
      {
        "id": "cryptominer",
        "label": "Cryptominer",
        "match": "\\bcrypto[- ]?min(er|ing)\\b",
        "rule": "Uses the victim's CPU or GPU to mine cryptocurrency, causing slowness and heat."
      },
      {
        "id": "boot-sector-virus",
        "label": "Boot sector virus",
        "match": "\\bboot sector virus\\b",
        "rule": "Infects the boot sector so it loads before the OS."
      }
    ]
  },
  {
    "id": "wireless-security",
    "title": "Wireless security protocols",
    "terms": [
      {
        "id": "wep",
        "label": "WEP",
        "match": "\\bWEP\\b",
        "rule": "Original Wi-Fi encryption; broken and should never be used."
      },
      {
        "id": "wpa",
        "label": "WPA (TKIP)",
        "match": "\\bWPA\\b(?![23])|\\bTKIP\\b",
        "rule": "Stopgap after WEP that uses TKIP; now deprecated."
      },
      {
        "id": "wpa2",
        "label": "WPA2",
        "match": "\\bWPA2\\b",
        "rule": "Uses AES with CCMP; Personal mode uses a pre-shared key (PSK)."
      },
      {
        "id": "wpa3",
        "label": "WPA3",
        "match": "\\bWPA3\\b",
        "rule": "Current standard; Personal mode replaces the PSK handshake with SAE, which resists offline password guessing."
      }
    ]
  },
  {
    "id": "aaa-protocols",
    "title": "Authentication protocols",
    "terms": [
      {
        "id": "radius",
        "label": "RADIUS",
        "match": "\\bRADIUS\\b",
        "rule": "UDP-based AAA, common for Wi-Fi and VPN logins; encrypts only the password and combines authentication with authorization."
      },
      {
        "id": "tacacs",
        "label": "TACACS+",
        "match": "\\bTACACS\\+?",
        "rule": "Cisco AAA over TCP 49; encrypts the whole payload and separates authentication, authorization and accounting, often for network device admin."
      },
      {
        "id": "kerberos",
        "label": "Kerberos",
        "match": "\\bKerberos\\b",
        "rule": "Ticket-based authentication used by Active Directory domains for single sign-on."
      }
    ]
  },
  {
    "id": "windows-mmc-tools",
    "title": "Windows management tools",
    "terms": [
      {
        "id": "msinfo32",
        "label": "System Information (msinfo32)",
        "match": "\\bmsinfo32\\b|\\bsystem information\\b",
        "rule": "A read-only summary of hardware, components and software environment."
      },
      {
        "id": "resmon",
        "label": "Resource Monitor (resmon)",
        "match": "\\bresmon\\b|\\bresource monitor\\b",
        "rule": "Live per-process detail for CPU, memory, disk and network activity."
      },
      {
        "id": "perfmon",
        "label": "Performance Monitor (perfmon)",
        "match": "\\bperfmon\\b|\\bperformance monitor\\b",
        "rule": "Counters and data collector sets that log performance over time for baselines."
      },
      {
        "id": "taskmgr",
        "label": "Task Manager",
        "match": "\\btaskmgr\\b|\\btask manager\\b",
        "rule": "Quick view to end processes, see usage and manage startup apps."
      },
      {
        "id": "eventvwr",
        "label": "Event Viewer (eventvwr)",
        "match": "\\beventvwr\\b|\\bevent viewer\\b",
        "rule": "Reads the System, Application and Security logs to find errors and their times."
      },
      {
        "id": "devmgmt",
        "label": "Device Manager (devmgmt.msc)",
        "match": "\\bdevmgmt\\b|\\bdevice manager\\b",
        "rule": "Install, update, roll back or disable hardware drivers."
      },
      {
        "id": "diskmgmt",
        "label": "Disk Management (diskmgmt.msc)",
        "match": "\\bdiskmgmt\\b|\\bdisk management\\b",
        "rule": "GUI to initialize disks and create, format, extend or shrink partitions and volumes."
      },
      {
        "id": "taskschd",
        "label": "Task Scheduler (taskschd.msc)",
        "match": "\\btaskschd\\b|\\btask scheduler\\b",
        "rule": "Runs a program or script automatically at a set time or on an event."
      },
      {
        "id": "services",
        "label": "Services (services.msc)",
        "match": "\\bservices\\.msc\\b",
        "rule": "Start, stop and set the startup type of Windows services."
      },
      {
        "id": "certmgr",
        "label": "Certificate Manager (certmgr.msc)",
        "match": "\\bcertmgr\\b|\\bcertificate manager\\b",
        "rule": "View, import and remove the user's digital certificates."
      },
      {
        "id": "gpedit",
        "label": "Local Group Policy Editor (gpedit.msc)",
        "match": "\\bgpedit\\b|\\bgroup policy editor\\b",
        "rule": "Sets local policies such as password rules on Pro and higher editions."
      },
      {
        "id": "lusrmgr",
        "label": "Local Users and Groups (lusrmgr.msc)",
        "match": "\\blusrmgr\\b|\\blocal users and groups\\b",
        "rule": "Create local accounts and manage their group memberships."
      },
      {
        "id": "cleanmgr",
        "label": "Disk Cleanup (cleanmgr)",
        "match": "\\bcleanmgr\\b|\\bdisk cleanup\\b",
        "rule": "Deletes temporary and other unneeded files to free space."
      },
      {
        "id": "dfrgui",
        "label": "Defragment and Optimize Drives (dfrgui)",
        "match": "\\bdfrgui\\b|\\bdefragment",
        "rule": "Defragments hard drives and runs TRIM on SSDs."
      },
      {
        "id": "regedit",
        "label": "Registry Editor (regedit)",
        "match": "\\bregedit\\b|\\bregistry editor\\b",
        "rule": "Directly edits the registry; back it up first."
      },
      {
        "id": "msconfig",
        "label": "System Configuration (msconfig)",
        "match": "\\bmsconfig\\b|\\bsystem configuration\\b",
        "rule": "Boot options such as Safe boot, and selective startup for troubleshooting."
      }
    ]
  },
  {
    "id": "windows-repair-commands",
    "title": "Windows repair commands",
    "terms": [
      {
        "id": "sfc",
        "label": "sfc /scannow",
        "match": "\\bsfc\\b",
        "rule": "Checks protected system files and replaces corrupted ones."
      },
      {
        "id": "dism",
        "label": "DISM",
        "match": "\\bDISM\\b",
        "rule": "Repairs the Windows image (component store) that sfc uses as its source; run it when sfc cannot fix files."
      },
      {
        "id": "chkdsk",
        "label": "chkdsk",
        "match": "\\bchkdsk\\b",
        "rule": "Checks the file system: /f fixes errors, /r also finds bad sectors and recovers readable data."
      },
      {
        "id": "bootrec",
        "label": "bootrec",
        "match": "\\bbootrec\\b",
        "rule": "Repairs the MBR, boot sector and BCD from the recovery environment."
      },
      {
        "id": "diskpart",
        "label": "diskpart",
        "match": "\\bdiskpart\\b",
        "rule": "Command-line tool to manage disks, partitions and volumes."
      },
      {
        "id": "format",
        "label": "format",
        "match": "^format\\b|\\bformat [a-z]:",
        "rule": "Creates a new file system on a volume, erasing what is there."
      }
    ]
  },
  {
    "id": "group-policy-commands",
    "title": "Group Policy commands",
    "terms": [
      {
        "id": "gpupdate",
        "label": "gpupdate",
        "match": "\\bgpupdate\\b",
        "rule": "Applies Group Policy changes now; /force reapplies every policy."
      },
      {
        "id": "gpresult",
        "label": "gpresult",
        "match": "\\bgpresult\\b",
        "rule": "Reports which policies were applied to a user or computer (/r for a summary)."
      }
    ]
  },
  {
    "id": "windows-network-commands",
    "title": "Windows network and account commands",
    "terms": [
      {
        "id": "ipconfig",
        "label": "ipconfig",
        "match": "\\bipconfig\\b",
        "rule": "Shows IP settings; /release, /renew and /flushdns fix DHCP and DNS cache problems."
      },
      {
        "id": "netstat",
        "label": "netstat",
        "match": "\\bnetstat\\b",
        "rule": "Lists active connections and listening ports; -b shows the program behind each."
      },
      {
        "id": "nslookup",
        "label": "nslookup",
        "match": "\\bnslookup\\b",
        "rule": "Queries DNS to test name resolution."
      },
      {
        "id": "tracert",
        "label": "tracert",
        "match": "\\btracert\\b",
        "rule": "Lists each router hop to a destination."
      },
      {
        "id": "pathping",
        "label": "pathping",
        "match": "\\bpathping\\b",
        "rule": "Combines tracert and ping to show packet loss at each hop."
      },
      {
        "id": "net-use",
        "label": "net use",
        "match": "\\bnet use\\b",
        "rule": "Maps or disconnects a network drive letter."
      },
      {
        "id": "net-user",
        "label": "net user",
        "match": "\\bnet user\\b",
        "rule": "Creates, changes or lists user accounts."
      },
      {
        "id": "robocopy",
        "label": "robocopy",
        "match": "\\brobocopy\\b",
        "rule": "Robust copy that can resume, mirror folders and keep permissions."
      },
      {
        "id": "xcopy",
        "label": "xcopy",
        "match": "\\bxcopy\\b",
        "rule": "Copies folders and subfolders; older and less robust than robocopy."
      }
    ]
  },
  {
    "id": "remote-access",
    "title": "Remote access protocols",
    "terms": [
      {
        "id": "rdp",
        "label": "RDP",
        "match": "\\bRDP\\b|\\bremote desktop\\b",
        "rule": "Windows graphical remote desktop on TCP 3389."
      },
      {
        "id": "ssh",
        "label": "SSH",
        "match": "\\bSSH\\b",
        "rule": "Encrypted command-line remote access on TCP 22."
      },
      {
        "id": "telnet",
        "label": "Telnet",
        "match": "\\btelnet\\b",
        "rule": "Plaintext command-line remote access on TCP 23; avoid it."
      },
      {
        "id": "vnc",
        "label": "VNC",
        "match": "\\bVNC\\b",
        "rule": "Cross-platform screen sharing, by default on TCP 5900."
      }
    ]
  },
  {
    "id": "file-systems",
    "title": "File systems",
    "terms": [
      {
        "id": "ntfs",
        "label": "NTFS",
        "match": "\\bNTFS\\b",
        "rule": "Windows default with file permissions, EFS, BitLocker and quotas."
      },
      {
        "id": "fat32",
        "label": "FAT32",
        "match": "\\bFAT32\\b",
        "rule": "Broad compatibility but a 4 GB maximum file size and no permissions."
      },
      {
        "id": "exfat",
        "label": "exFAT",
        "match": "\\bexFAT\\b",
        "rule": "For removable drives: large files and works on Windows and macOS."
      },
      {
        "id": "refs",
        "label": "ReFS",
        "match": "\\bReFS\\b",
        "rule": "Resilient File System for large, fault-tolerant storage."
      },
      {
        "id": "ext4",
        "label": "ext4",
        "match": "\\bext4\\b",
        "rule": "Common Linux file system."
      },
      {
        "id": "apfs",
        "label": "APFS",
        "match": "\\bAPFS\\b",
        "rule": "Current macOS file system, built for SSDs."
      }
    ]
  },
  {
    "id": "backup-types",
    "title": "Backup types",
    "terms": [
      {
        "id": "full",
        "label": "Full backup",
        "match": "\\bfull backup",
        "rule": "Copies everything; fastest to restore, slowest to run."
      },
      {
        "id": "incremental",
        "label": "Incremental",
        "match": "\\bincremental\\b",
        "rule": "Copies changes since the last backup of any kind; restore needs the full plus every incremental."
      },
      {
        "id": "differential",
        "label": "Differential",
        "match": "\\bdifferential\\b",
        "rule": "Copies changes since the last full backup; restore needs the full plus the latest differential."
      },
      {
        "id": "synthetic",
        "label": "Synthetic full",
        "match": "\\bsynthetic\\b",
        "rule": "Builds a new full backup from the last full and later incrementals without re-reading the source."
      }
    ]
  },
  {
    "id": "windows-encryption",
    "title": "Windows encryption",
    "terms": [
      {
        "id": "bitlocker",
        "label": "BitLocker",
        "match": "\\bBitLocker\\b(?! To Go)",
        "rule": "Encrypts a whole internal volume, ideally with a TPM."
      },
      {
        "id": "bitlocker-to-go",
        "label": "BitLocker To Go",
        "match": "\\bBitLocker To Go\\b",
        "rule": "BitLocker for removable drives such as USB sticks."
      },
      {
        "id": "efs",
        "label": "EFS",
        "match": "\\bEFS\\b|\\bencrypting file system\\b",
        "rule": "Encrypts individual files and folders on NTFS, tied to the user account."
      }
    ]
  },
  {
    "id": "linux-commands",
    "title": "Linux commands",
    "terms": [
      {
        "id": "chmod",
        "label": "chmod",
        "match": "\\bchmod\\b",
        "rule": "Changes read, write and execute permissions."
      },
      {
        "id": "chown",
        "label": "chown",
        "match": "\\bchown\\b",
        "rule": "Changes which user or group owns a file."
      },
      {
        "id": "grep",
        "label": "grep",
        "match": "\\bgrep\\b",
        "rule": "Searches text inside files or output for a pattern."
      },
      {
        "id": "find",
        "label": "find",
        "match": "^find\\b",
        "rule": "Locates files by name, size or other attributes."
      },
      {
        "id": "ps",
        "label": "ps",
        "match": "^ps\\b",
        "rule": "A snapshot list of running processes."
      },
      {
        "id": "top",
        "label": "top",
        "match": "^top\\b",
        "rule": "A live, updating view of processes and resource use."
      },
      {
        "id": "sudo",
        "label": "sudo",
        "match": "^sudo\\b",
        "rule": "Runs one command with elevated (root) rights."
      },
      {
        "id": "su",
        "label": "su",
        "match": "^su\\b",
        "rule": "Switches to another user, root by default, for the whole session."
      },
      {
        "id": "apt",
        "label": "apt",
        "match": "\\bapt(-get)?\\b",
        "rule": "Package manager on Debian and Ubuntu."
      },
      {
        "id": "yum",
        "label": "yum / dnf",
        "match": "\\byum\\b|\\bdnf\\b",
        "rule": "Package manager on Red Hat, CentOS and Fedora."
      },
      {
        "id": "pwd",
        "label": "pwd",
        "match": "^pwd\\b",
        "rule": "Prints the current working directory."
      },
      {
        "id": "ls",
        "label": "ls",
        "match": "^ls\\b",
        "rule": "Lists the files in a directory."
      },
      {
        "id": "df",
        "label": "df",
        "match": "^df\\b",
        "rule": "Shows free space on each mounted file system."
      },
      {
        "id": "du",
        "label": "du",
        "match": "^du\\b",
        "rule": "Shows how much space files and directories use."
      },
      {
        "id": "dig",
        "label": "dig",
        "match": "^dig\\b",
        "rule": "Queries DNS records."
      }
    ]
  },
  {
    "id": "data-destruction",
    "title": "Data destruction and disposal",
    "terms": [
      {
        "id": "shredding",
        "label": "Shredding",
        "match": "\\bshred",
        "rule": "Physically cuts drives or paper into pieces; nothing can be reused."
      },
      {
        "id": "degaussing",
        "label": "Degaussing",
        "match": "\\bdegauss",
        "rule": "A strong magnetic field erases magnetic media; it does not work on SSDs or flash."
      },
      {
        "id": "drilling",
        "label": "Drilling",
        "match": "\\bdrill(ing|ed)?\\b",
        "rule": "Drilling through platters or chips to destroy the drive."
      },
      {
        "id": "incineration",
        "label": "Incineration",
        "match": "\\bincinerat",
        "rule": "Burning media to destroy it completely."
      },
      {
        "id": "wipe",
        "label": "Secure wipe / overwrite",
        "match": "\\boverwrit|\\bsecure (erase|wipe)|\\bwiping\\b|\\bdrive wipe",
        "rule": "Overwrites the data so the drive can be reused or donated."
      },
      {
        "id": "quick-format",
        "label": "Standard or quick format",
        "match": "\\bquick format\\b|\\bstandard format\\b",
        "rule": "Leaves recoverable data behind; not a secure disposal method."
      }
    ]
  },
  {
    "id": "regulated-data",
    "title": "Regulated data",
    "terms": [
      {
        "id": "pii",
        "label": "PII",
        "match": "\\bPII\\b",
        "rule": "Personally identifiable information, such as name plus SSN or address."
      },
      {
        "id": "phi",
        "label": "PHI",
        "match": "\\bPHI\\b|\\bHIPAA\\b",
        "rule": "Protected health information, regulated in the U.S. by HIPAA."
      },
      {
        "id": "pci",
        "label": "PCI DSS",
        "match": "\\bPCI\\b",
        "rule": "The card industry standard for handling payment card data."
      },
      {
        "id": "gdpr",
        "label": "GDPR",
        "match": "\\bGDPR\\b",
        "rule": "The EU law protecting personal data of people in the EU."
      }
    ]
  },
  {
    "id": "macos-features",
    "title": "macOS features",
    "terms": [
      {
        "id": "time-machine",
        "label": "Time Machine",
        "match": "\\btime machine\\b",
        "rule": "Built-in incremental backup to an external or network drive."
      },
      {
        "id": "filevault",
        "label": "FileVault",
        "match": "\\bfilevault\\b",
        "rule": "Full-disk encryption."
      },
      {
        "id": "keychain",
        "label": "Keychain",
        "match": "\\bkeychain\\b",
        "rule": "Stores passwords, keys and certificates."
      },
      {
        "id": "spotlight",
        "label": "Spotlight",
        "match": "\\bspotlight\\b",
        "rule": "System-wide search for files and apps."
      },
      {
        "id": "mission-control",
        "label": "Mission Control",
        "match": "\\bmission control\\b",
        "rule": "Shows all open windows and virtual desktops (Spaces)."
      },
      {
        "id": "disk-utility",
        "label": "Disk Utility",
        "match": "\\bdisk utility\\b",
        "rule": "Formats, partitions and repairs disks (First Aid)."
      },
      {
        "id": "boot-camp",
        "label": "Boot Camp",
        "match": "\\bboot camp\\b",
        "rule": "Dual-boots Windows on Intel-based Macs."
      }
    ]
  },
  {
    "id": "script-types",
    "title": "Script file types",
    "terms": [
      {
        "id": "bat",
        "label": ".bat",
        "match": "\\.bat\\b",
        "rule": "Windows Command Prompt batch file."
      },
      {
        "id": "ps1",
        "label": ".ps1",
        "match": "\\.ps1\\b",
        "rule": "PowerShell script."
      },
      {
        "id": "sh",
        "label": ".sh",
        "match": "\\.sh\\b",
        "rule": "Linux or macOS shell (Bash) script."
      },
      {
        "id": "vbs",
        "label": ".vbs",
        "match": "\\.vbs\\b",
        "rule": "VBScript, run by Windows Script Host."
      },
      {
        "id": "js",
        "label": ".js",
        "match": "\\.js\\b",
        "rule": "JavaScript."
      },
      {
        "id": "py",
        "label": ".py",
        "match": "\\.py\\b",
        "rule": "Python script."
      }
    ]
  }
];
