/**
 * Server-only environment access.
 *
 * SECURITY RULES ENFORCED HERE
 * -----------------------------
 * 1. Nothing in this module may be imported from a Client Component. It reads
 *    process.env directly and is only ever reached from Route Handlers,
 *    Server Components and Server Actions.
 * 2. Every secret is read here and nowhere else. There is deliberately no
 *    `NEXT_PUBLIC_*` secret anywhere in this project.
 * 3. A missing secret is reported as "not configured" and surfaced to the UI as
 *    a configuration-required state. It is NEVER invented, defaulted to a real
 *    value, or guessed.
 * 4. Error messages returned to clients are built from `configured` booleans and
 *    public config names only — never from the underlying value.
 */

const isServer = typeof window === "undefined";
if (!isServer) {
  throw new Error(
    "src/lib/env.ts is server-only and must not be imported by a Client Component.",
  );
}

function read(name: string): string | null {
  const raw = process.env[name];
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readFlag(name: string): boolean {
  const v = read(name);
  return v === "1" || v?.toLowerCase() === "true";
}

export const env = {
  /** True when running a production build. */
  isProduction: process.env.NODE_ENV === "production",

  /**
   * Public base URL. Used only for absolute metadata URLs. Not a secret.
   */
  siteUrl: read("NEXT_PUBLIC_SITE_URL"),

  /* ---------------------------------------------------------------------- */
  /* Storage                                                                 */
  /* ---------------------------------------------------------------------- */

  /**
   * Postgres connection string for Supabase or any managed PostgreSQL.
   * NEVER exposed to the browser. When absent the app falls back to the
   * in-process store, which is explicitly documented as non-durable.
   */
  databaseUrl: read("DATABASE_URL"),

  /**
   * Optional pooled/serverless connection string. Preferred on Vercel where a
   * long-lived socket would be exhausted by serverless invocations.
   */
  databasePooledUrl: read("DATABASE_POOL_URL"),

  /* ---------------------------------------------------------------------- */
  /* Guest sessions                                                          */
  /* ---------------------------------------------------------------------- */

  /**
   * HMAC key for guest session tokens. When absent a per-boot random key is
   * generated, which INVALIDATES all guest sessions on restart. That is the
   * safe failure mode: sessions die rather than becoming forgeable.
   */
  guestSessionSecret: read("GUEST_SESSION_SECRET"),

  /** Cookie name. Renaming this logs every visitor out. */
  guestCookieName: read("GUEST_COOKIE_NAME") ?? "rph_guest",

  /** Set to "false" only for plain-HTTP local development. */
  guestCookieSecure: readFlag("GUEST_COOKIE_SECURE") || process.env.NODE_ENV === "production",

  /* ---------------------------------------------------------------------- */
  /* Model provider (server-side only)                                      */
  /* ---------------------------------------------------------------------- */

  modelApiKey: read("MODEL_API_KEY"),
  modelBaseUrl: read("MODEL_BASE_URL"),
  modelName: read("MODEL_NAME"),

  /**
   * Completion budget. Reasoning models can spend the ENTIRE default budget on
   * internal deliberation and return `content: null`, which would look exactly
   * like "the model failed" to a naive parser. Always set this explicitly.
   */
  modelMaxTokens: Number(read("MODEL_MAX_TOKENS") ?? 1024),

  /**
   * Ask reasoning models to answer directly instead of emitting a deliberation
   * trace. Measured: ~0.4s and a clean `content` string, versus 16 reasoning
   * tokens and a null `content` when left on.
   */
  modelDisableThinking: read("MODEL_DISABLE_THINKING") !== "false",

  /**
   * Per-rule rate-limit override, e.g. RATE_LIMIT_ASSISTANT=0 disables it.
   * Returns null when unset or unparseable, so a typo falls back to the safe
   * built-in default rather than disabling a protection by accident.
   */
  rateLimitOverride(rule: string): number | null {
    const key = `RATE_LIMIT_${rule.toUpperCase()}`;
    const raw = read(key);
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : null;
  },

  /**
   * Administrator credential for the moderation endpoints. When absent the
   * moderation API refuses every request and says so, rather than falling back
   * to a default credential or an unauthenticated path.
   */
  moderationKey: read("MODERATION_KEY"),

  /* ---------------------------------------------------------------------- */
  /* Derived capability flags                                                */
  /* ---------------------------------------------------------------------- */

  get storageConfigured(): boolean {
    return Boolean(this.databaseUrl || this.databasePooledUrl);
  },

  get generativeAiConfigured(): boolean {
    return Boolean(this.modelApiKey && this.modelBaseUrl && this.modelName);
  },

  get moderationConfigured(): boolean {
    return Boolean(this.moderationKey);
  },

  /**
   * Public-safe description of what is and is not configured. Safe to return
   * from an API route because it contains no values — only names and booleans.
   */
  describeCapabilities(): {
    storage: "postgres" | "memory";
    generativeAi: boolean;
    moderation: boolean;
    requiredForFullFunctionality: string[];
  } {
    const required: string[] = [];
    if (!this.storageConfigured) required.push("DATABASE_URL");
    if (!this.generativeAiConfigured)
      required.push("MODEL_API_KEY", "MODEL_BASE_URL", "MODEL_NAME");
    if (!this.moderationConfigured) required.push("MODERATION_KEY");
    return {
      storage: this.storageConfigured ? "postgres" : "memory",
      generativeAi: this.generativeAiConfigured,
      moderation: this.moderationConfigured,
      requiredForFullFunctionality: required,
    };
  },
} as const;