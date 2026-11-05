from videos import *  # CV base, helpers, palette, DOMAINS


def table_row(scene, cells, y, xs, colors, fs=24, w=2.6, h=0.7):
    out = []
    for c, x, col in zip(cells, xs, colors):
        out.append(scene.node(c, P(x, y), col, w=w, h=h, fs=fs))
    return out


# =====================================================================
class W01(CV):
    SLUG = "sdn-control-plane-vs-data-plane"
    TITLE = "SDN: Control, Data and Management Planes"
    CODE = "1.8"; TOPIC = "n10-sdn-overlay"; QID = "q-n10sdn-02"
    NOTES = "/notes/n10-sdn-overlay"
    DESC = "The control plane builds routing and switching tables, the data plane forwards packets, and the management plane is how you configure the device. SDN centralizes the control plane. Network+ N10-009 1.8."
    INTRO = "Today's concept: the three planes of a network device, and which one builds the tables."
    TAKEAWAY = "Control plane builds tables, data plane forwards"
    OUTRO = ("On the exam, ask who builds the routing and switching tables. That is the control plane. "
             "The data plane only forwards, and the management plane is how you configure the device. That's objective one point eight.")

    def body(self):
        self.play(FadeIn(self.header("Three planes of one device")))
        mg = self.node("Management plane", P(-3.4, 1.2), YELLOW_C, w=4.2)
        cp = self.node("Control plane", P(-3.4, -0.2), TEAL_C, w=4.2)
        dp = self.node("Data plane", P(-3.4, -1.6), BLUE_C, w=4.2)
        self.say("Every router and switch does three jobs. Each job is called a plane.")
        self.play(LaggedStart(FadeIn(mg), FadeIn(cp), FadeIn(dp), lag_ratio=0.3))
        tm = Text("you configure it: SSH, SNMP", font_size=22, color=YELLOW_C).move_to(P(2.6, 1.2))
        self.say("The management plane is how you configure the device, for example over SSH or SNMP.")
        self.play(FadeIn(tm, shift=LEFT * 0.3))
        self.play(Indicate(mg, color=YELLOW_C))
        tc = Text("builds the routing and MAC tables", font_size=22, color=TEAL_C).move_to(P(2.6, -0.2))
        self.say("The control plane is the brain. It builds the routing table and the switching table.")
        self.play(FadeIn(tc, shift=LEFT * 0.3))
        self.play(Indicate(cp, color=TEAL_C))
        td = Text("forwards each packet using the tables", font_size=22, color=BLUE_C).move_to(P(2.6, -1.6))
        look = DashedLine(dp.get_top(), cp.get_bottom(), color=YELLOW_C)
        self.say("The data plane does the work. For every packet it looks up the table and forwards it. It never builds the table itself.")
        self.play(FadeIn(td, shift=LEFT * 0.3), Create(look))
        path = Line(P(-6.3, -2.4), P(-0.5, -2.4), color=GREY_C, stroke_width=3)
        pkt = Dot(P(-6.3, -2.4), color=BLUE_C, radius=0.14)
        self.play(Create(path), FadeIn(pkt))
        self.play(pkt.animate.move_to(P(-0.5, -2.4)), run_time=1.6)
        self.hold()
        wrong = self.X(mg.get_right() + RIGHT * 0.4)
        q = self.cap("Tables are built by the control plane, not the management plane", CORAL_C, 24, 0.45)
        self.say("A common mistake is to say management plane, because you configure things there. But configuring is not building the tables.")
        self.play(Create(wrong), FadeIn(q))
        self.hold()
        self.clear()
        # SDN
        self.play(FadeIn(self.header("SDN moves the control plane out")))
        ctl = self.node("SDN controller", P(0, 1.5), TEAL_C, w=3.4)
        sws = [self.node(f"Switch {i+1}", P(x, -1.2), BLUE_C, w=1.9) for i, x in enumerate([-4.2, 0, 4.2])]
        self.say("In software-defined networking, the control plane moves into one central controller.")
        self.play(FadeIn(ctl), LaggedStart(*[FadeIn(s) for s in sws], lag_ratio=0.2))
        arrs = [Arrow(ctl.get_bottom(), s.get_top(), color=TEAL_C, buff=0.1, stroke_width=4) for s in sws]
        self.say("The controller pushes forwarding rules down to the switches. The switches keep only the data plane.")
        self.play(LaggedStart(*[GrowArrow(a) for a in arrs], lag_ratio=0.25))
        self.play(Indicate(ctl, color=YELLOW_C))
        self.play(FadeIn(self.cap("Central brain, simple forwarders", TEAL_C, 26)))
        self.hold()


