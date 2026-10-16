import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getStore } from "@/lib/store";


/**
 * Deployment health / capability probe.
 *
 * Returns CONFIGURATION NAMES AND BOOLEANS ONLY — never values, never connection
 * strings, never provider details. This endpoint is intentionally public so an
 * operator can verify what is wired up, and deliberately useless to an attacker.
 */

export async function GET() {
  const caps = env.describeCapabilities();
  let storageReachable = false;

  try {
    const store = await getStore();
    await store.init();
    storageReachable = true;
  } catch {
    storageReachable = false;
  }

  return NextResponse.json({
    status: "ok",
    storage: {
      driver: caps.storage,
      durable: caps.storage === "postgres",
      reachable: storageReachable,
      note:
        caps.storage === "memory"
          ? "Running on the non-durable in-memory store. Messages and reviews are lost on restart and are not shared between instances. Configure DATABASE_URL for real persistence."
          : "Connected to PostgreSQL.",
    },
    generativeAi: {
      enabled: caps.generativeAi,
      note: caps.generativeAi
        ? "Model provider configured. The assistant synthesises answers but still cites only server-retrieved sources."
        : "No model provider configured. The assistant runs in retrieval-only mode and quotes passages verbatim rather than generating text.",
    },
    moderation: {
      enabled: caps.moderation,
      note: caps.moderation
        ? "A moderator credential is configured; reviews publish immediately and can be hidden."
        : "No moderator configured. Reviews are held as PENDING and are not publicly listed.",
    },
    requiredForFullFunctionality: caps.requiredForFullFunctionality,
  });
}