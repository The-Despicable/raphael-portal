// Diagnostic: which query terms match which passages, and how weakly.
import { retrieve } from "../src/lib/assistant";
const qs = [
  "How do I bake sourdough bread at high altitude?",
  "What is the capital of France?",
  "Is exec/ really the only entry point for system primitives?",
];
for (const q of qs) {
  const hits = retrieve(q, 5);
  const qt = q.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 1);
  console.log("\nQ:", q);
  console.log("   terms:", qt.join(", "));
  for (const h of hits) {
    const hay = (h.section + " " + h.text).toLowerCase();
    const matched = qt.filter((t) => hay.includes(t));
    console.log(`   hit [${h.docId}] matched=${JSON.stringify(matched)} :: ${h.section}`);
  }
}