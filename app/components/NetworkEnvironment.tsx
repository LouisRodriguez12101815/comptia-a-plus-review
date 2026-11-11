"use client";

import { useEffect, useRef } from "react";
import { scene, mobileScene, type InfraNode } from "@/lib/network-environment";
import styles from "./NetworkEnvironment.module.css";

/** Decorative simulation only. Never reads progress, telemetry, or learner storage. */
export function NetworkEnvironment() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0, height = 0, frame = 0, elapsed = 0, last = 0, visible = true;
    let current = scene;
    let disposed = false;
    const positions = new Map<string, { x: number; y: number }>();
    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      const small = width < 700;
      const scroll = Math.min(window.scrollY / Math.max(height, 1), 1.8);
      // Drift is coherent per cluster, so links remain attached to their nodes.
      current.nodes.forEach((n, i) => {
        const drift = motion.matches ? 0 : Math.sin(time * .32 + n.depth * 3) * (small ? 5 : 13);
        positions.set(n.id, { x: n.x * width + drift, y: n.y * height - scroll * (18 + n.depth * 28) + (motion.matches ? 0 : Math.cos(time * .24 + i * .7) * 5) });
      });
      // Perspective field: a faint infrastructure plane, not random star particles.
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(80,125,180,.12)";
      const offset = motion.matches ? 0 : (time * 9) % 45;
      for (let y = height * .4 + offset; y < height + 45; y += 45) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
      for (let i = -8; i < 14; i++) {
        ctx.beginPath(); ctx.moveTo(width * .65, height * .18); ctx.lineTo(i * width / 7, height); ctx.stroke();
      }
      current.zones.forEach((zone) => {
        ctx.save();
        ctx.strokeStyle = zone.color + "65"; ctx.fillStyle = zone.color + "08";
        ctx.setLineDash([5, 8]);
        ctx.beginPath(); ctx.roundRect(zone.x * width, zone.y * height - scroll * 25, zone.w * width, zone.h * height, 28);
        ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = zone.color + "bb"; ctx.font = "11px ui-monospace, monospace";
        ctx.fillText(zone.label, zone.x * width + 18, zone.y * height + 23 - scroll * 25);
        ctx.restore();
      });
      current.edges.forEach((edge, index) => {
        const a = positions.get(edge.from)!, b = positions.get(edge.to)!;
        const cx = (a.x + b.x) / 2 + edge.bend * width;
        const cy = (a.y + b.y) / 2 - Math.abs(edge.bend) * height;
        const point = (p: number) => ({ x: (1-p)**2*a.x + 2*(1-p)*p*cx + p*p*b.x, y: (1-p)**2*a.y + 2*(1-p)*p*cy + p*p*b.y });
        const phase = (time / edge.duration + index * .173) % 1;
        const reroute = edge.alternate && !motion.matches && Math.floor(time / 6) % 2 === 1;
        ctx.save();
        ctx.lineWidth = small ? 1.1 : 1.5;
        ctx.strokeStyle = edge.color + (reroute ? "22" : "65");
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(cx, cy, b.x, b.y); ctx.stroke();
        if (!motion.matches && !reroute) {
          // Multiple packets per actual route; a short illuminated tail shows direction.
          for (let particle = 0; particle < (small ? 1 : 2); particle++) {
            const p = (phase + particle * .5) % 1;
            const at = point(edge.blocked ? Math.min(p, .92) : p);
            ctx.beginPath();
            for (let k = 0; k < 9; k++) {
              const tail = point(Math.max(0, p - .07 + k * .07 / 8));
              if (k === 0) ctx.moveTo(tail.x, tail.y); else ctx.lineTo(tail.x, tail.y);
            }
            ctx.strokeStyle = edge.color + "cc"; ctx.lineWidth = 2.8; ctx.stroke();
            ctx.fillStyle = edge.color; ctx.shadowBlur = 9; ctx.shadowColor = edge.color;
            ctx.beginPath(); ctx.arc(at.x, at.y, edge.blocked ? 3 : 3.8, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
            if (edge.blocked && p > .88) {
              ctx.strokeStyle = "#fb7185"; ctx.beginPath(); ctx.moveTo(at.x-5,at.y-5);ctx.lineTo(at.x+5,at.y+5);ctx.moveTo(at.x+5,at.y-5);ctx.lineTo(at.x-5,at.y+5);ctx.stroke();
            }
          }
        }
        ctx.restore();
      });
      current.nodes.forEach((node, index) => {
        const p = positions.get(node.id)!;
        const radius = (small ? 15 : 20) * (.85 + node.depth * .18);
        ctx.save(); ctx.translate(p.x, p.y);
        const beat = motion.matches ? .5 : (Math.sin(time * 2.4 + index) + 1) / 2;
        ctx.strokeStyle = node.color + "35"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(0,0,radius + 5 + beat * 8,0,Math.PI*2);ctx.stroke();
        ctx.fillStyle = "#0b1729"; ctx.strokeStyle = node.color + "bb";ctx.lineWidth=1.4;
        ctx.beginPath();ctx.roundRect(-radius,-radius,radius*2,radius*2,node.kind === "router" ? radius : 6);ctx.fill();ctx.stroke();
        ctx.strokeStyle = node.color;ctx.fillStyle=node.color;ctx.lineWidth=1.5;
        drawGlyph(ctx, node, radius);
        ctx.font = "10px ui-monospace, monospace";ctx.textAlign="center";ctx.fillStyle="#b9cde3";
        ctx.fillText(node.label, 0, radius+17);
        if (current.telemetry && !small && index % 4 === 0) {
          ctx.globalAlpha = motion.matches ? .65 : .4 + beat * .6;
          ctx.fillStyle=node.color;ctx.font="10px ui-monospace, monospace";
          ctx.fillText(["TCP 443","12 ms","IPv6","TLS"][index/4%4], 0, -radius-13);
        }
        ctx.restore();
      });
    };
    const tick = (now: number) => {
      frame = 0;
      if (disposed || !visible || document.hidden || motion.matches) return;
      elapsed += last ? Math.min((now-last)/1000, .05) : 0;
      last = now; draw(elapsed); frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame); frame=0; last=0;
      draw(motion.matches ? 0 : elapsed);
      if (visible && !document.hidden && !motion.matches && !disposed) frame=requestAnimationFrame(tick);
    };
    const resize = () => {
      const box=canvas.getBoundingClientRect(); width=box.width; height=box.height;
      const dpr=Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width=Math.round(width*dpr); canvas.height=Math.round(height*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
      current=width<700 ? mobileScene : scene;
      sync();
    };
    const observer = new IntersectionObserver(([entry]) => {visible=entry.isIntersecting;sync();});
    // Observe the homepage wrapper, not the fixed canvas (which never leaves view).
    observer.observe(canvas.parentElement!.parentElement!);
    const size = new ResizeObserver(resize);size.observe(canvas);
    motion.addEventListener("change",sync);document.addEventListener("visibilitychange",sync);
    // Reduced motion still repositions the static field on resize, not on scroll.
    resize();
    return () => {disposed=true;cancelAnimationFrame(frame);size.disconnect();observer.disconnect();motion.removeEventListener("change",sync);document.removeEventListener("visibilitychange",sync);};
  }, []);
  return <div className={styles.field} aria-hidden="true"><canvas ref={canvasRef} className={styles.canvas} /><div className={styles.scrim} /></div>;
}