# =====================================================================
class W02(CV):
    SLUG = "vxlan-udp-4789-and-24-bit-vni"
    TITLE = "VXLAN: UDP Port 4789 and the 24-Bit VNI"
    CODE = "1.8"; TOPIC = "n10-sdn-overlay"; QID = "q-n10sdn-14"
    NOTES = "/notes/n10-sdn-overlay"
    DESC = "VXLAN wraps a Layer 2 frame in UDP port 4789 and tags it with a 24-bit VNI, about 16 million segments versus 4,094 usable VLANs. Network+ N10-009 objective 1.8."
    INTRO = "Today's concept: the two numbers to remember for VXLAN."
    TAKEAWAY = "VXLAN = UDP 4789, 24-bit VNI"
    OUTRO = ("For the exam, VXLAN means UDP port four seven eight nine and a twenty four bit VNI. "
             "Five oh six oh is the port for SIP voice, and a VLAN ID is only twelve bits. That's objective one point eight.")

    def body(self):
        self.play(FadeIn(self.header("VXLAN: two numbers")))
        a = self.node("VM A", P(-5.2, 0.4), BLUE_C, w=1.5)
        b = self.node("VM B", P(5.2, 0.4), BLUE_C, w=1.5)
        net = self.node("Routed IP network", P(0, 0.4), GREY_C, w=3.2, h=0.9, fs=22)
        same = DashedLine(a.get_top() + UP * 0.2, b.get_top() + UP * 0.2, color=TEAL_C)
        lab = Text("they believe they share one Layer 2 segment", font_size=22, color=TEAL_C).next_to(same, UP, buff=0.12)
        self.say("Two virtual machines sit in different racks, with a routed IP network between them. They need to behave as if they share one Layer 2 network.")
        self.play(FadeIn(a), FadeIn(b), FadeIn(net))
        self.play(Create(same), FadeIn(lab))
        self.hold()
        self.play(FadeOut(lab), FadeOut(same))
        frame = self.node("Ethernet frame", P(-5.2, -1.7), BLUE_C, w=2.6, h=0.7, fs=22)
        self.say("So VXLAN takes the original Ethernet frame and wraps it.")
        self.play(FadeIn(frame, shift=UP * 0.3))
        layers = VGroup(
            self.node("Outer IP", P(0, 0), GREY_C, w=3.0, h=0.55, fs=20),
            self.node("UDP port 4789", P(0, 0), YELLOW_C, w=3.0, h=0.55, fs=20),
            self.node("VXLAN header: VNI", P(0, 0), TEAL_C, w=3.0, h=0.55, fs=20),
            self.node("Original frame", P(0, 0), BLUE_C, w=3.0, h=0.55, fs=20),
        ).arrange(DOWN, buff=0.06).move_to(P(0, -2.0))
        self.say("The wrapper is a UDP packet addressed to port four seven eight nine, plus a VXLAN header that carries the VNI, the virtual network identifier.")
        self.play(ReplacementTransform(frame, layers[3]))
        self.play(FadeIn(layers[2], shift=DOWN * 0.2))
        self.play(FadeIn(layers[1], shift=DOWN * 0.2))
        self.play(FadeIn(layers[0], shift=DOWN * 0.2))
        self.play(Indicate(layers[1], color=YELLOW_C))
        pk = Dot(P(-4.4, 0.4), color=YELLOW_C, radius=0.14)
        self.play(FadeIn(pk))
        self.play(pk.animate.move_to(P(4.4, 0.4)), run_time=1.5)
        self.hold()
        self.play(FadeOut(pk))
        self.clear()
        # bits
        self.play(FadeIn(self.header("Why 24 bits matters")))
        vl = VGroup(Text("VLAN ID", font_size=28, color=CORAL_C),
                    MathTex(r"12\ \text{bits}\ \Rightarrow\ 2^{12}=4096", font_size=40, color=CORAL_C)).arrange(DOWN, buff=0.3).move_to(P(-3.5, 0.5))
        vx = VGroup(Text("VXLAN VNI", font_size=28, color=TEAL_C),
                    MathTex(r"24\ \text{bits}\ \Rightarrow\ 2^{24}=16{,}777{,}216", font_size=40, color=TEAL_C)).arrange(DOWN, buff=0.3).move_to(P(3.2, 0.5))
        self.say("A VLAN ID has twelve bits, so about four thousand segments. The VNI has twenty four bits, which is more than sixteen million segments.")
        self.play(FadeIn(vl))
        self.play(FadeIn(vx))
        self.play(Indicate(vx[1], color=YELLOW_C))
        sip = Text("5060 is SIP voice, not VXLAN", font_size=24, color=CORAL_C).move_to(P(0, -1.7))
        cr = self.X(P(-3.3, -1.7))
        self.say("If an answer offers five oh six oh, that is the SIP voice port. VXLAN is four seven eight nine.")
        self.play(FadeIn(sip), Create(cr))
        self.play(FadeIn(self.cap("VXLAN: UDP 4789 · 24-bit VNI", TEAL_C, 28)))
        self.hold()


