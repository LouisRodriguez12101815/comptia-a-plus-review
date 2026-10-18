# A+ Core 1 Chapters 4 and 9 content verification

**Reviewed:** 2026-10-18
**Branch/base:** `content/core1-laptop-wireless-chapters`, based on current `origin/main` at `6da65a3b2f98f2360d7c44cb890af0461329ac19`
**Exam:** CompTIA A+ Core 1, 220-1201 (V15)
**Objectives document:** CompTIA A+ Core 1 (220-1201) V15, Version 4.0; official PDF URL: <https://lecbyo.files.cmp.optimizely.com/download/34be017cb73211ef8985a6f347fbf652>. Reviewed sections 1.1–1.3 (PDF p. 3), 2.2 and 2.6–2.7 (PDF pp. 5–6), 3.1 and 3.3 (PDF p. 8), and 5.5 (PDF p. 10). The original CompTIA-hosted URL returned HTTP 403 on this final recheck; the exact v4.0 section wording was cross-checked in an indexed searchable copy of the document, while the official source/version/section reference remains the one recorded above. The document says the examples are not exhaustive. The objective list sets exam scope; it does not settle technical behavior.

## Provenance and source limits

The user supplied two RTF study attachments. Both were fully converted with the already available `pandoc` command and read before authoring:

- `ch4-laptopAndMobileDeviceHardware.rtf`, SHA-256 `f87a5f6884c12c4c4bdc7629566c280474ecf5e31801d93e31e85ae72c1c65c7`.
- `ch9-wireless&sohoNetworking.rtf`, SHA-256 `5a67556cf46213af3cd548373e6c8058786ebc512c99181ed711f0c1d6cfd7ab`.

The files identify themselves only as generic Core 1/CompTIA material. Neither supplies a verifiable author, publisher, title page, publication year, or textbook edition. No edition or textbook identity is inferred. Their explanations and 40 supplied review-question keys were treated as candidate claims, not as answer authority. New lesson prose and practice questions are original; they do not reproduce attachment passages or questions.

## Objective-to-teaching evidence and matrix decisions

