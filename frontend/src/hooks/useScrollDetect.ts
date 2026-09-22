/**
 * useScrollDetect hook
 *
 * Detects whether the page has been scrolled past a configurable threshold.
 * Uses requestAnimationFrame for throttling to prevent scroll jank.
 *
 * This logic was previously inline inside Landing.jsx.
 * Extracted as a reusable hook — behavior is identical.
 *
 * @param scrollThreshold - px from top before `isScrolled` becomes true (default: 20)
 * @param showBtnThreshold - px from top before `showTopBtn` becomes true (default: 300)
 */
import { useState, useEffect } from "react";

interface ScrollState {
  isScrolled:  boolean;
  showTopBtn:  boolean;
}

export function useScrollDetect(
  scrollThreshold = 20,
  showBtnThreshold = 300,
): ScrollState {
  const [state, setState] = useState<ScrollState>({
    isScrolled: false,
    showTopBtn: false,
  });

  useEffect(() => {
    let ticking = false;

    const handler = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          setState({
            isScrolled: y > scrollThreshold,
            showTopBtn: y > showBtnThreshold,
          });
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [scrollThreshold, showBtnThreshold]);

  return state;
}