# =====================================================================
class W03(CV):
    SLUG = "sd-wan-local-breakout"
    TITLE = "SD-WAN Local Breakout: Skip the Headquarters Detour"
    CODE = "1.8"; TOPIC = "n10-sdn-overlay"; QID = "q-n10sdn-09"
    NOTES = "/notes/n10-sdn-overlay"
    DESC = "With local breakout an SD-WAN edge sends trusted cloud application traffic straight out of the branch instead of through headquarters. Network+ N10-009 objective 1.8."
    INTRO = "Today's concept: why a branch user's email goes straight to the cloud in an SD-WAN."
    TAKEAWAY = "Local breakout = app traffic goes direct, not via HQ"
    OUTRO = ("For the exam, when branch cloud traffic skips headquarters, the answer is local breakout, driven by application-aware policy. "
             "DHCP only hands out addresses and a gateway. That's objective one point eight.")

    def body(self):
        self.play(FadeIn(self.header("SD-WAN: local breakout")))
        br = self.node("Branch", P(-5, -1.4), BLUE_C, w=1.8)
        hq = self.node("Headquarters", P(0, 1.5), YELLOW_C, w=2.6)
        cl = self.node("Cloud email", P(5, -1.4), TEAL_C, w=2.2)
        self.say("A branch office, a headquarters, and a cloud email service.")
        self.play(FadeIn(br), FadeIn(hq), FadeIn(cl))
        p1 = Line(br.get_top(), hq.get_left(), color=CORAL_C, stroke_width=5)
        p2 = Line(hq.get_right(), cl.get_top(), color=CORAL_C, stroke_width=5)
        slow = Text("hairpin through HQ: extra delay", font_size=22, color=CORAL_C).move_to(P(0, 0.35))
        self.say("The old way sent everything to headquarters first, and then out to the cloud. That detour is called hairpinning, and it adds delay.")
        self.play(Create(p1), Create(p2))
        pk = Dot(br.get_top(), color=CORAL_C, radius=0.14)
        self.play(FadeIn(pk))
        self.play(MoveAlongPath(pk, VMobject().set_points_as_corners([br.get_top(), hq.get_left(), hq.get_right(), cl.get_top()])), run_time=2.4)
        self.play(FadeIn(slow))
        self.hold()
        self.play(FadeOut(p1), FadeOut(p2), FadeOut(pk), FadeOut(slow))
        pol = Text("policy: email and web apps → local breakout", font_size=22, color=YELLOW_C).move_to(P(0, -3.0))
        direct = Line(br.get_right(), cl.get_left(), color=TEAL_C, stroke_width=6)
        self.say("With SD-WAN local breakout, the branch edge device recognizes the application and sends trusted cloud traffic straight to the nearest service.")
        self.play(FadeIn(pol))
        self.play(GrowArrow(Arrow(br.get_right(), cl.get_left(), color=TEAL_C, buff=0.05, stroke_width=6)))
        pk2 = Dot(br.get_right(), color=TEAL_C, radius=0.14)
        self.play(FadeIn(pk2))
        self.play(pk2.animate.move_to(cl.get_left()), run_time=1.1)
        self.hold()
        dh = Text("DHCP gives an address and a gateway, not per-app paths", font_size=22, color=CORAL_C).move_to(P(0, -2.2))
        cr = self.X(P(-5.6, -2.2))
        self.say("DHCP is not the reason. It only gives out an address and a default gateway. It does not choose a path per application.")
        self.play(FadeIn(dh), Create(cr))
        self.hold()