| Objective | Before → after | Subtopic evidence in the authored lesson | Decision and remaining boundary |
|---|---|---|---|
| 1.1 | missing → covered | Explicit list: Wi-Fi antenna connector/placement; camera/webcam; microphone; battery; keyboard/keys; RAM; HDD/SSD; wireless cards; physical privacy/security including biometrics and near-field scanner features. `core1-ch4-mobile-hardware`: **Wireless cards, antennas, privacy, and sensors** teaches each listed part, inspection clues, model-compatible replacement boundaries, antenna lead placement and privacy/sensor checks. **Battery health, safety, and power adapters**, **Memory and storage replacement**, and **Keyboard, pointing devices, and touch input** teach monitoring, compatibility decisions, and post-replacement checks. **What to inspect and what to verify** teaches model/service-guide selection and safe diagnosis; lab `core1-laptop-inspection-planning` applies this process. | Covered because the notes teach the listed monitoring and replacement-planning task across each named hardware item. The lab supports application but is not the basis by itself. Exact procedures remain model-specific. |
| 1.2 | missing → covered | Explicit list: USB/USB-C/microUSB/miniUSB; Lightning; NFC; Bluetooth; tethering/hotspot; stylus; headsets; speakers; webcam; docking station; port replicator; trackpad/drawing pad/track points. `core1-ch4-mobile-hardware`: **Mobile connection methods** compares the listed connection families and their compatibility boundaries; **Accessories, docks, and port replicators** compares the listed accessories, docks and input devices by use and host support. | Covered because the notes teach the listed connectivity/accessory choices and distinguish connector form from supported protocol/function. Cards and scenarios reinforce but do not establish coverage. |
| 1.3 | missing → partial | `Basic mobile connectivity and application support`: Wi-Fi/cellular state, hotspot, Bluetooth pairing, app permissions and managed-device policy. | Partial. Full SIM/eSIM activation, location/synchronization and other complete configuration tasks need deeper teaching. |
| 2.2 | missing → covered | Explicit list: frequencies (2.4, 5 and 6 GHz); channels (regulations, selection, widths); Bluetooth; 802.11 standards; NFC; RFID. `core1-ch9-wireless-soho`: **802.11 generations and supported bands** compares standard generations and band support; **Bands, channel widths, and regional rules** teaches frequencies, width, channel choice and jurisdiction limits; **Bluetooth, NFC, and RFID** differentiates each named technology. **How Wi-Fi efficiency features actually help** adds beamforming, OFDMA, BSS coloring, and DFS without implying universal gains. | Covered because the notes teach each listed wireless technology and relevant comparisons. Practice items reinforce distinctions but are not the coverage evidence. Deployment details remain device- and region-specific. |
| 2.6 | partial → covered | Explicit IP-addressing list: IPv4 private/public; IPv6; APIPA; static/dynamic; subnet mask; gateway. `core1-ch9-wireless-soho` **Client addressing: DHCP, gateway, DNS, and verification** teaches each listed distinction and a troubleshooting sequence. Existing mapped notes `n10-ch7` and `n10-ch8` provide the broader addressing foundation. The new **SOHO topology and configuration sequence** teaches router/AP, management and wireless configuration context; `core1-soho-configuration-practice` applies the reasoning in a fictional paper setup. | Covered because mapped notes teach the full listed IP-addressing task and basic SOHO context; the exercise practices application but is not the sole evidence. No live router or ISP change is required. |
| 2.7 | partial → covered | Explicit internet types: satellite, fiber, cable, DSL, cellular, WISP. Explicit network types: LAN, WAN, PAN, MAN, SAN, WLAN. `core1-ch9-wireless-soho` **Network scope and internet access types** compares every listed category and gives scope/availability distinctions. | Covered because the notes teach and compare all named types. No universal provider-speed ranking is asserted. |
| 3.1 | partial → partial | Explicit v4.0 list: LCD (including IPS, TN, VA); OLED; Mini-LED; touchscreen/digitizer; inverter; pixel density; refresh rates; screen resolution; color gamut. `core1-ch4-mobile-hardware` **Display technologies and the legacy inverter** introduces each listed technology/attribute, touchscreen/digitizer service boundaries and CCFL inverter versus LED-driver/OLED distinctions; existing `core1-ch3-peripherals` **Video connectors and signal types** supplies connector and display-path context. | Partial because listing and defining the attributes does not fully teach the comparison requested. The new notes say TN, IPS and VA differ in viewing, response, contrast and color behavior, but do not explain the usual tradeoffs among these LCD modes sufficiently for a learner to compare them. Brightness and contrast ratio are not separately enumerated attributes in v4.0; they are useful supplemental material, not the sole reason for partial status. CompTIA states the list is not exhaustive, so this distinction does not imply those subjects are categorically out of scope. |
| 3.3 | partial → partial | `Memory and storage replacement`: SO-DIMM/DIMM, DDR generation/keying, ECC, capacity/speed/rank and channel population; model-specific compatibility and verification. | Added supporting teaching; a fuller comparison of RAM characteristics across platforms and generations is still needed. |
| 5.5 | partial → partial | `Client addressing...` and paper SOHO exercise: link/association, DHCP, address/prefix, gateway, DNS and application isolation. | Adds practice for a subset only. The broad network-symptom and tool coverage remains incomplete. |
| 5.4 | missing → missing | No mapping added. Battery, input and adapter checks are not a substitute for teaching the full mobile troubleshooting objective. | Explicitly not covered by these chapters. |

Only these 9 objective records were edited in `content/objectives.json`; global `reviewed` remains `false`. Status changes are supported by notes plus applicable practice, not by a card or quiz question alone. Domain weights apply at domain level; objective counts indicate content assigned to mapped topics. Weighted coverage is a planning estimate and does not establish exam readiness.

## Claim checks and corrections

