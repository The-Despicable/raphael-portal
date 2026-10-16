"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LogOut, Pencil, Send, Flag, RefreshCw, Users } from "lucide-react";
import { ACCENTS, type Accent } from "@/lib/validation";
import type { ChatMessagePublic } from "@/lib/types";
import { Avatar } from "@/components/community/Avatar";

interface Identity {
  nickname: string;
  accent: string;
  pseudonymous: true;
}

const POLL_MS = 4000;

/**
 * Live public guest chat.
 *
 * NO LOGIN. Identity is a server-issued random session in an HttpOnly cookie.
 *
 * TRANSPORT — documented fallback
 * -------------------------------
 * With DATABASE_URL configured, production deployments should attach a managed
 * realtime channel (Supabase Realtime or equivalent) to POST /api/chat/messages.
 * This build does NOT have such credentials wired, so it falls back to short
 * polling against GET /api/chat/messages. Polling is honest — it says so in the
 * connection indicator rather than animating a "live" pulse it cannot justify.
 *
 * RENDERING SAFETY
 * ----------------
 * Message bodies are rendered as React text nodes. There is no
 * dangerouslySetInnerHTML anywhere in this component, no HTML parsing, and no
 * tool invocation path. A message cannot execute.
 */
export function ChatRoom() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [messages, setMessages] = useState<ChatMessagePublic[]>([]);
  const [draft, setDraft] = useState("");
  const [connection, setConnection] = useState<"loading" | "polling" | "offline">("loading");
  const [durable, setDurable] = useState<boolean | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const lastId = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/messages?limit=50", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(data.messages ?? []);
      setDurable(Boolean(data.durable));
      setConnection("polling");
      setError(null);
    } catch {
      setConnection("offline");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Both initial reads live in one async IIFE whose first statement awaits.
    // No state is written synchronously from the effect body, so React does not
    // schedule a cascading render before paint.
    (async () => {
      const [sessionRes, historyRes] = await Promise.all([
        fetch("/api/chat/session", { cache: "no-store" }).catch(() => null),
        fetch("/api/chat/messages?limit=50", { cache: "no-store" }).catch(() => null),
      ]);
      if (cancelled) return;

      if (sessionRes?.ok) {
        const data = await sessionRes.json();
        if (!cancelled && data.identity) setIdentity(data.identity);
      }

      if (historyRes?.ok) {
        const data = await historyRes.json();
        if (cancelled) return;
        setMessages(data.messages ?? []);
        setDurable(Boolean(data.durable));
        setConnection("polling");
        setError(null);
      } else {
        setConnection("offline");
      }
    })();

    const timer = setInterval(() => {
      void load();
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [load]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function join(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const nickname = String(data.get("nickname") ?? "");
    const accent = String(data.get("accent") ?? "cyan") as Accent;

    setError(null);
    setStatus("Joining…");

    try {
      const res = await fetch("/api/chat/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, accent }),
      });
      const payload = await res.json();

      if (!res.ok) {
        setError(
          payload?.fields?.nickname ??
            payload?.error ??
            "Could not join. Please check your nickname.",
        );
        setStatus(null);
        return;
      }

      setIdentity(payload.identity);
      setStatus(null);
      setRenaming(false);
    } catch {
      setError("Could not reach the server. Nothing was submitted.");
      setStatus(null);
    }
  }

  async function rename(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const nickname = String(data.get("nickname") ?? identity?.nickname ?? "");
    const accent = String(data.get("accent") ?? identity?.accent ?? "cyan") as Accent;

    try {
      const res = await fetch("/api/chat/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, accent }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload?.fields?.nickname ?? payload?.error ?? "Could not change name.");
        return;
      }
      setIdentity(payload.identity);
      setRenaming(false);
      setError(null);
    } catch {
      setError("Could not reach the server.");
    }
  }

  async function leave() {
    await fetch("/api/chat/session", { method: "DELETE" }).catch(() => null);
    setIdentity(null);
    setRenaming(false);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;

    setDraft("");
    setError(null);

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const payload = await res.json();

      if (!res.ok) {
        setError(payload?.error ?? "Message not sent.");
        if (res.status === 429) {
          // Restore the draft so the visitor does not lose what they typed.
          setDraft(body);
        }
        return;
      }

      setMessages((m) => [...m, payload.message]);
      lastId.current = payload.message.id;
    } catch {
      setDraft(body);
      setError("Could not reach the server. Your message was not sent.");
    }
  }

  async function report(message: ChatMessagePublic) {
    const reason = window.prompt("Why are you reporting this message?");
    if (!reason) return;
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetKind: "MESSAGE", targetId: message.id, reason }),
      });
      setStatus(res.ok ? "Report recorded. Thank you." : "Report could not be recorded.");
    } catch {
      setStatus("Report could not be recorded.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      {/* ---------------- room ---------------- */}
      <div className="surface flex min-h-[520px] flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-[13.5px] font-medium text-ink">
              <Users size={14} aria-hidden className="text-ink-dim" />
              Public room
            </span>
            <ConnectionBadge state={connection} />
          </div>

          {identity ? (
            <div className="flex items-center gap-2">
              <Avatar accent={identity.accent} name={identity.nickname} size="sm" />
              <span className="text-[13px] text-ink-muted">{identity.nickname}</span>
              <button
                type="button"
                onClick={() => setRenaming((v) => !v)}
                className="rounded p-1.5 text-ink-dim transition-colors hover:text-ink"
                title="Change display name"
              >
                <Pencil size={13} aria-hidden />
                <span className="sr-only">Change display name</span>
              </button>
              <button
                type="button"
                onClick={leave}
                className="rounded p-1.5 text-ink-dim transition-colors hover:text-blocked"
                title="Leave the room"
              >
                <LogOut size={13} aria-hidden />
                <span className="sr-only">Leave the room</span>
              </button>
            </div>
          ) : null}
        </div>

        {renaming && identity ? (
          <form onSubmit={rename} className="flex flex-wrap items-end gap-3 border-b border-hairline bg-abyss/40 px-5 py-4">
            <div className="flex-1">
              <label htmlFor="rename-nickname" className="mb-1 block text-[11.5px] text-ink-dim">
                New display name
              </label>
              <input
                id="rename-nickname"
                name="nickname"
                defaultValue={identity.nickname}
                maxLength={24}
                required
                className="w-full rounded-md border border-hairline bg-abyss px-3 py-2 text-[13px] text-ink focus:border-cyan/50 focus:outline-none"
              />
            </div>
            <div className="w-32">
              <label htmlFor="rename-accent" className="mb-1 block text-[11.5px] text-ink-dim">
                Avatar colour
              </label>
              <select
                id="rename-accent"
                name="accent"
                defaultValue={identity.accent}
                className="w-full rounded-md border border-hairline bg-abyss px-2.5 py-2 text-[13px] text-ink focus:border-cyan/50 focus:outline-none"
              >
                {ACCENTS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="btn-glow rounded-md border border-cyan/40 bg-cyan/10 px-3.5 py-2 text-[13px] font-medium text-cyan"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setRenaming(false)}
              className="rounded-md border border-hairline px-3 py-2 text-[13px] text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
          </form>
        ) : null}

        {/* transcript */}
        <div
          ref={listRef}
          className="scroll-thin flex-1 space-y-3 overflow-y-auto px-5 py-4"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Public chat transcript"
        >
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-12 text-center">
              <p className="text-[14px] font-medium text-ink">No messages yet.</p>
              <p className="max-w-sm text-[13px] leading-relaxed text-ink-muted">
                This room is empty. Be the first to ask about the architecture, check a citation, or
                point out something on this site that is wrong.
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <article key={m.id} className="group flex items-start gap-3">
                <Avatar accent={m.accent} name={m.nickname} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2.5">
                    <span className="text-[12.5px] font-medium text-ink">{m.nickname}</span>
                    <time
                      dateTime={m.createdAt}
                      className="font-mono text-[10.5px] text-ink-faint"
                    >
                      {new Date(m.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-ink-muted">
                    {m.body}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => report(m)}
                  className="mt-0.5 shrink-0 rounded p-1 text-ink-faint opacity-0 transition-opacity hover:text-blocked focus-visible:opacity-100 group-hover:opacity-100"
                  title="Report this message"
                >
                  <Flag size={12} aria-hidden />
                  <span className="sr-only">Report message from {m.nickname}</span>
                </button>
              </article>
            ))
          )}
        </div>

        {/* composer */}
        <div className="border-t border-hairline px-5 py-3.5">
          {identity ? (
            <form onSubmit={send} className="flex items-end gap-2.5">
              <div className="flex-1">
                <label htmlFor="chat-input" className="sr-only">
                  Write a message
                </label>
                <textarea
                  id="chat-input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, 800))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                  rows={2}
                  maxLength={800}
                  placeholder="Share a citation, ask a question, or flag an error…"
                  className="w-full resize-none rounded-md border border-hairline bg-abyss px-3 py-2.5 text-[13.5px] text-ink placeholder:text-ink-faint focus:border-cyan/50 focus:outline-none"
                />
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="btn-glow flex items-center gap-1.5 rounded-md border border-cyan/40 bg-cyan/10 px-3.5 py-2.5 text-[13px] font-medium text-cyan disabled:opacity-40"
                >
                  <Send size={13} aria-hidden />
                  Send
                </button>
                <span className="font-mono text-[10.5px] text-ink-faint">
                  {draft.length}/800
                </span>
              </div>
            </form>
          ) : (
            <p className="py-2 text-center text-[13px] text-ink-dim">
              Choose a nickname above to join. No email, password or account required.
            </p>
          )}

          <div aria-live="polite" className="mt-2">
            {error ? <p className="text-[12.5px] text-blocked">{error}</p> : null}
            {status ? <p className="text-[12.5px] text-ink-dim">{status}</p> : null}
          </div>

          {durable === false ? (
            <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-conditional/90">
              <RefreshCw size={11} aria-hidden className="mt-0.5 shrink-0" />
              Running on the non-durable in-memory store: messages are lost on restart and are not
              shared between instances. Configure <span className="font-mono">DATABASE_URL</span> for
              real persistence.
            </p>
          ) : null}
        </div>
      </div>

      {/* ---------------- side panel ---------------- */}
      <aside className="flex flex-col gap-4">
        {identity ? (
          <div className="surface p-5">
            <h3 className="text-[13px] font-semibold text-ink">Your guest identity</h3>
            <div className="mt-3 flex items-center gap-2.5">
              <Avatar accent={identity.accent} name={identity.nickname} />
              <span className="text-[14px] font-medium text-ink">{identity.nickname}</span>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-ink-muted">
              This is a <span className="text-ink">pseudonym</span>, not a verified identity. It is not
              reserved globally — another visitor may use the same name from another device or after
              clearing their browser.
            </p>
            <p className="mt-2.5 text-[11.5px] leading-relaxed text-ink-faint">
              No email or password was collected. Clearing your browser data, or switching devices,
              resets the session. Nothing links this nickname to a real person.
            </p>
          </div>
        ) : (
          <JoinPanel busy={status === "Joining…"} onSubmit={join} />
        )}

        <div className="surface p-5">
          <h3 className="text-[13px] font-semibold text-ink">Room rules</h3>
          <ul className="mt-3 space-y-2">
            <Rule>Cite papers and source documents when making technical claims.</Rule>
            <Rule>Distinguish evidence from speculation.</Rule>
            <Rule>Do not share credentials or sensitive target data.</Rule>
            <Rule>No requests for scanning, exploitation, or system access.</Rule>
          </ul>
          <a
            href="#conduct"
            className="mt-4 inline-block text-[12.5px] text-cyan transition-opacity hover:opacity-80"
          >
            Full code of conduct →
          </a>
        </div>

        <div className="surface p-5">
          <h3 className="text-[13px] font-semibold text-ink">Data and privacy</h3>
          <p className="mt-2.5 text-[11.5px] leading-relaxed text-ink-faint">
            Only the nickname, message text and a timestamp are stored, plus a keyed hash of your
            session for rate limiting. No IP address is stored or shown. Session tokens are never
            exposed to the browser. Reports are never published.
          </p>
        </div>
      </aside>
    </div>
  );
}

