"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, Maximize2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

/**
 * Standalone architecture explorer, presented in a dialog.
 *
 * The explorer is a self-contained document (inline CSS + JS, no external
 * requests), so it is served from `public/` and rendered inside an iframe
 * rather than being rewritten as React. Two reasons for the iframe:
 *
 *  1. Fidelity. Its SVG graph, view tabs, search, zoom and node inspector are
 *     already working and keyboard-accessible; porting them to JSX would
 *     re-implement working behaviour with no gain.
 *  2. Isolation. Its `<style>` block declares `:root` custom properties and
 *     base element rules. Inlining that into the portal would leak into the
 *     host page and risk overriding the portal's own design tokens. An iframe
 *     gives it its own document scope.
 *
 * The iframe is titled, so it is announced rather than skipped, and it is
 * only mounted while the dialog is open so its script does not run on load.
 */
export function ArchitectureExplorerDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const closeRef = useRef(onClose);
  // Kept current in an effect rather than assigned during render, which the
  // react-hooks/refs rule rejects: the iframe handler must always call the
  // latest onClose without re-attaching the listener on every render.
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  const detachRef = useRef<(() => void) | null>(null);

  /**
   * Escape has to be handled inside the iframe as well as on the host page.
   *
   * A keydown fired inside an iframe does NOT bubble to the parent document,
   * so once the user interacts with the diagram, the dialog's own Escape
   * handler never sees the event and the dialog becomes impossible to close
   * with the keyboard. The iframe is same-origin, so a listener can be
   * attached to its window directly.
   */
  const attachEscape = useCallback((node: HTMLIFrameElement | null) => {
    detachRef.current?.();
    detachRef.current = null;
    const win = node?.contentWindow;
    if (!win) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeRef.current();
      }
    };
    win.addEventListener("keydown", handler, true);
    detachRef.current = () => win.removeEventListener("keydown", handler, true);
  }, []);

  useEffect(() => () => detachRef.current?.(), []);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="full"
      title="Raphael Architecture Explorer"
      description="Standalone interactive prototype. Select any component in the diagram to inspect its role, trust boundary, evidence and remaining proof obligations. Closes with Escape."
    >
      <div className="p-3 sm:p-4">
        <iframe
          ref={attachEscape}
          onLoad={(e) => attachEscape(e.currentTarget)}
          src="/raphael-architecture-explorer.html"
          title="Raphael Architecture Explorer — interactive architecture diagram"
          className="h-[78vh] min-h-[520px] w-full rounded-lg border border-hairline bg-[#050c18]"
        />
      </div>

      <footer className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-hairline px-4 py-3 sm:px-5">
        <span className="text-[11.5px] leading-relaxed text-ink-faint">
          A diagram shows intended structure. It is not evidence of runtime conformance.
        </span>
        <span className="ml-auto flex items-center gap-4">
          <Link
            href="/raphael/architecture"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-cyan underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
          >
            Open the in-site architecture page
            <ArrowRight size={13} aria-hidden />
          </Link>
          <a
            href="/raphael-architecture-explorer.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[13px] text-ink-muted underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
          >
            Open standalone
            <Maximize2 size={12} aria-hidden />
            <ExternalLink size={11} aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </span>
      </footer>
    </Modal>
  );
}
