import React, { useCallback, useRef, useState } from 'react';

interface ImageMagnifierProps {
  src: string;
  alt?: string;
  zoomLevel?: number;
  lensSize?: number;
}

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
        className="relative w-full h-full flex items-center justify-center cursor-crosshair bg-surface overflow-hidden max-lg:cursor-default"
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
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
      </div>

      <p className="text-center text-[13px] text-[#007185] mt-2.5 cursor-pointer font-medium hover:underline hover:text-[#c45500] max-lg:hidden">
        Click to see full view
      </p>

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
    </div>
  );
};

export default ImageMagnifier;
