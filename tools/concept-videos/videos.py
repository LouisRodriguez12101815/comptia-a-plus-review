from manim import *
import hashlib, json, os, subprocess

BLUE_C = "#58C4DD"
TEAL_C = "#5CD0B3"
YELLOW_C = "#FFD866"
CORAL_C = "#FF6B6B"
GREY_C = "#8A8F98"

HERE = os.path.dirname(os.path.abspath(__file__))
VOICE = os.path.join(HERE, "voices", "en-us-lessac-medium.onnx")
CACHE = os.path.join(HERE, "tts_cache")
OUT = os.path.join(HERE, "meta")
os.makedirs(CACHE, exist_ok=True)
os.makedirs(OUT, exist_ok=True)



DOMAINS = {
 "1": ("Networking concepts", 23, [("1.1","Explain concepts related to the OSI reference model"),("1.2","Compare and contrast networking appliances, applications, and functions"),("1.3","Summarize cloud concepts and connectivity options"),("1.4","Explain common networking ports, protocols, services, and traffic types"),("1.5","Compare and contrast transmission media and transceivers"),("1.6","Compare and contrast network topologies, architectures, and types"),("1.7","Given a scenario, use appropriate IPv4 network addressing"),("1.8","Summarize evolving use cases for modern network environments")]),
 "2": ("Network implementation", 20, [("2.1","Explain characteristics of routing technologies"),("2.2","Given a scenario, configure switching technologies and features"),("2.3","Given a scenario, select and configure wireless devices and technologies"),("2.4","Explain important factors of physical installations")]),
 "3": ("Network operations", 19, [("3.1","Explain the purpose of organizational processes and procedures"),("3.2","Given a scenario, use network monitoring technologies"),("3.3","Explain disaster-recovery concepts"),("3.4","Implement IPv4 and IPv6 network services"),("3.5","Compare and contrast network access and management methods")]),
 "4": ("Network security", 14, [("4.1","Explain the importance of basic network security concepts"),("4.2","Summarize various types of attacks and their impact to the network"),("4.3","Given a scenario, apply network security features, defense techniques, and solutions")]),
 "5": ("Network troubleshooting", 24, [("5.1","Explain the troubleshooting methodology"),("5.2","Given a scenario, troubleshoot common cabling and physical interface issues"),("5.3","Given a scenario, troubleshoot common issues with network services"),("5.4","Given a scenario, troubleshoot common performance issues"),("5.5","Given a scenario, use the appropriate tool or protocol to solve networking issues")]),
}
SPOKEN = lambda code: code.replace(".", " point ")


def P(x, y):
    return np.array([x, y, 0.0])


def synth(text):
    key = hashlib.md5(text.encode()).hexdigest()
    wav = os.path.join(CACHE, key + ".wav")
    if not os.path.exists(wav):
        subprocess.run(["python3", "-m", "piper", "-m", VOICE, "--length-scale", "1.12", "-f", wav],
                       input=text.encode(), check=True, stderr=subprocess.DEVNULL)
    dur = float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav]).decode())
    return wav, dur


class CV(Scene):
    """Base: objective card -> one concept -> tie back to the objective. Narrated."""
    SLUG = ""; TITLE = ""; CODE = ""; TOPIC = ""; QID = ""
    NOTES = ""; DESC = ""; INTRO = ""; OUTRO = ""; TAKEAWAY = ""

    # ---- narration sync ----
    def say(self, text):
        self.hold()
        wav, d = synth(text)
        t0 = self.renderer.time
        self.add_sound(wav)
        self._end = t0 + d + 0.35
        self.cues.append([round(t0, 2), round(t0 + d, 2), text])

    def hold(self):
        r = self._end - self.renderer.time
        if r > 0.02:
            self.wait(r)

    # ---- helpers ----
    def node(self, label, pos, color=BLUE_C, w=1.8, h=0.8, fs=24):
        box = RoundedRectangle(corner_radius=0.12, width=w, height=h, color=color,
                               fill_color=color, fill_opacity=0.18, stroke_width=4)
        return VGroup(box, Text(label, font_size=fs, color=WHITE)).move_to(pos)

    def header(self, text):
        a = Text(f"Network+ N10-009  ·  Objective {self.CODE}", font_size=22, color=GREY_C)
        b = Text(text, font_size=36, color=BLUE_C)
        return VGroup(a, b).arrange(DOWN, buff=0.12).to_edge(UP, buff=0.35)

    def cap(self, text, color=WHITE, fs=26, buff=0.5):
        return Text(text, font_size=fs, color=color).to_edge(DOWN, buff=buff)

    def X(self, target, size=0.45):
        return Cross(Square(size), stroke_color=CORAL_C, stroke_width=7).move_to(target)

    def clear(self):
        self.play(*[FadeOut(m) for m in self.mobjects])

    # ---- frame ----
    def construct(self):
        self._end = 0.0
        self.cues = []
        # objective card, built from the official objective list
        dom_id = self.CODE.split(".")[0]
        dom_title, weight, objs = DOMAINS[dom_id]
        obj_title = dict(objs)[self.CODE]
        words, lines, cur = obj_title.split(), [], ""
        for w in words:
            if len(cur) + len(w) + 1 > 46:
                lines.append(cur); cur = w
            else:
                cur = (cur + " " + w).strip()
        lines.append(cur)
        k = Text("CompTIA Network+  N10-009", font_size=26, color=GREY_C)
        code = Text(f"Objective {self.CODE}", font_size=54, color=BLUE_C)
        obj = VGroup(*[Text(l, font_size=30, color=WHITE) for l in lines]).arrange(DOWN, buff=0.12)
        VGroup(k, code, obj).arrange(DOWN, buff=0.28).to_edge(UP, buff=0.7)
        self.play(FadeIn(k), Write(code))
        self.play(FadeIn(obj))
        self.say(f"CompTIA Network Plus, domain {dom_id}, {dom_title}, which is {weight} percent of the exam. "
                 f"This lesson covers objective {SPOKEN(self.CODE)}. {obj_title}. " + self.INTRO)
        dlab = Text(f"Domain {dom_id}: {dom_title}  ·  {weight}% of the exam", font_size=24, color=GREY_C).shift(DOWN * 1.0)
        chips = VGroup(*[
            VGroup(RoundedRectangle(corner_radius=0.15, width=1.1, height=0.6,
                                    color=YELLOW_C if oid == self.CODE else GREY_C,
                                    fill_color=YELLOW_C if oid == self.CODE else GREY_C,
                                    fill_opacity=0.3 if oid == self.CODE else 0.08, stroke_width=3),
                   Text(oid, font_size=24, color=WHITE))
            for oid, _ in objs]).arrange(RIGHT, buff=0.2).next_to(dlab, DOWN, buff=0.4)
        idx = [oid for oid, _ in objs].index(self.CODE)
        self.play(FadeIn(dlab), LaggedStart(*[FadeIn(c, shift=UP * 0.2) for c in chips], lag_ratio=0.15))
        self.play(Indicate(chips[idx], color=YELLOW_C, scale_factor=1.15))
        self.hold()
        self.clear()
        # concept
        self.body()
        self.hold()
        self.clear()
        # tie back
        t = Text(f"Objective {self.CODE}", font_size=40, color=BLUE_C).shift(UP * 1.7)
        tk = Text(self.TAKEAWAY, font_size=34, color=YELLOW_C).next_to(t, DOWN, buff=0.5)
        self.play(FadeIn(t))
        self.say(self.OUTRO)
        self.play(Write(tk))
        n = Text(f"Study notes: {self.NOTES}", font_size=24, color=TEAL_C).next_to(tk, DOWN, buff=0.9)
        self.play(FadeIn(n))
        self.hold()
        self.wait(1)
        total = self.renderer.time
        json.dump({"slug": self.SLUG, "title": self.TITLE, "code": self.CODE, "obj": dict(DOMAINS[self.CODE.split(".")[0]][2])[self.CODE],
                   "domain": DOMAINS[self.CODE.split(".")[0]][0], "topic": self.TOPIC, "qid": self.QID,
                   "desc": self.DESC, "notes": self.NOTES, "duration": round(total, 1),
                   "cues": self.cues, "takeaway": self.TAKEAWAY},
                  open(os.path.join(OUT, self.SLUG + ".json"), "w"), indent=1)