| Claim in supplied material / risk | Verification and authoring treatment |
|---|---|
| Bluetooth cannot provide phone tethering | Incorrect as an absolute. Bluetooth Personal Area Networking supports network access, and some operating systems expose Bluetooth tethering. Apple documents Personal Hotspot options including Bluetooth. The lesson says capability depends on platform, carrier and supported profile. |
| Every LCD has a CCFL inverter | Outdated. CCFL backlights use inverter circuitry; LED-backlit LCDs use LED driver circuitry, while OLED pixels emit light without a separate backlight. The lesson explicitly limits the inverter to CCFL models and requires model-specific service information. |
| A full discharge recalibrates/fixes any lithium-ion battery | Unsupported and unsafe as general advice. Battery gauge procedures are vendor/model-specific; calibration may update an estimate and cannot restore chemically worn capacity. No routine deep-discharge recommendation or repair promise is made. |
| Any higher-watt charger is compatible | Incomplete. Verify device input/connector or USB-PD profiles, cable capability, port charging support and model requirements. USB-C shape and wattage alone do not establish compatibility. |
| Wi-Fi “speed/range” follows generation labels | Overstated. Standards define capabilities/PHY rates; actual client throughput depends on both endpoints, streams, channel width, RF conditions, contention, retries, overhead, backhaul and ISP service. |
| 2.4-GHz channels 1/6/11 apply everywhere | Underqualified. This is a common U.S. 20-MHz plan, not a global rule. Use the local regulatory domain, supported device channels and site conditions. DFS also applies only to designated channels/regions and requires compliant radar response. |
| WPA2 plus AES uniquely means WPA3 | Incorrect/ambiguous. WPA2-Personal commonly uses a shared passphrase with AES-CCMP; WPA3-Personal uses SAE. Authentication/key establishment and cipher/encryption are described separately. |
| Changing the SSID secures a router; MAC filtering is strong authentication | Incorrect security implication. SSID is a label and MAC addresses can be copied. The lesson prioritizes admin credential changes, supported firmware/security settings and strong WLAN authentication. An allowlist is only a limited administrative filter. |
| Fiber is always faster / Wi-Fi rates equal user throughput | Unsupported absolutes. Scenarios compare stated plan rates and user needs; the lesson distinguishes PHY/link rate from application throughput. |
| Wi-Fi 6 features eliminate interference or always improve a client | Overstated. Beamforming can improve link quality under supported conditions; OFDMA schedules compatible clients for efficiency; BSS coloring can support spatial reuse under thresholds; none removes all interference or guarantees a per-client speedup. DFS is described as regulatory radar sharing, not a feature introduced by one Wi-Fi generation. |
| MAC filtering and ambiguous “best security” questions | The supplied keys do not consistently distinguish security mode, authentication and cipher. New scenarios state endpoint/security assumptions and explain why WPA2/AES does not uniquely identify WPA3. |
| Existing `q-cls-023` swollen-battery key and explanation | Preserved the existing ID and correct concept, fixed the malformed keyed phrase “Swollen (deprecated) battery,” and removed the blanket “replace it right away” instruction. The revised explanation treats swelling as a serious clue, advises against pressing/puncturing, and directs the learner to safe, model-specific manufacturer service/disposal instructions. |

### Supplied review-question audit (order in each attachment)

These are review dispositions, not imported exam questions. A key can be directionally plausible while still needing its assumptions stated; “retain concept” means the general claim is teachable, not that the attached wording was copied into the site.

