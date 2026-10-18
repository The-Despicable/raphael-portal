import { existsSync, readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * /api/health MUST BE EVALUATED AT REQUEST TIME.
 *
 * The defect this file guards: `next build` classified this route as static
 * (`○ /api/health` in the route table) and wrote a frozen snapshot to
 * `.next/server/app/api/health.body`. That snapshot was taken from the BUILD
 * environment, so a Vercel deployment reported build-time state forever — it
 * advertised `generativeAi.enabled: true` on the strength of a developer's local
 * `.env.local`, and could never observe a variable changed or added after deploy.
 *
 * Two independent guarantees are asserted:
 *
 *   1. The handler opts into request-time evaluation unconditionally, by awaiting
 *      `connection()` before it touches configuration or storage. This matters
 *      because the storage call is NOT a reliable signal on its own: with no
 *      database configured, `getStore()` refuses before opening a connection, so
 *      the build saw a route that touched nothing and had nothing to defer on.
 *
 *   2. The emitted build artifacts contain no prerendered health body, so the
 *      route cannot be served from a build-time snapshot.
 *
 * No production credential and no live database are required: the pool is injected
 * through the store module's own dynamic `pg` import, and `connection()` is stubbed
 * because it only resolves inside a real request.
 */

type PoolBehaviour = "ok" | "throw";

const mutableEnv = process.env as unknown as Record<string, string | undefined>;

/** Events in call order, to prove `connection()` precedes any storage access. */
const events: string[] = [];
/** Number of times the handler awaited `connection()`. */
let connectionCalls = 0;

interface LoadOptions {
  behaviour?: PoolBehaviour;
  nodeEnv?: "production" | "development";
  databaseUrl?: string;
  modelKey?: string;
  modelBase?: string;
  modelName?: string;
  moderationKey?: string;
}

const ORIGINAL_ENV = {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_POOL_URL: process.env.DATABASE_POOL_URL,
  MODEL_API_KEY: process.env.MODEL_API_KEY,
  MODEL_BASE_URL: process.env.MODEL_BASE_URL,
  MODEL_NAME: process.env.MODEL_NAME,
  MODERATION_KEY: process.env.MODERATION_KEY,
};

const MANY_ENV_KEYS = [
  "DATABASE_URL", "DATABASE_POOL_URL",
  "MODEL_API_KEY", "MODEL_BASE_URL", "MODEL_NAME", "MODERATION_KEY",
] as const;

interface HealthBody {
  status: string;
  storage: {
    configured: boolean;
    driver: string;
    durable: boolean;
    reachable: boolean;
    failure: string | null;
    note: string;
  };
  generativeAi: { enabled: boolean; note: string };
  moderation: { enabled: boolean; note: string };
  requiredForFullFunctionality: string[];
}

function applyEnv(opts: LoadOptions) {
  mutableEnv.NODE_ENV = opts.nodeEnv ?? "production";
  for (const key of MANY_ENV_KEYS) delete mutableEnv[key];
  if (opts.databaseUrl) mutableEnv.DATABASE_URL = opts.databaseUrl;
  if (opts.modelKey) mutableEnv.MODEL_API_KEY = opts.modelKey;
  if (opts.modelBase) mutableEnv.MODEL_BASE_URL = opts.modelBase;
  if (opts.modelName) mutableEnv.MODEL_NAME = opts.modelName;
  if (opts.moderationKey) mutableEnv.MODERATION_KEY = opts.moderationKey;
}

/**
 * Load a fresh copy of the health route with `pg` and `connection()` stubbed.
 *
 * `env` and the store factory both memoise, so each scenario needs its own module
 * instance: `vi.resetModules()` plus a dynamic import gives exactly that.
 */
async function loadRoute(opts: LoadOptions) {
  vi.resetModules();
  connectionCalls = 0;
  events.length = 0;

  const behaviour: PoolBehaviour = opts.behaviour ?? "ok";

  vi.doMock("next/server", async (importOriginal) => {
    const actual = await importOriginal<typeof import("next/server")>();
    return {
      ...actual,
      connection: async () => {
        connectionCalls += 1;
        events.push("connection");
      },
    };
  });

  vi.doMock("pg", () => ({
    Pool: class {
      constructor() {
        events.push("pool-construct");
      }
      async query() {
        events.push("query");
        if (behaviour === "throw") {
          // A realistic, sensitive-looking failure. It must never reach the client.
          throw new Error("ECONNREFUSED 10.0.0.1:5432 password=hunter2 dbname=raphael");
        }
        return { rows: [{ "?column?": 1 }] };
      }
      async end() {
        /* closes cleanly */
      }
    },
  }));

  applyEnv(opts);
  return import("@/app/api/health/route");
}

/** Call GET() with no arguments, headers, or credentials, then parse the body. */
async function callHealth(opts: LoadOptions) {
  const route = await loadRoute(opts);
  const res = await route.GET();
  const body = (await res.json()) as HealthBody;
  return { res, body };
}

beforeEach(() => {
  events.length = 0;
  connectionCalls = 0;
});

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("next/server");
  vi.doUnmock("pg");
  mutableEnv.NODE_ENV = ORIGINAL_ENV.NODE_ENV;
  for (const key of MANY_ENV_KEYS) {
    const original = ORIGINAL_ENV[key];
    if (original === undefined) delete mutableEnv[key];
    else mutableEnv[key] = original;
  }
});