# =====================================================================
class V01(CV):
    SLUG = "dnssec-is-not-encryption"
    TITLE = "DNSSEC Does Not Hide Your DNS Queries"
    CODE = "4.3"; TOPIC = "n10-ch21"; QID = "q-n10c21-08"
    NOTES = "/notes/n10-ch21"
    DESC = "DNSSEC proves who sent a DNS answer and that it was not changed, but it does not encrypt the lookup. Network+ N10-009 objective 4.3."
    INTRO = "Today's concept: what DNSSEC actually protects, and what it does not."
    TAKEAWAY = "DNSSEC = authenticity + integrity, not secrecy"
    OUTRO = ("On the exam, when you see DNSSEC, think origin and integrity. If the question asks about hiding "
             "the lookup, that needs a separate mechanism like DNS over HTTPS or TLS. That's objective four point three.")

    def body(self):
        self.play(FadeIn(self.header("DNSSEC is not encryption")))
        cl = self.node("Client", P(-4.5, -0.6), BLUE_C)
        sv = self.node("Signed zone", P(4.5, -0.6), TEAL_C, w=2.4)
        wire = Line(cl.get_right(), sv.get_left(), color=GREY_C, stroke_width=4)
        self.say("Here a client looks up a name from a zone that is validly signed.")
        self.play(FadeIn(cl), FadeIn(sv), Create(wire))
        q = Text("bank.com ?", font_size=24, color=CORAL_C).next_to(wire, UP, buff=0.15)
        self.play(FadeIn(q))
        rec = Text("203.0.113.5 + signature", font_size=22, color=YELLOW_C).next_to(wire, DOWN, buff=0.2)
        self.say("The answer comes back with a signature. The client checks the chain of trust, and it can be sure "
                 "the data came from the right zone and was not changed on the way.")
        self.play(FadeIn(rec, shift=LEFT * 0.5))
        ok = Text("origin verified · data unchanged", font_size=22, color=TEAL_C).next_to(cl, DOWN, buff=0.3)
        self.play(FadeIn(ok))
        obs = self.node("Observer", P(0, 1.7), CORAL_C)
        spy = DashedLine(wire.get_center() + UP * 0.35, obs.get_bottom(), color=CORAL_C)
        self.say("But look at the question itself. It still travels in the clear. Anyone watching the wire can read it.")
        self.play(FadeIn(obs), Create(spy))
        self.play(Indicate(q, color=CORAL_C))
        eq = MathTex(r"\text{DNSSEC}=\text{authenticity}+\text{integrity}", r"\ \neq\ ",
                     r"\text{confidentiality}", font_size=38).to_edge(DOWN, buff=1.3)
        eq[2].set_color(CORAL_C)
        self.say("So an analyst who says the lookup is now hidden needs a correction. DNSSEC validates origin and integrity. "
                 "Confidentiality is a different problem.")
        self.play(Write(eq))
        self.play(FadeIn(self.cap("Hiding queries needs a separate mechanism, such as DoH or DoT", TEAL_C, 24)))
        self.hold()


