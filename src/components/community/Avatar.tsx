import { ACCENT_HEX } from "./ChatRoom";

/**
 * Abstract generated avatar.
 *
 * Renders a deterministic geometric glyph from the nickname, plus the guest's
 * chosen accent colour. It contains no image, no upload, and no user-supplied
 * markup — the initial and colour come from a fixed palette and a single
 * normalised character.
 */
export function Avatar({
  accent,
  name,
  size = "md",
}: {
  accent: string;
  name: string;
  size?: "sm" | "md";
}) {
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
  const color = ACCENT_HEX[accent] ?? ACCENT_HEX.cyan;
  const dims = size === "sm" ? "size-7 text-[11px]" : "size-10 text-[14px]";

  return (
    <span
      aria-hidden
      className={`${dims} flex shrink-0 items-center justify-center rounded-full border font-semibold`}
      style={{
        color,
        borderColor: `${color}55`,
        background: `${color}14`,
      }}
    >
      {initial}
    </span>
  );
}