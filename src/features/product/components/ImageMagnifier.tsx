import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ZoomIn } from 'lucide-react';
import TouchImageZoom from './TouchImageZoom';

interface ImageMagnifierProps {
  src: string;
  alt?: string;
  zoomLevel?: number;
  lensSize?: number;
}

// Tablets and phones get a tap-to-open pinch viewer instead of the hover lens, which
// needs a pointer. Mirrors the `max-lg:hidden` breakpoint used on the lens below.
const TOUCH_QUERY = '(hover: none), (pointer: coarse), (max-width: 1023px)';

const ImageMagnifier: React.FC<ImageMagnifierProps> = ({
  src,
  alt = 'Product image',
  zoomLevel = 2.0,
  lensSize = 180,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [bgPos, setBgPos] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [isTouch, setIsTouch] = useState(false);
  const [showTouchZoom, setShowTouchZoom] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(TOUCH_QUERY);
    const update = () => setIsTouch(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setImgSize({ w: rect.width, h: rect.height });
    setIsHovering(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const half = lensSize / 2;

    setLensPos({
      x: Math.min(Math.max(x - half, 0), rect.width - lensSize),
      y: Math.min(Math.max(y - half, 0), rect.height - lensSize),
    });

    const zoomedW = rect.width * zoomLevel;
    const zoomedH = rect.height * zoomLevel;
    const panelW = rect.width;
    const panelH = rect.height;

    setBgPos({
      x: Math.min(Math.max((x / rect.width) * zoomedW - panelW / 2, 0), zoomedW - panelW),
      y: Math.min(Math.max((y / rect.height) * zoomedH - panelH / 2, 0), zoomedH - panelH),
    });
  }, [zoomLevel, lensSize]);

  const handleMouseLeave = useCallback(() => setIsHovering(false), []);

  return (
    <div className="relative flex flex-col items-center w-full h-full">
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center cursor-crosshair bg-surface overflow-hidden max-lg:cursor-zoom-in"
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={isTouch ? () => setShowTouchZoom(true) : undefined}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-full object-contain select-none block"
          draggable={false}
        />

        {isHovering && (
          <div
            className="absolute pointer-events-none border-2 border-[rgba(0,100,180,0.55)] bg-[rgba(0,100,180,0.08)] z-10 max-lg:hidden"
            style={{
              width: lensSize, height: lensSize,
              left: lensPos.x, top: lensPos.y,
              backgroundImage: 'linear-gradient(0deg,rgba(0,100,180,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(0,100,180,0.15) 1px,transparent 1px)',
              backgroundSize: '8px 8px',
            }}
          />
        )}

        {isTouch && (
          <span className="absolute bottom-3 left-3 z-[5] flex items-center gap-1.5 bg-surface/90 border border-border rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-700 pointer-events-none shadow-sm">
            <ZoomIn size={14} /> Tap to zoom
          </span>
        )}
      </div>
      {isHovering && imgSize.w > 0 && (
        <div
          className="absolute top-0 left-[calc(100%+32px)] bg-surface border border-[#e0e0e0] shadow-[0_4px_24px_rgba(0,0,0,0.15)] z-[100] pointer-events-none bg-no-repeat max-lg:hidden"
          style={{
            width: imgSize.w,
            height: imgSize.h,
            backgroundImage: `url('${src}')`,
            backgroundSize: `${imgSize.w * zoomLevel}px ${imgSize.h * zoomLevel}px`,
            backgroundPosition: `-${bgPos.x}px -${bgPos.y}px`,
          }}
        />
      )}

      {showTouchZoom && (
        <TouchImageZoom src={src} alt={alt} onClose={() => setShowTouchZoom(false)} />
      )}
    </div>
  );
};

export default ImageMagnifier;