class V02(CV):
    SLUG = "out-of-band-management"
    TITLE = "What Is Out-of-Band Management?"
    CODE = "3.5"; TOPIC = "n10-remote-access-methods"; QID = "q-n10acc-22"
    NOTES = "/notes/n10-remote-access-methods"
    DESC = "Out-of-band management reaches a device over a separate dedicated path that still works when the production network is down. Network+ N10-009 objective 3.5."
    INTRO = "Today's concept is out-of-band management."
    TAKEAWAY = "Out-of-band = a separate, dedicated management path"
    OUTRO = ("For the exam, out-of-band means a dedicated path that is independent of production. "
             "If the network is down and you can still manage the device, that's out-of-band. That's objective three point five.")

    def body(self):
        self.play(FadeIn(self.header("Out-of-band management")))
        adm = self.node("Admin", P(-5, 0.6), BLUE_C, w=1.5)
        sw = self.node("Switch", P(3, 0.6), TEAL_C, w=1.6)
        cs = self.node("Console server", P(-1, -1.6), YELLOW_C, w=2.6, fs=22)
        inb = Line(adm.get_right(), sw.get_left(), color=BLUE_C, stroke_width=5)
        t_in = Text("production network (in-band)", font_size=22, color=BLUE_C).next_to(inb, UP, buff=0.15)
        o1 = Line(adm.get_bottom(), cs.get_left(), color=TEAL_C, stroke_width=5)
        o2 = Line(cs.get_right(), sw.get_bottom(), color=TEAL_C, stroke_width=5)
        t_out = Text("dedicated path (out-of-band)", font_size=22, color=TEAL_C).next_to(cs, DOWN, buff=0.2)
        self.say("Normally an admin manages a switch over the same production network that carries everyone's traffic. That's in-band.")
        self.play(FadeIn(adm), FadeIn(sw))
        self.play(Create(inb), FadeIn(t_in))
        self.say("Out-of-band adds a second, dedicated path, like a console server, that does not depend on production. Independence is the test. A management VLAN on the production switches is still in-band.")
        self.play(FadeIn(cs), Create(o1), Create(o2), FadeIn(t_out))
        fail = Text("Outage!", font_size=30, color=CORAL_C).next_to(inb, DOWN, buff=0.3)
        self.say("Now the production network fails. The in-band path is gone.")
        self.play(inb.animate.set_color(CORAL_C), FadeIn(fail), FadeIn(self.X(inb.get_center())))
        self.say("But the admin can still reach the switch, because the dedicated path never touched production.")
        self.play(Indicate(o1, color=YELLOW_C), Indicate(o2, color=YELLOW_C), run_time=1.5)
        self.play(FadeIn(self.cap("Out-of-band = a separate path that still works when production is down", WHITE, 26)))
        self.hold()


class V03(CV):
    SLUG = "10-gigabit-over-multimode-fiber"
    TITLE = "10 Gb/s Between 100 and 500 Meters: Multimode Fiber"
    CODE = "1.5"; TOPIC = "networking-cabling"; QID = "q-cls-037"
    NOTES = "/notes/networking-cabling"
    DESC = "Why multimode fiber is the right cable for 10 Gb/s over more than 100 meters but under 500 meters. Network+ N10-009 objective 1.5."
    INTRO = "Today's concept: matching the cable to the distance."
    TAKEAWAY = "Over 100 m and under 500 m at 10 Gb/s: multimode fiber"
    OUTRO = ("Remember the pattern. Copper stops at one hundred meters. For ten gigabit past that and under five hundred, "
             "pick multimode fiber. Single-mode works, but costs more. That's objective one point five.")

    def body(self):
        self.play(FadeIn(self.header("10 Gb/s between 100 m and 500 m")))
        nl = NumberLine(x_range=[0, 500, 100], length=10, include_numbers=True,
                        font_size=22, color=GREY_C).shift(DOWN * 0.9)
        unit = Text("meters", font_size=20, color=GREY_C).next_to(nl, RIGHT, buff=0.2)
        self.say("The question is a distance problem. You need ten gigabits per second, over more than one hundred meters, but less than five hundred.")
        self.play(Create(nl), FadeIn(unit))

        def bar(end, y, label, color):
            w = nl.n2p(end)[0] - nl.n2p(0)[0]
            r = Rectangle(width=w, height=0.5, color=color, fill_color=color, fill_opacity=0.5,
                          stroke_width=3).move_to(P(nl.n2p(0)[0] + w / 2, y))
            return VGroup(r, Text(label, font_size=20, color=WHITE).move_to(r))

        b1 = bar(100, 2.0, "Cat 6a", CORAL_C)
        b2 = bar(300, 1.35, "multimode OM3 about 300 m", TEAL_C)
        b3 = bar(400, 0.7, "multimode OM4 about 400 m", TEAL_C)
        b4 = bar(500, 0.05, "single-mode (works, costs more)", BLUE_C)
        self.say("Copper, even Cat six A, tops out at one hundred meters.")
        self.play(GrowFromEdge(b1, LEFT), run_time=0.8)
        self.say("Multimode fiber, O M three and O M four, carries ten gigabit roughly three hundred to four hundred meters, and costs less than single-mode.")
        self.play(GrowFromEdge(b2, LEFT), GrowFromEdge(b3, LEFT), run_time=1.2)
        self.play(GrowFromEdge(b4, LEFT), run_time=0.8)
        zone = Rectangle(width=nl.n2p(500)[0] - nl.n2p(100)[0], height=3.0, color=YELLOW_C,
                         fill_color=YELLOW_C, fill_opacity=0.12, stroke_width=2).move_to(
            P((nl.n2p(100)[0] + nl.n2p(500)[0]) / 2, 0.95))
        self.say("Our target zone starts where copper ends. Multimode fiber covers it at the lowest sensible cost.")
        self.play(FadeIn(zone))
        self.play(Indicate(b1, color=CORAL_C))
        eq = MathTex(r"10\text{ Gb/s},\ \ 100\text{ m}<d<500\text{ m}\ \Rightarrow\ \text{multimode fiber}",
                     font_size=36).to_edge(DOWN, buff=0.9)
        self.play(Write(eq))
        self.hold()