describe("health: request-time evaluation", () => {
  it("awaits connection() so prerendering cannot freeze the response", async () => {
    await callHealth({ nodeEnv: "production" });
    expect(connectionCalls).toBe(1);
  });

  it("opts in BEFORE touching storage", async () => {
    await callHealth({
      behaviour: "ok", nodeEnv: "production", databaseUrl: "postgres://u:p@db.example/d",
    });
    expect(events.indexOf("connection")).toBe(0);
    expect(events.indexOf("connection")).toBeLessThan(events.indexOf("query"));
  });

  it("opts in even when NO database is configured", async () => {
    // The regression case: with no credential the store refuses before connecting,
    // so nothing looks like request-time work and the route gets prerendered.
    const { body } = await callHealth({ nodeEnv: "production" });
    expect(connectionCalls).toBe(1);
    expect(body.storage.driver).toBe("unavailable");
  });

  it("reflects runtime configuration rather than a fixed snapshot", async () => {
    const withModel = await callHealth({
      nodeEnv: "production",
      modelKey: "k", modelBase: "https://provider.invalid/v1", modelName: "m",
    });
    expect(withModel.body.generativeAi.enabled).toBe(true);

    const withoutModel = await callHealth({ nodeEnv: "production" });
    expect(withoutModel.body.generativeAi.enabled).toBe(false);
  });
});

describe("health: storage honesty", () => {
  it("missing configuration is never reported as durable", async () => {
    const { body } = await callHealth({ nodeEnv: "production" });
    expect(body.storage.configured).toBe(false);
    expect(body.storage.driver).toBe("unavailable");
    expect(body.storage.durable).toBe(false);
    expect(body.storage.reachable).toBe(false);
    expect(body.storage.failure).toBe("not_configured");
    expect(body.requiredForFullFunctionality).toContain("DATABASE_URL");
  });

  it("a configured but UNREACHABLE database is neither reachable nor durable", async () => {
    const { body } = await callHealth({
      behaviour: "throw", nodeEnv: "production", databaseUrl: "postgres://u:p@db.example/d",
    });
    expect(body.storage.configured).toBe(true);
    expect(body.storage.driver).toBe("unavailable");
    expect(body.storage.reachable).toBe(false);
    expect(body.storage.durable).toBe(false);
    expect(body.storage.failure).toBe("connection_failed");
  });

  it("reports durable only when postgres actually answers", async () => {
    const { body } = await callHealth({
      behaviour: "ok", nodeEnv: "production", databaseUrl: "postgres://u:p@db.example/d",
    });
    expect(body.storage.configured).toBe(true);
    expect(body.storage.driver).toBe("postgres");
    expect(body.storage.reachable).toBe(true);
    expect(body.storage.durable).toBe(true);
    expect(body.storage.failure).toBeNull();
  });

  it("does not silently serve memory storage in production", async () => {
    const { body } = await callHealth({ nodeEnv: "production" });
    expect(body.storage.driver).not.toBe("memory");
    expect(body.storage.note).toMatch(/refused/i);
  });

  it("keeps configured / driver / reachable / durable as independent axes", async () => {
    const { body } = await callHealth({ nodeEnv: "production" });
    for (const key of ["configured", "driver", "durable", "reachable", "failure"]) {
      expect(body.storage).toHaveProperty(key);
    }
  });
});

describe("health: disclosure", () => {
  it("never returns credentials, URLs, or connection error text", async () => {
    const { body, res } = await callHealth({
      behaviour: "throw", nodeEnv: "production",
      databaseUrl: "postgres://user:s3cr3t@db.example/raphael",
    });
    const text = JSON.stringify(body);
    expect(text).not.toContain("s3cr3t");
    expect(text).not.toContain("postgres://");
    expect(text).not.toContain("@db.example");
    expect(text).not.toContain("hunter2");
    expect(text).not.toContain("10.0.0.1");
    expect(text).not.toContain("ECONNREFUSED");
    expect(text).not.toMatch(/\/home\//);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("names missing configuration without revealing values", async () => {
    const { body } = await callHealth({
      nodeEnv: "production", modelKey: "sk-should-never-appear",
    });
    expect(body.generativeAi.enabled).toBe(false);
    expect(JSON.stringify(body)).not.toContain("sk-should-never-appear");
  });
});

describe("health: public accessibility", () => {
  it("responds with no credentials, headers or cookies supplied", async () => {
    const { res, body } = await callHealth({ nodeEnv: "production" });
    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
  });

  it("imports no authentication module", async () => {
    const src = readFileSync(new URL("../src/app/api/health/route.ts", import.meta.url), "utf8");
    expect(src).not.toMatch(/clerk/i);
    expect(src).not.toMatch(/getAuth|currentUser|auth\(\)/i);
  });

  it("keeps the response contract stable", async () => {
    const { body } = await callHealth({
      behaviour: "ok", nodeEnv: "production", databaseUrl: "postgres://u:p@db.example/d",
    });
    expect(Object.keys(body).sort()).toEqual([
      "generativeAi", "moderation", "requiredForFullFunctionality", "status", "storage",
    ]);
  });
});

/**
 * Artifact-level guard. A unit test cannot prove Next stopped prerendering, so this
 * inspects the real build output when one exists.
 */
describe("health: build artifact", () => {
  const BUILT = existsSync(".next/server/app");
  const FROZEN = ".next/server/app/api/health.body";

  it.skipIf(!BUILT)("ships no prerendered health body", () => {
    expect(existsSync(FROZEN)).toBe(false);
  });

  it.skipIf(!BUILT)("does not advertise a baked generative-AI flag", () => {
    if (!existsSync(FROZEN)) return;
    expect(readFileSync(FROZEN, "utf8")).not.toContain('"generativeAi"');
  });
});