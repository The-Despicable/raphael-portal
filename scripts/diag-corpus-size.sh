#!/usr/bin/env bash
# Size the corpus by asking the running API indirectly is unreliable; instead
# build it in-process via a tiny vitest-free tsx script.
cd /home/yaser/raphael-portal
npx tsx -e "
import { retrieve } from './src/lib/assistant';
// Probe the biggest passages to estimate an upper bound on corpus size.
const q = 'architecture evidence governance research agent policy enforcement measurement contract blocker';
const hits = retrieve(q, 66);
let total = 0;
for (const h of hits) total += h.text.length + h.section.length;
console.log('passages retrieved by a broad query:', hits.length);
console.log('approx chars of that slice        :', total);
console.log('approx tokens (chars/3.6)         :', Math.round(total / 3.6));
"