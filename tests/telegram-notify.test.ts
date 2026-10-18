import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * TELEGRAM DELIVERY FOR PAPER SUGGESTIONS
 *
 * What these guard:
 *   - an unconfigured deployment makes NO network call and says so honestly;
 *   - a configured deployment posts to the Bot API with the right chat id, as
 *     PLAIN TEXT (no parse_mode — submissions are untrusted input);
 *   - the bot token never appears in the message body, in a returned value, or
 *     in anything a caller could surface;
 *   - a Telegram rejection or a network failure degrades to `delivery_failed`
 *     and NEVER throws — a notification problem must not become a 500;
 *   - oversize input is clipped to Telegram's 4096-character limit.
 *
 * No real token is used and no request leaves the process: `fetch` is stubbed.
 */

const mutableEnv = process.env as unknown as Record<string, string | undefined>;

const ORIGINAL = {
  NODE_ENV: process.env.NODE_ENV,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
};

const SAMPLE = {
  title: "A verification principle for blind detectors",
  identifier: "arXiv:2601.00001",
  relevance: "Directly questions whether a verifier can see its own failure mode.",
  component: "EVIDENCE_PROVENANCE",
  rationale: "Relevant because it generalises the measurement-contract problem.",
};

/** Load a fresh copy of the notify module with the given Telegram config. */
async function load(opts: { token?: string; chatId?: string } = {}) {
  vi.resetModules();
  delete mutableEnv.TELEGRAM_BOT_TOKEN;
  delete mutableEnv.TELEGRAM_CHAT_ID;
  if (opts.token !== undefined) mutableEnv.TELEGRAM_BOT_TOKEN = opts.token;
  if (opts.chatId !== undefined) mutableEnv.TELEGRAM_CHAT_ID = opts.chatId;
  return import("@/lib/notify/telegram");
}

interface Captured {
  url: string;
  body: Record<string, unknown>;
  headers: Record<string, string>;
}

function stubFetch(impl: (url: string, init: RequestInit) => Promise<Response> | Response) {
  const captured: Captured[] = [];
  const spy = vi.fn(async (url: unknown, init?: RequestInit) => {
    const headers = (init?.headers ?? {}) as Record<string, string>;
    let body: Record<string, unknown> = {};
    try {
      body = JSON.parse(String(init?.body ?? "{}"));
    } catch {
      /* leave empty */
    }
    captured.push({ url: String(url), body, headers });
    return impl(String(url), init as RequestInit);
  });
  vi.stubGlobal("fetch", spy);
  return { spy, captured };
}

const okResponse = () => new Response(JSON.stringify({ ok: true }), { status: 200 });

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  mutableEnv.NODE_ENV = ORIGINAL.NODE_ENV;
  for (const k of ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"] as const) {
    if (ORIGINAL[k] === undefined) delete mutableEnv[k];
    else mutableEnv[k] = ORIGINAL[k];
  }
});