| Attachment question | Independent disposition |
|---|---|
| Chapter 4 Q1 | Retain the concept: consult the exact manufacturer support/service source before choosing a part. |
| Chapter 4 Q2 | Qualify: the inverter answer applies to CCFL backlights only. |
| Chapter 4 Q3 | Ambiguous/outdated: an inverter is not in every LCD; service assembly boundaries vary by model. |
| Chapter 4 Q4 | Qualify: temporarily disabling a touchpad can isolate a typing/palm-input symptom, but is a reversible test, not proof of hardware failure. |
| Chapter 4 Q5 | Correct the absolute claim: Bluetooth tethering is possible on supported PAN/OS/carrier combinations. |
| Chapter 4 Q6 | Do not preserve as a generic selection rule: exact module-generation/pin-count requirements depend on the module and laptop specification. |
| Chapter 4 Q7 | Qualify: calibration is only a vendor/model procedure for a stated use; no universal “first” calibration step. |
| Chapter 4 Q8 | Ambiguous: NFC may help pair/configure, while Bluetooth provides the sustained accessory link; “wireless” alone does not make them equivalent answers. |
| Chapter 4 Q9 | Qualify: cable locks require a compatible chassis slot and a secured anchor. |
| Chapter 4 Q10 | Correct the scope: a DC-to-AC inverter is the legacy CCFL description, not the universal modern display design. |
| Chapter 4 Q11 | Unsupported/source-dependent claim; not carried forward as teaching. |
| Chapter 4 Q12 | Retain with boundary: a digitizer detects pen/touch, but integration and replacement scope are model-specific. |
| Chapter 4 Q13 | Underdetermined by visual width alone; verify the model and module notch/specification rather than guessing generation. |
| Chapter 4 Q14 | Qualify: a dock versus port replicator depends on required ports, display path, host support and power. |
| Chapter 4 Q15 | Qualify: thermal throttling is one form of dynamic performance management; do not use it as a universal explanation for slow CPU behavior. |
| Chapter 4 Q16 | Correct the incomplete key: wattage does not establish charger compatibility without voltage, connector/polarity or USB-PD, cable and model checks. |
| Chapter 4 Q17 | Reject as universal advice: routine full discharge does not restore lithium-ion capacity; gauge calibration is model-specific. |
| Chapter 4 Q18 | Qualify: 2.5-inch HDDs are common in some laptops, but storage may be M.2 or another supported form. |
| Chapter 4 Q19 | Qualify: a USB Bluetooth adapter may be an option if supported; “cheapest” is not established without actual products/prices. |
| Chapter 4 Q20 | Ambiguous/historical: docking-station bays and features vary; verify the exact dock rather than assume drive bays. |
| Chapter 9 Q1 | Retain with context: 802.11b/g are 2.4-GHz standards, while client/AP compatibility and permitted channels still matter. |
| Chapter 9 Q2 | Qualify: an SSID is the WLAN name, but it need not be globally unique and is not a password. |
| Chapter 9 Q3 | Ambiguous: 802.11ac features can improve PHY rate; MIMO, channel width, beamforming and endpoint configuration all affect results. |
| Chapter 9 Q4 | Underdetermined without mode/client context; distinguish WPA3 authentication from cipher/encryption. |
| Chapter 9 Q5 | Reject broad absolutes about every Wi-Fi 6 deployment being faster, reaching the same range, serving “more users” or using less power in every case. |
| Chapter 9 Q6 | Correct the security implication: change default admin credentials and enable supported WLAN authentication/encryption; renaming the SSID alone is not a control. |
| Chapter 9 Q7 | Underdetermined as a universal provider ranking; compare stated local plans, upload, latency, availability and cost. |
| Chapter 9 Q8 | Retain as a high-level IPv4 NAT description, with translation behavior dependent on the configured NAT mode. |
| Chapter 9 Q9 | Qualify: channels 1/6/11 are a common U.S. 2.4-GHz 20-MHz plan, not a universal answer. |
| Chapter 9 Q10 | Correct the terminology: headline PHY/link rate is not actual application/user throughput. |
| Chapter 9 Q11 | Qualify: enter the WLAN credential and configure the network/security mode; an SSID is not itself a credential. |
| Chapter 9 Q12 | Do not teach one textbook frequency list as exhaustive: RFID frequency bands vary by tag/system; NFC is 13.56 MHz. |
| Chapter 9 Q13 | Correct/qualify: BSS coloring may enable spatial reuse under thresholds; it does not remove interference. DFS is not a “new in 802.11n” feature. |
| Chapter 9 Q14 | Treat TKIP as legacy/deprecated; do not recommend it for a new WLAN. |
| Chapter 9 Q15 | Correct the standards conflation: OFDMA is an 802.11ax/Wi-Fi 6 efficiency feature; WPA3 is a separate security program/mode and does not define the Wi-Fi generation. |
| Chapter 9 Q16 | Qualify: MAC allowlists match presented addresses but are not strong authentication because addresses can be copied. |
| Chapter 9 Q17 | Vendor/UI-specific; a firewall can filter flows, but do not present “ACL” as a universal consumer-router interface label. |
| Chapter 9 Q18 | Correct: AES-CCMP does not uniquely indicate WPA3; WPA2 modes can use AES-CCMP too. |
| Chapter 9 Q19 | Retain Bluetooth’s 2.4-GHz fact; exclude the attachment’s malformed mmWave frequency text and do not infer broader bands from it. |
| Chapter 9 Q20 | Retain with scope: a host generally needs a default route/gateway for off-subnet IPv4 destinations; correct DHCP lease settings also include address/mask and resolver information. |