function drawGlyph(ctx: CanvasRenderingContext2D, node: InfraNode, radius: number) {
  const r=radius*.58;
  ctx.beginPath();
  if (node.kind==="cloud") {
    ctx.moveTo(-r,r*.3);ctx.bezierCurveTo(-r*1.6,-r*.3,-r*.5,-r*.9,0,-r*.65);ctx.bezierCurveTo(r*.6,-r*1.4,r*1.6,-r*.3,r,r*.4);ctx.lineTo(-r,r*.4);
  } else if (node.kind==="database") {
    ctx.ellipse(0,-r*.5,r,r*.35,0,0,Math.PI*2);ctx.moveTo(-r,-r*.5);ctx.lineTo(-r,r*.6);ctx.ellipse(0,r*.6,r,r*.35,0,Math.PI,0,true);ctx.lineTo(r,-r*.5);
  } else if (node.kind==="firewall") {
    for(let i=-1;i<=1;i++){ctx.moveTo(-r,i*r*.6);ctx.lineTo(r,i*r*.6);}
    ctx.moveTo(0,-r*.6);ctx.lineTo(0,0);ctx.moveTo(-r*.5,0);ctx.lineTo(-r*.5,r*.6);ctx.moveTo(r*.5,0);ctx.lineTo(r*.5,r*.6);
  } else if (node.kind==="router") {
    ctx.moveTo(-r,0);ctx.lineTo(r,0);ctx.moveTo(0,-r);ctx.lineTo(0,r);
    ctx.moveTo(r*.5,-r*.4);ctx.lineTo(r,0);ctx.lineTo(r*.5,r*.4);
  } else if(node.kind==="device") {
    ctx.rect(-r,-r*.7,r*2,r*1.25);ctx.moveTo(-r*1.2,r*.9);ctx.lineTo(r*1.2,r*.9);
  } else {
    ctx.rect(-r,-r*.65,r*2,r*1.3);
    for(let i=-1;i<=1;i++){ctx.moveTo(i*r*.6,-r*.25);ctx.lineTo(i*r*.6,r*.25);}
  }
  ctx.stroke();
}
