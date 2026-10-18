import { NextResponse } from "next/server";
import { StorageUnavailableError, getStore, type Store } from "@/lib/store";

/**
 * Store acquisition for route handlers.
 *
 * WHY THIS EXISTS
 * ---------------
 * `getStore()` throws when durable storage is configured but unusable. Letting
 * that propagate would surface as an unhandled 500, which is technically a
 * failure but is not explicit about the cause and invites a future "fix" that
 * quietly reintroduces a fallback.
 *
 * This wrapper turns the failure into a deliberate 503 with a stable body, so a
 * client (or a monitor) can distinguish "the write was refused because storage
 * is down" from "the request was malformed".
 *
 * 503 Service Unavailable is the correct status: the request was valid, the
 * service is running, and the condition is expected to be transient. Retrying
 * later is meaningful, which is exactly what the status signals.
 *
 * SAFETY
 * ------
 * The response body is built from the error's `reason` code only. It never
 * includes the connection string, the driver error, or any credential. The
 * underlying failure is logged server-side by the store, which logs the error
 * name and nothing more.
 */

export type StoreResolution =
  | { ok: true; store: Store }
  | { ok: false; response: NextResponse };

export async function resolveStore(): Promise<StoreResolution> {
  try {
    return { ok: true, store: await getStore() };
  } catch (error) {
    if (error instanceof StorageUnavailableError) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: "Community storage is temporarily unavailable. Nothing was saved.",
            reason: error.reason,
          },
          { status: 503, headers: { "Retry-After": "30" } },
        ),
      };
    }
    // Anything else is a genuine bug. Re-throw so it is not mislabelled as a
    // storage outage and does not hide a real error from the logs.
    throw error;
  }
}