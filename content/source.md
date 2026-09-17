# CompTIA A+ COMPREHENSIVE STUDY GUIDE
**Core 1 & Core 2 Consolidated Knowledge Base**

**Study Period:** September 10-16, 2026  
**Student:** Louis  
**Status:** Mid-certification study with strong foundation  
**Last Updated:** September 16, 2026

---

## TABLE OF CONTENTS

1. [Study Progress Summary](#study-progress-summary)
2. [Core 1 Knowledge](#core-1-knowledge)
   - Chapter 2: Expansion Cards, Storage, Power Supplies
3. [Core 2 Knowledge](#core-2-knowledge)
   - Chapter 1: Operating System Basics
   - Chapter 2: Windows Configuration
   - Chapter 3: Windows Administration
   - Chapter 7: Troubleshooting
4. [Networking Fundamentals](#networking-fundamentals)
   - DNS & DHCP
   - Storage: NAS/SAN
   - RAID Configurations
5. [Critical Weak Areas](#critical-weak-areas)
6. [Quick Reference](#quick-reference)

---

## STUDY PROGRESS SUMMARY

| Chapter | Content | Score | Status |
|---------|---------|-------|--------|
| Core 1 - Ch2 | Expansion Cards, Storage, Power | 15/20 (75%) | ✅ Strong |
| Core 2 - Ch1 | OS Basics | 13/18 (72%) | ✅ Solid |
| Core 2 - Ch2 | Windows Configuration | 14/20 (70%) | ✅ Solid |
| Core 2 - Ch3 | Windows Administration | 7-8/20 (35-40%) | ⚠️ Weak (sysprep, deployment) |
| Core 2 - Ch7 | Troubleshooting | 13/20 (65%) → 82% after drill | ✅ Good |
| DNS/DHCP | Network fundamentals | 3/3 (100%) | ✅ Excellent |

**Overall Average:** ~72% across tested material

---

# CORE 1 KNOWLEDGE

## Chapter 2: Expansion Cards, Storage Devices, Power Supplies

### Expansion Slots & Interfaces

**Graphics/High-Speed:**
- PCIe (PCI Express) = GPU/graphics cards
- PCIe x16 = highest bandwidth for video cards
- PCIe architecture = serial bus, faster than parallel

**Storage Interfaces:**
- M.2 = form factor for NVMe/SATA SSDs
- NVMe (Non-Volatile Memory Express) = fastest (3.5-4 GB/s)
- SATA = 600 MB/s (SATA 3)
- PATA/IDE = legacy (40-pin, slow, obsolete)

**Network:**
- NIC (Network Interface Card) = communication device
- Connects devices to network

### Storage Device Types & Speeds

**Ranking by Speed (Fastest to Slowest):**
1. PCIe (4.0 GB/s) — Fastest, bus architecture
2. M.2 (3.5 GB/s) — Form factor for NVMe
3. SATA 3 (600 MB/s) — Standard HDD/SSD connection
4. SATA 2 (300 MB/s)
5. SATA 1 (150 MB/s)
6. PATA (Legacy, slow)

**Storage Media:**
- Hard Disk Drives (HDD) = mechanical, slower
- Solid State Drives (SSD) = no moving parts, faster
- NVMe = newest standard, fastest
- Optical Drives = DVDs, Blu-ray (declining use)
- Memory Cards (SD, microSD, CompactFlash) = camera storage
- USB Flash Drives = portable storage

### Optical Media Capacity

- **Single-sided, single-layer Blu-ray** = ~25 GB
- **Double-sided, single-layer DVD+R** = 9-10 GB (for 20GB video, use larger format)
- **DVD+R/DVD-R** = ~4.7 GB single-layer
- **CD** = ~700 MB

### Power Supplies

**AC to DC Conversion:**
- **Input:** AC (alternating current) from wall outlet
- **Output:** DC (direct current) to computer components
- ⚠️ **Common mistake:** Reversing input/output

**Standard PC Power Supply Voltages:**
- +3.3V DC
- +5V DC
- +12V DC
- -12V DC (rarely used)
- NOT: +4.3V, +8V, +110V

**Power Supply Selection:**
- **Wattage varies** (100W, 500W, 850W, etc.) — must match system needs
- Voltage stays consistent (AC→DC standard)
- Amperage calculated from wattage

**Power Supply Redundancy:**
- Redundant power supply = backup power if primary fails
- Critical for servers (prevents data loss)
- One on/one off configuration

### Hot-Swappable Devices

- **Definition:** Power does NOT need to be turned off before insertion/removal
- Device can be removed with power applied after proper OS shutdown
- USB devices, external drives, some drive bays
- ⚠️ **NOT:** removing immediately after powering down while still hot

### Hard Drive Installation Considerations

**NOT required:**
- Don't need external power source for modern HDDs (internal supplies have capacity)
- Form factor matching is required
- Secure with at least 2 screws (1 side, preferably 2 each side)
- Don't obstruct airflow with cables

### RAID 5 Fundamentals

- **Minimum drives:** 3
- **Data arrangement:** Striping with parity
- **Fault tolerance:** Can survive 1 drive failure
- **Rebuild time:** 3 hours to 6 months (enterprise challenge)
- **Requires:** At least 3 drives for parity calculation

### Video Card Integration

- **PCIe x16** = standard for discrete video cards
- Can coexist with integrated video
- Integrated video may need disabling in BIOS
- PCIe card auto-detected in most cases
- Requires proper driver installation

### Video Card Selection

- **PCIe x16** = best performance (uses most bandwidth)
- PCIe x128 = not a real standard
- AGP = legacy (obsolete)
- PCI = too slow for video

---

# CORE 2 KNOWLEDGE

## Chapter 1: Operating System Basics

### Windows 11 System Requirements (64-bit)

**CRITICAL — Commonly tested:**
- Processor: 1.0 GHz or faster, 2 cores minimum
- **TPM 2.0: MANDATORY** (often the blocker)
- RAM: 4 GB minimum (8 GB recommended)
- **Storage: 64 GB minimum** (CompTIA spec; Microsoft says 15-20GB)
- Display: 720p, 9" minimum
- Firmware: UEFI with Secure Boot capable

### Windows OS Versions & Editions

**Editions:**
- **Home** = local accounts only, NO domain join, NO BitLocker, NO Remote Desktop
- **Pro** = CAN join domain, BitLocker, Remote Desktop, Group Policy
- **Enterprise** = domain required, all features
- **32-bit vs. 64-bit:** 64-bit required for modern Windows 11

**Upgrade Paths:**
- Same OS family, same bit version = upgrade allowed
- 32-bit → 64-bit = clean install required
- Win10 Home → Win11 Pro = within same family, can upgrade

### Boot Process Sequence (In Order)

1. **POST** (Power-On Self-Test) — BIOS checks hardware
2. **Boot Loader** — Locates OS files
3. **Kernel Load** — Loads Windows core
4. **Logon** — User authentication
5. **Shell/Desktop** — GUI loads

**Troubleshooting by stage:**
- Can't start = POST failed (hardware issue)
- BSOD during boot = driver/kernel issue
- Stuck at logon = network/auth issue
- Black screen = driver issue

### File Systems

| Feature | FAT32 | NTFS | exFAT |
|---------|-------|------|-------|
| Max File Size | 4 GB ⚠️ | 16 EB | 16 EB |
| Permissions | ❌ No | ✅ Yes | ❌ No |
| Encryption | ❌ No | ✅ BitLocker | ❌ No |
| Journaling | ❌ No | ✅ Yes | Limited |
| **Best For** | Legacy | Internal Windows | USB/External |

**Selection Rules:**
- **Internal C: drive** = NTFS (security, permissions)
- **External USB/cross-platform** = exFAT
- **Legacy only** = FAT32

### Registry Basics

- Hierarchical database of system configuration
- **HKEY_LOCAL_MACHINE** = hardware, system, services
- **HKEY_CURRENT_USER** = user settings, preferences
- **NEVER edit directly without cause** — last resort only
- Incorrect edits can render system unbootable
- Backed up during System Restore

### User Account Types & Permissions

**Account Types:**
- **Administrator** = full system access
- **Standard User** = run apps, LIMITED system changes
- **Guest** = temporary, very restricted
- **Service Account** = runs background services (not interactive login)

**Permission Hierarchy:**
- Explicit **Deny > Allow** (if both exist, Deny wins)
- Group Policy enforces restrictions company-wide
- Least Privilege principle = restrict to what's needed

---

## Chapter 2: Windows Configuration

### MMC Snap-In Commands (.msc extension)

**Critical:** All use .msc extension, NOT .exe

- `eventvwr.msc` = Event Viewer (logs)
- `devmgmt.msc` = Device Manager (hardware)
- `diskmgmt.msc` = Disk Management (partitions)
- `services.msc` = Services (background processes)
- `compmgmt.msc` = Computer Management (all tools)
- `gpedit.msc` = Group Policy Editor
- `msconfig.msc` = System Configuration

### Device Manager

**Scope:** Hardware ONLY
- Display adapters, network adapters, USB devices, sound devices
- Manage drivers, enable/disable hardware
- ❌ NOT for applications, software, services

### Event Viewer Logs

- **System** = OS events, driver failures, reboot events
- **Application** = app crashes, errors
- **Security** = login attempts, permission denials
- **Setup** = Windows installation events

### Indexing Options

- Configure file types and metadata for Windows Search
- Decide what gets indexed for faster searching
- ⚠️ Different from File Explorer Options (which controls VIEW settings)

### Registry Hives (5 Main)

1. **HKEY_LOCAL_MACHINE (HKLM)** = hardware, system, services
2. **HKEY_CURRENT_USER (HKCU)** = current user settings
3. **HKEY_CLASSES_ROOT (HKCR)** = file associations
4. **HKEY_USERS** = all user profiles
5. **HKEY_CURRENT_CONFIG** = hardware profiles

### File Systems & Partition Tables

**Partition Types:**
- **MBR** = Master Boot Record (legacy, max 4 primary partitions)
- **GPT** = GUID Partition Table (modern, unlimited partitions)
- **UEFI firmware** requires GPT

**Partition Components:**
- **Boot partition** = primary (holds boot files)
- **ESP** (EFI System Partition) = contains BCD on UEFI systems
- **WinRE partition** = recovery utilities

### Task Scheduler

- Schedule programs to run automatically
- Common use: maintenance tasks, backups, system utilities
- Access via Windows Tools or Control Panel

### Power Modes

- **Sleep/Standby** = low power, RAM stays on, quick wake
- **Hibernate** = writes RAM to disk, slower wake, power saving
- **Shutdown** = full power down

### Defragmentation vs. TRIM

- **Defragmentation** = for mechanical drives (HDDs) — organize fragmented files
- **TRIM** = for SSDs — tells drive which blocks are no longer needed

---

## Chapter 3: Windows Administration

### Setup Passes (Not WinPE!)

**⚠️ CRITICAL:** WinPE is the environment, NOT a pass

1. **auditSystem** = system-wide setup
2. **generalize** = removes hardware-specific drivers, SIDs
3. **auditUser** = user-specific setup
4. **OOBE** = Out-of-Box Experience (first-time user setup)

### Deployment Workflow (Correct Order)

```
1. Configure reference PC (install software, settings)
   ↓
2. Run: sysprep /oobe /generalize /shutdown (PREPARE)
   ↓
3. Boot to WinPE
   ↓
4. Run: imagex /capture C: image.wim OR DISM /Capture-Image (CAPTURE)
   ↓
5. Configure WDS with image
   ↓
6. Boot target computers to network (PXE)
   ↓
7. WDS deploys image (DEPLOY)
   ↓
8. Each computer boots to OOBE (SETUP)
```

### Sysprep Switches (/generalize is key)

- `/oobe` = reset to Out-of-Box Experience
- `/generalize` = **REMOVE hardware-specific drivers, SIDs** ← THIS IS KEY
- `/shutdown` = graceful shutdown after prep
- `/audit` = boot to audit mode for testing

**Why /generalize first:** Removes hardware bindings before capturing, so image works on ANY hardware

### Image Deployment Tools (Different purposes!)

- **sysprep** = PREPARE reference PC
- **ImageX / DISM** = CAPTURE into .wim file
- **WDS** = DEPLOY .wim to network
- **USMT** = migrate user data (different purpose)
- **MAP toolkit** = hardware assessment (different purpose)

### Windows 11 Editions & Insider Program

**Insider Program availability:**
- ❌ Home = NOT supported
- ✅ Pro, Education, Enterprise = supported

### Windows Update Branches

**NOT "General Availability"** ← Common mistake

- **Semi-Annual Channel** = regular releases (general public, twice yearly)
- **LTSC** (Long-Term Servicing Channel) = stable, minimal changes (enterprise)
- **Insider Program** = beta/preview releases

### Update Types

- **Security Updates** = fix vulnerabilities (highest priority)
- **Critical Updates** = fix major bugs
- **Feature Updates** = new features, version bump (21H2 → 22H2)
- **Quality Rollups** = monthly cumulative patches
- **Optional Updates** = non-critical drivers/improvements

### Architecture Upgrades (32→64 bit)

**32→64 bit = CLEAN INSTALL ONLY**
- Cannot upgrade within same Windows version
- Cannot do intermediate steps
- Must wipe and reinstall

### Boot Configuration Data (BCD)

**Location varies:**
- **Legacy (MBR):** c:\boot
- **Modern (UEFI):** ESP (EFI System Partition)

### bootrec Commands

- `/rebuildbcd` = rebuild BCD (modern, UEFI)
- `/fixmbr` = fix MBR (legacy)
- `/fixboot` = fix boot sector
- `/scanos` = scan for Windows installations

### Concurrent Connections

**Windows Workstation limit:** 20 concurrent SMB connections
- Not unlimited
- Not 25, 30, or 40
- **20 is the cap**

---

## Chapter 7: Troubleshooting Operating Systems & Security

### 5-Step Troubleshooting Methodology

1. **Identify the problem** — gather symptoms, error codes, recent changes
2. **Establish theory** — what likely caused it?
3. **Test theory** — try most likely fix first
4. **Establish plan & implement** — document the fix
5. **Verify & document** — confirm it works, update records

**Key rule:** Ask questions BEFORE troubleshooting

### Safe Mode Variants

| Mode | Loads | When to Use | Access |
|------|-------|------------|--------|
| **Safe Mode (Minimal)** | Drivers only | Remove bad driver | F8 (legacy) or Shift+Restart |
| **Safe Mode w/ Networking** | Drivers + network | Download driver fixes | F8 or Shift+Restart |
| **Safe Mode w/ Command Prompt** | Minimal + cmd.exe | Advanced recovery | Recovery console |

**Modern access (Win10/11):**
1. Shift + Restart
2. Troubleshoot → Advanced → Startup Settings
3. Choose Safe Mode (F4, F5, F6)

### Boot Failure Recovery Hierarchy

1. **Startup Repair** (automatic, fastest)
2. **System Restore** (if restore point exists)
3. **bootrec commands** (manual, advanced)
4. **SFC /scannow** (system file repair)
5. **Reset This PC** (destructive)
6. **Reimage or reinstall** (last resort)

### BSOD Troubleshooting

**Stop code:** Indicates what failed (e.g., DRIVER_IRQL_NOT_LESS_OR_EQUAL)

**Fix strategy:**
1. Note the stop code
2. Boot to Safe Mode
3. Roll back latest driver
4. Uninstall recent software
5. System Restore
6. Run memory diagnostic

**Common BSOD causes:**
- DRIVER_IRQL = bad driver (roll back)
- PAGE_FAULT = RAM issue (memory diagnostic)
- SYSTEM_SERVICE_EXCEPTION = system service crashed

### Command-Line Troubleshooting Tools

**Networking:**
- `ipconfig /all` = view network config, DHCP server, DNS
- `ipconfig /release && /renew` = renew DHCP lease
- `ping` = test connectivity
- `nslookup` = query DNS
- `tracert` = trace route to destination
- `pathping` = trace route + measure packet loss ← **KEY DIFFERENCE**
- `netstat` = view network connections, ports in use
- `arp -a` = view MAC/IP mappings (ARP cache)

**Disk & System:**
- `chkdsk` = check disk for corruption
- `chkdsk /F` = fix errors (needs restart)
- `sfc /scannow` = scan and repair system files
- `DISM /Online /Cleanup-Image /RestoreHealth` = repair Windows image

**Process Management:**
- `tasklist` = list running processes
- `taskkill /IM processname.exe` = end process

### Networking Troubleshooting Flow

```
No internet connection
  ↓
Run: ipconfig /all
  - Check IP (if 169.254.x.x = DHCP failed) → Run ipconfig /release & /renew
  - Check gateway and DNS
  ↓
If has IP but no internet: ping 8.8.8.8 (test connectivity)
  - If fails → firewall or ISP issue
  ↓
If ping works but can't see websites: nslookup google.com (test DNS)
  - If fails → DNS issue (check DNS in ipconfig)
```

### Malware Removal Sequence

1. **IDENTIFY & VERIFY symptoms** ← FIRST
2. **Quarantine** (isolate from network)
3. **Remediate** (remove malware)
4. **Educate** (user training on prevention)

⚠️ **Common mistake:** Quarantine before identifying

### Windows Update Troubleshooting

- **Windows Update troubleshooter** = diagnose update failures
- Clear SoftwareDistribution folder if stuck
- Check Task Scheduler for update status
- Disable Windows Update service if needed (Group Policy or services.msc)

### Antivirus Definitions

- **Update frequency:** Daily (NOT weekly)
- New malware appears constantly
- Weekly updates = 72-120 hours of exposure gap
- Daily updates = best practice

### System File Repair Tools

- **SFC /scannow** = repair corrupted SYSTEM FILES
- **regedit** = edit REGISTRY (different purpose!)
- ⚠️ **Common mistake:** Using regedit to fix system file corruption

### Unactivated Windows Restrictions

**NOT apps can't launch**

- **Actual restriction:** Can't change wallpaper/personalization
- CAN launch apps
- CAN run updates
- CAN browse internet
- Just cosmetic limitations

### Task Manager Tabs

1. **Processes** = running apps, CPU/RAM/Disk usage
2. **Performance** = real-time graphs (CPU, RAM, Network, Disk)
3. **App History** = historical usage
4. **Startup** = apps launching on boot (disable unnecessary)
5. **Services** = background services
6. **Details** = extended process info

### Performance Troubleshooting (Task Manager approach)

**High CPU:**
- Identify app in Processes tab
- End process or uninstall

**High RAM:**
- Identify memory hog in Processes
- Close unnecessary apps or upgrade RAM

**High Disk Usage (100%):**
- Usually Windows Update, indexing, or malware scan
- Wait or disable in settings

**Network spike:**
- Check App History for bandwidth hogs
- Disable cloud sync, auto-update, or quarantine malware

### Mobile Device Troubleshooting

**Battery drain with background apps:**
- Apps consuming CPU, network, GPS, sensors
- Close unnecessary background apps

**Overheating consequences:**
- Degraded battery life
- Potential device shutdown
- Performance throttling

**Cellular (WWAN) vs. WiFi:**
- ⚠️ **Common mistake:** Confusing WiFi (Wireless) with WWAN (Cellular/4G/5G)
- Both are "wireless" but different technologies

**Auto-connect risk:**
- Vulnerable to evil twin attacks
- Device connects to lookalike network
- Attacker intercepts data or forces cellular use (data charges)

---

# NETWORKING FUNDAMENTALS

## DNS & DHCP

### DHCP Overview

**Ports:**
- Server: UDP port 67
- Client: UDP port 68

**DORA Process:**
1. **Discover** = client broadcasts "I need an IP"
2. **Offer** = DHCP server offers IP
3. **Request** = client confirms the offer
4. **Acknowledge** = DHCP server finalizes assignment

**APIPA (Automatic Private IP Addressing):**
- **169.254.x.x** = backup when DHCP fails
- Allows local communication without DHCP
- Indicates DHCP server not responding

**Lease Duration:**
- Default: 8 days
- Adjust based on environment (high-traffic networks need shorter leases)
- Can be renewed before expiration

### DHCP Security Issues

**Attacks:**
- DHCP starvation/depletion = exhaust IP pool, legitimate users get APIPA
- DHCP poisoning = attacker sends fake DHCP offers
- Man-in-the-middle via DHCP

**Defenses:**
- MAC address filtering
- Port security (sticky MAC = remember MAC on port)
- DHCP snooping on switches
- Limit DHCP requests

**3-2-1 Backup Rule:** Separate from DHCP
- DHCP = local redundancy
- Backups = disaster recovery (offsite)

### DNS Overview

**Purpose:** Resolve domain names to IP addresses

**DNS Record Types:**

| Record | Maps To | Example |
|--------|---------|---------|
| **A** | IPv4 | google.com → 142.250.185.46 |
| **AAAA** | IPv6 | example.com → 2001:db8::1 |
| **CNAME** | Domain alias | www.example.com → example.com |
| **MX** | Mail server | example.com → mail.example.com |
| **NS** | Nameserver | Points to DNS server |
| **SOA** | Start of Authority | Zone info |

**DNS Forwarder:**
- Local DNS server forwards unresolved queries to external DNS (e.g., 8.8.8.8)
- Allows caching locally while having fallback for unknown domains
- ⚠️ **Common mistake:** Thinking forwarder replaces local DNS

### Troubleshooting DNS/DHCP

**Can access by IP but NOT domain name:**
→ DNS problem (name resolution issue)

**Cannot access by IP or domain:**
→ Network/connectivity problem

**ipconfig /all output clues:**
- IP starting 169.254.x.x = DHCP failed
- DNS 0.0.0.0 = DNS not assigned
- Default gateway blank = can't reach router

**Commands:**
- `ipconfig /release && /renew` = reset DHCP
- `nslookup domain.com` = test DNS resolution
- `ping 8.8.8.8` = test general connectivity

---

## Storage: RAID, NAS, SAN

### RAID Configurations

| RAID | Striping | Mirroring | Min Drives | Fault Tolerance | Use Case |
|------|----------|-----------|-----------|-----------------|----------|
| **0** | ✅ Yes | ❌ No | 2 | ❌ None | Speed only |
| **1** | ❌ No | ✅ Yes | 2 | ✅ 1 drive | Redundancy |
| **5** | ✅ Yes | ✅ Parity | 3 | ✅ 1 drive | Balance |
| **10** | ✅ Yes | ✅ Yes | 4 | ✅ 1 per mirror | High availability |

**RAID 0 (Striping):**
- Data split across multiple drives
- High performance, zero redundancy
- ⚠️ One drive failure = total data loss

**RAID 1 (Mirroring):**
- Exact copy on second drive
- Redundancy, 50% storage loss
- Can access during rebuild

**RAID 5 (Striping with Parity):**
- Best balance, uses parity for recovery
- ⚠️ Rebuild time: 3 hours to 6 months (critical in enterprise)
- ❌ CANNOT access during rebuild (unavailable until complete)

**RAID 10 (Mirror + Stripe):**
- Mirrored pairs then striped
- Highest cost, best performance/availability
- ✅ CAN access during rebuild

**RAID Controllers:**
- Physical = more stable, reliable
- Virtual = software-based
- Servers have built-in; standard motherboards need extension card
- Presents multiple disks as single logical drive to OS

### NAS (Network Attached Storage)

**Connection:**
- Ethernet (1 GB to 2.5 GB typical)
- USB
- Adequate for home/SMB

**Brands:**
- Western Digital (WD) = most common
- Synology = vendor lock-in (proprietary drives)
- Runs Linux OS for management

**Capabilities:**
- Media sharing
- File sharing
- Versatile for small/medium environments

**Limitation:** Ethernet bandwidth bottleneck (1 GBps)

### SAN (Storage Area Network)

**Purpose:** High-speed, petabyte-scale data movement in enterprise

**Technology:**
- Fibre Channel network (40 Gbps, 80 Gbps, 100+ Gbps)
- LUN (Logical Unit Number) = data store
- VMDK = virtual disk
- Proprietary hardware/software (e.g., VMAX)

**Infrastructure:**
- Multiple redundancies built-in
- Media controllers convert Ethernet → Fibre Channel
- Expensive switches with port limitations (often restricted to first 8 ports despite many available)

**CapEx vs. OpEx issue:**
- SAN = CapEx (large hardware investment)
- Cloud = OpEx (monthly billing)
- Funding challenges drive architecture decisions

### 3-2-1 Backup Rule (Enterprise Best Practice)

**3 copies** of data
**2 different media types** (cloud, NAS, tape)
**1 offsite location** (third-party like Iron Mountain)

**Typical implementation:**
- Copy 1: Cloud
- Copy 2: NAS (on-site)
- Copy 3: Tape (offsite via third-party)

**Compliance requirements:**
- Legal industry: long-term retention
- HIPAA: years of data retention
- Financial: hardware destruction certificates

**Important:** Backups ≠ RAID
- RAID = local redundancy
- Backups = disaster recovery
- Enterprise needs BOTH

---

# CRITICAL WEAK AREAS

## Must Lock In Before Exam

### 1. **sysprep/ImageX/WDS Workflow** (Chapter 3, Core 2)
- ⚠️ **sysprep MUST run FIRST** (remove hardware, then capture)
- sysprep = PREPARE, ImageX = CAPTURE, WDS = DEPLOY
- Easy to reverse order → incorrect answer

**Drill:** sysprep /oobe /generalize /shutdown → ImageX capture → WDS deploy

### 2. **A Records vs. AAAA Records** (DNS)
- **A** = IPv4 (192.168.1.1)
- **AAAA** = IPv6 (4 A's for 4-octet IPv6)
- Easy to confuse

**Drill:** A = one letter = IPv4, AAAA = four letters = IPv6 (bigger)

### 3. **DNS vs. Network Failure Symptoms**
- **Can access by IP but NOT domain** = DNS problem
- **Can't access by either** = network problem

### 4. **tracert vs. pathping**
- **tracert** = path ONLY
- **pathping** = path + packet loss measurement
- Easy to confuse

### 5. **RAID Rebuild Access**
- **RAID 5** = ❌ CANNOT access during rebuild (blocked until done)
- **RAID 10** = ✅ CAN access during rebuild (mirrored pairs)

### 6. **Windows 11 Hardware: TPM 2.0**
- ⚠️ MANDATORY (often the blocker)
- Not just 4GB RAM or 64GB storage
- TPM 2.0 is frequently the reason systems can't upgrade

### 7. **AC/DC Conversion**
- Wall outlet = AC
- Computer needs = DC
- Power supply converts AC → DC
- ⚠️ Common mistake: reversing input/output

### 8. **20 Concurrent Connections**
- Windows Workstation limit = 20 SMB connections
- NOT 25, 30, or 40
- Must memorize

### 9. **DHCP Failure Signal**
- 169.254.x.x = APIPA = DHCP failed
- NOT a usable IP
- User can't get real IP, reverts to APIPA

### 10. **Antivirus Definition Updates**
- **Daily** (NOT weekly)
- New malware every hour
- Weekly leaves 3-day gap of vulnerability

---

# QUICK REFERENCE

## File System Selection

| Scenario | Answer |
|----------|--------|
| External USB, cross-platform | exFAT |
| Internal C: drive | NTFS |
| Encrypt drive | NTFS + BitLocker |
| Legacy only | FAT32 |
| 5GB file on USB | exFAT or NTFS (NOT FAT32) |

## Boot Troubleshooting Hierarchy

1. Startup Repair (automatic)
2. System Restore
3. bootrec commands
4. SFC /scannow
5. Reset This PC
6. Reimage

## Networking Issue Diagnosis

```
ipconfig /all → check IP address
  ├─ 169.254.x.x? → DHCP failed → ipconfig /release && /renew
  ├─ Valid IP? → check DNS
  └─ No DNS? → ipconfig shows 0.0.0.0 or wrong DNS server

ping 8.8.8.8 → test connectivity
  ├─ Works? → DNS issue (nslookup)
  └─ Fails? → Network/firewall issue

nslookup domain.com → test DNS
  ├─ Works? → DNS is fine
  └─ Fails? → DNS server down/misconfigured
```

## Command-Line Tool Quick Reference

| Issue | Command |
|-------|---------|
| DHCP failed | `ipconfig /release && /renew` |
| Can't resolve domains | `nslookup domain.com` |
| Trace route to host | `tracert host` OR `pathping host` (if need packet loss) |
| Check ports/connections | `netstat -a` |
| Find MAC addresses | `arp -a` |
| Disk corruption | `chkdsk C: /F` |
| System file corruption | `sfc /scannow` |
| List processes | `tasklist` |
| End process | `taskkill /IM processname.exe` |

## Weak Area Focus Areas

### Before Retake:

1. **Chapter 3 sysprep/deployment** → Do 5 more drills
2. **DNS record types** → Memorize A, AAAA, CNAME, MX
3. **RAID comparison** → RAID 0/1/5/10 differences
4. **AC/DC** → Wall is AC, computer is DC
5. **20 concurrent connections** → Lock this in

---

## RECOMMENDED STUDY PATH FORWARD

### Monday & Tuesday: DNS/DHCP Deep Dive
- Pages 442-448 in textbook
- Record types, resolution process, troubleshooting commands
- Lab: Configure DHCP scope, test DNS with nslookup

### Wednesday: RAID Lab
- Hands-on RAID configuration
- Understand rebuild times, fault tolerance
- Physical vs. virtual controllers

### Thursday: Cabling & Infrastructure
- Chapter 6 content
- Cable types, connectors, standards

### Ongoing Drills:
- Chapter 3 weak areas (sysprep, deployment, architecture upgrade rules)
- DNS/DHCP scenarios
- Malware removal sequence (identify → quarantine → remediate → educate)

---

*Comprehensive Study Guide — CompTIA A+ Core 1 & Core 2*  
*Last Updated: September 16, 2026*  
*Student: Louis*