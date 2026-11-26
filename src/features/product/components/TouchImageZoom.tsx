import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Minus, Plus, RotateCcw, X } from 'lucide-react';

interface TouchImageZoomProps {
  src: string;
  alt?: string;
  onClose: () => void;
  minScale?: number;
  maxScale?: number;
}

const DOUBLE_TAP_MS = 280;
const DOUBLE_TAP_SLOP = 30;

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

const distance = (a: Touch, b: Touch) =>
  Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

/**
 * Fullscreen pinch-to-zoom viewer for touch devices (phones and tablets), where the
 * hover magnifier in ImageMagnifier cannot work. Supports pinch, double-tap and drag-pan,
 * plus on-screen controls for tablets used with a stylus or trackpad.
 */
const TouchImageZoom: React.FC<TouchImageZoomProps> = ({
  src,
  alt = 'Product image',
  onClose,
  minScale = 1,
  maxScale = 4,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [scale, setScale] = useState(minScale);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  // Size the image occupies at scale 1, derived from its natural ratio and the stage box.
  const [baseSize, setBaseSize] = useState({ w: 0, h: 0 });

  // Gesture bookkeeping kept in refs so the native listeners never go stale.
  const gesture = useRef({
    startDist: 0,
    startScale: minScale,
    startTranslate: { x: 0, y: 0 },
    panStart: { x: 0, y: 0 },
    lastTapAt: 0,
    lastTapPos: { x: 0, y: 0 },
  });
  const live = useRef({ scale: minScale, translate: { x: 0, y: 0 }, baseSize: { w: 0, h: 0 } });
  live.current = { scale, translate, baseSize };

  const measure = useCallback(() => {
    const stage = stageRef.current;
    const img = imgRef.current;
    if (!stage || !img || !img.naturalWidth || !img.naturalHeight) return;
    const { width, height } = stage.getBoundingClientRect();
    const ratio = Math.min(width / img.naturalWidth, height / img.naturalHeight);
    setBaseSize({ w: img.naturalWidth * ratio, h: img.naturalHeight * ratio });
  }, []);

  useLayoutEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, [measure, src]);

  // Keep the page behind the overlay from scrolling while it is open.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  /** Largest pan offset that still keeps image content covering the stage. */
  const panBounds = useCallback((s: number) => {
    const stage = stageRef.current;
    const { w, h } = live.current.baseSize;
    if (!stage) return { x: 0, y: 0 };
    const rect = stage.getBoundingClientRect();
    return {
      x: Math.max(0, (w * s - rect.width) / 2),
      y: Math.max(0, (h * s - rect.height) / 2),
    };
  }, []);

  const applyTranslate = useCallback((next: { x: number; y: number }, s: number) => {
    const bounds = panBounds(s);
    setTranslate({ x: clamp(next.x, -bounds.x, bounds.x), y: clamp(next.y, -bounds.y, bounds.y) });
  }, [panBounds]);

  /**
   * Zoom to `nextScale` while keeping the point (px, py) — in viewport coordinates —
   * pinned under the finger. Mirrors `translate(t) scale(s)` with a centered origin.
   */
  const zoomAround = useCallback((nextScale: number, px: number, py: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const { scale: s0, translate: t0 } = live.current;
    const s1 = clamp(nextScale, minScale, maxScale);
    const factor = s1 / s0;
    const next = {
      x: px - cx - factor * (px - cx - t0.x),
      y: py - cy - factor * (py - cy - t0.y),
    };
    setScale(s1);
    if (s1 <= minScale) setTranslate({ x: 0, y: 0 });
    else applyTranslate(next, s1);
  }, [applyTranslate, maxScale, minScale]);

  // Native listeners, because touchmove must be non-passive to cancel page scrolling.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const onTouchStart = (e: TouchEvent) => {
      const g = gesture.current;
      if (e.touches.length === 2) {
        g.startDist = distance(e.touches[0], e.touches[1]);
        g.startScale = live.current.scale;
        g.startTranslate = { ...live.current.translate };
        return;
      }
      if (e.touches.length !== 1) return;

      const t = e.touches[0];
      const now = Date.now();
      const isDoubleTap =
        now - g.lastTapAt < DOUBLE_TAP_MS &&
        Math.hypot(t.clientX - g.lastTapPos.x, t.clientY - g.lastTapPos.y) < DOUBLE_TAP_SLOP;

      if (isDoubleTap) {
        g.lastTapAt = 0;
        zoomAround(live.current.scale > minScale ? minScale : 2.5, t.clientX, t.clientY);
        return;
      }

      g.lastTapAt = now;
      g.lastTapPos = { x: t.clientX, y: t.clientY };
      g.panStart = { x: t.clientX, y: t.clientY };
      g.startTranslate = { ...live.current.translate };
    };

    const onTouchMove = (e: TouchEvent) => {
      const g = gesture.current;

      if (e.touches.length === 2 && g.startDist > 0) {
        e.preventDefault();
        const dist = distance(e.touches[0], e.touches[1]);
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        // Re-anchor to the gesture's own start so the pinch stays stable across frames.
        const s0 = live.current.scale;
        const target = clamp(g.startScale * (dist / g.startDist), minScale, maxScale);
        if (Math.abs(target - s0) > 0.001) zoomAround(target, midX, midY);
        return;
      }

      if (e.touches.length === 1 && live.current.scale > minScale) {
        e.preventDefault();
        const t = e.touches[0];
        applyTranslate(
          {
            x: g.startTranslate.x + (t.clientX - g.panStart.x),
            y: g.startTranslate.y + (t.clientY - g.panStart.y),
          },
          live.current.scale,
        );
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) gesture.current.startDist = 0;
    };

    stage.addEventListener('touchstart', onTouchStart, { passive: false });
    stage.addEventListener('touchmove', onTouchMove, { passive: false });
    stage.addEventListener('touchend', onTouchEnd);
    stage.addEventListener('touchcancel', onTouchEnd);
    return () => {
      stage.removeEventListener('touchstart', onTouchStart);
      stage.removeEventListener('touchmove', onTouchMove);
      stage.removeEventListener('touchend', onTouchEnd);
      stage.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [applyTranslate, maxScale, minScale, zoomAround]);

  const stepZoom = (delta: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    zoomAround(live.current.scale + delta, rect.left + rect.width / 2, rect.top + rect.height / 2);
  };

  const reset = () => { setScale(minScale); setTranslate({ x: 0, y: 0 }); };

  const btnCls =
    'bg-surface/95 border border-border rounded-full w-11 h-11 flex items-center justify-center cursor-pointer shadow-md text-slate-700 transition-colors active:bg-cream disabled:opacity-40';

  return (
    <div className="fixed inset-0 z-[1000] bg-black flex flex-col touch-none select-none">
      <div className="flex items-center justify-between p-4 shrink-0">
        <span className="text-white/80 text-xs font-semibold tracking-wide">
          {scale > minScale ? `${scale.toFixed(1)}×  ·  drag to pan` : 'Pinch or double-tap to zoom'}
        </span>
        <button onClick={onClose} aria-label="Close zoom" className={btnCls}>
          <X size={20} />
        </button>
      </div>

      <div
        ref={stageRef}
        className="flex-1 min-h-0 overflow-hidden flex items-center justify-center"
        onClick={(e) => { if (e.target === e.currentTarget && scale <= minScale) onClose(); }}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={measure}
          draggable={false}
          className="max-w-full max-h-full object-contain block will-change-transform"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transition: gesture.current.startDist ? 'none' : 'transform 120ms ease-out',
            width: baseSize.w || undefined,
            height: baseSize.h || undefined,
          }}
        />
      </div>

      <div className="flex items-center justify-center gap-3 p-5 shrink-0">
        <button onClick={() => stepZoom(-0.5)} disabled={scale <= minScale} aria-label="Zoom out" className={btnCls}>
          <Minus size={20} />
        </button>
        <button onClick={reset} disabled={scale <= minScale} aria-label="Reset zoom" className={btnCls}>
          <RotateCcw size={18} />
        </button>
        <button onClick={() => stepZoom(0.5)} disabled={scale >= maxScale} aria-label="Zoom in" className={btnCls}>
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
};

export default TouchImageZoom;