class V04(CV):
    SLUG = "end-of-support-vs-end-of-life"
    TITLE = "End of Life vs. End of Support"
    CODE = "3.1"; TOPIC = "n10-org-change-config"; QID = "q-n10chg-02"
    NOTES = "/notes/n10-org-change-config"
    DESC = "A vendor stops providing security patches for a router. That milestone is end of support, not end of life. Network+ N10-009 objective 3.1."
    INTRO = "Two milestones sound alike, and the exam likes to swap them."
    TAKEAWAY = "No more patches or help = end of support"
    OUTRO = ("When the question says the vendor no longer provides patches or help, the answer is end of support. "
             "End of life comes earlier, when the product stops being sold. That's objective three point one.")

    def body(self):
        self.play(FadeIn(self.header("End of life vs. end of support")))
        line = Arrow(P(-6, 0), P(6, 0), buff=0, color=GREY_C, stroke_width=5)
        self.say("Picture a product's life as a timeline.")
        self.play(GrowArrow(line))
        pts = [(-4.2, "Released", "in service", BLUE_C),
               (0.0, "End of life", "vendor stops selling", YELLOW_C),
               (4.0, "End of support", "no patches, no help", CORAL_C)]
        dots = []
        lines = ["It starts out in service.",
                 "At end of life, the vendor stops selling it.",
                 "Later comes end of support: no more security patches, and no more help."]
        for (x, a, b, col), ln in zip(pts, lines):
            d = Dot(P(x, 0), color=col, radius=0.16)
            t1 = Text(a, font_size=28, color=col).next_to(d, UP, buff=0.35)
            t2 = Text(b, font_size=22, color=WHITE).next_to(d, DOWN, buff=0.35)
            self.say(ln)
            self.play(FadeIn(d, scale=2), FadeIn(t1), FadeIn(t2))
            dots.append(d)
        scn = Text("A router stops receiving security patches", font_size=28, color=WHITE).to_edge(DOWN, buff=1.5)
        self.say("In the question, a vendor stops providing security patches for a router. That's the last milestone, end of support.")
        self.play(FadeIn(scn))
        self.play(Create(Circle(radius=0.45, color=CORAL_C, stroke_width=6).move_to(dots[2])))
        res = MathTex(r"\text{no more patches}\ \Rightarrow\ \text{end of }", r"\text{support}",
                      font_size=38).to_edge(DOWN, buff=0.7)
        res[1].set_color(CORAL_C)
        self.play(Write(res))
        self.hold()


class V05(CV):
    SLUG = "zero-rpo-needs-synchronous-replication"
    TITLE = "Zero RPO Requires Synchronous Replication"
    CODE = "3.3"; TOPIC = "n10-disaster-recovery"; QID = "q-n10dr-04"
    NOTES = "/notes/n10-disaster-recovery"
    DESC = "RPO measures how much data you can lose. A zero RPO accepts no data loss, so writes must be replicated synchronously. Network+ N10-009 objective 3.3."
    INTRO = "Today: which recovery point objective needs synchronous replication?"
    TAKEAWAY = "RPO = 0  =>  synchronous replication"
    OUTRO = ("Lock this in. R P O is how much data loss you can accept. Zero means none, and the only way to get zero is to "
             "replicate every write synchronously. That's objective three point three.")

    def body(self):
        self.play(FadeIn(self.header("Zero RPO needs synchronous replication")))
        ax = Arrow(P(-6, 0.2), P(6, 0.2), buff=0, color=GREY_C, stroke_width=4)
        tl = Text("time", font_size=20, color=GREY_C).next_to(ax, DOWN, buff=0.1).align_to(ax, RIGHT)
        d1 = Dot(P(-2.5, 0.2), color=TEAL_C, radius=0.14)
        d2 = Dot(P(2.5, 0.2), color=CORAL_C, radius=0.14)
        l1 = Text("last good copy", font_size=24, color=TEAL_C).next_to(d1, UP, buff=0.3)
        l2 = Text("failure", font_size=24, color=CORAL_C).next_to(d2, UP, buff=0.3)
        br = Brace(Line(d1.get_center(), d2.get_center()), DOWN, color=YELLOW_C)
        lost = Text("data lost = RPO", font_size=26, color=YELLOW_C).next_to(br, DOWN, buff=0.15)
        self.say("R P O stands for recovery point objective. It is how much data you can afford to lose, measured back from the failure.")
        self.play(GrowArrow(ax), FadeIn(tl))
        self.play(FadeIn(d1), FadeIn(l1))
        self.play(FadeIn(d2), FadeIn(l2))
        self.play(GrowFromCenter(br), FadeIn(lost))
        eq = MathTex(r"\text{RPO}=t_{\text{failure}}-t_{\text{last copy}}", font_size=40).to_edge(DOWN, buff=1.0)
        self.play(Write(eq))
        self.say("The gap between the last good copy and the failure is the data you lose.")
        self.hold()
        self.play(*[FadeOut(m) for m in [ax, tl, d1, d2, l1, l2, br, lost]])
        app = self.node("App", P(-5, 0.5), BLUE_C, w=1.3)
        pri = self.node("Primary", P(-1.2, 0.5), TEAL_C, w=1.8)
        rep = self.node("Replica", P(3.2, 0.5), TEAL_C, w=1.8)
        a1 = Arrow(app.get_right(), pri.get_left(), buff=0.1, color=YELLOW_C)
        a2 = Arrow(pri.get_right(), rep.get_left(), buff=0.1, color=YELLOW_C)
        a3 = CurvedArrow(rep.get_bottom() + DOWN * 0.05, pri.get_bottom() + DOWN * 0.05, angle=-TAU / 6, color=TEAL_C)
        ack = Text("ack", font_size=22, color=TEAL_C).next_to(a3, DOWN, buff=0.1)
        self.say("To make that gap zero, every write must reach the replica before it counts as done.")
        self.play(FadeIn(app), FadeIn(pri), FadeIn(rep))
        self.play(GrowArrow(a1))
        self.play(GrowArrow(a2))
        self.play(Create(a3), FadeIn(ack))
        zero = MathTex(r"\text{RPO}=0", r"\ \Rightarrow\ ", r"\text{synchronous replication}",
                       font_size=40).to_edge(DOWN, buff=1.0)
        zero[2].set_color(TEAL_C)
        self.say("That's synchronous replication. A zero R P O accepts no data loss, so it requires it.")
        self.play(ReplacementTransform(eq, zero))
        self.play(FadeIn(self.cap("A write completes only after both copies have it", WHITE, 24, buff=0.4)))
        self.hold()


