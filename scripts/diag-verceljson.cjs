// Validate vercel.json: does it parse, and is the env value a real literal?
const fs = require("fs");

const raw = fs.readFileSync("vercel.json", "utf8");
// Vercel accepts comments in vercel.json; JSON.parse does not.
const stripped = raw
  .replace(/^\s*\/\/.*$/gm, "")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/,(\s*[}\]])/g, "$1");

let cfg;
try {
  cfg = JSON.parse(stripped);
  console.log("vercel.json parses: YES");
} catch (e) {
  console.log("vercel.json parses: NO ->", e.message);
  process.exit(0);
}

const v = cfg.build?.env?.NEXT_PUBLIC_SITE_URL;
console.log("build.env.NEXT_PUBLIC_SITE_URL =", JSON.stringify(v));
const looksPlaceholder = typeof v === "string" && v.startsWith("@");
console.log(looksPlaceholder
  ? "  !! This is a PLACEHOLDER, not a URL. Vercel sets it literally,"
  + " so the site would receive the literal string '@next_public_site_url'."
  : "  ok, looks like a real value");

console.log("crons entries:", Array.isArray(cfg.crons) ? cfg.crons.length : "(not an array)");
console.log("headers rules :", Array.isArray(cfg.headers) ? cfg.headers.length : "(none)");
console.log("header keys   :", (cfg.headers?.[0]?.headers ?? []).map((h) => h.key).join(", "));