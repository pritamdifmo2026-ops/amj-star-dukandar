import React, { useCallback, useRef, useState } from 'react';
import styles from './ImageMagnifier.module.css';

interface ImageMagnifierProps {
  src: string;
  alt?: string;
  /** Zoom level multiplier (default 2.5) */
  zoomLevel?: number;
  /** Size of the lens square in px (default 180) */
  lensSize?: number;
}

/**
 * Amazon-style product image magnifier.
 * - Shows a blue grid lens on the image following the cursor
 * - Displays a zoomed preview panel that overlays to the right
 * - "Click to see full view" hint below the image
 */
const ImageMagnifier: React.FC<ImageMagnifierProps> = ({
  src,
  alt = 'Product image',
  zoomLevel = 2.5,
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

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      // cursor position relative to the image container
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;

      // half lens
      const half = lensSize / 2;

      // clamp lens so it doesn't go outside the image
      const lensX = Math.min(Math.max(x - half, 0), rect.width - lensSize);
      const lensY = Math.min(Math.max(y - half, 0), rect.height - lensSize);
      setLensPos({ x: lensX, y: lensY });

      // calculate background position for the zoom panel
      // ratio of cursor position within the image
      const ratioX = x / rect.width;
      const ratioY = y / rect.height;

      // zoomed image dimensions
      const zoomedW = rect.width * zoomLevel;
      const zoomedH = rect.height * zoomLevel;

      // zoom panel size (30% bigger than the left image)
      const panelW = rect.width * 1.3;
      const panelH = rect.height * 1.3;

      // background offset: center the cursor point in the zoom panel
      let bgX = ratioX * zoomedW - panelW / 2;
      let bgY = ratioY * zoomedH - panelH / 2;

      // clamp
      bgX = Math.min(Math.max(bgX, 0), zoomedW - panelW);
      bgY = Math.min(Math.max(bgY, 0), zoomedH - panelH);

      setBgPos({ x: bgX, y: bgY });
    },
    [zoomLevel, lensSize]
  );

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  return (
    <div className={styles.magnifierRoot}>
      {/* Main image container */}
      <div
        ref={containerRef}
        className={styles.imageContainer}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <img
          src={src}
          alt={alt}
          className={styles.productImage}
          draggable={false}
        />

        {/* Blue grid lens */}
        {isHovering && (
          <div
            className={styles.lens}
            style={{
              width: lensSize,
              height: lensSize,
              left: lensPos.x,
              top: lensPos.y,
            }}
          />
        )}
      </div>

      {/* Hint text */}
      <p className={styles.hintText}>Click to see full view</p>

      {/* Zoom preview panel — absolutely positioned to the right of imageContainer */}
      {isHovering && imgSize.w > 0 && (
        <div
          className={styles.zoomPanel}
          style={{
            width: imgSize.w * 1.3,
            height: imgSize.h * 1.3,
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