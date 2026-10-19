"use client";

import { motion, type Variants } from "motion/react";
import { useReducedMotionPreference } from "@/components/ui/reduced-motion";
import type { ReactNode } from "react";

/**
 * Motion system.
 *
 * Two invariants, both mandatory per the project's accessibility rules:
 *   1. `prefers-reduced-motion` collapses every variant to an instant,
 *      non-animated render. Content is never gated behind an animation.
 *   2. Content is present in the DOM on first paint. Reveals only animate
 *      transform/opacity, never height, width or anything that reflows, so
 *      there is no layout shift.
 *
 * Duration band: 250-650ms.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

function useVariants(dir: "up" | "left" | "right" | "down", reduced: boolean): Variants {
  const hidden =
    dir === "left"
      ? { opacity: 0, x: 18 }
      : dir === "right"
        ? { opacity: 0, x: -18 }
        : dir === "down"
          ? { opacity: 0, y: -14 }
          : { opacity: 0, y: 14 };

  return {
    hidden: reduced ? { opacity: 1 } : hidden,
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: reduced ? 0 : 0.55, ease: EASE },
    },
  };
}

export function Reveal({
  children,
  dir = "up",
  delay = 0,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  dir?: "up" | "left" | "right" | "down";
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const reduced = useReducedMotionPreference();
  const variants = useVariants(dir, reduced);
  const Comp = motion[as];

  return (
    <Comp
      className={className}
      initial={reduced ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={variants}
      transition={reduced ? { duration: 0 } : { delay }}
    >
      {children}
    </Comp>
  );
}

/**
 * Hero entrance: a short directional stagger that does NOT wait for scroll.
 * Used above the fold, where scroll-triggered reveals would leave content
 * invisible on load.
 */
export function HeroStagger({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotionPreference();

  /*
   * The element type must NOT change with the reduced-motion preference.
   * Returning a plain <div> for one branch and <motion.div> for the other
   * makes React unmount and remount the subtree, which discards state and
   * destroys any shared-layout projection (`layoutId`) that was in flight.
   * The preference is expressed through the variants instead.
   */
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reduced ? 0 : 0.09,
            delayChildren: reduced ? 0 : 0.05,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function HeroItem({
  children,
  dir = "up",
  className = "",
}: {
  children: ReactNode;
  dir?: "up" | "left" | "right";
  className?: string;
}) {
  const reduced = useReducedMotionPreference();

  const initial =
    dir === "left" ? { opacity: 0, x: -20 } : dir === "right" ? { opacity: 0, x: 20 } : { opacity: 0, y: 16 };

  return (
    <motion.div
      className={className}
      initial={initial}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.6, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Container that staggers direct `StaggerItem` children into view. */
export function Stagger({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotionPreference();

  // See HeroStagger: the element type must not vary with the preference.
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: reduced ? 0 : 0.07,
            delayChildren: reduced ? 0 : delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotionPreference();

  // See HeroStagger: the element type must not vary with the preference.
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 14 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: reduced ? 0 : 0.5, ease: EASE },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Expands and collapses a detail region.
 *
 * `height: auto` is animated here via a measured height, which does reflow.
 * That is deliberate and scoped: it is the only height animation in the system,
 * it is short, and it is skipped entirely under reduced motion.
 */
export function Expand({
  open,
  children,
  className = "",
}: {
  open: boolean;
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotionPreference();

  /*
   * The element type must not vary with the preference: swapping <div> for
   * <motion.div> (or for null) remounts the region, which discards focus and
   * any state inside it. Reduced motion is expressed as a zero-length
   * transition instead, so the region still opens and closes, just instantly.
   */
  return (
    <motion.div
      initial={false}
      animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
      transition={{ duration: reduced ? 0 : 0.32, ease: EASE }}
      style={{ overflow: "hidden" }}
      className={className}
      aria-hidden={!open}
    >
      {children}
    </motion.div>
  );
}

/** Static, low-opacity ambient glow. No motion when reduced. */
export function AmbientGlow({ className = "" }: { className?: string }) {
  const reduced = useReducedMotionPreference();
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 -z-10 ${className}`}
      style={{
        background:
          "radial-gradient(60% 50% at 50% 0%, rgba(34,211,238,0.10) 0%, rgba(167,139,250,0.05) 45%, transparent 75%)",
        opacity: reduced ? 0.75 : undefined,
        animation: reduced ? undefined : "ambient 14s ease-in-out infinite",
      }}
    />
  );
}