# =====================================================================
class W04(CV):
    SLUG = "wifi-6-6e-and-7-generations"
    TITLE = "Wi-Fi 6, 6E and 7: Which Is Which?"
    CODE = "2.3"; TOPIC = "n10-wireless-standards-security"; QID = "q-n10wl-13"
    NOTES = "/notes/n10-wireless-standards-security"
    DESC = "802.11ax is Wi-Fi 6 on 2.4 and 5 GHz, Wi-Fi 6E adds the 6 GHz band, and 802.11be is Wi-Fi 7 with multi-link operation. Network+ N10-009 objective 2.3."
    INTRO = "Today's concept: matching Wi-Fi generations to standards, bands and features."
    TAKEAWAY = "ax = Wi-Fi 6 · 6E = 6 GHz · be = Wi-Fi 7 (MLO)"
    OUTRO = ("For the exam, eight oh two dot eleven A X is Wi-Fi six. Six E adds the six gigahertz band. "
             "Eight oh two dot eleven B E is Wi-Fi seven, and it brings multi-link operation. That's objective two point three.")

    def body(self):
        self.play(FadeIn(self.header("Wi-Fi generations")))
        names = ["Wi-Fi 4", "Wi-Fi 5", "Wi-Fi 6", "Wi-Fi 6E", "Wi-Fi 7"]
        stds = ["802.11n", "802.11ac", "802.11ax", "802.11ax", "802.11be"]
        bands = ["2.4 · 5 GHz", "5 GHz", "2.4 · 5 GHz", "adds 6 GHz", "2.4 · 5 · 6 GHz"]
        xs = [-5.6, -2.8, 0.0, 2.8, 5.6]
        cols = [GREY_C, GREY_C, BLUE_C, TEAL_C, YELLOW_C]
        heads = [self.node(n, P(x, 1.4), c, w=2.5, h=0.75, fs=26) for n, x, c in zip(names, xs, cols)]
        self.say("Here are the recent generations, from Wi-Fi four to Wi-Fi seven.")
        self.play(LaggedStart(*[FadeIn(h) for h in heads], lag_ratio=0.2))
        st = [Text(s, font_size=24, color=WHITE).move_to(P(x, 0.45)) for s, x in zip(stds, xs)]
        self.say("Each has an IEEE standard behind it. Eight oh two dot eleven N, A C, A X, and B E.")
        self.play(LaggedStart(*[FadeIn(s) for s in st], lag_ratio=0.15))
        bd = [Text(b, font_size=22, color=c).move_to(P(x, -0.3)) for b, x, c in zip(bands, xs, cols)]
        self.say("Wi-Fi six uses the two point four and five gigahertz bands. Wi-Fi six E is the same standard, extended into the six gigahertz band. Wi-Fi seven uses all three.")
        self.play(LaggedStart(*[FadeIn(b) for b in bd], lag_ratio=0.15))
        self.play(Indicate(heads[2], color=YELLOW_C), Indicate(st[2], color=YELLOW_C))
        self.hold()
        f6 = Text("BSS coloring: tags frames so APs can ignore a neighbor", font_size=22, color=BLUE_C).move_to(P(-1.2, -1.4))
        f7 = Text("MLO: multi-link operation", font_size=22, color=YELLOW_C).move_to(P(4.6, -2.1))
        self.say("Two features separate them. BSS coloring is a Wi-Fi six feature, it tags frames so an access point can ignore a neighbor on the same channel. Multi-link operation arrives with Wi-Fi seven.")
        self.play(FadeIn(f6))
        self.play(FadeIn(f7))
        self.play(Indicate(heads[4], color=YELLOW_C))
        self.hold()
        self.play(FadeOut(f6), FadeOut(f7))
        a = Text("ax is Wi-Fi 6, not Wi-Fi 7", font_size=24, color=CORAL_C).move_to(P(0, -2.2))
        b2 = Text("5 GHz is not the new band: 6 GHz is", font_size=24, color=CORAL_C).move_to(P(0, -2.9))
        self.say("So ax is Wi-Fi six, not seven. And five gigahertz is not the new band. The new band is six gigahertz.")
        self.play(FadeIn(a))
        self.play(FadeIn(b2))
        self.hold()


