"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { ArchitectureExplorerDialog } from "./ArchitectureExplorerDialog";

/**
 * Trigger + dialog pair for the standalone architecture explorer.
 *
 * Kept as one client component so the homepage stays a Server Component: the
 * page imports this instead of a `Link`, and no server component gains
 * client state it does not need.
 */
export function ArchitectureExplorerTrigger({
  label = "Open the interactive diagram",
}: {
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="mt-4 inline-flex items-center gap-2 text-[14px] font-medium text-cyan transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
      >
        {label} <ArrowRight size={14} aria-hidden />
      </button>

      <ArchitectureExplorerDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
