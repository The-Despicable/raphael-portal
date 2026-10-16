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

interface Queryable {
  query<T = unknown>(text: string, params?: unknown[]): Promise<{ rows: T[] }>;
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
      const result = await pool.query(`UPDATE ${table} SET moderation = $1 WHERE id = $2`, [state, id]);
      return (result.rows.length ?? 0) > 0;
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

let cached: Promise<Store> | null = null;

async function createStore(): Promise<Store> {
  const connectionString = env.databasePooledUrl ?? env.databaseUrl;
  if (!connectionString) return makeMemoryStore();

  try {
    // Dynamic import keeps `pg` out of the bundle when unused.
    const pg = await import("pg");
    const PoolCtor = (pg as unknown as { Pool: new (cfg: unknown) => Queryable }).Pool;
    const pool = new PoolCtor({
      connectionString,
      max: env.isProduction ? 5 : 2,
      // Managed providers commonly terminate TLS with a private CA.
      ...(env.isProduction ? { ssl: { rejectUnauthorized: false } } : {}),
    });
    const store = makePostgresStore(pool);
    await store.init();
    return store;
  } catch (error) {
    // Never surface the connection string or driver internals to the client.
    console.error(
      "[store] Postgres unavailable; falling back to the non-durable in-memory store.",
      error instanceof Error ? error.name : "unknown",
    );
    return makeMemoryStore();
  }
}

export function getStore(): Promise<Store> {
  cached ??= createStore();
  return cached;
}