class V06(CV):
    SLUG = "straight-through-cable-between-switches"
    TITLE = "Straight-Through Cable Between Two Switches Without Auto-MDIX"
    CODE = "5.2"; TOPIC = "n10-osi-models"; QID = "q-n10osi-17"
    NOTES = "/notes/n10-osi-models"
    DESC = "Two older switches without Auto-MDIX joined by a straight-through cable have no link, because transmit meets transmit. Network+ N10-009 objective 5.2."
    INTRO = "Today's symptom: a link that stays down because transmit and receive are on the wrong pins."
    TAKEAWAY = "Like devices + straight-through cable = TX meets TX = no link"
    OUTRO = ("For the exam, two older switches joined by a straight-through cable, with no Auto M D I X, give you no link, "
             "because transmit meets transmit. A crossover cable or Auto M D I X fixes it. That's objective five point two.")

    def body(self):
        self.play(FadeIn(self.header("Straight-through between two switches")))
        s1 = self.node("Switch 1", P(-4.8, 0), BLUE_C, w=1.9)
        s2 = self.node("Switch 2", P(4.8, 0), BLUE_C, w=1.9)
        cab = Line(s1.get_right(), s2.get_left(), color=GREY_C, stroke_width=6)
        lab = Text("straight-through cable, no Auto-MDIX", font_size=22, color=GREY_C).next_to(cab, DOWN, buff=0.7)
        self.say("Two older switches, no Auto M D I X, connected with a straight-through cable.")
        self.play(FadeIn(s1), FadeIn(s2), Create(cab), FadeIn(lab))
        a1 = Arrow(s1.get_right(), P(-0.35, 0), buff=0.1, color=YELLOW_C, stroke_width=6)
        a2 = Arrow(s2.get_left(), P(0.35, 0), buff=0.1, color=YELLOW_C, stroke_width=6)
        t1 = Text("TX", font_size=28, color=YELLOW_C).next_to(a1, UP, buff=0.15)
        t2 = Text("TX", font_size=28, color=YELLOW_C).next_to(a2, UP, buff=0.15)
        self.say("Switch ports are M D I X. They transmit on pins three and six, and receive on one and two. A straight-through cable keeps the pins in the same order end to end.")
        self.play(GrowArrow(a1), FadeIn(t1))
        self.play(GrowArrow(a2), FadeIn(t2))
        x = self.X(P(0, 0), 0.7)
        eq = MathTex(r"\text{TX}\rightarrow\ \leftarrow\text{TX}\ \Rightarrow\ \text{no link}",
                     font_size=40, color=CORAL_C).to_edge(DOWN, buff=1.5)
        self.say("So both sides transmit on the same pair, and neither one listens. Transmit meets transmit. No link.")
        self.play(Create(x), cab.animate.set_color(CORAL_C))
        self.play(Write(eq))
        t2b = Text("RX", font_size=28, color=TEAL_C).move_to(t2)
        a2b = Arrow(P(0.35, 0), s2.get_left(), buff=0.1, color=TEAL_C, stroke_width=6)
        fix = Text("Auto-MDIX (or a crossover cable) swaps the pairs: TX meets RX",
                   font_size=24, color=TEAL_C).to_edge(DOWN, buff=0.5)
        self.say("Auto M D I X, or a crossover cable, swaps the pairs, so transmit finally meets receive.")
        self.play(FadeOut(x), cab.animate.set_color(TEAL_C), ReplacementTransform(t2, t2b),
                  ReplacementTransform(a2, a2b), FadeIn(fix))
        self.hold()


class V07(CV):
    SLUG = "hybrid-cloud-model"
    TITLE = "Hybrid Cloud: Private Data, Public Front End"
    CODE = "1.3"; TOPIC = "n10-cloud-models-connectivity"; QID = "q-n10cloud-connectivity-01"
    NOTES = "/notes/n10-cloud-models-connectivity"
    DESC = "When sensitive data stays on premises and a scalable web front end runs in the public cloud, the model is hybrid. Network+ N10-009 objective 1.3."
    INTRO = "Let's pick the right deployment model for a split workload."
    TAKEAWAY = "Hybrid = private + public, connected"
    OUTRO = ("When a scenario keeps sensitive data on premises and runs a scalable front end in the public cloud, "
             "the answer is hybrid. Private alone, or public alone, only describes half. That's objective one point three.")

    def body(self):
        self.play(FadeIn(self.header("Hybrid cloud")))
        L = RoundedRectangle(corner_radius=0.2, width=5.2, height=3.4, color=TEAL_C, stroke_width=4).move_to(P(-3.6, 0))
        R = RoundedRectangle(corner_radius=0.2, width=5.2, height=3.4, color=BLUE_C, stroke_width=4).move_to(P(3.6, 0))
        lt = Text("Private (on premises)", font_size=26, color=TEAL_C).next_to(L, UP, buff=0.15)
        rt = Text("Public cloud", font_size=26, color=BLUE_C).next_to(R, UP, buff=0.15)
        db = self.node("Sensitive data", P(-3.6, 0), TEAL_C, w=3.0)
        web = self.node("Scalable web front end", P(3.6, 0), BLUE_C, w=3.8, fs=22)
        self.say("A company must keep sensitive data on premises, but wants its web front end to scale in the cloud.")
        self.play(Create(L), Create(R), FadeIn(lt), FadeIn(rt))
        self.play(FadeIn(db), FadeIn(web))
        br = DoubleArrow(L.get_right(), R.get_left(), buff=0.0, color=YELLOW_C, stroke_width=7)
        bt = Text("connected", font_size=22, color=YELLOW_C).next_to(br, UP, buff=0.1)
        self.say("One side is private. The other is public cloud. A connection joins them into one deployment.")
        self.play(GrowFromCenter(br), FadeIn(bt))
        eq = MathTex(r"\text{Hybrid}", r"=", r"\text{Private}", r"+", r"\text{Public}", font_size=48).to_edge(DOWN, buff=1.3)
        eq[0].set_color(YELLOW_C); eq[2].set_color(TEAL_C); eq[4].set_color(BLUE_C)
        self.say("That is hybrid. Private alone has no public half, and public alone has no on-premises half.")
        self.play(Write(eq))
        self.play(FadeIn(self.cap("Using a public-cloud service does not make the whole deployment public", WHITE, 22, buff=0.5)))
        self.hold()


