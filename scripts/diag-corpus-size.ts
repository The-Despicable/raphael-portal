// How big is the corpus? If the WHOLE thing fits in the context window,
// lexical retrieval becomes an unnecessary bottleneck.
import { corpusSize } from "../src/lib/assistant";

console.log("passages :", corpusSize);