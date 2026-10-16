"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { navItems, releaseReadiness } from "@/config/site";
import { Container } from "@/components/ui/primitives";

/**
 * Persistent navigation.
 *
 * Desktop: transparent at the top of the page, becoming an opaque glass bar
 * after a short scroll. The active route is indicated by a cyan bar that
 * animates in width rather than blinking.
 *
 * Mobile: a disclosure panel with aria-expanded / aria-controls, Escape to
 * close, and focus returned to the trigger.
 */
export function NavBar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open
          ? "border-b border-hairline bg-void/85 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <Container>
        <nav aria-label="Primary" className="flex h-16 items-center justify-between gap-6">
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2.5"
            aria-label="Raphael Research Portal — home"
          >
            <span
              aria-hidden
              className="size-2 rounded-full bg-cyan transition-transform duration-300 group-hover:scale-125"
            />
            <span className="text-[15px] font-semibold tracking-tight text-ink">
              RAPHAEL
              <span className="ml-2 hidden text-[11px] font-normal uppercase tracking-[0.14em] text-ink-dim sm:inline">
                Research Portal
              </span>
            </span>
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative block px-3.5 py-2 text-[13.5px] transition-colors ${
                      active ? "text-ink" : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {item.label}
                    {active ? (
                      reduced ? (
                        <span className="absolute inset-x-3.5 -bottom-px h-px bg-cyan" />
                      ) : (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute inset-x-3.5 -bottom-px h-px bg-cyan"
                          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        />
                      )
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            {releaseReadiness.approved ? (
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden rounded-md border border-hairline px-3 py-1.5 text-[13px] text-ink-muted transition-colors hover:border-hairline-strong hover:text-ink sm:inline-block"
              >
                GitHub
              </a>
            ) : (
              <span
                title={
                  "Source repository is pending release review, so no link is published."
                }
                className="hidden cursor-not-allowed rounded-md border border-dashed border-hairline px-3 py-1.5 text-[13px] text-ink-faint sm:inline-block"
              >
                GitHub · pending review
              </span>
            )}

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              className="rounded-md border border-hairline p-2 text-ink-muted transition-colors hover:text-ink lg:hidden"
            >
              <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                {open ? (
                  <>
                    <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" />
                  </>
                ) : (
                  <>
                    <path d="M2.5 5.5h13M2.5 9h13M2.5 12.5h13" stroke="currentColor" strokeWidth="1.5" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </nav>
      </Container>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-nav"
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-hairline bg-void/95 backdrop-blur-xl lg:hidden"
          >
            <Container>
              <ul className="flex flex-col py-3">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setOpen(false)}
                        className={`flex flex-col gap-0.5 rounded-md px-3 py-3 transition-colors ${
                          active ? "bg-elevated text-ink" : "text-ink-muted"
                        }`}
                      >
                        <span className="text-[15px] font-medium">{item.label}</span>
                        <span className="text-[12.5px] text-ink-faint">{item.description}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Container>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}