class V08(CV):
    SLUG = "twisted-pair-100-meter-channel"
    TITLE = "Twisted-Pair Ethernet: The 100 Meter Channel Limit"
    CODE = "2.4"; TOPIC = "n10-physical-install-factors"; QID = "q-n10ph-09"
    NOTES = "/notes/n10-physical-install-factors"
    DESC = "The maximum channel length for twisted-pair Ethernet is 100 meters: 90 meters of permanent link plus patch cords. Network+ N10-009 objective 2.4."
    INTRO = "Start with the number every installer memorizes: the twisted pair distance limit."
    TAKEAWAY = "Channel limit: 100 m  (90 + up to 10)"
    OUTRO = ("The channel limit for twisted pair Ethernet is one hundred meters: ninety of permanent link, "
             "plus the patch cords. That's objective two point four.")

    def body(self):
        self.play(FadeIn(self.header("Twisted-pair channel limit")))
        k = 0.1
        x, rects = -5.0, VGroup()
        for m, col in [(90, TEAL_C), (10, BLUE_C)]:
            w = m * k
            r = Rectangle(width=w, height=0.6, color=col, fill_color=col, fill_opacity=0.5,
                          stroke_width=3).move_to(P(x + w / 2, 0.3))
            rects.add(VGroup(r, Text(f"{m} m" if m == 90 else "up to 10 m", font_size=22, color=WHITE).next_to(r, UP, buff=0.2)))
            x += w
        nm = Text("permanent link (wall to panel)", font_size=22, color=TEAL_C).next_to(rects[0], DOWN, buff=0.15)
        self.say("Twisted pair Ethernet has a hard distance limit. Here is how it adds up.")
        self.play(LaggedStart(*[GrowFromEdge(r, LEFT) for r in rects], lag_ratio=0.4))
        self.say("Ninety meters of permanent link, the run from the wall jack to the patch panel. Plus up to ten meters of patch cords in total, for both ends.")
        self.play(FadeIn(nm))
        brace = Brace(rects, DOWN, buff=0.75, color=YELLOW_C)
        bl = Text("channel", font_size=26, color=YELLOW_C).next_to(brace, DOWN, buff=0.1)
        self.play(GrowFromCenter(brace), FadeIn(bl))
        eq = MathTex(r"90+10=", r"100\text{ m}", font_size=52).to_edge(DOWN, buff=1.1)
        eq[1].set_color(YELLOW_C)
        self.say("Together that's a one hundred meter channel. Not fifty-five. One hundred.")
        self.play(Write(eq))
        self.play(FadeIn(Text("55 m is not the limit", font_size=24, color=CORAL_C).to_edge(DOWN, buff=0.5)))
        self.hold()


class V09(CV):
    SLUG = "dsl-speed-and-distance"
    TITLE = "DSL: Why Speed Drops With Distance"
    CODE = "1.6"; TOPIC = "n10-topologies-architecture"; QID = "q-n10top-28"
    NOTES = "/notes/n10-topologies-architecture"
    DESC = "DSL runs over telephone lines and slows as distance from the provider's equipment grows. Network+ N10-009 objective 1.6."
    INTRO = "Under provider links, there's one that depends on how far away you are."
    TAKEAWAY = "Telephone lines + speed falls with distance = DSL"
    OUTRO = ("If a question mentions telephone lines and speed that drops with distance from the provider, "
             "the answer is D S L. That's objective one point six.")

    def body(self):
        h = self.header("DSL slows with distance")
        self.play(FadeIn(h))
        ax = Axes(x_range=[0, 6, 1], y_range=[0, 10, 2], x_length=8, y_length=3.6,
                  axis_config={"color": GREY_C, "include_ticks": False}).shift(DOWN * 0.3 + RIGHT * 0.8)
        xl = Text("distance from provider", font_size=22, color=GREY_C).next_to(ax, DOWN, buff=0.15)
        yl = Text("speed", font_size=22, color=GREY_C).next_to(ax, LEFT, buff=0.15).shift(UP * 1.2)
        curve = ax.plot(lambda x: 9 * np.exp(-0.42 * x), x_range=[0, 6], color=BLUE_C, stroke_width=6)
        tel = Text("runs over telephone lines", font_size=26, color=YELLOW_C).next_to(h, DOWN, buff=0.3)
        self.say("D S L delivers internet over ordinary telephone lines.")
        self.play(FadeIn(tel))
        self.play(Create(ax), FadeIn(xl), FadeIn(yl))
        self.say("The farther your home or office is from the provider's equipment, the weaker the signal, and the slower the connection.")
        self.play(Create(curve), run_time=2)
        near = Dot(ax.c2p(0.8, 9 * np.exp(-0.42 * 0.8)), color=TEAL_C, radius=0.14)
        far = Dot(ax.c2p(5, 9 * np.exp(-0.42 * 5)), color=CORAL_C, radius=0.14)
        self.play(FadeIn(near), FadeIn(Text("near: fast", font_size=22, color=TEAL_C).next_to(near, UR, buff=0.15)))
        self.play(FadeIn(far), FadeIn(Text("far: slow", font_size=22, color=CORAL_C).next_to(far, UP, buff=0.3)))
        eq = MathTex(r"\text{distance}\uparrow\ \Rightarrow\ \text{speed}\downarrow", font_size=42).to_edge(DOWN, buff=0.6)
        self.say("Distance goes up, speed goes down. That is the signature of D S L.")
        self.play(Write(eq))
        self.hold()


