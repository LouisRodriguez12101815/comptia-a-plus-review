# Exam objective coverage (Network+ section only)

NOTE: This copy keeps only the CompTIA Network+ (n10-009) table and the Network+ rows of the gap list from the original 2026-10-17 report. The A+ Core 1 and Core 2 sections were left out because they are not needed for this work. The numbering of 3.3/3.4/3.5 below reflects the site's old (wrong) ids; see review/n10-009-gap-audit-2026-10-30.md for the correction. First-pass map: statuses came from notes section titles and item counts, not a full read. Regenerate with: npm run report:objectives

## CompTIA Network+ (n10-009)

6 covered, 13 partial, 6 missing of 25 objectives. Weighted coverage about 49% (covered counts 1, partial 0.5).

| Objective | Weight | Status | Notes sections | Cards | Quiz | Labs | Visuals | Topics |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1.1 Explain concepts related to the OSI reference model | 23% | covered | 15 | 27 | 43 | 1 | 4 | n10-osi-models, n10-l2-l3-switching |
| 1.2 Compare and contrast networking appliances, applications, and functions | 23% | partial | 20 | 33 | 65 | 4 | 16 | networking-devices, n10-l2-l3-switching, networking-fundamentals, networking-storage |
| 1.3 Summarize cloud concepts and connectivity options | 23% | missing | 0 | 0 | 0 | 0 | 0 | - |
| 1.4 Explain common networking ports, protocols, services, and traffic types | 23% | covered | 23 | 46 | 61 | 3 | 13 | n10-tcpip, n10-html-http, networking-devices, networking-dns-dhcp |
| 1.5 Compare and contrast transmission media and transceivers | 23% | partial | 15 | 25 | 76 | 2 | 11 | networking-cabling, n10-osi-models, networking-fundamentals |
| 1.6 Compare and contrast network topologies, architectures, and types | 23% | partial | 8 | 16 | 18 | 2 | 6 | networking-devices |
| 1.7 Given a scenario, use appropriate IPv4 network addressing | 23% | covered | 22 | 38 | 65 | 0 | 9 | n10-ch7, n10-ch8 |
| 1.8 Summarize evolving use cases for modern network environments | 23% | partial | 19 | 36 | 57 | 2 | 11 | networking-devices, n10-ch7 |
| 2.1 Explain characteristics of routing technologies | 20% | covered | 33 | 50 | 70 | 1 | 4 | n10-ch9, n10-ch10, n10-ch8 |
| 2.2 Given a scenario, configure switching technologies and features | 20% | covered | 21 | 22 | 35 | 1 | 2 | n10-ch11, n10-l2-l3-switching |
| 2.3 Given a scenario, select and configure wireless devices and technologies | 20% | missing | 0 | 0 | 0 | 0 | 0 | - |
| 2.4 Explain important factors of physical installations | 20% | missing | 0 | 0 | 0 | 0 | 0 | - |
| 3.1 Explain the purpose of organizational processes and procedures | 19% | missing | 0 | 0 | 0 | 0 | 0 | - |
| 3.2 Given a scenario, use network monitoring technologies | 19% | partial | 17 | 26 | 36 | 0 | 0 | n10-ch10, n10-security |
| 3.3 Explain network services | 19% | partial | 13 | 28 | 54 | 3 | 9 | networking-dns-dhcp, n10-ch7 |
| 3.4 Explain network access and management methods | 19% | missing | 0 | 0 | 0 | 0 | 0 | - |
| 3.5 Explain disaster-recovery concepts | 19% | partial | 2 | 5 | 6 | 1 | 4 | networking-storage |
| 4.1 Explain the importance of basic network security concepts | 14% | covered | 13 | 16 | 34 | 0 | 0 | n10-security, n10-risk-compliance |
| 4.2 Summarize various types of attacks and their impact to the network | 14% | partial | 6 | 9 | 24 | 0 | 0 | n10-risk-compliance |
| 4.3 Given a scenario, apply network security features, defense techniques, and solutions | 14% | partial | 14 | 10 | 19 | 1 | 0 | n10-ch11 |
| 5.1 Explain the troubleshooting methodology | 24% | partial | 5 | 10 | 11 | 0 | 5 | core2-ch7 |
| 5.2 Given a scenario, troubleshoot common cabling and physical interface issues | 24% | partial | 12 | 25 | 51 | 0 | 7 | networking-cabling, n10-osi-models |
| 5.3 Given a scenario, troubleshoot common issues with network services | 24% | partial | 37 | 41 | 63 | 1 | 4 | n10-ch8, n10-ch9, n10-ch11 |
| 5.4 Given a scenario, troubleshoot common performance issues | 24% | missing | 0 | 0 | 0 | 0 | 0 | - |
| 5.5 Given a scenario, use the appropriate tool or protocol to solve networking issues | 24% | partial | 11 | 21 | 36 | 0 | 10 | quick-reference, networking-cabling, core2-ch7 |

## Network+ gaps, heaviest domain first (from the original list)

1. n10-009 5.4 (Network troubleshooting, 24%): Troubleshoot common performance issues. missing.
2. n10-009 5.1 (Network troubleshooting, 24%): Explain the troubleshooting methodology. partial. Methodology lives in the Core 2 notes, not Network+.
3. n10-009 5.2 (Network troubleshooting, 24%): Cabling and physical interface issues. partial.
4. n10-009 5.3 (Network troubleshooting, 24%): Common issues with network services. partial.
5. n10-009 5.5 (Network troubleshooting, 24%): Appropriate tool or protocol. partial.
6. n10-009 1.3 (Networking concepts, 23%): Cloud concepts and connectivity options. missing.
7. n10-009 1.2 (23%): Networking appliances. partial. Routers, switches, and storage covered; firewalls, IDS/IPS, load balancers, and proxies thin.
8. n10-009 1.5 (23%): Transmission media and transceivers. partial. Copper and fiber covered; wireless media and SFP/QSFP transceivers not found.
9. n10-009 1.6 (23%): Topologies, architectures, and types. partial. Topologies covered; spine-leaf and three-tier not found.
10. n10-009 1.8 (23%): Evolving use cases. partial. SD-WAN and IPv6 covered; SDN, VXLAN, zero trust, SASE, and IaC not found.
11. n10-009 2.3 (Implementation, 20%): Wireless devices and technologies. missing.
12. n10-009 2.4 (20%): Physical installations. missing.
13. n10-009 3.1 (Operations, 19%): Organizational processes and procedures. missing.
14. n10-009 3.4 (19%): Network access and management methods. missing.
15. n10-009 3.2 (19%): Network monitoring technologies. partial. SNMP only; flow data, packet capture, baselines, and SIEM not found.
16. n10-009 3.3 (19%): Network services. partial. DHCP, DNS, and SLAAC covered; NTP and PTP not found.
17. n10-009 3.5 (19%): Disaster-recovery concepts. partial. Backups covered; RPO, RTO, MTTR, and DR site types not found.
18. n10-009 4.2 (Security, 14%): Attack types. partial. Threat terms covered; VLAN hopping, ARP poisoning, and evil twin not checked.
19. n10-009 4.3 (14%): Security features and defenses. partial. Port security covered; NAC, 802.1X, ACLs, and zones not found.
