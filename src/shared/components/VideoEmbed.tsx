import React from 'react';
import { parseVideoUrl } from '@/shared/utils/videoEmbed';

interface VideoEmbedProps {
  url: string;
  title?: string;
  /** Poster for uploaded files; hosted players supply their own. */
  poster?: string;
  className?: string;
  autoPlay?: boolean;
}

/**
 * Plays a YouTube/Vimeo link or an uploaded video file. Renders nothing for a URL
 * we cannot recognise, so callers can fall back to their image.
 */
const VideoEmbed: React.FC<VideoEmbedProps> = ({
  url,
  title = 'Video',
  poster,
  className = '',
  autoPlay = false,
}) => {
  const video = parseVideoUrl(url);
  if (!video) return null;

  if (video.kind === 'file') {
    return (
      <video
        src={video.src}
        poster={poster}
        controls
        autoPlay={autoPlay}
        playsInline
        preload="metadata"
        className={`w-full h-full object-contain bg-black ${className}`}
      />
    );
  }

  return (
    <iframe
      src={autoPlay ? `${video.src}${video.src.includes('?') ? '&' : '?'}autoplay=1` : video.src}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      className={`w-full h-full border-0 bg-black ${className}`}
    />
  );
};

export default VideoEmbed;