### Authoritative technical references

References below support technical behavior, not the completeness of an objective. Retrieved/reviewed 2026-10-17. Vendor procedures apply only to the named model/product family.

- CompTIA A+ 220-1201 V15, objectives document v4.0, sections listed above: <https://lecbyo.files.cmp.optimizely.com/download/34be017cb73211ef8985a6f347fbf652>.
- Bluetooth SIG, Personal Area Networking Profile 1.0, network access role: <https://www.bluetooth.com/specifications/specs/personal-area-networking-profile-1-0/>.
- Apple, iPhone Personal Hotspot, supported sharing paths including Bluetooth: <https://support.apple.com/guide/iphone/share-your-internet-connection-iph45447ca6/27/ios/27>.
- NFC Forum, NFC frequency, range and use cases: <https://nfc-forum.org/learn/nfc-technology/>.
- USB-IF, USB Power Delivery negotiation and cable considerations: <https://www.usb.org/usb-charger-pd>; USB cable/connector resources: <https://www.usb.org/cable_connector>.
- Apple, choosing a Mac power adapter (model/port and wattage guidance): <https://support.apple.com/en-us/109509>.
- HP, notebook AC adapter identification and compatibility: <https://support.hp.com/us-en/document/ish_2025983-1502949-16>.
- Dell, USB-C power-delivery capabilities by supported model/port: <https://www.dell.com/support/kbdoc/en-us/000224141/power-delivery-capabilities-of-usb-c-ports-on-latitude-and-precision-laptops>.
- Apple, check battery condition: <https://support.apple.com/guide/mac-help/check-the-condition-of-your-computers-battery-mh20865/mac>; model-specific battery-health management example: <https://support.apple.com/en-us/102588>.
- Microsoft, Surface repair safety guidance and service-guide index (the cited safety procedure is model-family guidance, not a universal repair sequence): <https://learn.microsoft.com/en-us/surface/service-guides/surface-repair-safety-guidelines>, <https://learn.microsoft.com/en-us/surface/service-guides/surface-service-guides>; example Surface Laptop 7th Edition guide used in the paper exercise: <https://learn.microsoft.com/en-us/surface/service-guides/surface-laptop-7/surface-laptop-7-component-disassembly-and-reassembly>. This does not authorize applying that procedure to another model.
- Analog Devices, MAX8722C CCFL inverter and CCFL inverter design note: <https://www.analog.com/en/products/max8722c.html>, <https://www.analog.com/en/resources/design-notes/high-power-ccfl-backlight-inverter.html>.
- Texas Instruments, TPS68000 LED backlight driver: <https://www.ti.com/product/TPS68000>.
- Intel, 2.4-GHz vs 5-GHz behavior, actual Wi-Fi throughput and channel planning: <https://www.intel.com/content/www/us/en/products/docs/wireless/2-4-vs-5ghz.html>, <https://www.intel.com/content/www/us/en/support/articles/000059666/wireless.html>, <https://www.intel.com/content/www/us/en/support/articles/000058989/wireless/intel-killer-wi-fi-products.html>.
- Cisco, Business Wireless 151AXM datasheet (feature/product/regulatory examples): <https://www.cisco.com/c/en/us/products/collateral/wireless/business-100-series-mesh-extenders/busines-mesh-extender-ds.html>; BSS coloring behavior and thresholds: <https://www.cisco.com/c/en/us/td/docs/wireless/controller/9800/17-12/config-guide/b_wl_17_12_cg/m_bss_coloring_ewlc.html>.
- U.S. FCC, 6-GHz rules (United States only; local rules differ): <https://docs.fcc.gov/public/attachments/FCC-24-125A1_Rcd.pdf>, <https://docs.fcc.gov/public/attachments/FCC-23-86A1.pdf>.
- Wi-Fi Alliance, WPA3 introduction including SAE: <https://www.globenewswire.com/fr/news-release/2018/06/26/1529297/0/en/wi-fi-alliance-introduces-wi-fi-certified-wpa3-security.html>.
- Cisco, WPA3 deployment guide: <https://www.cisco.com/c/en/us/products/collateral/wireless/catalyst-9100ax-access-points/wpa3-dep-guide-og.html>.
- Microsoft, WLAN authentication and encryption schema: <https://learn.microsoft.com/en-us/windows/win32/nativewifi/wlan-profileschema-authencryption-security-element>.
- CISA, securing network devices and default credentials/firmware hygiene: <https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-278a>.