# =====================================================================
class W05(CV):
    SLUG = "bssid-changes-essid-stays-when-roaming"
    TITLE = "Roaming: The BSSID Changes, the ESSID Stays"
    CODE = "2.3"; TOPIC = "n10-wireless-standards-security"; QID = "q-n10wl-26"
    NOTES = "/notes/n10-wireless-standards-security"
    DESC = "When a client roams between access points in one wireless network, the BSSID of the access point changes while the ESSID, the network name, stays the same. Network+ N10-009 objective 2.3."
    INTRO = "Today's concept: what changes, and what does not, when a user roams between access points."
    TAKEAWAY = "Roaming: new BSSID, same ESSID"
    OUTRO = ("For the exam, the network name is the ESSID, and it stays the same while you roam. "
             "The BSSID identifies each access point's radio, so it changes. That's objective two point three.")

    def body(self):
        self.play(FadeIn(self.header("Roaming between access points")))
        ap1 = self.node("AP 1", P(-4.2, 1.2), BLUE_C, w=1.5)
        ap2 = self.node("AP 2", P(4.2, 1.2), BLUE_C, w=1.5)
        b1 = Text("BSSID  00:1A:2B:3C:4D:01", font_size=20, color=BLUE_C).next_to(ap1, DOWN, buff=0.15)
        b2 = Text("BSSID  00:1A:2B:3C:4D:02", font_size=20, color=BLUE_C).next_to(ap2, DOWN, buff=0.15)
        essid = Text("ESSID: Office  (the network name)", font_size=26, color=TEAL_C).move_to(P(0, 2.15))
        self.say("Two access points broadcast the same network name, Office. That shared name is the ESSID.")
        self.play(FadeIn(ap1), FadeIn(ap2))
        self.play(FadeIn(essid))
        self.say("But each access point radio has its own hardware address, the BSSID.")
        self.play(FadeIn(b1), FadeIn(b2))
        lap = self.node("Laptop", P(-4.2, -1.6), YELLOW_C, w=1.7)
        st = Text("connected to  ...:01", font_size=22, color=YELLOW_C).move_to(P(0, -0.7))
        link = DashedLine(lap.get_top(), b1.get_bottom(), color=YELLOW_C)
        self.say("A user sits near the first access point. The laptop is associated with BSSID zero one.")
        self.play(FadeIn(lap), Create(link), FadeIn(st))
        self.hold()
        st2 = Text("connected to  ...:02", font_size=22, color=YELLOW_C).move_to(P(0, -0.7))
        link2 = DashedLine(P(4.2, -1.6) + UP * 0.4, b2.get_bottom(), color=YELLOW_C)
        self.say("The user walks across the building. The laptop moves to the second access point.")
        self.play(lap.animate.move_to(P(4.2, -1.6)), FadeOut(link), run_time=1.8)
        self.play(Create(link2), Transform(st, st2))
        self.play(Indicate(st, color=CORAL_C))
        ok = Text("ESSID still: Office", font_size=26, color=TEAL_C).move_to(P(0, -2.6))
        self.say("The BSSID changed from zero one to zero two. The ESSID stayed Office, so the user notices nothing.")
        self.play(FadeIn(ok))
        self.play(Indicate(essid, color=TEAL_C))
        self.hold()
        self.play(FadeIn(self.cap("Roaming = BSSID changes within the same ESSID", YELLOW_C, 24, 0.3)))
        self.hold()