describe("telegram notify: unconfigured", () => {
  it("makes no network call and reports not_configured", async () => {
    const { spy } = stubFetch(okResponse);
    const mod = await load({});
    expect(mod.notifyConfigured()).toBe(false);
    const res = await mod.deliverSuggestion(SAMPLE);
    expect(res).toEqual({ delivered: false, reason: "not_configured" });
    expect(spy).not.toHaveBeenCalled();
  });

  it("treats a half-configured pair (token only) as unconfigured", async () => {
    const { spy } = stubFetch(okResponse);
    const mod = await load({ token: "123:FAKE" });
    expect(mod.notifyConfigured()).toBe(false);
    expect((await mod.deliverSuggestion(SAMPLE)).delivered).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it("treats a half-configured pair (chat only) as unconfigured", async () => {
    const { spy } = stubFetch(okResponse);
    const mod = await load({ chatId: "555" });
    expect(mod.notifyConfigured()).toBe(false);
    expect((await mod.deliverSuggestion(SAMPLE)).delivered).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("telegram notify: configured", () => {
  it("posts to the Bot API with the configured chat id", async () => {
    const { captured } = stubFetch(okResponse);
    const mod = await load({ token: "123:FAKE", chatId: "-100999" });
    expect(mod.notifyConfigured()).toBe(true);

    const res = await mod.deliverSuggestion(SAMPLE);
    expect(res).toEqual({ delivered: true });
    expect(captured).toHaveLength(1);
    expect(captured[0].url).toBe("https://api.telegram.org/bot123:FAKE/sendMessage");
    expect(captured[0].body.chat_id).toBe("-100999");
    expect(String(captured[0].body.text)).toContain(SAMPLE.title);
  });

  it("sends PLAIN TEXT — no parse_mode is ever set", async () => {
    const { captured } = stubFetch(okResponse);
    const mod = await load({ token: "123:FAKE", chatId: "1" });
    await mod.deliverSuggestion(SAMPLE);
    expect(captured[0].body).not.toHaveProperty("parse_mode");
  });

  it("never puts the bot token in the message body", async () => {
    const { captured } = stubFetch(okResponse);
    const mod = await load({ token: "123:SECRETVALUE", chatId: "1" });
    await mod.deliverSuggestion(SAMPLE);
    expect(String(captured[0].body.text)).not.toContain("SECRETVALUE");
    expect(JSON.stringify(captured[0].body)).not.toContain("SECRETVALUE");
  });

  it("clips oversize input to Telegram's 4096-character limit", async () => {
    const { captured } = stubFetch(okResponse);
    const mod = await load({ token: "123:FAKE", chatId: "1" });
    await mod.deliverSuggestion({ ...SAMPLE, rationale: "x".repeat(20_000) });
    expect(String(captured[0].body.text).length).toBeLessThanOrEqual(4096);
  });

  it("renders an enum-ish component as readable prose, inventing nothing", async () => {
    const mod = await load({});
    const text = mod.renderSuggestion({ ...SAMPLE, component: "EVIDENCE_PROVENANCE" });
    expect(text).toContain("Evidence Provenance");
  });
});

describe("telegram notify: failure modes never throw", () => {
  it("a non-2xx response degrades to delivery_failed", async () => {
    stubFetch(() => new Response("Bad Request", { status: 400 }));
    const mod = await load({ token: "123:FAKE", chatId: "1" });
    await expect(mod.deliverSuggestion(SAMPLE)).resolves.toEqual({
      delivered: false, reason: "delivery_failed",
    });
  });

  it("a network throw degrades to delivery_failed", async () => {
    stubFetch(() => { throw new Error("ECONNREFUSED"); });
    const mod = await load({ token: "123:FAKE", chatId: "1" });
    await expect(mod.deliverSuggestion(SAMPLE)).resolves.toEqual({
      delivered: false, reason: "delivery_failed",
    });
  });

  it("the returned outcome carries no token on the failure path either", async () => {
    stubFetch(() => new Response("nope", { status: 500 }));
    const mod = await load({ token: "123:SECRETVALUE", chatId: "1" });
    const res = await mod.deliverSuggestion(SAMPLE);
    expect(JSON.stringify(res)).not.toContain("SECRETVALUE");
  });
});

describe("suggestions route: delivery is independent of storage", () => {
  const route = readFileSync(
    new URL("../src/app/api/suggestions/route.ts", import.meta.url), "utf8",
  );

  it("calls deliverSuggestion", () => {
    expect(route).toMatch(/deliverSuggestion/);
  });

  it("does NOT return early on storage failure before notifying", () => {
    // The bug this prevents: `if (!resolved.ok) return resolved.response;` before
    // the notification, which on a database-less deployment would make the form
    // permanently unable to deliver anything.
    expect(route).not.toMatch(/if\s*\(!resolved\.ok\)\s*return\s+resolved\.response;\s*\n\s*const/);
  });

  it("reports what actually happened rather than a fixed success string", () => {
    expect(route).toMatch(/recorded/);
    expect(route).toMatch(/notified/);
  });

  it("never exposes the token or chat id in the response", () => {
    expect(route).not.toMatch(/telegramBotToken|telegramChatId|TELEGRAM_BOT_TOKEN/);
  });
});

describe("env contract", () => {
  const envSrc = readFileSync(new URL("../src/lib/env.ts", import.meta.url), "utf8");

  it("reads the Telegram values in the server-only module", () => {
    expect(envSrc).toMatch(/read\("TELEGRAM_BOT_TOKEN"\)/);
    expect(envSrc).toMatch(/read\("TELEGRAM_CHAT_ID"\)/);
  });

  it("keeps notification out of the public health capability object", async () => {
    // describeCapabilities() is returned verbatim by the public /api/health
    // route, so notification configuration must not appear in it at all.
    vi.resetModules();
    delete mutableEnv.TELEGRAM_BOT_TOKEN;
    delete mutableEnv.TELEGRAM_CHAT_ID;
    const { env } = await import("@/lib/env");
    const caps = env.describeCapabilities();

    expect(Object.keys(caps).sort()).toEqual([
      "generativeAi", "moderation", "requiredForFullFunctionality", "storage",
    ]);
    expect(JSON.stringify(caps)).not.toMatch(/telegram/i);
    expect(caps.requiredForFullFunctionality).not.toContain("TELEGRAM_BOT_TOKEN");
    expect(caps.requiredForFullFunctionality).not.toContain("TELEGRAM_CHAT_ID");
  });

  it("no Telegram value is ever prefixed NEXT_PUBLIC_", () => {
    expect(envSrc).not.toMatch(/NEXT_PUBLIC_TELEGRAM/);
  });
});