## Authored scenarios and exercises

The 27 original scenario questions encode explicit assumptions: the named service/model is the authority for replacement; a scenario gives the user a particular feature/support profile where needed; Wi-Fi client and AP capabilities must be compatible; a stated local regulatory domain controls allowed channels; plan speeds are given when comparing internet services; and fault-isolation steps identify evidence without claiming a symptom proves a root cause. Each wrong option has an explanation. Choice text is stored as a position-independent regression pin after verification against the lesson and references; pins remain reviewable and are not source authority.

- `core1-laptop-inspection-planning`: paper-first manufacturer-guide research using the Microsoft Surface Laptop 7th Edition guide as a named, model-specific example. It does not require opening a device, touching a battery, ordering a part, or attempting calibration.
- `core1-soho-configuration-practice`: fictional/private addressing and WLAN setup/troubleshooting. Learners plan address/mask, DHCP, gateway, DNS, choose a supported wireless/security mode, and verify in sequence. The paper alternative requires no live router, account or network changes.
- `core1-mobile-hardware-map.html` and `core1-soho-network-path.html` are static responsive SVG diagrams with title, description and text equivalents; physical components and SOHO arrangements are labeled illustrative, not universal.

## Attachment answer-key dispositions

The supplied 40 questions were reviewed as candidate material and were not imported. The following key/explanation patterns required correction or qualification. Existing `q-cls-023` retained its ID and topic but its keyed label and blanket immediate-replacement explanation were corrected: Bluetooth tethering was wrongly denied as a universal capability; a CCFL inverter was treated as universal; an “higher wattage” adapter answer omitted connector, voltage, cable/PD and model compatibility; battery drain/calibration was described too generally; display and accessory serviceability was assumed uniform; the Wi-Fi 6 user-speed/range claims were absolute; WPA2/AES was conflated with WPA3; changing the SSID was treated as a security control; MAC filtering was overstated; worldwide channel 1/6/11 guidance lacked region/width assumptions; DFS was incorrectly assigned as a feature newly introduced by a particular generation; and rated PHY rates were presented as actual client throughput. Other keys that depend on named model, regional plan, stated provider offering, or exact wording were not reused as public answers. The new quiz scenarios state those assumptions directly.

For `q-cls-023`, the keyed choice remains the symptom-level best answer, not a complete diagnosis. Microsoft's Surface repair-safety guidance identifies expansion/swelling as a battery-damage sign, prohibits puncturing/impact/bending/crushing, and says a battery exhibiting the listed signs must be replaced; its repair context requires the applicable Surface guide and qualified service process. Apple's device-safety guidance says to discontinue use when battery damage is suspected and warns that untrained repair can affect safety. The question therefore advises stopping use/charging when safe, avoiding physical manipulation, and following model-specific service/disposal guidance; it does not tell the learner to remove or immediately replace a battery themselves. These sources support safety escalation, not a universal repair procedure: <https://learn.microsoft.com/en-us/surface/service-guides/surface-repair-safety-guidelines> (Surface repair safety and lithium-ion battery inspection) and <https://support.apple.com/guide/iphone/important-safety-information-iph301fc905/26/ios/26> (suspected device/battery damage; iPhone-specific).

## Remaining scope gaps and limitations

