import {useEffect, useRef, type ReactNode} from 'react';
import styles from './BrandCanvas.module.css';

/** Fixed spacing between candle bars, like a real K-line chart. */
const BAR_SPACING = 20;
/** Max total bar length (wick tip to tip) = 50px. */
const MAX_HALF = 160;
/** Gaussian falloff radius — how far the influence spreads. */
const FALLOFF = 80;
/** Body width of each candle bar. */
const BAR_WIDTH = 7;
/** Wick line width. */
const WICK_WIDTH = 1;
/** Easing speed for smooth animation (per frame ~60fps). */
const EASE = 0.03;
/** Easing for mouse leave fade-out. */
const FADE_EASE = 0.045;

interface BarState {
  /** Current animated half-length. */
  len: number;
  /** Pseudo-random seed for organic variation. */
  seed: number;
}

/**
 * Interactive candlestick-style canvas background for the brand hero.
 * Bars are vertically centered on the mouse Y and grow longer
 * the closer they are to the mouse X (max total 50px).
 */
export default function BrandCanvas(): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let bars: BarState[] = [];
    let mouse = {x: -9999, y: 0};
    let inside = false;
    /** Global opacity envelope for fade in/out. */
    let envelope = 0;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Rebuild bar slots on resize
      const count = Math.ceil(width / BAR_SPACING) + 2;
      const next: BarState[] = [];
      for (let i = 0; i < count; i++) {
        next.push(bars[i] ?? {len: 0, seed: Math.random()});
      }
      bars = next;
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse = {x: e.clientX - rect.left, y: e.clientY - rect.top};
      inside = true;
    };

    const onPointerLeave = () => {
      inside = false;
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Ease the global envelope
      const target = inside ? 1 : 0;
      envelope += (target - envelope) * (inside ? EASE * 1.6 : FADE_EASE);
      if (envelope < 0.004 && !inside) {
        envelope = 0;
        // Still animate bars shrinking below
      }

      const isDark =
        document.documentElement.getAttribute('data-theme') === 'dark';
      // const upColor = isDark
      //   ? 'rgba(94, 219, 163, ALPHA)'
      //   : 'rgba(22, 163, 106, ALPHA)';
      // const downColor = isDark
      //   ? 'rgba(244, 115, 115, ALPHA)'
      //   : 'rgba(214, 69, 69, ALPHA)';

      const upColor = isDark ? "rgba(85, 85, 85, ALPHA)" : "rgba(204, 204, 204, ALPHA)";
      const downColor = isDark ? "rgba(51, 51, 51, ALPHA)" : "rgba(238, 238, 238, ALPHA)";


      const originX = (width % BAR_SPACING) / 2;

      // Mouse further from vertical center → smaller max bar length
      const vertDist = Math.abs(mouse.y - height / 2) / (height / 2);
      const vertScale = Math.max(0, 1 - vertDist * vertDist);

      for (let i = 0; i < bars.length; i++) {
        const bar = bars[i];
        const x = originX + i * BAR_SPACING;
        const dist = Math.abs(x - mouse.x);

        // Gaussian falloff: closer to mouse X → longer bar
        const targetLen =
          envelope * MAX_HALF * vertScale * Math.exp(-(dist * dist) / (2 * FALLOFF * FALLOFF));

        bar.len += (targetLen - bar.len) * EASE * 1.8;
        if (bar.len < 0.3) continue;

        const halfLen = bar.len;
        const alpha = Math.min(1, halfLen / MAX_HALF);
        const isUp = bar.seed > 0.5;
        const color = (isUp ? upColor : downColor).replace('ALPHA', "1");

        const cy = mouse.y;

        // Wick — total length = 2 * halfLen ≤ 50px
        ctx.strokeStyle = color;
        ctx.lineWidth = WICK_WIDTH;
        ctx.beginPath();
        ctx.moveTo(x, cy - halfLen);
        ctx.lineTo(x, cy + halfLen);
        ctx.stroke();

        // Body — rounded rect centered on mouse Y
        const bodyHalf = halfLen * 0.68;
        const bx = x - BAR_WIDTH / 2;
        const by = cy - bodyHalf;
        const bh = bodyHalf * 2;
        ctx.fillStyle = color;
        ctx.beginPath();
        const r = Math.min(2, bodyHalf);
        ctx.roundRect(bx, by, BAR_WIDTH, Math.max(bh, 1.5), r);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    // Listen on parent (the hero header) so the whole area is interactive
    const host = canvas.parentElement!;
    host.addEventListener('pointermove', onPointerMove);
    host.addEventListener('pointerleave', onPointerLeave);

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden />;
}
