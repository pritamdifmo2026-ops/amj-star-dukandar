import { useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Remembered window scroll offset for each history entry, keyed by location.key.
// Lives at module scope so it survives route changes within the SPA session.
const scrollPositions = new Map<string, number>();

/**
 * Global scroll restoration.
 * - New navigation (PUSH/REPLACE): scroll to top, like opening a fresh page.
 * - Back / Forward (POP): return to exactly where the user was on that page.
 *
 * Replaces the browser's native restoration (disabled below), which restores
 * against a half-loaded page and lands you in the wrong place on pages whose
 * content loads asynchronously and grows taller after mount (e.g. Landing).
 *
 * Saving happens in this effect's CLEANUP so the outgoing position is captured
 * BEFORE the incoming page resets scroll to top — otherwise it records 0.
 */
const ScrollManager = () => {
  const { key } = useLocation();
  const navigationType = useNavigationType(); // 'PUSH' | 'REPLACE' | 'POP'
  const cancelRestore = useRef<(() => void) | null>(null);

  // Take scroll control away from the browser so its restoration doesn't fight ours.
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useLayoutEffect(() => {
    // Abort any restore still in flight from the entry we just left.
    cancelRestore.current?.();
    cancelRestore.current = null;

    // Entering this history entry.
    if (navigationType === 'POP' && scrollPositions.has(key)) {
      cancelRestore.current = restoreScroll(scrollPositions.get(key)!);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }

    // Leaving this entry: record where we are now, before the next page scrolls
    // to top. This cleanup runs before the next entry's setup above.
    return () => {
      cancelRestore.current?.();
      cancelRestore.current = null;
      scrollPositions.set(key, window.scrollY);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return null;
};

/**
 * Restore the saved scroll offset, smoothly and reliably.
 *
 * Pages load content asynchronously (images, API data) and reflow AFTER mount,
 * so a one-shot scroll races the layout and often lands wrong. Instead we keep
 * re-applying the target every frame while the page grows, and only stop once
 * the target has stayed reachable and stable for a short settle window (or the
 * time budget runs out). The first attempt is synchronous, so when the page is
 * already full height (e.g. cached data) the restore happens before paint with
 * no visible jump. Aborts if the user starts scrolling themselves.
 * Returns a cancel function.
 */
function restoreScroll(top: number): () => void {
  if (top <= 0) {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    return () => {};
  }

  const start = performance.now();
  const MAX_WAIT = 3000; // ms — hard cap for slow async content
  const SETTLE = 250;    // ms the target must stay reachable & held before we stop
  let cancelled = false;
  let rafId = 0;
  let reachedAt = 0; // when the target first became reachable

  const onUserScroll = () => cancel();

  const cleanup = () => {
    window.removeEventListener('wheel', onUserScroll);
    window.removeEventListener('touchmove', onUserScroll);
    window.removeEventListener('keydown', onUserScroll);
  };

  const cancel = () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
    cleanup();
  };

  // Only user-initiated input aborts — programmatic scrollTo fires 'scroll',
  // not these, so re-applying below never cancels itself.
  window.addEventListener('wheel', onUserScroll, { passive: true });
  window.addEventListener('touchmove', onUserScroll, { passive: true });
  window.addEventListener('keydown', onUserScroll);

  const step = () => {
    if (cancelled) return;
    const now = performance.now();
    const reachable = document.documentElement.scrollHeight - window.innerHeight >= top;

    if (reachable) {
      if (Math.abs(window.scrollY - top) > 1) {
        window.scrollTo({ top, left: 0, behavior: 'instant' });
      }
      if (!reachedAt) reachedAt = now;
      if (now - reachedAt >= SETTLE) { cleanup(); return; } // held steady — done
    } else {
      reachedAt = 0; // page not tall enough yet; keep waiting
    }

    if (now - start >= MAX_WAIT) {
      window.scrollTo({ top, left: 0, behavior: 'instant' });
      cleanup();
      return;
    }
    rafId = requestAnimationFrame(step);
  };

  step(); // synchronous first attempt (no flash when already full height)
  return cancel;
}

export default ScrollManager;
