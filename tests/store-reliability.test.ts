import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * STORAGE DURABILITY FAILURE MODES
 *
 * The defect this file guards: a database that is CONFIGURED but UNREACHABLE used
 * to be caught inside the store factory, which logged a line and returned the
 * in-process memory store. Every API route then returned 201/200, `/api/health`
 * reported `status: "ok"`, and the site appeared fully healthy while writing every
 * message and review to an array that dies on restart and is not shared between
 * serverless instances. Nothing surfaced the loss.
 *
 * The rule now enforced:
 *   - No credential configured + not production -> memory store (local dev).
 *   - No credential configured + production      -> REFUSE, never memory.
 *   - Credential configured but unusable         -> REFUSE, never memory.
 *
 * No production credential is required. The pool is injected through the module's
 * own dynamic `pg` import, and `NODE_ENV` is set only around the factory call.
 */

type PoolBehaviour = "ok" | "throw";

interface Captured {
  behaviour: PoolBehaviour;
  config?: { connectionString?: string };
}

/**
 * Typed view of `process.env`.
 *
 * Next.js declares `NODE_ENV` as a readonly literal on `ProcessEnv`, so
 * assigning to it is a type error even though it is genuinely writable at
 * runtime. Tests need to vary it to exercise the production code path, so the
 * casts are isolated here rather than sprinkled through the cases.
 */
const mutableEnv = process.env as unknown as Record<string, string | undefined>;

/**
 * Load a fresh copy of the store module with `pg` replaced by a fake Pool.
 *
 * The factory memoises its selection in a module-level variable, so each scenario
 * needs its own module instance: `vi.resetModules()` plus a dynamic import gives
 * exactly that.
 */
async function loadStore(opts: {
  behaviour: PoolBehaviour;
  pooled?: string;
  direct?: string;
}): Promise<{ store: typeof import("@/lib/store"); captured: Captured }> {
  vi.resetModules();
  const captured: Captured = { behaviour: opts.behaviour };

  vi.doMock("pg", () => ({
    Pool: class {
      constructor(cfg: { connectionString?: string }) {
        captured.config = cfg;
      }
      async query() {
        if (captured.behaviour === "throw") {
          throw new Error("ECONNREFUSED 10.0.0.1:5432");
        }
        return { rows: [{ "?column?": 1 }] };
      }
      async end() {
        /* the fake pool closes cleanly */
      }
    },
  }));

  if (opts.direct) mutableEnv.DATABASE_URL = opts.direct;
  if (opts.pooled) mutableEnv.DATABASE_POOL_URL = opts.pooled;

  const store = await import("@/lib/store");
  return { store, captured };
}

const ORIGINAL_ENV = {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_POOL_URL: process.env.DATABASE_POOL_URL,
};

function restore(key: string, value: string | undefined): void {
  if (value === undefined) delete mutableEnv[key];
  else mutableEnv[key] = value;
}

beforeEach(() => {
  delete mutableEnv.DATABASE_URL;
  delete mutableEnv.DATABASE_POOL_URL;
  // The factory logs the driver error name on failure. Silence it so a passing
  // run does not print a scary line that looks like a real outage.
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  restore("NODE_ENV", ORIGINAL_ENV.NODE_ENV);
  restore("DATABASE_URL", ORIGINAL_ENV.DATABASE_URL);
  restore("DATABASE_POOL_URL", ORIGINAL_ENV.DATABASE_POOL_URL);
  vi.restoreAllMocks();
  vi.resetModules();
  vi.doUnmock("pg");
});

describe("storage durability", () => {
  it("uses the memory store in development when no database is configured", async () => {
    mutableEnv.NODE_ENV = "development";
    vi.resetModules();
    const { getStore } = await import("@/lib/store");

    const store = await getStore();

    expect(store.kind).toBe("memory");
    expect(store.durable).toBe(false);
  });

  it("refuses to use the memory store in production when no database is configured", async () => {
    mutableEnv.NODE_ENV = "production";
    vi.resetModules();
    const { getStore, StorageUnavailableError } = await import("@/lib/store");

    // The behaviour under test: this must NOT resolve to a memory store.
    await expect(getStore()).rejects.toBeInstanceOf(StorageUnavailableError);
    await expect(getStore()).rejects.toMatchObject({ reason: "not_configured" });
  });

  it("does not fall back to the memory store when a configured database cannot be reached", async () => {
    mutableEnv.NODE_ENV = "production";
    const { store } = await loadStore({
      behaviour: "throw",
      direct: "postgres://u:secret-password@db.example/db",
    });

    // The regression this file exists for: previously this RESOLVED with
    // kind === "memory".
    await expect(store.getStore()).rejects.toMatchObject({
      code: "STORAGE_UNAVAILABLE",
      reason: "connection_failed",
    });
  });

  it("reports the postgres driver and durability when initialisation succeeds", async () => {
    mutableEnv.NODE_ENV = "production";
    const { store } = await loadStore({
      behaviour: "ok",
      direct: "postgres://u:p@db.example/db",
    });

    const resolved = await store.getStore();

    expect(resolved.kind).toBe("postgres");
    expect(resolved.durable).toBe(true);
  });

  it("prefers the pooled connection string over the direct one", async () => {
    mutableEnv.NODE_ENV = "production";
    const { store, captured } = await loadStore({
      behaviour: "ok",
      pooled: "postgres://u:p@pooler.example/db",
      direct: "postgres://u:p@direct.example/db",
    });

    await store.getStore();

    // Pooled must win on serverless: a long-lived socket would be exhausted.
    expect(captured.config?.connectionString).toBe("postgres://u:p@pooler.example/db");
    expect(captured.config?.connectionString).not.toContain("direct.example");
  });

  it("never exposes a credential in the thrown error", async () => {
    mutableEnv.NODE_ENV = "production";
    const { store } = await loadStore({
      behaviour: "throw",
      direct: "postgres://user:super-secret-value@db.example/db",
    });

    const error = (await store.getStore().catch((e: unknown) => e)) as Error;

    const serialised = `${error.message} ${error.stack ?? ""} ${JSON.stringify(error)}`;
    expect(serialised).not.toContain("super-secret-value");
    expect(serialised).not.toContain("postgres://");
    // The driver message that named the internal host must not leak either.
    expect(serialised).not.toContain("10.0.0.1");
    expect(serialised).not.toContain("ECONNREFUSED");
  });

  it("does not log a credential when initialisation fails", async () => {
    mutableEnv.NODE_ENV = "production";
    const { store } = await loadStore({
      behaviour: "throw",
      direct: "postgres://user:another-secret@db.example/db",
    });

    await store.getStore().catch(() => undefined);

    const logged = (console.error as unknown as { mock: { calls: unknown[][] } }).mock.calls
      .map((args) => args.map(String).join(" "))
      .join("\n");

    expect(logged).not.toContain("another-secret");
    expect(logged).not.toContain("postgres://");
  });
});