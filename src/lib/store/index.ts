import type { ChatMessagePublic, PaperSuggestion, ReviewPublic } from "@/lib/types";
import { env } from "@/lib/env";
import { randomBytes } from "node:crypto";

/**
 * Storage abstraction.
 *
 * Two drivers behind one narrow interface:
 *
 *   postgres — used when DATABASE_URL / DATABASE_POOL_URL is configured.
 *              Durable, shared across instances, supports row-level security.
 *   memory   — the fallback. In-process, NON-DURABLE, single-instance only.
 *
 * The fallback exists so the site is genuinely runnable and testable with zero
 * credentials. It is never presented as production-ready: the UI surfaces the
 * active driver, and the README documents the durability limitation. It is a
 * development and demo mode, not a substitute for the database.
 */

export interface NewMessage {
  nickname: string;
  accent: string;
  body: string;
  moderation?: "VISIBLE" | "PENDING" | "HIDDEN";
}

export interface NewReview {
  nickname: string | null;
  accent: string | null;
  rating: number | null;
  title: string;
  body: string;
  category: ReviewPublic["category"];
  component: ReviewPublic["component"];
  moderation?: ReviewPublic["moderation"];
}

export interface NewSuggestion {
  title: string;
  identifier: string;
  relevance: string;
  component: PaperSuggestion["component"];
  rationale: string;
}

export interface NewReport {
  targetKind: "MESSAGE" | "REVIEW" | "SUGGESTION";
  targetId: string;
  reason: string;
  /** Digest of the reporter's session. Never the raw token. */
  reporterDigest: string | null;
}

export interface Page<T> {
  items: T[];
  total: number;
}

export interface Store {
  readonly kind: "postgres" | "memory";
  readonly durable: boolean;
  init(): Promise<void>;
  addMessage(input: NewMessage): Promise<ChatMessagePublic>;
  listMessages(limit: number): Promise<ChatMessagePublic[]>;
  addReview(input: NewReview): Promise<ReviewPublic>;
  listReviews(limit: number, offset: number, moderationOnly?: boolean): Promise<Page<ReviewPublic>>;
  addSuggestion(input: NewSuggestion): Promise<PaperSuggestion>;
  addReport(input: NewReport): Promise<void>;
  setModeration(targetKind: "REVIEW" | "MESSAGE", id: string, state: "VISIBLE" | "HIDDEN"): Promise<boolean>;
  close(): Promise<void>;
}