# =====================================================================
class W06(CV):
    SLUG = "administrative-distance-beats-metric"
    TITLE = "Administrative Distance Is Compared Before Metric"
    CODE = "2.1"; TOPIC = "n10-ch10"; QID = "q-n10c10-03"
    NOTES = "/notes/n10-ch10"
    DESC = "A router compares administrative distance first and installs the lowest. Metrics only choose between routes from the same source. Network+ N10-009 objective 2.1."
    INTRO = "Today's concept: when two routes disagree, what does the router compare first?"
    TAKEAWAY = "Lowest AD wins · metric only breaks ties"
    OUTRO = ("For the exam, administrative distance decides between route sources, and the lowest one wins. "
             "Metric is only used to choose among routes from the same protocol. That's objective two point one.")

    def body(self):
        self.play(FadeIn(self.header("Two routes to the same network")))
        r = self.node("Router", P(-5.2, 0.2), BLUE_C, w=1.8)
        isp = self.node("ISP", P(5.2, 0.2), TEAL_C, w=1.6)
        l1 = Line(r.get_right() + UP * 0.15, isp.get_left() + UP * 0.15, color=YELLOW_C, stroke_width=5)
        l2 = Line(r.get_right() + DOWN * 0.15, isp.get_left() + DOWN * 0.15, color=BLUE_C, stroke_width=5)
        t1 = Text("static default route", font_size=24, color=YELLOW_C).move_to(P(0, 1.4))
        t2 = Text("RIP default route", font_size=24, color=BLUE_C).move_to(P(0, -1.1))
        self.say("A router learns a default route two ways. One is typed in by an administrator, a static route. The other is learned from RIP.")
        self.play(FadeIn(r), FadeIn(isp))
        self.play(Create(l1), FadeIn(t1))
        self.play(Create(l2), FadeIn(t2))
        self.hold()
        m = Text("RIP metric: 1 hop (lower!)", font_size=22, color=CORAL_C).next_to(t2, DOWN, buff=0.2)
        self.say("RIP shows a lower metric, just one hop. That tempts people to choose RIP. But the router does not compare those numbers first.")
        self.play(FadeIn(m))
        self.hold()
        self.play(FadeOut(m))
        ad1 = MathTex(r"\text{static: AD}=1", font_size=40, color=YELLOW_C).move_to(P(0, 0.2)).shift(UP * 0.0)
        ad2 = MathTex(r"\text{RIP: AD}=120", font_size=40, color=BLUE_C)
        self.play(FadeOut(t1), FadeOut(t2), FadeOut(l1), FadeOut(l2))
        grp = VGroup(ad1, ad2).arrange(RIGHT, buff=1.2).move_to(P(0, 0.9))
        self.say("First it compares administrative distance, which measures how much the router trusts the source. Static is one. RIP is one hundred twenty.")
        self.play(Write(grp[0]))
        self.play(Write(grp[1]))
        cmp = MathTex(r"1 < 120", font_size=54, color=TEAL_C).move_to(P(0, -0.7))
        self.say("One is lower than one hundred twenty, so the static route is installed. The decision is made before the metric is ever looked at.")
        self.play(Write(cmp))
        self.play(grp[1].animate.set_opacity(0.3), Indicate(grp[0], color=TEAL_C))
        self.hold()
        self.play(FadeOut(cmp))
        rule = Text("Metric only breaks ties between routes from the same protocol", font_size=24, color=TEAL_C).move_to(P(0, -1.5))
        ex = Text("e.g. RIP route A: 1 hop  vs  RIP route B: 3 hops", font_size=22, color=BLUE_C).move_to(P(0, -2.3))
        self.say("Metric only matters when two routes come from the same protocol, such as two RIP paths with one hop and three hops.")
        self.play(FadeIn(rule))
        self.play(FadeIn(ex))
        self.hold()


