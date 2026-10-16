// Validate raphael-portal/vercel.json against Vercel's published schema.
const fs = require("fs");
const https = require("https");

function get(url) {
  return new Promise((res, rej) => {
    https.get(url, (r) => {
      let d = "";
      r.on("data", (c) => (d += c));
      r.on("end", () => res(d));
    }).on("error", rej);
  });
}

(async () => {
  const schema = JSON.parse(await get("https://openapi.vercel.sh/vercel.json"));
  const raw = fs.readFileSync("/home/yaser/raphael-portal/vercel.json", "utf8");

  // Vercel accepts comments in vercel.json, but strip them so we test VALUES.
  const body = raw
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/,(\s*[}\]])/g, "$1");
  const cfg = JSON.parse(body);

  console.log("--- top-level keys ---");
  for (const [k, v] of Object.entries(cfg)) {
    const known = Object.prototype.hasOwnProperty.call(schema.properties, k);
    console.log(
      `  ${known ? "OK     " : "UNKNOWN"}  ${k}` +
        (known ? "" : "   <-- additionalProperties:false will reject this"),
    );
  }

  console.log("\n--- version ---");
  const vs = schema.properties.version;
  const ok = typeof cfg.version === "number" && cfg.version >= vs.minimum && cfg.version <= vs.maximum;
  console.log(`  value=${cfg.version}  allowed=${vs.minimum}..${vs.maximum}  ${ok ? "OK" : "INVALID"}`);

  console.log("\n--- headers ---");
  const hs = schema.properties.headers;
  console.log("  headers is a known key:", Object.prototype.hasOwnProperty.call(schema.properties, "headers"));
  for (const rule of cfg.headers ?? []) {
    console.log(`  rule keys: ${Object.keys(rule).join(", ")}`);
    const knownRule = Object.keys(rule).every((k) =>
      Object.prototype.hasOwnProperty.call(hs.items.properties, k),
    );
    console.log("  rule keys all valid:", knownRule);
    for (const h of rule.headers ?? []) {
      // Header names are NOT an enum in Vercel's schema — `key` is just a
      // string (maxLength 4096). So every header name is valid; only check
      // shape/length.
      const keyOk = typeof h.key === "string" && h.key.length > 0 && h.key.length <= 4096;
      const valOk = typeof h.value === "string" && h.value.length <= 32768;
      console.log(
        `    ${keyOk && valOk ? "OK     " : "INVALID"}  ${h.key} (value ${h.value.length} chars)`,
      );
    }
  }
})();