export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(9).toString("base64url")}`;
}

/* ========================================================================== */
/* Memory driver                                                             */
/* ========================================================================== */

const MEMORY_CAPS = { messages: 500, reviews: 200, suggestions: 200, reports: 500 } as const;

function makeMemoryStore(): Store {
  const messages: ChatMessagePublic[] = [];
  const reviews: ReviewPublic[] = [];
  const suggestions: PaperSuggestion[] = [];
  const reports: NewReport[] = [];

  const trim = <T>(arr: T[], cap: number): void => {
    if (arr.length > cap) arr.splice(0, arr.length - cap);
  };

  return {
    kind: "memory",
    durable: false,

    async init() {
      /* nothing to migrate */
    },

    async addMessage(input) {
      const row: ChatMessagePublic = {
        id: newId("msg"),
        nickname: input.nickname,
        accent: input.accent,
        body: input.body,
        createdAt: new Date().toISOString(),
        moderation: input.moderation ?? "VISIBLE",
      };
      messages.push(row);
      trim(messages, MEMORY_CAPS.messages);
      return row;
    },

    async listMessages(limit) {
      return messages.filter((m) => m.moderation === "VISIBLE").slice(-limit);
    },

    async addReview(input) {
      const row: ReviewPublic = {
        id: newId("rev"),
        nickname: input.nickname,
        accent: input.accent,
        rating: input.rating,
        title: input.title,
        body: input.body,
        category: input.category,
        component: input.component,
        createdAt: new Date().toISOString(),
        moderation: input.moderation ?? "VISIBLE",
      };
      reviews.push(row);
      trim(reviews, MEMORY_CAPS.reviews);
      return row;
    },

    async listReviews(limit, offset, moderationOnly = true) {
      const visible = moderationOnly ? reviews.filter((r) => r.moderation === "VISIBLE") : reviews;
      // Newest first.
      const ordered = [...visible].reverse();
      return { items: ordered.slice(offset, offset + limit), total: ordered.length };
    },

    async addSuggestion(input) {
      const row: PaperSuggestion = {
        id: newId("sug"),
        ...input,
        createdAt: new Date().toISOString(),
        reviewStatus: "AWAITING_REVIEW",
      };
      suggestions.push(row);
      trim(suggestions, MEMORY_CAPS.suggestions);
      return row;
    },

    async addReport(input) {
      reports.push(input);
      trim(reports, MEMORY_CAPS.reports);
    },

    async setModeration(targetKind, id, state) {
      const list = targetKind === "REVIEW" ? (reviews as ReviewPublic[]) : (messages as ChatMessagePublic[]);
      const row = list.find((r) => r.id === id);
      if (!row) return false;
      row.moderation = state;
      return true;
    },

    async close() {
      /* nothing to close */
    },
  };
}

/* ========================================================================== */
/* Postgres driver                                                           */
/* ========================================================================== */

/**
 * Result shape returned by the pool.
 *
 * `rowCount` is the number of rows an INSERT/UPDATE/DELETE actually affected.
 * It is REQUIRED, not optional: a statement with no RETURNING clause returns an
 * empty `rows` array, so `rows.length` cannot distinguish "matched nothing"
 * from "matched and changed something". See setModeration() below.
 *
 * node-postgres always supplies rowCount, so requiring it costs nothing and
 * removes the `?? 0` guesswork that previously masked the bug.
 */
interface QueryResult<T> {
  rows: T[];
  rowCount: number | null;
}

interface Queryable {
  query<T = unknown>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
}

function makePostgresStore(pool: Queryable): Store {
  return {
    kind: "postgres",
    durable: true,

    async init() {
      // Schema is created by the migration file. We only verify reachability.
      await pool.query("SELECT 1");
    },

    async addMessage(input) {
      const { rows } = await pool.query<ChatMessagePublic>(
        `INSERT INTO chat_messages (id, nickname, accent, body, moderation)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING id, nickname, accent, body, created_at AS "createdAt", moderation`,
        [newId("msg"), input.nickname, input.accent, input.body, input.moderation ?? "VISIBLE"],
      );
      return rows[0];
    },

    async listMessages(limit) {
      const { rows } = await pool.query<ChatMessagePublic>(
        `SELECT id, nickname, accent, body, created_at AS "createdAt", moderation
         FROM chat_messages
         WHERE moderation = 'VISIBLE'
         ORDER BY created_at DESC
         LIMIT $1`,
        [limit],
      );
      return rows.reverse();
    },

    async addReview(input) {
      const { rows } = await pool.query<ReviewPublic>(
        `INSERT INTO reviews (id, nickname, accent, rating, title, body, category, component, moderation)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING id, nickname, accent, rating, title, body, category, component,
                   created_at AS "createdAt", moderation`,
        [
          newId("rev"),
          input.nickname,
          input.accent,
          input.rating,
          input.title,
          input.body,
          input.category,
          input.component,
          input.moderation ?? "VISIBLE",
        ],
      );
      return rows[0];
    },

    async listReviews(limit, offset, moderationOnly = true) {
      const where = moderationOnly ? "WHERE moderation = 'VISIBLE'" : "";
      const { rows } = await pool.query<ReviewPublic>(
        `SELECT id, nickname, accent, rating, title, body, category, component,
                created_at AS "createdAt", moderation
         FROM reviews ${where}
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      );
      const countResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM reviews ${where}`,
      );
      return { items: rows, total: Number(countResult.rows[0]?.count ?? 0) };
    },

    async addSuggestion(input) {
      const { rows } = await pool.query<PaperSuggestion>(
        `INSERT INTO paper_suggestions (id, title, identifier, relevance, component, rationale, review_status)
         VALUES ($1,$2,$3,$4,$5,$6,'AWAITING_REVIEW')
         RETURNING id, title, identifier, relevance, component, rationale,
                   created_at AS "createdAt", review_status AS "reviewStatus"`,
        [newId("sug"), input.title, input.identifier, input.relevance, input.component, input.rationale],
      );
      return rows[0];
    },

    async addReport(input) {
      await pool.query(
        `INSERT INTO reports (target_kind, target_id, reason, reporter_digest)
         VALUES ($1,$2,$3,$4)`,
        [input.targetKind, input.targetId, input.reason, input.reporterDigest],
      );
    },

    async setModeration(targetKind, id, state) {
      const table = targetKind === "REVIEW" ? "reviews" : "chat_messages";
      // table is from a closed union above, never user input.
      //
      // BUG FIXED: this previously returned `result.rows.length > 0`.
      //
      // The UPDATE has no RETURNING clause, so PostgreSQL sends back an EMPTY
      // row array on every execution. `rows.length` was therefore always 0 and
      // this method always reported `false` — a moderator hiding a message got
      // `{ ok: true, updated: false }` and had no way to tell that the row had
      // in fact been updated. The write and the reported result disagreed.
      //
      // `rowCount` is the affected-row count, which is what actually answers
      // "did this statement match anything". No RETURNING clause was added: the
      // caller only needs a boolean, and returning rows would change nothing
      // about the API response shape.
      const result = await pool.query(`UPDATE ${table} SET moderation = $1 WHERE id = $2`, [state, id]);
      // null rowCount is not possible for node-postgres, but treating it as
      // "no rows affected" fails closed rather than reporting a false success.
      return (result.rowCount ?? 0) > 0;
    },

    async close() {
      const closable = pool as { end?: () => Promise<void> };
      await closable.end?.();
    },
  };
}

/* ========================================================================== */
/* Selection                                                                 */
/* ========================================================================== */

/**
 * Raised when a database is CONFIGURED but cannot be reached or initialised.
 *
 * WHY THIS EXISTS
 * ---------------
 * The previous implementation caught every failure and returned the in-memory
 * store. That is the worst possible failure mode for a durability control: the
 * site kept returning 201 responses, the health probe kept reporting `status:
 * "ok"`, and nothing in the UI or the logs indicated that data was being written
 * to a process-local array that dies on restart and is not shared between
 * serverless instances. An operator could run for a long time believing
 * persistence was configured while silently serving volatile storage.
 *
 * Silently degrading is only acceptable when NO database was configured, which
 * is the local-development case. Once a credential is supplied, the operator has
 * asked for durability, so a failure to provide it must be loud.
 *
 * SECURITY
 * --------
 * The message is deliberately generic. The underlying error may embed a
 * connection string containing a password, so it is NEVER placed in this
 * message, in a client response, or in `env.describeCapabilities()`. Only the
 * error NAME is logged server-side, which is enough to tell a driver-level
 * problem from a network-level one without disclosing either.
 */
/** Why a durable store could not be provided. */
export type StoreUnavailableReason = "not_configured" | "connection_failed";

export class StorageUnavailableError extends Error {
  readonly code = "STORAGE_UNAVAILABLE" as const;
  /** Machine-readable cause, safe to surface in a capability probe. */
  readonly reason: StoreUnavailableReason;

  constructor(reason: StoreUnavailableReason) {
    super(
      reason === "not_configured"
        ? "Persistent storage is not configured for this deployment."
        : "Persistent storage is configured but could not be reached.",
    );
    this.name = "StorageUnavailableError";
    this.reason = reason;
  }
}

let cached: Promise<Store> | null = null;

/** Test seam. Clears the memoised selection so a scenario can be re-evaluated. */
export function resetStoreForTests(): void {
  cached = null;
}

async function createStore(): Promise<Store> {
  // Pooled connection string takes precedence: on serverless a long-lived socket
  // would be exhausted by invocations, so DATABASE_POOL_URL must win when set.
  const connectionString = env.databasePooledUrl ?? env.databaseUrl;
  if (!connectionString) {
    // No credential supplied. In production that is a misconfiguration and must
    // be reported rather than papered over with volatile storage. In local
    // development the in-memory store is a deliberate, documented convenience.
    if (env.isProduction) throw new StorageUnavailableError("not_configured");
    return makeMemoryStore();
  }

  let pool: Queryable | null = null;
  try {
    // Dynamic import keeps `pg` out of the bundle when unused.
    const pg = await import("pg");
    const PoolCtor = (pg as unknown as { Pool: new (cfg: unknown) => Queryable }).Pool;
    pool = new PoolCtor({
      connectionString,
      max: env.isProduction ? 5 : 2,
      // Managed providers commonly terminate TLS with a private CA.
      ...(env.isProduction ? { ssl: { rejectUnauthorized: false } } : {}),
    });
    const store = makePostgresStore(pool);
    await store.init();
    return store;
  } catch (error) {
    // Log the error NAME only. The message can contain the connection string,
    // which embeds the password, so it must never reach the log sink.
    console.error(
      "[store] PostgreSQL is configured but unavailable. Refusing to fall back to" +
        " the non-durable in-memory store. error=" +
        (error instanceof Error ? error.name : "unknown"),
    );
    // Close a pool that was constructed but never reached `init()`. Leaking it
    // would hold a socket open for the lifetime of the process.
    await (pool as { end?: () => Promise<void> } | null)?.end?.().catch(() => undefined);
    throw new StorageUnavailableError("connection_failed");
  }
}

export function getStore(): Promise<Store> {
  cached ??= createStore();
  return cached;
}