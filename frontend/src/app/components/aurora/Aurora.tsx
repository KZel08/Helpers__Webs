// ─── Aurora Shader Background ────────────────────────────────────────────────
// Lightweight canvas-based aurora using the locked palette.
// Renders soft, animated gradient blobs behind authentication pages.
//
// Props mirror the API described in the task:
//   colorStops : array of hex colors (size 3, in order)
//   amplitude  : intensity of vertical motion
//   blend      : softness of the color falloff
//   speed      : animation speed multiplier
//   className  : additional classes for the wrapper

import { useEffect, useRef } from "react";

export interface AuroraProps {
  colorStops: string[];
  amplitude?: number;
  blend?: number;
  speed?: number;
  className?: string;
}

interface Blob {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  color: string;
}

export function Aurora({
  colorStops,
  amplitude = 1.0,
  blend = 0.5,
  speed = 1.0,
  className = "",
}: AuroraProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const blobsRef = useRef<Blob[]>([]);
  const sizeRef = useRef<{ w: number; h: number; dpr: number }>({
    w: 0,
    h: 0,
    dpr: 1,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const safeStops =
      colorStops && colorStops.length >= 3
        ? colorStops.slice(0, 3)
        : ["#7456D0", "#4FC0E8", "#5BE7C4"];

    // ── Resize handler ────────────────────────────────────────────────────
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      sizeRef.current = { w, h, dpr };
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      // Re-initialise blobs to fit the new canvas, preserving motion phase
      const previous = blobsRef.current;
      blobsRef.current = safeStops.map((color, i) => {
        const base = previous[i];
        return {
          x: base?.x ?? w * (0.3 + i * 0.2),
          y:
            base?.y ??
            h * (0.35 + (i % 2) * 0.15) +
              Math.sin(i) * 60 * amplitude,
          radius: base?.radius ?? Math.max(w, h) * (0.45 + i * 0.05),
          vx: base?.vx ?? (0.15 + i * 0.07) * (i % 2 === 0 ? 1 : -1),
          vy: base?.vy ?? (0.1 + i * 0.05) * (i % 2 === 0 ? -1 : 1),
          color,
        };
      });
    };

    resize();
    window.addEventListener("resize", resize);

    // ── Render loop ───────────────────────────────────────────────────────
    let last = performance.now();
    const render = (now: number) => {
      const dt = Math.min((now - last) / 16.67, 2.5); // normalise to ~60fps
      last = now;
      const { w, h, dpr } = sizeRef.current;
      if (w === 0 || h === 0) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Soft light overlay behind blobs for readability
      const baseAlpha = 0.85 - blend * 0.15;
      ctx.fillStyle = `rgba(248, 247, 251, ${baseAlpha})`;
      ctx.fillRect(0, 0, w, h);

      const blobs = blobsRef.current;
      for (const b of blobs) {
        b.x += b.vx * speed * dt;
        b.y += b.vy * speed * dt * 0.6;

        // Bounce within canvas with margin so blobs wrap softly
        const margin = b.radius * 0.4;
        if (b.x < -margin) b.vx = Math.abs(b.vx);
        else if (b.x > w + margin) b.vx = -Math.abs(b.vx);
        if (b.y < -margin) b.vy = Math.abs(b.vy);
        else if (b.y > h + margin) b.vy = -Math.abs(b.vy);

        // Gentle vertical bobbing for organic feel
        const bob = Math.sin((now / 1000 + b.x * 0.001) * speed) * 8 * amplitude;
        const drawY = b.y + bob;

        const grad = ctx.createRadialGradient(b.x, drawY, 0, b.x, drawY, b.radius);
        const alpha = 0.55 + blend * 0.2;
        grad.addColorStop(0, hexToRgba(b.color, alpha));
        grad.addColorStop(0.6, hexToRgba(b.color, alpha * 0.35));
        grad.addColorStop(1, hexToRgba(b.color, 0));

        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, drawY, b.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    // ── Cleanup ──────────────────────────────────────────────────────────
    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
    // Re-create aurora when colorStops change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorStops.join(","), amplitude, blend, speed]);

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 overflow-hidden pointer-events-none ${className}`}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────
function hexToRgba(hex: string, alpha: number): string {
  let h = hex.trim().replace("#", "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default Aurora;
