---
name: hardware-diagram-designer
description: Build accurate, interactive diagrams of PC hardware (motherboards, slots, sockets, headers, RAM, storage, power connectors, cooling, laptop internals) that drill the A+ Core 1 question types. Use when a hardware chapter needs a board map, a part-identification drill, a compatibility comparison, or a symptom-to-component exercise.
---

# Hardware Diagram Designer

Before applying this workflow, read the [workflow contract](../../WORKFLOW.md). This skill specializes [exam-visual-designer](../exam-visual-designer/SKILL.md) for physical hardware. Follow that skill for the fact list, the `visual-facts` block, the text budget, accessibility and verification, and this one for what to draw and how to drill it.

The reference build is `public/visuals/core1-ch1-motherboard-map.html`. Copy its structure (one parts table drives the drawing, the labels, the explore panel and every drill) rather than starting from a blank page.

## 1. What the exam asks about hardware

Core 1 objectives 3.3 (RAM), 3.4 (storage), 3.5 (motherboards, CPUs, add-on cards), 3.6 (power) and 5.1 (troubleshoot motherboards, RAM, CPU, power) produce seven recurring question types. Check `content/questions.json` for the chapter's existing items and tag each new drill with one of these.

| # | Question type | Typical stem | Diagram that answers it |
| --- | --- | --- | --- |
| 1 | Identify by location or look | "Which component is labeled C?" "What is this connector?" | Board map with hidden labels; connector face close-up |
| 2 | Pick the slot, port or header | "Where does the GPU go?" "Where do the case LED wires connect?" | Board map with an install prompt; learner taps the target |
| 3 | Compatibility | "Will this DDR4 module fit?" "Which board fits a small case?" "Which socket matches?" | Side-by-side faces showing the keying notch, pin rows, or outlines to the same scale |
| 4 | Power and cabling | "Which cable powers the CPU?" "How many watts from an 8-pin PCIe?" | Connector faces with pin counts and rail labels; cable-to-header matching |
| 5 | Firmware setting | "What do you enable for a hypervisor / Windows 11?" | The BIOS/UEFI chip as the target, with the setting named in the feedback (VT-x/AMD-V, TPM, Secure Boot, boot order, passwords, fan monitoring) |
| 6 | Symptom to component | "Clock resets after unplugging." "Beeps after adding RAM." "Shuts down under load." | Troubleshoot drill: symptom prompt, learner taps the part to check first |
| 7 | Install order (PBQ style) | "Put the CPU install steps in order." | Sequence stepper over the drawing: socket lever, align, paste, cooler, fan header |

Performance-based questions often ask the learner to drag labels onto a board or cables onto connectors. A tap-to-place drill with a keyboard path practices the same skill without drag-only interaction.

## 2. Facts that must be right

Record each with an objective key and a source in the fact block. Common anchors (verify against the source before reuse, never from memory alone):

- **Form factors:** ATX 305 × 244 mm, microATX 244 × 244 mm, mini-ITX 170 × 170 mm. Draw outlines to the same scale, aligned at the rear I/O corner.
- **Power:** 24-pin ATX main (20-pin on older boards; 20+4 cables); 4/8-pin 12 V CPU (EPS12V/ATX12V); PCIe slot 75 W, 6-pin 75 W, 8-pin 150 W; SATA power 15-pin; Molex 4-pin. Rails +3.3, +5, +12 V DC.
- **Slots and storage:** PCIe x1/x4/x8/x16 (a smaller card fits a larger slot); M.2 carries NVMe or SATA depending on the slot and key; SATA data 7-pin L-keyed, 6 Gbps.
- **Memory:** DDR4 and DDR5 desktop DIMMs are both 288-pin and keyed by notch position, so they are not interchangeable; laptops use SO-DIMMs. Dual channel follows the board manual's slot table. Do not draw notch offsets or pin counts for other generations without a JEDEC or vendor source.
- **CPU:** LGA has pins in the socket (Intel, AMD AM5), PGA on the CPU (AMD AM4). Architectures (x64, ARM) are not socket types.
- **Headers:** front panel (power/reset switches, power/HDD LEDs), USB 2.0 (9-pin), USB 3.x (19-pin), front audio, fan (3-pin DC, 4-pin PWM), TPM.
- **Firmware and battery:** CMOS battery (CR2032) keeps the clock and settings; clear-CMOS jumper resets settings and passwords; virtualization needs CPU support plus the UEFI setting.

Exam traps belong in the feedback, one per part (for example "M.2 is a form factor, NVMe is a protocol").

## 3. How to draw hardware

- **Representative, not a model.** Draw a typical layout and say so in the caption. Positions that hold on most boards: rear I/O on one edge, CPU socket near it with CPU power above, DIMMs beside the socket, 24-pin on the far edge, PCIe slots below the socket, chipset and SATA toward the lower corner, front-panel and USB headers along the bottom edge. Say "positions vary"; the tested facts are types, counts and keys.
- **Draw the identifying feature.** Each part needs the detail that tells it apart: pin rows on the 24-pin and CPU 8-pin, alternating colored DIMM pairs, the length difference between x1 and x16, the coin cell, the L key, the heat sink fins on the chipset. A plain labeled rectangle is not enough.
- **Scale honestly.** Only draw to scale what the source gives (board outlines, relative slot lengths). Mark everything else schematic in `simplifications`.
- **Labels like silkscreen.** On the board use the short names printed on real boards (`CPU_FAN`, `F_PANEL`, `CLR_CMOS`, `SATA`), 12 px or larger, with a halo (`paint-order: stroke`) so they read over parts. Full names go in the panel and the `aria-label`.
- **Phone layout.** A full board stays legible only around 600 px wide. Keep the SVG at `min-width: 600px` inside the focusable scrolling `.stage` region and tell phone users to scroll sideways. Close-up figures (a connector face, form-factor outlines) should fit without scrolling.
- Theme with the page tokens, including a board color pair (`--pcb`, `--pcb-line`) defined for light and dark.

## 4. Interaction pattern

1. **Explore:** labels on; tapping or pressing Enter on a part shows what it is, two or three tested facts and one exam trap.
2. **Find it: install** (question types 1, 2, 4, 5): labels hidden; a prompt names a job; the learner taps the part. Accept every correct part (an x1 card fits any PCIe slot) and explain why.
3. **Find it: troubleshoot** (type 6): symptom prompts from objective 5.1; the answer is the part to check first, with the fix in the feedback.
4. **Compare** (type 3) and **Order** (type 7) as separate figures when the chapter needs them.

Every part is a focusable SVG group with `role="button"`, an `aria-label` and Enter/Space handling. Feedback marks the right part and the wrong pick with color plus text. Prompts shuffle; scores stay on the page.

## 5. Verify

- Walk every prompt and confirm each accepted answer against the fact list.
- Check that no label overlaps another or leaves the board at the drawn width, in light and dark, at 390 px (scroll) and 1000 px.
- Keyboard: tab through every part, answer a prompt with Enter, move to the next prompt.
- `npm run audit:visuals -- --check`, `npm run check:content`; register the visual in `content/track-visuals.json` under the chapter's topic id.