class V10(CV):
    SLUG = "glbp-load-balancing-gateways"
    TITLE = "GLBP: First Hop Redundancy With Load Balancing"
    CODE = "2.1"; TOPIC = "n10-ch10"; QID = "q-n10fhrp-03"
    NOTES = "/notes/n10-ch10"
    DESC = "GLBP is the first hop redundancy protocol that can spread client traffic across several gateways at once, unlike HSRP and VRRP. Network+ N10-009 objective 2.1."
    INTRO = "Inside it, first hop redundancy protocols. Which one can share the load?"
    TAKEAWAY = "Spread traffic across gateways = GLBP"
    OUTRO = ("HSRP and VRRP normally send everything through one active router. G L B P adds load balancing across the gateways. "
             "That's objective two point one.")

    def body(self):
        self.play(FadeIn(self.header("GLBP load-balances gateways")))
        pcs = [self.node(f"PC{i + 1}", P(-5.2, 1.1 - i * 1.3), BLUE_C, w=1.2, h=0.6, fs=22) for i in range(3)]
        r1 = self.node("Gateway 1", P(0.8, 1.0), TEAL_C, w=2.0, fs=22)
        r2 = self.node("Gateway 2", P(0.8, -1.2), TEAL_C, w=2.0, fs=22)
        net = self.node("Internet", P(5.2, -0.1), GREY_C, w=1.7, fs=22)
        links = VGroup(Line(r1.get_right(), net.get_left(), color=GREY_C), Line(r2.get_right(), net.get_left(), color=GREY_C))
        self.say("Three clients share two gateways for redundancy.")
        self.play(*[FadeIn(m) for m in pcs + [r1, r2, net]], Create(links))
        title = Text("HSRP / VRRP: one active forwarder", font_size=28, color=CORAL_C).to_edge(DOWN, buff=1.2)
        arrows = [Arrow(p.get_right(), r1.get_left(), buff=0.1, color=YELLOW_C, stroke_width=5) for p in pcs]
        self.say("With H S R P or V R R P, one router is active, or master, and carries all the traffic. The other waits as a standby.")
        self.play(FadeIn(title))
        self.play(*[GrowArrow(a) for a in arrows])
        idle = Text("standby, idle", font_size=20, color=GREY_C).next_to(r2, DOWN, buff=0.15)
        self.play(r2.animate.set_opacity(0.35), FadeIn(idle))
        self.hold()
        new_arrows = [Arrow(p.get_right(), t.get_left(), buff=0.1, color=TEAL_C, stroke_width=5)
                      for p, t in zip(pcs, [r1, r2, r2])]
        new_title = Text("GLBP: traffic spread across gateways", font_size=28, color=TEAL_C).to_edge(DOWN, buff=1.2)
        self.say("G L B P, which is Cisco proprietary, changes that. It hands out different gateways to different clients, so both routers forward traffic at the same time.")
        self.play(*[ReplacementTransform(a, b) for a, b in zip(arrows, new_arrows)],
                  r2.animate.set_opacity(1), FadeOut(idle), ReplacementTransform(title, new_title))
        eq = MathTex(r"\text{GLBP}=\text{redundancy}+\text{load balancing}", font_size=38).to_edge(DOWN, buff=0.5)
        self.play(Write(eq))
        self.hold()


