import { useState, useEffect } from 'react';

/**
 * useMediaQuery
 * @param query CSS media query string, e.g. '(max-width: 640px)'
 * @returns boolean indicating whether the query matches the current viewport
 */
export const useMediaQuery = (query: string): boolean => {
  const getMatches = (q: string): boolean => {
    // Prevent errors during server-side rendering
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia(q).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState<boolean>(getMatches(query));

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    // Safari < 14 does not support addEventListener on MediaQueryList
    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else {
      media.addListener(listener);
    }
    // Set initial value in case it changed before effect ran
    setMatches(media.matches);
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else {
        media.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
};
