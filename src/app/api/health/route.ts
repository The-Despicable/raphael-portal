import { NextResponse, connection } from "next/server";
import { env } from "@/lib/env";
import { getStore, StorageUnavailableError } from "@/lib/store";


/**
 * Deployment health / capability probe.
 *
 * Returns CONFIGURATION NAMES AND BOOLEANS ONLY — never values, never connection
 * strings, never provider details. This endpoint is intentionally public so an
 * operator can verify what is wired up, and deliberately useless to an attacker.
 */

export async function GET() {
  // DO NOT REMOVE. This endpoint must report the configuration of the machine
  // that is actually serving the request, not the machine that built the bundle.
  //
  // `next build` prerendered this route as static (shown as `○ /api/health` in the
  // route table), freezing a snapshot taken from the BUILD environment. On Vercel
  // that meant `/api/health` permanently advertised build-time state — including
  // `generativeAi.enabled: true` picked up from a developer's local `.env.local` —
  // regardless of what the deployment was actually configured with.
  //
  // The store call below is not a reliable signal on its own: when no database is
  // configured, `getStore()` refuses before it ever opens a connection, so the
  // build saw a route that touched nothing and had no reason to defer.
  //
  // `connection()` is the documented Cache-Components opt-in (see the installed
  // Next docs: `next/dist/docs/01-app/03-api-reference/04-functions/connection.md`
  // — "call `connection()` before your query to exclude them from prerendering").
  // It is unconditional, so the route cannot be frozen again by a configuration
  // that happens to be absent at build time. It reads no request data and returns
  // nothing, so it cannot leak anything.
  await connection();

  const caps = env.describeCapabilities();

  // Storage health is reported on THREE independent axes, because conflating
  // them is what allowed the silent downgrade to go unnoticed:
  //
  //   configured  a credential is present
  //   driver      which store is actually in use
  //   reachable   did it answer
  //
  // A deployment can be configured but unreachable, or reachable but running on
  // the non-durable driver. `durable` is true only when the durable driver is
  // both in use and answering.
  let driver: "postgres" | "memory" | "unavailable" = "unavailable";
  let storageReachable = false;
  let failure: "not_configured" | "connection_failed" | null = null;

  try {
    const store = await getStore();
    driver = store.kind;
    await store.init();
    storageReachable = true;
  } catch (error) {
    storageReachable = false;
    // The error carries the reason as data rather than only in its message, so
    // the probe can distinguish the two causes without parsing English.
    if (error instanceof StorageUnavailableError) failure = error.reason;
  }

  const durable = driver === "postgres" && storageReachable;

  return NextResponse.json({
    // The service itself is up if it can render this response. Storage
    // unavailability is reported inside `storage`, not by failing the whole
    // probe, so a monitor can tell the two apart.
    status: "ok",
    storage: {
      configured: env.storageConfigured,
      driver,
      durable,
      reachable: storageReachable,
      failure,
      note:
        driver === "unavailable"
          ? env.isProduction
            ? "Persistent storage is unavailable. Writes will be refused rather than served from volatile memory. Set DATABASE_URL (and DATABASE_POOL_URL on serverless)."
            : "No database configured; using the local development in-memory store."
          : driver === "memory"
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