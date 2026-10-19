// Per-route security posture matrix. Reports PRESENCE of controls, never values.
const fs = require("fs");
const path = require("path");

const ROUTES = [
  "assistant", "chat/messages", "chat/session", "health",
  "moderation", "reports", "reviews", "suggestions",
];

const has = (s, re) => (re.test(s) ? "yes" : "NO ");

console.log(
  ["route".padEnd(16), "sess", "rl", "valid", "dup", "body-cap", "errShape"].join("  "),
);
console.log("-".repeat(72));

for (const r of ROUTES) {
  const f = path.join("src/app/api", r, "route.ts");
  if (!fs.existsSync(f)) { console.log(r.padEnd(16), "  MISSING"); continue; }
  const s = fs.readFileSync(f, "utf8");

  const row = [
    r.padEnd(16),
    has(s, /readSession|session\.sessionId/).trim(),
    has(s, /consume\("(\w+)"/).trim(),
    has(s, /safeParse/).trim(),
    has(s, /isDuplicateSubmission|recordSubmission/).trim(),
    has(s, /LIMITS\.|\.max\(/).trim(),
    has(s, /NextResponse\.json\(\s*\{\s*error:/).trim(),
  ];
  console.log(row.join("   "));
}

console.log("\n=== outbound network calls from server code ===");
const walk = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return walk(p);
    return /\.tsx?$/.test(e.name) ? [p] : [];
  });
for (const f of walk("src")) {
  const s = fs.readFileSync(f, "utf8");
  for (const m of s.matchAll(/fetch\(\s*[`"']([^`"']+)/g)) {
    const url = m[1];
    const external = /^https?:\/\//.test(url);
    console.log(
      `  ${f.replace("src/", "")}: ${external ? "EXTERNAL " : "internal "} ${url.slice(0, 60)}`,
    );
  }
}