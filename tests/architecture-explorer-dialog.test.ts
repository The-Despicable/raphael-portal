import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Tests for the standalone architecture-explorer dialog.
 *
 * The interaction itself is verified in a real browser (Playwright drives the
 * trigger, the iframe, Escape, the backdrop and the close button). These tests
 * lock the structural properties that a browser check cannot assert on every
 * future run: that the asset exists and is self-contained, that the dialog
 * follows the ARIA dialog pattern, and that the iframe is isolated rather than
 * inlined.
 */

const ROOT = process.cwd();

const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

const ASSET = "public/raphael-architecture-explorer.html";
const DIALOG = "src/components/architecture/ArchitectureExplorerDialog.tsx";
const TRIGGER = "src/components/architecture/ArchitectureExplorerTrigger.tsx";
const MODAL = "src/components/ui/Modal.tsx";
const HOME = "src/app/page.tsx";

describe("the explorer asset", () => {
  it("is committed to public/ so the route can serve it", () => {
    expect(existsSync(join(ROOT, ASSET))).toBe(true);
    expect(read(ASSET)).toMatch(/^<!doctype html>/i);
    expect(read(ASSET)).toContain("Raphael Architecture Explorer");
  });

  it("is self-contained: no external script or stylesheet requests", () => {
    const html = read(ASSET);
    expect(html).not.toMatch(/<script[^>]+src=/i);
    expect(html).not.toMatch(/<link[^>]+rel=["']?stylesheet/i);
    expect(html).not.toMatch(/https?:\/\/[^"'\s]+\.(js|css)/i);
  });

  it("carries its own inline styles and script", () => {
    const html = read(ASSET);
    expect(html).toMatch(/<style>/i);
    expect(html).toMatch(/<script>/i);
  });
});

describe("the dialog", () => {
  it("loads the asset in a titled iframe", () => {
    const dialog = read(DIALOG);
    expect(dialog).toContain(`/${"raphael-architecture-explorer.html"}`);
    expect(dialog).toMatch(/title="Raphael Architecture Explorer/);
  });

  it("mounts the iframe only while open, so its script does not run on page load", () => {
    const modal = read(MODAL);
    expect(modal).toContain("if (!open) return null;");
    // `loading="lazy"` was removed deliberately: inside a modal the frame must
    // load as soon as the dialog opens.
    expect(read(DIALOG)).not.toContain('loading="lazy"');
  });

  it("keeps the prototype in its own document scope instead of inlining it", () => {
    const dialog = read(DIALOG);
    expect(dialog).toContain("<iframe");
    // The prototype declares :root custom properties and base element rules.
    // Inlining those into the portal would leak into the host page.
    expect(dialog).not.toMatch(/import .*raphael-architecture-explorer\.html/);
    expect(dialog).not.toMatch(/dangerouslySetInnerHTML/);
  });

  it("closes on Escape from inside the iframe, not only on the host page", () => {
    const dialog = read(DIALOG);
    // A keydown inside an iframe does not bubble to the parent document, so a
    // listener must be attached to the iframe window itself.
    expect(dialog).toContain("contentWindow");
    expect(dialog).toContain('addEventListener("keydown"');
    expect(dialog).toContain("Escape");
  });

  it("re-attaches the iframe listener on load and detaches on unmount", () => {
    const dialog = read(DIALOG);
    expect(dialog).toMatch(/ref=\{attachEscape\}/);
    expect(dialog).toContain("onLoad=");
    expect(dialog).toMatch(/removeEventListener\("keydown"/);
    expect(dialog).toMatch(/useEffect\(\(\) => \(\) => detachRef\.current\?\.\(\), \[\]\)/);
  });

  it("keeps the close handler in an effect rather than assigning a ref during render", () => {
    // The react-hooks/refs lint rule rejects `ref.current = x` in the render
    // body; ESLint runs in CI, and this test pins the intended shape so the
    // workaround is not quietly reverted back into render.
    expect(read(DIALOG)).toMatch(
      /useEffect\(\(\) => \{\s*closeRef\.current = onClose;\s*\}, \[onClose\]\)/,
    );
  });

  it("keeps a route out of the in-site page reachable from the dialog", () => {
    const dialog = read(DIALOG);
    expect(dialog).toContain('href="/raphael/architecture"');
  });
});

describe("the modal primitive", () => {
  it("implements the ARIA dialog pattern", () => {
    const modal = read(MODAL);
    expect(modal).toContain('role="dialog"');
    expect(modal).toContain('aria-modal="true"');
    expect(modal).toContain("aria-labelledby");
    expect(modal).toContain("aria-describedby");
  });

  it("closes on Escape, on backdrop click and via a visible button", () => {
    const modal = read(MODAL);
    expect(modal).toContain('e.key === "Escape"');
    expect(modal).toMatch(/onMouseDown/);
    expect(modal).toContain('aria-label="Close dialog"');
  });

  it("moves focus in on open and restores it to the trigger on close", () => {
    const modal = read(MODAL);
    expect(modal).toContain("restoreRef");
    expect(modal).toMatch(/panelRef\.current\?\.focus\(\)/);
    expect(modal).toMatch(/restoreRef\.current\?\.focus\?\.\(\)/);
  });

  it("traps Tab inside the panel", () => {
    const modal = read(MODAL);
    expect(modal).toContain('e.key !== "Tab"');
    expect(modal).toContain("preventDefault");
  });

  it("locks background scroll without a layout shift", () => {
    const modal = read(MODAL);
    expect(modal).toContain('body.style.overflow = "hidden"');
    expect(modal).toContain("paddingRight");
  });
});

describe("framing headers for the explorer asset", () => {
  const cfg = JSON.parse(read("vercel.json")) as {
    headers: { source: string; headers: { key: string; value: string }[] }[];
  };
  const siteWide = cfg.headers.find((h) => h.source === "/(.*)")!;
  const explorer = cfg.headers.find(
    (h) => h.source === "/raphael-architecture-explorer.html",
  );

  const valueOf = (
    rule: { headers: { key: string; value: string }[] },
    key: string,
  ) => rule.headers.find((h) => h.key === key)?.value;

  it("keeps site-wide clickjacking protection intact", () => {
    expect(valueOf(siteWide, "X-Frame-Options")).toBe("DENY");
    expect(valueOf(siteWide, "Content-Security-Policy")).toContain(
      "frame-ancestors 'none'",
    );
  });

  it("allows the explorer asset to be framed by this origin only", () => {
    // Without this the iframe renders blank IN PRODUCTION ONLY: the site-wide
    // DENY / frame-ancestors 'none' headers block framing, and there is no
    // such header in local dev, so the bug is invisible until deployment.
    expect(explorer).toBeDefined();
    expect(valueOf(explorer!, "X-Frame-Options")).toBe("SAMEORIGIN");
    expect(valueOf(explorer!, "Content-Security-Policy")).toContain(
      "frame-ancestors 'self'",
    );
  });

  it("never relaxes framing to allow or to any origin", () => {
    expect(explorer).toBeDefined();
    expect(valueOf(explorer!, "X-Frame-Options")).not.toMatch(/ALLOW-FROM/i);
    expect(valueOf(explorer!, "Content-Security-Policy")).not.toContain("*");
    expect(valueOf(explorer!, "Content-Security-Policy")).not.toContain("'unsafe-eval'");
  });

  it("scopes the exception to that one path and nothing else", () => {
    const scoped = cfg.headers.filter(
      (h) =>
        h.headers.some(
          (x) =>
            (x.key === "X-Frame-Options" && x.value !== "DENY") ||
            (x.key === "Content-Security-Policy" &&
              x.value.includes("frame-ancestors 'self'")),
        ),
    );
    expect(scoped.map((h) => h.source)).toEqual([
      "/raphael-architecture-explorer.html",
    ]);
  });

  it("keeps the remaining security headers on the explorer asset", () => {
    const keys = explorer!.headers.map((h) => h.key);
    expect(keys).toContain("Content-Security-Policy");
    expect(valueOf(explorer!, "Content-Security-Policy")).toContain(
      "default-src 'self'",
    );
    expect(valueOf(explorer!, "Content-Security-Policy")).toContain(
      "object-src 'none'",
    );
  });
});

describe("homepage integration", () => {
  it("renders the trigger instead of a plain link", () => {
    const home = read(HOME);
    expect(home).toContain("<ArchitectureExplorerTrigger />");
    expect(home).toContain("ArchitectureExplorerTrigger");
    // The old link must be gone, otherwise there are two competing controls.
    expect(home).not.toContain('href="/raphael#architecture"');
  });

  it("keeps the page a Server Component", () => {
    expect(read(HOME)).not.toMatch(/^\s*"use client"/m);
    expect(read(TRIGGER)).toMatch(/^\s*"use client"/m);
  });

  it("advertises the dialog relationship on the trigger", () => {
    expect(read(TRIGGER)).toContain('aria-haspopup="dialog"');
    expect(read(TRIGGER)).toContain('type="button"');
    expect(read(TRIGGER)).toContain("setOpen(true)");
  });

  it("preserves the original trigger label", () => {
    expect(read(TRIGGER)).toContain("Open the interactive diagram");
  });

  it("gives the trigger a visible focus state", () => {
    expect(read(TRIGGER)).toMatch(/focus-visible:outline/);
  });
});