- Objective 1.3 needs fuller SIM/eSIM, location, synchronization and mobile application/network setup teaching.
- Objective 3.1 remains partial because the notes do not yet teach the comparative tradeoffs among TN, IPS and VA LCD modes. Brightness and contrast ratio are useful supplemental context but are not separately enumerated in the v4.0 objective list; they are not the identified teaching gap. Objective 3.3 needs a fuller RAM generation/platform comparison.
- Objective 5.4 remains missing; this addition does not try to complete it. Objective 5.5 remains partial.
- Attachment edition/publisher/author provenance could not be established from the supplied files.
- Regulatory channel and Wi-Fi 6 GHz availability is jurisdiction- and product-specific; do not treat U.S. FCC rules as global guidance.
- No deployed preview or physical hardware was available for verification. Local browser emulation, when completed, is not evidence from an actual phone/laptop or router.
- Existing unrelated repository warnings and UI behavior must be reported separately from package regressions.

## Validation record

Validation completed on this branch after the content changes:

- `npm run report:objectives`: passed on the final content/matrix state. Core 1 reports 12 covered, 13 partial and 2 missing objectives, with a preliminary weighted content estimate of about 65%. The covered objective records are reflected in the subtopic-to-notes table above; 220-1201 objective 5.4 remains the highest-ranked gap. There is no `npm run report` alias in this checkout.
- `npm run check:content`: 0 errors, 25 warnings. This matches the pre-change baseline of 0 errors and 25 warnings; none of the warnings is for the new lessons or scenarios. The existing warnings concern other chapters’ explanation phrasing, choice counts/answer balance, and two unpinned Network+ answers.
- `npm run test:objectives`: 11/11 passed. The objective tests include shared CLI/dashboard agreement, objective identity, ranking and item counts.
- `npm test`: passed all constituent suites (155 tests across game, practice, subnet, content-check, report and objectives). The final run includes the revised 3.1 matrix note.
- `npm run lint`: passed with 0 errors and 3 existing `<img>` optimization warnings in `SectionBlocks.tsx` and lab pages; no application code was changed here.
- `npm run typecheck`: passed.
- The requested default `npm run build` was attempted on the final state and failed in this environment when Turbopack tried to create a worker and bind an internal port (`Operation not permitted`). The same production build using Next.js’s supported webpack backend, `npm run build -- --webpack`, passed and generated all 69 static pages. This is an environment/backend limitation, not a content compilation failure.
- Local production browser walkthrough (Playwright/Chromium, 1365×900 desktop and 390×844 mobile emulation): both Core 1 lessons appeared in the hub and notes search; all 11/9 lesson sections and ChapterStrip links rendered; the 16/18 flashcards and 12/15 quiz questions were available under Core 1 and absent under Core 2 filtering; answer keys and missed-answer explanations rendered; both paper exercises loaded; the Core 1 visual browser listed both diagrams, and each diagram linked to its corresponding lab. Coverage opened the mapped lesson. Keyboard Tab reached an actionable link. No horizontal overflow appeared on the hub or lesson pages.
- Axe scans across nine relevant surfaces at both widths (18 scans total) found 0 serious/critical and 0 other violations. The scans included both lesson pages, card and quiz pages, both labs, the Core 1 visual browser and each standalone diagram.
- At 390px, `/labs/*` has 409px document scroll width (19px beyond the viewport). This is pre-existing: the same measurement occurs on `/labs/two-subnet-lan`, so it is not introduced by these labs. The new hardware evidence table scrolls within its focusable table region (478px content in a 358px viewport); this region is keyboard reachable. The SOHO lab tables also remain within their focusable horizontal table regions. No application code was changed to address the shared TrackBar overflow.
- No deployed preview or physical laptop, phone, router or projector was used for the local implementation walkthrough. Phone-sized viewport results are emulation only. The existing Core 1 hub still labels the shared Labs tool “In the CCNA track”; these new labs are reachable through the new Core 1 diagrams and their related links, but the site-wide tool label/navigation behavior was not changed as part of this content package.
- `git diff --check`: passed. JSON parsing, duplicate-ID/slug checks and all 27 new scenario answer-key pin comparisons passed. Global `reviewed` remains `false`.
