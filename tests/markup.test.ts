import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * MARKUP INTEGRITY
 *
 * `<p> cannot be a descendant of <p>` is a validity error, not a style opinion:
 * a paragraph may only contain phrasing content. React renders it into the HTML
 * anyway, the browser then silently restructures the tree, and the client and
 * server disagree — which surfaces as a hydration error in the console rather
 * than as a broken page.
 *
 * The instance that prompted this wrapped `<DatedSource>` (which renders its own
 * `<p>`) inside another `<p>`. It sat in a spot nobody visits, so nothing failed
 * visibly; only the console was wrong. These tests make that failure loud.
 */

const ROOT = join(__dirname, "..");

function sourceFiles(dir = join(ROOT, "src")): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = sourceFiles();
const rel = (f: string) => relative(ROOT, f);

/**
 * Primitives whose root element is a `<p>`. Each of these is a paragraph, so each
 * one inherits the same "no `<p>` ancestor" rule as a literal `<p>`.
 */
const PARAGRAPH_PRIMITIVES = ["DatedSource"];

describe("no paragraph nests another paragraph", () => {
  it("never opens a <p> directly inside another <p>", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      // Allow whitespace and simple expression children between the two tags.
      const pattern = /<p\b[^>]*>\s*(?:\{[^}]*\}\s*)*<p\b/;
      if (pattern.test(src)) offenders.push(rel(file));
    }
    expect(offenders).toEqual([]);
  });

  it("never places a paragraph-rendering primitive inside a <p>", () => {
    // A component is invisible to a purely textual scan, so this walks back from
    // each call site to the nearest enclosing element and rejects a <p>.
    const offenders: string[] = [];
    for (const file of files) {
      const lines = readFileSync(file, "utf8").split("\n");
      lines.forEach((line, i) => {
        const call = PARAGRAPH_PRIMITIVES.find((p) =>
          new RegExp(`^\\s*<${p}\\b`).test(line)
        );
        if (!call) return;
        // The enclosing tag is a few lines up: attributes and comments intervene.
        for (let j = i - 1; j >= 0 && j >= i - 4; j--) {
          const opener = lines[j].match(/^\s*<(p|div|section|article|li|Reveal)\b/);
          if (!opener) continue;
          if (opener[1] === "p") {
            offenders.push(`${rel(file)}:${j + 1} wraps <${call}>`);
          }
          break;
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  it("renders each paragraph primitive as a standalone block", () => {
    // Guards the premise of the check above: if DatedSource ever stops being a
    // paragraph, the call-site rule stops applying and must be revisited.
    const primitives = readFileSync(
      join(ROOT, "src/components/ui/primitives.tsx"),
      "utf8"
    );
    for (const name of PARAGRAPH_PRIMITIVES) {
      const body = primitives.slice(primitives.indexOf(`export function ${name}`));
      const root = body.match(/return \(\s*<([a-z]+)/);
      expect(root, `${name} has no recognisable root element`).not.toBeNull();
      expect(root![1], `${name} must render a <p>`).toBe("p");
    }
  });
});