// Is the header `key` constrained to an enum, or is any string valid?
const https = require("https");
const get = (u) =>
  new Promise((res, rej) => {
    https.get(u, (r) => {
      let d = "";
      r.on("data", (c) => (d += c));
      r.on("end", () => res(d));
    }).on("error", rej);
  });

(async () => {
  const schema = JSON.parse(await get("https://openapi.vercel.sh/vercel.json"));
  const h = schema.properties.headers;
  console.log("headers schema shape:");
  console.log(JSON.stringify(h, null, 2).slice(0, 1200));
})();