class V11(CV):
    SLUG = "dhcp-address-but-cannot-reach-neighbors"
    TITLE = "Got a DHCP Address But Can't Reach Neighbors: Check the VLAN"
    CODE = "5.3"; TOPIC = "n10-troubleshoot-services"; QID = "q-n10s-08"
    NOTES = "/notes/n10-troubleshoot-services"
    DESC = "A device that gets a DHCP address but cannot reach neighbors on the same switch is often in the wrong VLAN. Check the switch port's VLAN first. Network+ N10-009 objective 5.3."
    INTRO = "Here's a classic scenario. The device has an address, but nothing works."
    TAKEAWAY = "Has an IP but can't reach neighbors: check the port's VLAN"
    OUTRO = ("When a device gets a DHCP address but can't talk to neighbors that work fine, check the V LAN assigned to its switch port first. "
             "That's objective five point three.")

    def body(self):
        self.play(FadeIn(self.header("Has an IP, can't reach neighbors")))
        sw = self.node("Switch", P(0, 0.2), GREY_C, w=2.4)
        a = self.node("PC A", P(-4.8, 1.5), BLUE_C, w=1.4, h=0.6, fs=22)
        b = self.node("PC B", P(-4.8, -1.0), BLUE_C, w=1.4, h=0.6, fs=22)
        c = self.node("PC C", P(4.8, 0.2), CORAL_C, w=1.4, h=0.6, fs=22)
        la = Line(a.get_right(), sw.get_left() + UP * 0.2, color=BLUE_C, stroke_width=5)
        lb = Line(b.get_right(), sw.get_left() + DOWN * 0.2, color=BLUE_C, stroke_width=5)
        lc = Line(sw.get_right(), c.get_left(), color=CORAL_C, stroke_width=5)
        ia = Text("192.168.10.21", font_size=20, color=BLUE_C).next_to(a, DOWN, buff=0.15)
        ib = Text("192.168.10.22", font_size=20, color=BLUE_C).next_to(b, DOWN, buff=0.15)
        ic = Text("192.168.20.37", font_size=20, color=CORAL_C).next_to(c, DOWN, buff=0.15)
        v1 = Text("VLAN 10", font_size=22, color=BLUE_C).move_to(P(-2.4, -1.5))
        v2 = Text("VLAN 20", font_size=22, color=CORAL_C).next_to(lc, UP, buff=0.15)
        self.say("Three PCs on one switch. A and B work together fine.")
        self.play(FadeIn(sw), FadeIn(a), FadeIn(b), FadeIn(c))
        self.play(Create(la), Create(lb), Create(lc), FadeIn(v1), FadeIn(v2))
        self.play(FadeIn(ia), FadeIn(ib), FadeIn(ic))
        dhcp = Text("DHCP worked: C has an address", font_size=24, color=YELLOW_C).to_edge(DOWN, buff=1.7)
        ping = DashedLine(c.get_top(), a.get_right(), color=CORAL_C)
        self.say("PC C got an address by D H C P, but it can't reach its neighbors. Notice its port sits in a different VLAN, so it landed on a different network.")
        self.play(FadeIn(dhcp))
        self.play(Create(ping), FadeIn(self.X(ping.get_center())))
        eq = MathTex(r"\text{port VLAN}\ \Rightarrow\ \text{subnet}\ \Rightarrow\ \text{who you can reach}",
                     font_size=34).to_edge(DOWN, buff=1.0)
        self.say("The port's VLAN decides the subnet, and the subnet decides who you can reach. So check the VLAN on the switch port first.")
        self.play(Write(eq))
        self.play(FadeIn(Text("Check the VLAN assigned to the switch port first", font_size=26, color=TEAL_C).to_edge(DOWN, buff=0.4)))
        self.hold()
        ic2 = Text("192.168.10.23", font_size=20, color=BLUE_C).next_to(c, DOWN, buff=0.15)
        v2b = Text("VLAN 10", font_size=22, color=BLUE_C).next_to(lc, UP, buff=0.15)
        self.say("Move the port into the right VLAN and the problem goes away.")
        self.play(lc.animate.set_color(BLUE_C), c[0].animate.set_color(BLUE_C),
                  ReplacementTransform(ic, ic2), ReplacementTransform(v2, v2b))
        self.hold()


class V12(CV):
    SLUG = "vpc-internet-gateway"
    TITLE = "What Lets a VPC Reach the Internet? The Internet Gateway"
    CODE = "1.3"; TOPIC = "n10-cloud-models-connectivity"; QID = "q-n10cl-15"
    NOTES = "/notes/n10-cloud-models-connectivity"
    DESC = "An internet gateway is the cloud component that lets a VPC exchange traffic with the internet. Network+ N10-009 objective 1.3."
    INTRO = "Today: how does a virtual private cloud actually reach the internet?"
    TAKEAWAY = "VPC to internet = internet gateway"
    OUTRO = ("When the question asks which cloud component lets a V P C exchange traffic with the internet, "
             "the answer is the internet gateway. That's objective one point three.")

    def body(self):
        self.play(FadeIn(self.header("Internet gateway")))
        vpc = RoundedRectangle(corner_radius=0.2, width=5.6, height=3.2, color=BLUE_C, stroke_width=4).move_to(P(-3.0, -0.8))
        vt = Text("VPC", font_size=26, color=BLUE_C).next_to(vpc, UP, buff=0.1).align_to(vpc, LEFT)
        inst = self.node("Instance", P(-3.8, -0.8), TEAL_C, w=1.8, fs=22)
        net = Ellipse(width=3.2, height=1.5, color=GREY_C, stroke_width=4).move_to(P(4.2, -0.8))
        nt = Text("Internet", font_size=26, color=WHITE).move_to(net)
        self.say("A virtual private cloud, or V P C, is your own isolated network inside the provider's cloud.")
        self.play(Create(vpc), FadeIn(vt), FadeIn(inst), Create(net), FadeIn(nt))
        gap = DashedLine(inst.get_right(), net.get_left(), color=GREY_C)
        why = Text("No path out of the VPC yet", font_size=26, color=CORAL_C).to_edge(DOWN, buff=0.8)
        x = self.X(gap.get_center())
        self.say("By default, the instances inside have no path to the internet.")
        self.play(Create(gap))
        self.play(FadeIn(x), FadeIn(why))
        igw = self.node("Internet gateway", P(-0.2, -0.8), YELLOW_C, w=3.0, fs=20)
        self.say("The component that fixes that is the internet gateway. It attaches to the V P C and connects it to the internet, and the subnet needs a route that points to it.")
        self.play(FadeOut(why), FadeOut(gap), FadeOut(x))
        self.play(FadeIn(igw, scale=1.3))
        l1 = Line(inst.get_right(), igw.get_left(), color=TEAL_C, stroke_width=5)
        l2 = Line(igw.get_right(), net.get_left(), color=TEAL_C, stroke_width=5)
        self.play(Create(l1), Create(l2))
        pkt = Dot(inst.get_right(), color=YELLOW_C, radius=0.14)
        self.play(FadeIn(pkt))
        self.play(MoveAlongPath(pkt, Line(inst.get_right(), net.get_left())), run_time=2)
        eq = MathTex(r"\text{VPC}\ \leftrightarrow\ \text{Internet gateway}\ \leftrightarrow\ \text{Internet}",
                     font_size=36).to_edge(DOWN, buff=0.8)
        self.say("Traffic now flows both ways between the V P C and the internet, through the internet gateway.")
        self.play(Write(eq))
        self.hold()
