// Strict parse: NO comment stripping. This is what Vercel's parser does.
const fs = require("fs");
const s = fs.readFileSync("/home/yaser/raphael-portal/vercel.json", "utf8");
try {
  JSON.parse(s);
  console.log("strict JSON.parse: OK");
  console.log("comments present  :", s.includes("//") || s.includes("/*"));
} catch (e) {
  console.log("strict JSON.parse: FAILS ->", e.message);
}