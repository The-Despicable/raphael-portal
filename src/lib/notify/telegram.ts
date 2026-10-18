import { env } from "@/lib/env";

/**
 * Outbound Telegram delivery for paper suggestions.
 *
 * Server-only: it imports `@/lib/env`, which throws if it is ever reached from a
 * Client Component, so the bot token cannot leak into a browser bundle.
 *
 * DESIGN RULES
 * ------------
 * 1. This never throws. A notification failure must not turn a valid submission
 *    into a 500, and it must not be reported as success either.
 * 2. The result is a discriminated status, not a boolean, so the caller can tell
 *    "we were never configured" apart from "we tried and Telegram refused".
 * 3. The message is sent as PLAIN TEXT (no `parse_mode`). A submission is
 *    untrusted input; markup parsing would let it format the message arbitrarily.
 * 4. The token appears only in the request URL. It is never logged, never
 *    returned, and never included in an error message.
 */

export type NotifyOutcome =
  | { delivered: true }
  | { delivered: false; reason: "not_configured" | "delivery_failed" };

/** Telegram rejects messages longer than 4096 characters. */
const MAX_MESSAGE_CHARS = 4096;
const REQUEST_TIMEOUT_MS = 8000;

export interface SuggestionNotice {
  title: string;
  identifier: string;
  relevance: string;
  component: string;
  rationale: string;
}

function clip(value: string, max: number): string {
  const t = value.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

/** Turn an enum-ish value into readable prose without inventing anything. */
function humanise(value: string): string {
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function renderSuggestion(s: SuggestionNotice): string {
  // Plain text only. No markdown, no parse_mode, no links.
  const body = [
    "New paper suggestion — awaiting review",
    "",
    `Title: ${clip(s.title, 300)}`,
    `Identifier: ${clip(s.identifier, 200)}`,
    `Relevance area: ${humanise(clip(s.component, 120))}`,
    "",
    "Rationale:",
    clip(s.rationale, 1600),
    "",
    `Received: ${new Date().toISOString()}`,
    "",
    "Sent by the Raphael Portal suggest-a-paper form.",
    "Nothing here is published automatically; it becomes a cited entry only after",
    "being checked against the original publication.",
  ].join("\n");

  return clip(body, MAX_MESSAGE_CHARS);
}

export function notifyConfigured(): boolean {
  return env.notifyConfigured;
}

/**
 * Deliver a suggestion to the configured Telegram chat.
 *
 * Never throws. Returns `not_configured` when the token or chat id is absent,
 * and `delivery_failed` when Telegram rejected it or the network failed.
 */
export async function deliverSuggestion(s: SuggestionNotice): Promise<NotifyOutcome> {
  const token = env.telegramBotToken;
  const chatId = env.telegramChatId;

  if (!token || !chatId) return { delivered: false, reason: "not_configured" };

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: renderSuggestion(s),
        // Explicitly NOT setting parse_mode: the body is untrusted text.
        disable_web_page_preview: true,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) {
      // Status code only. The response body can echo the request, which contains
      // the bot token in its URL, so it is never read or logged here.
      console.error(`[notify] telegram sendMessage rejected with status ${res.status}`);
      return { delivered: false, reason: "delivery_failed" };
    }

    return { delivered: true };
  } catch (error) {
    // Name only — an SDK/network error message can embed the request URL.
    console.error(
      `[notify] telegram delivery failed: ${error instanceof Error ? error.name : "unknown"}`,
    );
    return { delivered: false, reason: "delivery_failed" };
  }
}