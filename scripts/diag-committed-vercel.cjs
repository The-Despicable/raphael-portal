// Parse the COMMITTED vercel.json and inspect real values, not comment text.
const { execSync } = require("child_process");

const raw = execSync("git show origin/main:vercel.json", {
  cwd: "/home/yaser/raphael-portal",
  encoding: "utf8",
});

const stripped = raw
  .replace(/^\s*\/\/.*$/gm, "")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/,(\s*[}\]])/g, "$1");

const cfg = JSON.parse(stripped);

console.log("build block present :", Object.prototype.hasOwnProperty.call(cfg, "build"));
console.log("build.env value     :", JSON.stringify(cfg.build?.env?.NEXT_PUBLIC_SITE_URL));
console.log("");
if (cfg.build?.env?.NEXT_PUBLIC_SITE_URL === undefined) {
  console.log("VERDICT: no placeholder value -> layout.tsx will NOT call");
  console.log('         new URL("@next_public_site_url") and crash at build.');
} else {
  console.log("VERDICT: build.env still sets a value. Check whether it is a real URL.");
}
console.log("");
console.log("crons key present   :", Object.prototype.hasOwnProperty.call(cfg, "crons"));
console.log("header count        :", cfg.headers.length);
console.log("security headers    :");
for (const h of cfg.headers[0].headers) {
  console.log("   ", h.key.padEnd(28), h.value.slice(0, 58));
}