export function JoinPanel({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const [accent, setAccent] = useState<Accent>("cyan");

  return (
    <form onSubmit={onSubmit} className="surface flex flex-col gap-4 p-5">
      <div>
        <h3 className="text-[13px] font-semibold text-ink">Join the room</h3>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-dim">
          Choose a nickname. No email, password, OAuth or registration.
        </p>
      </div>

      <div>
        <label htmlFor="join-nickname" className="mb-1.5 block text-[11.5px] text-ink-dim">
          Username
        </label>
        <input
          id="join-nickname"
          name="nickname"
          required
          minLength={2}
          maxLength={24}
          placeholder="e.g. evaluator"
          className="w-full rounded-md border border-hairline bg-abyss px-3 py-2.5 text-[13.5px] text-ink placeholder:text-ink-faint focus:border-cyan/50 focus:outline-none"
        />
        <p className="mt-1.5 text-[11px] text-ink-faint">
          2–24 characters. Letters, numbers, spaces, dots, hyphens, underscores.
        </p>
      </div>

      <fieldset>
        <legend className="mb-2 text-[11.5px] text-ink-dim">Avatar colour</legend>
        <div className="flex flex-wrap gap-2">
          {ACCENTS.map((a) => (
            <label key={a} className="cursor-pointer">
              <input
                type="radio"
                name="accent"
                value={a}
                checked={accent === a}
                onChange={() => setAccent(a)}
                className="sr-only"
              />
              <span
                className={`block size-7 rounded-full border-2 transition-transform ${
                  accent === a ? "scale-110 border-ink" : "border-transparent"
                }`}
                style={{ background: ACCENT_HEX[a] }}
              >
                <span className="sr-only">{a}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-start gap-2.5 text-[11.5px] leading-relaxed text-ink-muted">
        <input
          type="checkbox"
          required
          className="mt-0.5 size-3.5 shrink-0 accent-[color:var(--color-cyan)]"
        />
        <span>
          I have read the code of conduct, and I understand my nickname is a pseudonym rather than a
          verified identity.
        </span>
      </label>

      <button
        type="submit"
        disabled={busy}
        className="btn-glow rounded-md border border-cyan/40 bg-cyan/10 px-4 py-2.5 text-[13.5px] font-medium text-cyan disabled:opacity-50"
      >
        {busy ? "Joining…" : "Join the chat"}
      </button>
    </form>
  );
}

export const ACCENT_HEX: Record<string, string> = {
  cyan: "#22d3ee",
  violet: "#a78bfa",
  azure: "#60a5fa",
  emerald: "#34d399",
  amber: "#fbbf24",
  rose: "#fb7185",
};

function ConnectionBadge({ state }: { state: "loading" | "polling" | "offline" }) {
  if (state === "offline") {
    return (
      <span className="status-pill border-blocked/35 bg-blocked/10 text-blocked">
        <span aria-hidden className="size-1.5 rounded-full bg-current" />
        Reconnecting
      </span>
    );
  }
  if (state === "loading") {
    return <span className="status-pill border-hairline-strong bg-elevated text-ink-dim">Connecting</span>;
  }
  // Deliberately static: a pulse here would imply a push transport we do not have.
  return (
    <span className="status-pill border-cyan/30 bg-cyan/[0.07] text-cyan" title="Updated by short polling (no realtime transport configured)">
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      Updating
    </span>
  );
}

function Rule({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-[11.5px] leading-relaxed text-ink-muted">
      <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-ink-faint" />
      <span>{children}</span>
    </li>
  );
}