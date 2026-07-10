import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Always reset to top on route change, including browser back/forward (POP).
    // Native scroll-restoration on POP looks nicer in theory, but this app's pages
    // (Landing especially) load content asynchronously — the browser restores scroll
    // against the page's height at that instant, which is still short/half-loaded,
    // so it lands you deep in a page that then grows taller underneath you.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
