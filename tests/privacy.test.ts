import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * PUBLIC RESPONSE PRIVACY
 *
 * The assistant endpoint once attached the raw provider text to its JSON
 * response as `__raw`, gated only by the MODEL_DEBUG_RAW environment variable.
 * That was a latent disclosure: the raw field contains the model's reasoning
 * trace and any text the prompt induced.
 *
 * A flag that is "off by default" is a configuration state. It can be flipped by
 * a deploy, by someone copying an .env file, or by a well-meaning "just enable
 * debug" commit. The capability is now REMOVED, and these tests exist to make
 * reintroducing it a visible failure rather than a silent regression.
 */

const ROOT = join(__dirname, "..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

/** Every source file, so a reintroduced leak anywhere is caught. */
function allSourceFiles(dir = join(ROOT, "src")): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...allSourceFiles(full));
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(full);
  }
  return out;
}

describe("no raw provider output is reachable from the public API", () => {
  it("no source file defines or returns a raw-output debug field", () => {
    const offenders = allSourceFiles()
      .filter((f) => {
        const s = readFileSync(f, "utf8");
        // Strip comments so documentation about the removal does not trip this.
        const code = s
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/^\s*\/\/.*$/gm, "");
        return /__raw|__debugRaw|\breadRaw\b|modelDebugRaw|MODEL_DEBUG_RAW/.test(code);
      })
      .map((f) => f.replace(ROOT + "/", ""));
    expect(offenders).toEqual([]);
  });

  it("the assistant route builds an explicit allowlist rather than spreading internal state", () => {
    const route = read("src/app/api/assistant/route.ts");
    const code = route.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    // Spreading `...result` would re-publish whatever the result type grows to
    // next. The route must name each field it publishes.
    expect(code).not.toMatch(/\.\.\.\s*result\b/);
    for (const field of ["mode:", "text:", "citations:", "notice:"]) {
      expect(code).toContain(field);
    }
  });

  it("citations are narrowed field-by-field, not forwarded wholesale", () => {
    const route = read("src/app/api/assistant/route.ts");
    expect(route).toMatch(/citations:\s*result\.citations\.map/);
    for (const field of ["docId", "docTitle", "section", "label"]) {
      expect(route).toContain(`${field}:`);
    }
  });

  it("the env module exposes no debug-output switch", () => {
    const env = read("src/lib/env.ts");
    expect(env).not.toMatch(/MODEL_DEBUG_RAW|modelDebugRaw/);
  });

  it("the assistant module exports no raw-text helper", () => {
    const mod = read("src/lib/assistant.ts");
    expect(mod).not.toMatch(/export\s+async\s+function\s+__debugRaw/);
    // reasoning_content must be consumed internally and never surfaced.
    expect(mod).toMatch(/reasoning_content/);
  });
});

describe("privileged endpoint protection", () => {
  const modRoute = read("src/app/api/moderation/route.ts");

  it("compares the moderation credential in constant time", () => {
    expect(modRoute).toMatch(/timingSafeEqual/);
    // A length check must precede it, since timingSafeEqual throws on a
    // length mismatch and that throw would itself become a timing oracle.
    expect(modRoute).toMatch(/a\.length !== b\.length/);
  });

  it("fails closed when no moderation credential is configured", () => {
    expect(modRoute).toMatch(/if \(!env\.moderationConfigured\)/);
    expect(modRoute).toMatch(/status: 501/);
    // It must NOT fall through to an unauthenticated path.
    expect(modRoute).not.toMatch(/moderationConfigured\s*\?\s*authorised/);
  });

  it("rate limits the privileged route to cap credential guessing", () => {
    // Regression: the endpoint had no rate limit, so a wrong key could be
    // retried without bound. Constant-time comparison prevents a timing leak
    // but says nothing about attempt volume.
    expect(modRoute).toMatch(/consume\("moderation"/);
    // The limit must be taken BEFORE the credential is evaluated.
    const rateLimitAt = modRoute.indexOf('consume("moderation"');
    const authAt = modRoute.indexOf("authorised(request)");
    expect(rateLimitAt).toBeGreaterThan(-1);
    expect(authAt).toBeGreaterThan(-1);
    expect(rateLimitAt).toBeLessThan(authAt);

    const rules = read("src/lib/rate-limit.ts");
    expect(rules).toMatch(/moderation:\s*\{\s*limit:\s*\d+/);
  });

  it("reads the credential from a header, never a query string", () => {
    expect(modRoute).toMatch(/headers\.get\("x-moderation-key"\)/);
    expect(modRoute).not.toMatch(/searchParams.*moderation/i);
  });

  it("never returns the moderation key or its length", () => {
    expect(modRoute).not.toMatch(/moderationKey\s*[:,]/);
    expect(modRoute).toMatch(/configured: env\.moderationConfigured/);
  });
});

describe("no provider credential can appear in a response", () => {
  it("the assistant module never puts the API key into a returned string", () => {
    const mod = read("src/lib/assistant.ts");
    // The key is only ever used in the Authorization header.
    const keyUsages = mod.match(/modelApiKey/g) ?? [];
    expect(keyUsages.length).toBeGreaterThan(0);
    for (const m of mod.matchAll(/modelApiKey/g)) {
      const line = mod.slice(0, m.index).split("\n").pop() ?? "";
      expect(line).toMatch(/Authorization|Bearer/);
    }
  });

  it("provider error bodies are never echoed to the client", () => {
    const mod = read("src/lib/assistant.ts");
    expect(mod).toMatch(/throw new Error\(`Provider responded \$\{res\.status\}`\)/);
    // No res.text()/res.json() error-body passthrough.
    expect(mod).not.toMatch(/await res\.json\(\)[\s\S]{0,200}res\.status[\s\S]{0,200}res\.text/);
  });

  it("capability reporting exposes booleans and config names, never values", () => {
    const env = read("src/lib/env.ts");
    const start = env.indexOf("describeCapabilities");
    expect(start).toBeGreaterThan(-1);
    const fn = env.slice(start);

    // Must be derived from `configured`-style booleans, not from secret values.
    expect(fn).not.toMatch(/\benv\.modelApiKey\b/);
    expect(fn).not.toMatch(/\benv\.guestSessionSecret\b/);
    expect(fn).not.toMatch(/\benv\.moderationKey\b/);
    // and it should name required configuration, which is safe.
    expect(fn).toMatch(/requiredForFullFunctionality/);
  });
});