from manim import *

BLUE_C = "#58C4DD"
TEAL_C = "#5CD0B3"
YELLOW_C = "#FFD866"
CORAL_C = "#FF6B6B"
GREY_C = "#8A8F98"


class RoutingExplained(Scene):
    """CompTIA Network+ Ch.10: how routers choose paths
    (hop count vs. cost, distance vector vs. link state, AD, loops)."""

    # ---------- helpers ----------
    def router(self, label, pos, color=BLUE_C):
        body = Circle(radius=0.38, color=color, fill_color=color, fill_opacity=0.18, stroke_width=4)
        txt = Text(label, font_size=28, color=WHITE)
        g = VGroup(body, txt).move_to(np.array([pos[0], pos[1], 0]))
        return g

    def link(self, a, b, color=GREY_C, width=4):
        d = (b.get_center() - a.get_center())
        d = d / np.linalg.norm(d)
        return Line(a.get_center() + d * 0.38, b.get_center() - d * 0.38,
                    color=color, stroke_width=width)

    def tag(self, text, node, direction, color=YELLOW_C, size=22):
        return Text(text, font_size=size, color=color).next_to(node, direction, buff=0.2)

    def title(self, text, sub=None):
        t = Text(text, font_size=40, color=BLUE_C).to_edge(UP, buff=0.4)
        if sub:
            s = Text(sub, font_size=24, color=GREY_C).next_to(t, DOWN, buff=0.15)
            return VGroup(t, s)
        return VGroup(t)

    def build_topology(self):
        self.A = self.router("A", [-4.8, -0.2])
        self.B = self.router("B", [-2.6, 1.3])
        self.C = self.router("C", [-0.1, 1.3])
        self.D = self.router("D", [2.3, -0.2])
        self.N = VGroup(
            RoundedRectangle(corner_radius=0.1, width=1.2, height=0.7, color=TEAL_C,
                             fill_color=TEAL_C, fill_opacity=0.2, stroke_width=4),
            Text("Net N", font_size=24, color=WHITE),
        ).move_to(np.array([5.0, -0.2, 0]))
        self.l_ab = self.link(self.A, self.B)
        self.l_bc = self.link(self.B, self.C)
        self.l_cd = self.link(self.C, self.D)
        self.l_ad = self.link(self.A, self.D)
        # D to N: stop at the rectangle edge
        self.l_dn = Line(self.D.get_center() + RIGHT * 0.38, self.N.get_left(),
                         color=GREY_C, stroke_width=4)
        self.links = VGroup(self.l_ab, self.l_bc, self.l_cd, self.l_ad, self.l_dn)
        self.routers = VGroup(self.A, self.B, self.C, self.D, self.N)
        # A-D is drawn as a curve below so it reads as the "short but slow" link
        self.l_ad = ArcBetweenPoints(self.A.get_bottom() + DOWN * 0.0,
                                     self.D.get_bottom() + DOWN * 0.0,
                                     angle=PI / 3.2, color=GREY_C, stroke_width=4)
        self.links = VGroup(self.l_ab, self.l_bc, self.l_cd, self.l_ad, self.l_dn)

    # ---------- scene ----------
    def construct(self):
        self.intro()
        self.hop_count_and_distance_vector()
        self.link_state()
        self.admin_distance()
        self.routing_loops()
        self.summary()

    # 1 ------------------------------------------------------------
    def intro(self):
        q = Text("A packet needs to reach Net N.", font_size=40, color=WHITE)
        q2 = Text("Which path should the router pick?", font_size=40, color=YELLOW_C)
        VGroup(q, q2).arrange(DOWN, buff=0.4)
        self.play(FadeIn(q, shift=UP * 0.3))
        self.wait(1)
        self.play(FadeIn(q2, shift=UP * 0.3))
        self.wait(2)
        self.play(FadeOut(q), FadeOut(q2))

        self.build_topology()
        ttl = self.title("Chapter 10 · Routing Protocols")
        self.play(Write(ttl))
        self.play(LaggedStart(*[FadeIn(r, scale=0.6) for r in
                                [self.A, self.B, self.C, self.D, self.N]], lag_ratio=0.2))
        self.play(LaggedStart(*[Create(l) for l in self.links], lag_ratio=0.2))
        self.wait(1)

        rule = Text("Router A has two routes to Net N", font_size=30, color=WHITE).to_edge(DOWN, buff=1.4)
        top = Text("Top: A → B → C → D", font_size=26, color=TEAL_C)
        bot = Text("Bottom: A → D (direct)", font_size=26, color=CORAL_C)
        VGroup(top, bot).arrange(RIGHT, buff=1.0).next_to(rule, DOWN, buff=0.3)
        self.play(FadeIn(rule))
        self.wait(1)

        path_top = VGroup(self.l_ab, self.l_bc, self.l_cd).copy().set_color(TEAL_C).set_stroke(width=8)
        path_bot = self.l_ad.copy().set_color(CORAL_C).set_stroke(width=8)
        self.play(Create(path_top), FadeIn(top))
        self.wait(1)
        self.play(Create(path_bot), FadeIn(bot))
        self.wait(2)
        self.play(FadeOut(path_top), FadeOut(path_bot), FadeOut(rule), FadeOut(top), FadeOut(bot))
        self.ttl = ttl

    # 2 ------------------------------------------------------------
    def hop_count_and_distance_vector(self):
        new_ttl = self.title("Distance Vector · RIP", "metric = hop count · updates every 30 s")
        self.play(ReplacementTransform(self.ttl, new_ttl))
        self.ttl = new_ttl

        t_d = self.tag("N: 0 hops", self.D, UP)
        self.play(FadeIn(t_d, shift=DOWN * 0.2))
        self.wait(1)
        note = Text("Each router tells its neighbors: “I can reach N in … hops”",
                    font_size=26, color=WHITE).to_edge(DOWN, buff=1.5)
        self.play(FadeIn(note))
        self.wait(1)

        # round 1
        t_c = self.tag("N: 1 hop", self.C, UP)
        t_a = self.tag("N: 1 hop", self.A, LEFT)
        self.play(
            TransformFromCopy(t_d, t_c),
            TransformFromCopy(t_d, t_a),
            self.l_cd.animate.set_color(YELLOW_C),
            self.l_ad.animate.set_color(YELLOW_C),
        )
        self.play(self.l_cd.animate.set_color(GREY_C), self.l_ad.animate.set_color(GREY_C))
        self.wait(1)

        # round 2
        t_b = self.tag("N: 2 hops", self.B, UP)
        self.play(TransformFromCopy(t_c, t_b), self.l_bc.animate.set_color(YELLOW_C))
        self.play(self.l_bc.animate.set_color(GREY_C))
        self.wait(1)

        # B tells A: 3 hops -> rejected
        t_try = Text("N: 3 hops", font_size=22, color=CORAL_C).next_to(self.A, UP, buff=0.35).shift(LEFT * 0.2)
        self.play(TransformFromCopy(t_b, t_try), self.l_ab.animate.set_color(CORAL_C))
        cross = Cross(t_try, stroke_color=CORAL_C, stroke_width=5).scale(0.8)
        self.play(Create(cross))
        self.play(self.l_ab.animate.set_color(GREY_C))
        self.wait(1)
        self.play(FadeOut(note), FadeOut(t_try), FadeOut(cross))

        # Bellman-Ford equation
        eq1 = MathTex(r"d_A(N)", r"=", r"\min_{v \in \{B,\,D\}}", r"\bigl(1 + d_v(N)\bigr)",
                      font_size=44, color=WHITE).to_edge(DOWN, buff=1.6)
        eq1[0].set_color(BLUE_C)
        eq2 = MathTex(r"d_A(N)", r"=", r"\min\bigl(", r"1+2", r",\ ", r"1+0", r"\bigr)", r"=", r"1",
                      font_size=44, color=WHITE).to_edge(DOWN, buff=1.6)
        eq2[0].set_color(BLUE_C)
        eq2[3].set_color(CORAL_C)
        eq2[5].set_color(TEAL_C)
        eq2[8].set_color(YELLOW_C)
        self.play(Write(eq1))
        self.wait(2)
        self.play(TransformMatchingTex(eq1, eq2))
        self.wait(1)

        pick = self.l_ad.copy().set_color(YELLOW_C).set_stroke(width=9)
        verdict = Text("RIP sends A's traffic over the direct link A → D", font_size=26,
                       color=YELLOW_C).next_to(eq2, DOWN, buff=0.3)
        self.play(Create(pick), FadeIn(verdict))
        self.wait(2)

        limit = MathTex(r"\text{hop count} \le 15 \qquad 16 = \text{unreachable}",
                        font_size=36, color=CORAL_C).move_to(eq2)
        self.play(FadeOut(eq2), FadeOut(verdict))
        self.play(Write(limit))
        self.wait(2)
        self.play(FadeOut(limit), FadeOut(pick))

        self.play(FadeOut(t_a), FadeOut(t_b), FadeOut(t_c), FadeOut(t_d))

    # 3 ------------------------------------------------------------
    def link_state(self):
        new_ttl = self.title("Link State · OSPF", "every router learns the whole map, then runs Dijkstra")
        self.play(ReplacementTransform(self.ttl, new_ttl))
        self.ttl = new_ttl

        cost_formula = MathTex(r"\text{cost}", r"=", r"\frac{10^{8}}{\text{bandwidth (bps)}}",
                               font_size=48, color=WHITE).to_edge(DOWN, buff=0.6).shift(RIGHT * 1.5)
        cost_formula[0].set_color(YELLOW_C)
        self.play(Write(cost_formula))
        self.wait(2)

        def lab(txt, line, color, direction):
            return Text(txt, font_size=24, color=color).move_to(line.get_center()).shift(direction * 0.35)

        c_ab = lab("1", self.l_ab, TEAL_C, UL * 0.7)
        c_bc = lab("1", self.l_bc, TEAL_C, UP)
        c_cd = lab("1", self.l_cd, TEAL_C, UR * 0.7)
        c_ad = Text("64", font_size=24, color=CORAL_C).move_to(self.l_ad.point_from_proportion(0.5) + UP * 0.35)
        legend = VGroup(
            Text("100 Mbps link → cost 1", font_size=22, color=TEAL_C),
            Text("T1 serial (1.544 Mbps) → cost 64", font_size=22, color=CORAL_C),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.15).to_corner(DL, buff=0.4)
        self.play(LaggedStart(FadeIn(c_ab), FadeIn(c_bc), FadeIn(c_cd), FadeIn(c_ad), lag_ratio=0.25))
        self.play(FadeIn(legend))
        self.wait(2)
        self.play(self.l_ad.animate.set_color(CORAL_C), self.l_ad.animate.set_stroke(width=3))
        self.wait(1)

        # Compare the two paths
        eq = MathTex(r"\text{A→B→C→D}", r":\ 1+1+1", r"=", r"3", r"\ <\ ",
                     r"\text{A→D}", r":\ 64",
                     font_size=40, color=WHITE).to_edge(DOWN, buff=1.1)
        eq[0].set_color(TEAL_C); eq[3].set_color(YELLOW_C); eq[5].set_color(CORAL_C)
        self.play(FadeOut(cost_formula), FadeOut(legend))
        self.play(Write(eq))

        # Dijkstra sweep along the cheap path
        fast = VGroup(self.l_ab, self.l_bc, self.l_cd).copy().set_color(YELLOW_C).set_stroke(width=9)
        dots = [Circle(radius=0.46, color=YELLOW_C, stroke_width=6).move_to(self.A.get_center())]
        self.add(dots[0])
        for node, seg in zip([self.B, self.C, self.D], fast):
            self.play(Create(seg), run_time=0.9)
            d = Circle(radius=0.46, color=YELLOW_C, stroke_width=6).move_to(node.get_center())
            self.play(FadeIn(d, scale=2), run_time=0.4)
            dots.append(d)
        self.wait(1)

        verdict = Text("OSPF picks the lowest total cost, even though it uses more hops",
                       font_size=26, color=YELLOW_C).next_to(eq, DOWN, buff=0.25)
        self.play(FadeIn(verdict))
        self.wait(3)

        contrast = VGroup(
            Text("RIP counts hops → direct (slow) link", font_size=26, color=CORAL_C),
            Text("OSPF counts bandwidth → three fast hops", font_size=26, color=TEAL_C),
        ).arrange(DOWN, buff=0.2).next_to(eq, DOWN, buff=0.3)
        self.play(ReplacementTransform(verdict, contrast))
        self.wait(3)

        self.play(FadeOut(eq), FadeOut(contrast), FadeOut(fast),
                  FadeOut(VGroup(*dots)), FadeOut(c_ab), FadeOut(c_bc), FadeOut(c_cd), FadeOut(c_ad))
        self.play(self.l_ad.animate.set_color(GREY_C).set_stroke(width=4))

    # 4 ------------------------------------------------------------
    def admin_distance(self):
        everything = VGroup(self.links, self.routers)
        new_ttl = self.title("Administrative Distance", "when two protocols disagree, the lower AD wins")
        self.play(FadeOut(everything), ReplacementTransform(self.ttl, new_ttl))
        self.ttl = new_ttl

        rows = [("Connected", 0, TEAL_C), ("Static", 1, TEAL_C), ("EIGRP", 90, BLUE_C),
                ("OSPF", 110, BLUE_C), ("RIP", 120, CORAL_C)]
        scale = 5.5 / 120
        bars, labels, nums = VGroup(), VGroup(), VGroup()
        for i, (name, ad, col) in enumerate(rows):
            y = 1.2 - i * 0.8
            w = max(ad * scale, 0.05)
            bar = Rectangle(width=w, height=0.5, color=col, fill_color=col, fill_opacity=0.7,
                            stroke_width=2).move_to([-2.5, y, 0], aligned_edge=LEFT)
            lab = Text(name, font_size=26, color=WHITE).next_to(bar, LEFT, buff=0.0).set_x(-3.7, direction=LEFT)
            lab.move_to([-4.0, y, 0], aligned_edge=RIGHT)
            num = MathTex(str(ad), font_size=34, color=WHITE).next_to(bar, RIGHT, buff=0.25)
            bars.add(bar); labels.add(lab); nums.add(num)
        self.play(LaggedStart(*[FadeIn(l, shift=RIGHT * 0.2) for l in labels], lag_ratio=0.15))
        self.play(LaggedStart(*[GrowFromEdge(b, LEFT) for b in bars], lag_ratio=0.15))
        self.play(LaggedStart(*[FadeIn(n) for n in nums], lag_ratio=0.15))
        self.wait(2)

        box = SurroundingRectangle(VGroup(labels[3], nums[3], labels[4], nums[4]),
                                   color=YELLOW_C, buff=0.2)
        eq = MathTex(r"\text{AD}_{\text{OSPF}} = 110", r"\ <\ ", r"\text{AD}_{\text{RIP}} = 120",
                     r"\ \Rightarrow\ \text{OSPF route wins}", font_size=38, color=WHITE
                     ).to_edge(DOWN, buff=0.9)
        eq[0].set_color(BLUE_C); eq[2].set_color(CORAL_C); eq[3].set_color(YELLOW_C)
        self.play(Create(box))
        self.play(Write(eq))
        self.wait(3)
        self.play(FadeOut(box), FadeOut(eq), FadeOut(bars), FadeOut(labels), FadeOut(nums))

    # 5 ------------------------------------------------------------
    def routing_loops(self):
        new_ttl = self.title("Routing Loops & Split Horizon", "bad news travels slowly")
        self.play(ReplacementTransform(self.ttl, new_ttl))
        self.ttl = new_ttl

        a = self.router("A", [-1.2, 0.3])
        b = self.router("B", [2.8, 0.3])
        n = VGroup(
            RoundedRectangle(corner_radius=0.1, width=1.2, height=0.7, color=TEAL_C,
                             fill_color=TEAL_C, fill_opacity=0.2, stroke_width=4),
            Text("Net N", font_size=24, color=WHITE)).move_to(np.array([-4.2, 0.3, 0]))
        l_an = Line(n.get_right(), a.get_left() + LEFT * 0.0, color=GREY_C, stroke_width=4)
        l_ab = self.link(a, b)
        self.play(FadeIn(n), FadeIn(a), FadeIn(b), Create(l_an), Create(l_ab))
        self.wait(1)

        fail = Text("Net N goes down!", font_size=28, color=CORAL_C).next_to(n, DOWN, buff=0.5).shift(RIGHT * 0.9)
        x = Cross(Square(0.4), stroke_color=CORAL_C, stroke_width=6).move_to(l_an.get_center())
        self.play(l_an.animate.set_color(CORAL_C), Create(x), FadeIn(fail))
        self.wait(1.5)

        story = Text("B still advertises “N is 1 hop away” …", font_size=26, color=WHITE
                     ).next_to(l_ab, DOWN, buff=1.6).set_x(0.8)
        self.play(FadeIn(story))
        self.wait(1.5)

        tracker = ValueTracker(2)
        counter = VGroup(
            MathTex(r"\text{metric to N} =", font_size=44, color=WHITE),
            DecimalNumber(2, num_decimal_places=0, font_size=60, color=YELLOW_C),
        ).arrange(RIGHT, buff=0.3).next_to(story, DOWN, buff=0.7)
        counter[1].add_updater(lambda m: m.set_value(tracker.get_value()))
        arrow_ab = Arrow(a.get_top() + UP * 0.1, b.get_top() + UP * 0.1, buff=0.1, color=YELLOW_C,
                         path_arc=-0.6, stroke_width=5)
        arrow_ba = Arrow(b.get_top() + UP * 0.1, a.get_top() + UP * 0.1, buff=0.1, color=CORAL_C,
                         path_arc=-0.6, stroke_width=5)
        self.play(FadeIn(counter))
        self.play(GrowArrow(arrow_ba))
        self.wait(0.5)
        self.play(ReplacementTransform(arrow_ba, arrow_ab), tracker.animate.set_value(3), run_time=1)
        arrow_ba = Arrow(b.get_top() + UP * 0.1, a.get_top() + UP * 0.1, buff=0.1, color=CORAL_C,
                         path_arc=-0.6, stroke_width=5)
        self.play(ReplacementTransform(arrow_ab, arrow_ba), tracker.animate.set_value(4), run_time=1)
        self.play(tracker.animate.set_value(16), run_time=3, rate_func=linear)
        inf = MathTex(r"16 = \infty", font_size=48, color=CORAL_C).move_to(counter)
        counter[1].clear_updaters()
        self.play(FadeOut(counter), FadeIn(inf))
        self.wait(2)
        self.play(FadeOut(inf), FadeOut(arrow_ba), FadeOut(story))

        # Split horizon
        rule = MathTex(r"\text{Never advertise a route out the interface}\ ",
                       r"\text{it was learned on}", font_size=36, color=WHITE
                       ).arrange(DOWN, buff=0.15).to_edge(DOWN, buff=1.6)
        rule[1].set_color(TEAL_C)
        learned = Arrow(a.get_top() + UP * 0.1, b.get_top() + UP * 0.1, buff=0.1, color=TEAL_C,
                        path_arc=-0.6, stroke_width=5)
        back = Arrow(b.get_bottom() + DOWN * 0.1, a.get_bottom() + DOWN * 0.1, buff=0.1, color=CORAL_C,
                     path_arc=-0.6, stroke_width=5)
        sh = Text("Split horizon", font_size=34, color=YELLOW_C).next_to(l_ab, UP, buff=1.0)
        self.play(FadeIn(sh))
        self.play(GrowArrow(learned))
        self.wait(1)
        self.play(GrowArrow(back))
        bx = Cross(Square(0.4), stroke_color=CORAL_C, stroke_width=6).move_to(back.point_from_proportion(0.5))
        self.play(Create(bx))
        self.play(Write(rule))
        self.wait(4)
        self.play(*[FadeOut(m) for m in [n, a, b, l_an, l_ab, x, fail, learned, back, bx, sh, rule]])

    # 6 ------------------------------------------------------------
    def summary(self):
        new_ttl = self.title("Putting it together")
        self.play(ReplacementTransform(self.ttl, new_ttl))

        header = ["Protocol", "Type", "Metric", "AD"]
        data = [
            ["RIP / RIPv2", "Distance vector", "Hop count (max 15)", "120"],
            ["EIGRP", "Hybrid", "Bandwidth + delay", "90"],
            ["OSPF", "Link state", "Cost = 10⁸ / bandwidth", "110"],
            ["BGP", "Path vector", "AS path", "—"],
        ]
        table = Table(data, col_labels=[Text(h, font_size=26, color=YELLOW_C) for h in header],
                      element_to_mobject=lambda s: Text(s, font_size=24, color=WHITE),
                      line_config={"stroke_color": GREY_C, "stroke_width": 2},
                      h_buff=0.7, v_buff=0.45).scale(0.9).shift(DOWN * 0.2)
        self.play(Create(table), run_time=3)
        self.wait(3)

        final = MathTex(r"\text{best route}", r"=", r"\text{lowest AD}", r"\rightarrow",
                        r"\text{lowest metric}", font_size=40, color=WHITE
                        ).to_edge(DOWN, buff=0.8)
        final[0].set_color(BLUE_C); final[2].set_color(TEAL_C); final[4].set_color(YELLOW_C)
        self.play(Write(final))
        self.wait(4)
        self.play(FadeOut(table), FadeOut(final), FadeOut(new_ttl))
        self.wait(1)
