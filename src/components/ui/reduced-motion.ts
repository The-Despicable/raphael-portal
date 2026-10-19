"use client";

import { useEffect, useState } from "react";

/**
 * Reduced-motion preference, safe to use during SSR and hydration.
 *
 * WHY THIS EXISTS
 * ---------------
 * `useReducedMotion()` from `motion/react` reads `matchMedia` DURING render.
 * The server has no `matchMedia`, so on the server it always reports the
 * "motion allowed" value. For a reveal, that value is what makes the server
 * emit an inline `style="opacity:0; transform:translateY(14px)"`.
 *
 * A client that HAS reduced motion enabled renders the other branch. React
 * does not patch mismatched attributes during hydration -- it reports
 * "A tree hydrated but some attributes of the server rendered HTML didn't
 * match the client properties. This won't be patched up." -- and leaves the
 * server markup in place. The server's `opacity: 0` therefore survives, and
 * the content is present in the DOM but permanently invisible.
 *
 * This hook reports `false` for the server render AND for the first client
 * render, then applies the real preference after mount. Server and first
 * client render agree exactly, so hydration is clean; the preference then
 * arrives as an ordinary post-mount update, where React does patch styles.
 *
 * The cost is one extra render after mount. The benefit is that a visitor who
 * has asked for reduced motion actually gets a page they can read.
 */
export function useReducedMotionPreference(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return reduced;
}
