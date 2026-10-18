import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * MODERATION RESULT REPORTING
 *
 * BUG UNDER TEST
 * -------------
 * `setModeration` ran an UPDATE with no RETURNING clause and then reported
 * `result.rows.length > 0`. PostgreSQL returns an EMPTY row array for such a
 * statement, so the method ALWAYS returned false. A moderator who hid a message
 * was told `{ ok: true, updated: false }` while the row had in fact been
 * updated — the write and the reported outcome silently disagreed.
 *
 * The correct signal is `rowCount`, the affected-row count. These tests pin the
 * four outcomes that matter and keep the in-memory driver honest, so the two
 * drivers cannot drift apart again.
 *
 * No live database and no credentials are required: the pool is a stub that
 * returns whatever row count the case needs.
 */

type StoreModule = typeof import("@/lib/store");

const mutableEnv = process.env as unknown as Record<string, string | undefined>;

/**
 * Load a fresh store module wired to a stub pool.
 *
 * `rowCount` is supplied per-call so a single module instance can serve
 * several outcomes without a real database.
 */
async function loadStore(): Promise<{
  store: StoreModule;
  calls: { text: string; params: unknown[] }[];
  setResult: (r: { rows: unknown[]; rowCount: number | null }) => void;
}> {
  vi.resetModules();

  const calls: { text: string; params: unknown[] }[] = [];
  let result: { rows: unknown[]; rowCount: number | null } = { rows: [], rowCount: 1 };

  vi.doMock("pg", () => ({
    Pool: class {
      async query(text: string, params?: unknown[]) {
        calls.push({ text, params: params ?? [] });
        return result;
      }
      async end() {
        /* stub pool closes cleanly */
      }
    },
  }));

  mutableEnv.NODE_ENV = "production";
  mutableEnv.DATABASE_URL = "postgres://u:p@db.example/db";

  const store = await import("@/lib/store");
  return {
    store,
    calls,
    setResult: (r) => {
      result = r;
    },
  };
}

const ORIGINAL = {
  NODE_ENV: mutableEnv.NODE_ENV,
  DATABASE_URL: mutableEnv.DATABASE_URL,
  DATABASE_POOL_URL: mutableEnv.DATABASE_POOL_URL,
};

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  for (const key of ["NODE_ENV", "DATABASE_URL", "DATABASE_POOL_URL"] as const) {
    const v = ORIGINAL[key];
    if (v === undefined) delete mutableEnv[key];
    else mutableEnv[key] = v;
  }
  vi.restoreAllMocks();
  vi.resetModules();
  vi.doUnmock("pg");
});

describe("setModeration result reporting (postgres)", () => {
  it("reports true when a chat message id matches", async () => {
    const { store, setResult } = await loadStore();
    setResult({ rows: [], rowCount: 1 });

    const s = await store.getStore();
    await expect(s.setModeration("MESSAGE", "msg_abc", "HIDDEN")).resolves.toBe(true);
  });

  it("reports true when a review id matches", async () => {
    const { store, setResult } = await loadStore();
    setResult({ rows: [], rowCount: 1 });

    const s = await store.getStore();
    await expect(s.setModeration("REVIEW", "rev_abc", "VISIBLE")).resolves.toBe(true);
  });

  it("reports false when no row matches", async () => {
    const { store, setResult } = await loadStore();
    setResult({ rows: [], rowCount: 0 });

    const s = await store.getStore();
    await expect(s.setModeration("MESSAGE", "msg_missing", "HIDDEN")).resolves.toBe(false);
  });

  it("does not treat an empty row array as success", async () => {
    // The precise regression. rows is empty — as it ALWAYS is for an UPDATE
    // without RETURNING — yet rowCount is 1, so this must be a success.
    // The old `rows.length` check returned false here and reported a phantom
    // failure for a write that had succeeded.
    const { store, setResult } = await loadStore();
    setResult({ rows: [], rowCount: 1 });

    const s = await store.getStore();
    const updated = await s.setModeration("MESSAGE", "msg_abc", "HIDDEN");

    expect(updated).toBe(true);
  });

  it("reports false when the driver returns a null row count", async () => {
    // Fails closed. A null rowCount must never be read as success.
    const { store, setResult } = await loadStore();
    setResult({ rows: [], rowCount: null });

    const s = await store.getStore();
    await expect(s.setModeration("REVIEW", "rev_abc", "HIDDEN")).resolves.toBe(false);
  });

  it("updates only the moderation column on both tables", async () => {
    const { store, calls, setResult } = await loadStore();
    setResult({ rows: [], rowCount: 1 });

    const s = await store.getStore();
    await s.setModeration("MESSAGE", "msg_abc", "HIDDEN");
    await s.setModeration("REVIEW", "rev_abc", "VISIBLE");

    // init() issues `SELECT 1` first, so the UPDATEs are the last two calls.
    const updates = calls.filter((c) => c.text.startsWith("UPDATE"));
    expect(updates).toHaveLength(2);

    expect(updates[0]?.text).toContain("UPDATE chat_messages SET moderation = $1");
    expect(updates[1]?.text).toContain("UPDATE reviews SET moderation = $1");

    // No RETURNING clause: the caller needs a boolean, not rows.
    for (const call of updates) expect(call.text).not.toMatch(/RETURNING/i);

    // The table is chosen from a closed union, never interpolated from input.
    expect(updates[0]?.params).toEqual(["HIDDEN", "msg_abc"]);
    expect(updates[1]?.params).toEqual(["VISIBLE", "rev_abc"]);
  });
});

describe("setModeration in-memory driver (unchanged)", () => {
  it("still flips moderation state and reports the same booleans", async () => {
    // The memory driver is a separate implementation and must not regress while
    // the postgres driver is fixed. Driven through the public Store interface
    // so both drivers stay behaviourally aligned.
    mutableEnv.NODE_ENV = "development";
    delete mutableEnv.DATABASE_URL;
    delete mutableEnv.DATABASE_POOL_URL;
    vi.resetModules();

    const { getStore } = await import("@/lib/store");
    const s = await getStore();
    expect(s.kind).toBe("memory");

    const message = await s.addMessage({ nickname: "tester", accent: "cyan", body: "hello" });
    await expect(s.setModeration("MESSAGE", message.id, "HIDDEN")).resolves.toBe(true);

    const review = await s.addReview({
      nickname: "tester",
      accent: "cyan",
      rating: 4,
      title: "A review title",
      body: "A review body long enough to satisfy the constraint.",
      category: "OTHER",
      component: null,
    });
    await expect(s.setModeration("REVIEW", review.id, "HIDDEN")).resolves.toBe(true);

    // Unknown id is still false in memory.
    await expect(s.setModeration("MESSAGE", "msg_nope", "HIDDEN")).resolves.toBe(false);
  });
});