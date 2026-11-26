export type VideoKind = 'youtube' | 'vimeo' | 'file';

export interface ParsedVideo {
  kind: VideoKind;
  /** Source for an <iframe> (youtube/vimeo) or a <video> element (file). */
  src: string;
  /** Poster frame, where the host exposes one. */
  thumbnail?: string;
}

const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/i,
  /(?:youtu\.be\/)([\w-]{11})/i,
  /(?:youtube\.com\/embed\/)([\w-]{11})/i,
  /(?:youtube\.com\/shorts\/)([\w-]{11})/i,
  /(?:youtube\.com\/live\/)([\w-]{11})/i,
];

const VIMEO_PATTERN = /vimeo\.com\/(?:video\/)?(\d+)/i;

const FILE_EXTENSIONS = /\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i;

/**
 * Normalise a pasted video link (or an uploaded file URL) into something renderable.
 * Returns null when the URL is not a video we can play.
 */
export const parseVideoUrl = (raw?: string | null): ParsedVideo | null => {
  const url = (raw || '').trim();
  if (!url) return null;

  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      return {
        kind: 'youtube',
        src: `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0&modestbranding=1`,
        thumbnail: `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`,
      };
    }
  }

  const vimeo = url.match(VIMEO_PATTERN);
  if (vimeo) {
    return { kind: 'vimeo', src: `https://player.vimeo.com/video/${vimeo[1]}` };
  }

  // Cloudinary video delivery URLs have no extension in some transforms, so accept those too.
  if (FILE_EXTENSIONS.test(url) || /\/video\/upload\//.test(url)) {
    return { kind: 'file', src: url };
  }

  return null;
};

export const isSupportedVideoUrl = (raw?: string | null) => parseVideoUrl(raw) !== null;
