'use client';

import React, { useEffect, useRef } from 'react';

interface NNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
}

export default function NeuralFabricCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const nodes = useRef<NNode[]>([]);
  const raf = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;

    function init() {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx.scale(dpr, dpr);
      const count = Math.min(90, Math.max(40, Math.floor((w * h) / 7500)));
      nodes.current = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.6 + 0.6,
        phase: Math.random() * Math.PI * 2,
      }));
    }

    function tick(t: number) {
      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      const ns = nodes.current;
      const mx = mouse.current.x;
      const my = mouse.current.y;

      ctx.clearRect(0, 0, w, h);

      for (const n of ns) {
        const dx = n.x - mx;
        const dy = n.y - my;
        const dist = Math.hypot(dx, dy);
        if (dist < 140 && dist > 0) {
          const f = ((140 - dist) / 140) * 0.07;
          n.vx += (dx / dist) * f;
          n.vy += (dy / dist) * f;
        }
        n.vx *= 0.991;
        n.vy *= 0.991;
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0) { n.x = 0; n.vx *= -1; }
        if (n.x > w) { n.x = w; n.vx *= -1; }
        if (n.y < 0) { n.y = 0; n.vy *= -1; }
        if (n.y > h) { n.y = h; n.vy *= -1; }
      }

      const MAXD = 155;
      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          const dx = ns[i].x - ns[j].x;
          const dy = ns[i].y - ns[j].y;
          const d = Math.hypot(dx, dy);
          if (d < MAXD) {
            const midX = (ns[i].x + ns[j].x) / 2;
            const midY = (ns[i].y + ns[j].y) / 2;
            const glow = Math.max(0, 1 - Math.hypot(midX - mx, midY - my) / 230);
            const alpha = (1 - d / MAXD) * 0.1 + glow * 0.32;
            ctx.beginPath();
            ctx.moveTo(ns[i].x, ns[i].y);
            ctx.lineTo(ns[j].x, ns[j].y);
            ctx.strokeStyle = `hsla(var(--accent-hsl), ${alpha})`;
            ctx.lineWidth = 0.55;
            ctx.stroke();
          }
        }
      }

      for (const n of ns) {
        const pulse = Math.sin(t * 0.0007 + n.phase) * 0.22 + 0.78;
        const glow = Math.max(0, 1 - Math.hypot(n.x - mx, n.y - my) / 170);
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(var(--accent-hsl), ${0.3 + glow * 0.6})`;
        ctx.fill();
        if (glow > 0.25) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * pulse * 3, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(var(--accent-hsl), ${glow * 0.07})`;
          ctx.fill();
        }
      }

      raf.current = requestAnimationFrame(tick);
    }

    init();
    const ro = new ResizeObserver(init);
    ro.observe(canvas);

    const onMove = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => { mouse.current = { x: -9999, y: -9999 }; };
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    raf.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf.current);
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
