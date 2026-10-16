import { retrieve } from "../src/lib/assistant";

const hits = retrieve(
  "AUTH-000 blocker authority principal ratification NOT_READY exec entry point measurement contract verification principal broker",
  66,
);
const ids = [...new Set(hits.map((h) => h.docId))].sort();
console.log("docIds (" + ids.length + "):");
for (const id of ids) console.log("  " + id);