# =====================================================================
class W07(CV):
    SLUG = "ip-addr-vs-ipconfig-vs-tracert"
    TITLE = "ip addr, ipconfig and tracert: Which OS, Which Job?"
    CODE = "5.5"; TOPIC = "n10-troubleshoot-tools"; QID = "q-n10t-14"
    NOTES = "/notes/n10-troubleshoot-tools"
    DESC = "On modern Linux, ip addr shows IP address information. ipconfig is the Windows equivalent, and tracert traces a path rather than showing an address. Network+ N10-009 objective 5.5."
    INTRO = "Today's concept: three commands that look alike, and which operating system and job each belongs to."
    TAKEAWAY = "Show my IP: ip addr (Linux) · ipconfig (Windows)"
    OUTRO = ("For the exam, to see IP address information on modern Linux, use IP space ADDR. "
             "Ipconfig is Windows. And tracert traces a path, it does not show your address. That's objective five point five.")

    def body(self):
        self.play(FadeIn(self.header("Show an address, or trace a path?")))
        lx = Text("Linux", font_size=30, color=TEAL_C).move_to(P(-2.2, 1.95))
        wn = Text("Windows", font_size=30, color=BLUE_C).move_to(P(3.2, 1.95))
        r1 = Text("Show my IP", font_size=26, color=YELLOW_C).move_to(P(-5.6, 0.9))
        r2 = Text("Trace the path", font_size=26, color=YELLOW_C).move_to(P(-5.6, -1.1))
        self.say("Two jobs, two operating systems. The first job is showing your own IP address information. The second is tracing the path to another host.")
        self.play(FadeIn(lx), FadeIn(wn))
        self.play(FadeIn(r1), FadeIn(r2))
        c1 = self.node("ip addr", P(-2.2, 0.9), TEAL_C, w=2.6, fs=26)
        c2 = self.node("ipconfig", P(3.2, 0.9), BLUE_C, w=2.6, fs=26)
        self.say("On modern Linux, ip addr shows the address. On Windows, the command is ipconfig.")
        self.play(FadeIn(c1, shift=UP * 0.2))
        self.play(FadeIn(c2, shift=UP * 0.2))
        self.play(Indicate(c1, color=YELLOW_C))
        self.hold()
        old = self.node("ifconfig (older)", P(-2.2, 0.0), GREY_C, w=3.2, h=0.5, fs=18)
        old.set_opacity(0.6).shift(DOWN * 0.0)
        c3 = self.node("traceroute", P(-2.2, -1.1), TEAL_C, w=2.6, fs=26)
        c4 = self.node("tracert", P(3.2, -1.1), BLUE_C, w=2.6, fs=26)
        self.say("Linux still has the older ifconfig, but ip is the modern tool. For tracing, Linux uses traceroute and Windows uses tracert.")
        self.play(FadeIn(old))
        self.play(FadeIn(c3), FadeIn(c4))
        self.hold()
        x = self.X(c4.get_right() + RIGHT * 0.5)
        wrong = Text("tracert traces hops. It does not display your address.", font_size=22, color=CORAL_C).move_to(P(0, -2.3))
        self.say("So tracert is the wrong answer for a question about address information. It lists the routers along a path. It does not show your own address.")
        self.play(Create(x), FadeIn(wrong))
        self.play(Indicate(c4, color=CORAL_C))
        self.hold()
        self.play(FadeIn(self.cap("Linux: ip addr · Windows: ipconfig", TEAL_C, 26, 0.4)))
        self.hold()


# =====================================================================
class W08(CV):
    SLUG = "tacacs-plus-tcp-49-vs-radius-udp-1812"
    TITLE = "TACACS+ Uses TCP 49, RADIUS Uses UDP 1812"
    CODE = "4.1"; TOPIC = "n10-risk-compliance"; QID = "q-n10risk-08"
    NOTES = "/notes/n10-risk-compliance"
    DESC = "TACACS+ runs over TCP port 49, while RADIUS authentication uses UDP port 1812. Network+ N10-009 objective 4.1."
    INTRO = "Today's concept: the transport and port for TACACS plus, and how it differs from RADIUS."
    TAKEAWAY = "TACACS+ = TCP 49 · RADIUS = UDP 1812/1813"
    OUTRO = ("For the exam, TACACS plus is T for TCP, port forty nine. RADIUS is UDP, with eighteen twelve for authentication "
             "and eighteen thirteen for accounting. That's objective four point one.")

    def body(self):
        self.play(FadeIn(self.header("Two AAA protocols")))
        dev = self.node("Switch / router", P(-5, 0.3), BLUE_C, w=2.6, fs=22)
        tac = self.node("TACACS+ server", P(4.8, 1.3), TEAL_C, w=2.8, fs=22)
        rad = self.node("RADIUS server", P(4.8, -1.2), YELLOW_C, w=2.8, fs=22)
        self.say("A network device sends logins to an AAA server. Two common choices are TACACS plus and RADIUS.")
        self.play(FadeIn(dev), FadeIn(tac), FadeIn(rad))
        a1 = Arrow(dev.get_right() + UP * 0.1, tac.get_left(), color=TEAL_C, buff=0.1, stroke_width=5)
        a2 = Arrow(dev.get_right() + DOWN * 0.1, rad.get_left(), color=YELLOW_C, buff=0.1, stroke_width=5)
        l1 = Text("TCP 49", font_size=30, color=TEAL_C).move_to(P(0.2, 1.35))
        l2 = Text("UDP 1812 (auth) · 1813 (accounting)", font_size=22, color=YELLOW_C).move_to(P(-0.2, -1.55))
        self.say("TACACS plus travels over TCP, port forty nine.")
        self.play(GrowArrow(a1), FadeIn(l1))
        self.play(Indicate(l1, color=TEAL_C))
        self.say("RADIUS travels over UDP. Port eighteen twelve carries authentication, and port eighteen thirteen carries accounting.")
        self.play(GrowArrow(a2), FadeIn(l2))
        self.play(Indicate(l2, color=YELLOW_C))
        self.hold()
        mix = Text("TACACS+ is not UDP 1812", font_size=26, color=CORAL_C).move_to(P(-0.4, -2.2))
        cr = self.X(P(-3.3, -2.2))
        self.say("The common mix-up is to pair TACACS plus with UDP eighteen twelve. That port belongs to RADIUS.")
        self.play(FadeIn(mix), Create(cr))
        self.hold()
        tip = Text("T for TCP, T for TACACS+", font_size=26, color=TEAL_C).move_to(P(0, -2.8))
        enc = Text("TACACS+ protects the whole body; RADIUS only the password", font_size=21, color=GREY_C).move_to(P(0, -3.4))
        self.say("A simple hook: T for TCP, T for TACACS plus. TACACS plus also protects the whole packet body, while RADIUS hides only the password.")
        self.play(FadeIn(tip))
        self.play(FadeIn(enc))
        self.hold()
