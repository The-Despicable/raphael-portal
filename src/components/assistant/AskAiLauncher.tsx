"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import type { AssistantAnswer, Citation } from "@/lib/types";

/**
 * Global AI research assistant launcher.
 *
 * SEPARATION FROM THE COMMUNITY CHAT — deliberate and load-bearing
 * ------------------------------------------------------------------
 * This panel answers questions about Raphael's published material. It is not a
 * chat room, it is not connected to the community chat, it never receives a
 * community message, and it has no tools. A visitor cannot use it to operate
 * Raphael, run a scan, or reach a target.
 *
 * The header states this distinction permanently rather than making the reader
 * infer it, because conflating the two is the single most likely way this site
 * could mislead someone.
 *
 * Attribution guarantee: citations come from server-side retrieval and are
 * rendered regardless of what the model says. A hallucinated source cannot be
 * displayed.
 */

interface Turn {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations?: Citation[];
  mode?: AssistantAnswer["mode"];
  notice?: string | null;
  error?: boolean;
}

const STARTERS = [
  "What is the canonical execution chain?",
  "Why is the project NOT_READY?",
  "What does AUTH-000 block?",
  "Is exec/ really the only entry point?",
  "What is the verification principle?",
  "Is Dream-RSI actually related to Raphael?",
];

export function AskAiLauncher() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [capabilities, setCapabilities] = useState<{
    generativeAi: boolean;
    storage: string;
  } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    fetch("/api/assistant")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.capabilities && setCapabilities(d.capabilities))
      .catch(() => setCapabilities(null));
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    // Only the newest turn is announced, so a screen reader is not forced to
    // re-read the whole transcript on every arrival.
    if (turns.length > 0)
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [turns]);

  const ask = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed || busy) return;

      const userTurn: Turn = {
        id: `u${Date.now()}`,
        role: "user",
        text: trimmed,
      };
      setTurns((t) => [...t, userTurn]);
      setQuestion("");
      setBusy(true);

      // Send the conversation so far. Without this, a follow-up like "tell me in
      // more detail" has no referent and the assistant cannot tell what it means.
      const historyForRequest = [...turns, userTurn]
        .filter((t) => !t.error)
        .map((t) => ({ role: t.role, text: t.text }))
        .slice(-12);

      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: trimmed,
            history: historyForRequest,
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          // The server already returns a specific per-field reason (e.g. "Question
          // must be at least 3 characters."). Prefer it over the generic envelope
          // message, which promises highlighted fields that a chat turn has no way
          // to show — so the user was told to look for something that does not exist.
          const detail =
            data?.fields && typeof data.fields === "object"
              ? Object.values<string>(
                  data.fields as Record<string, string>,
                ).filter(Boolean)[0]
              : null;
          setTurns((t) => [
            ...t,
            {
              id: `a${Date.now()}`,
              role: "assistant",
              text:
                detail ??
                data?.error ??
                "Something went wrong. Please try again.",
              error: true,
            },
          ]);
          return;
        }

        setTurns((t) => [
          ...t,
          {
            id: `a${Date.now()}`,
            role: "assistant",
            text: data.text,
            citations: data.citations,
            mode: data.mode,
            notice: data.notice,
          },
        ]);
      } catch {
        setTurns((t) => [
          ...t,
          {
            id: `a${Date.now()}`,
            role: "assistant",
            text: "Could not reach the assistant. It is still local and cannot fabricate an answer, so nothing is shown.",
            error: true,
          },
        ]);
      } finally {
        setBusy(false);
      }
    },
    // `turns` MUST be a dependency. The request body is built from the
    // conversation so far so that follow-ups ("tell me in more detail") can be
    // resolved. Leaving it out captures a stale `turns`, which silently drops
    // the prior turns from the history the server receives — the exact
    // regression the follow-up support exists to fix.
    [busy, turns],
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="ask-ai-panel"
        className="btn-glow group fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full border border-cyan/40 bg-elevated/90 px-3.5 py-3 text-[13.5px] font-medium text-ink shadow-lg backdrop-blur-xl"
      >
        <span
          aria-hidden
          className={`size-1.5 shrink-0 rounded-full bg-cyan ${reduced ? "" : "animate-[pulse-live_2.4s_ease-in-out_infinite]"}`}
        />
        {/* The label collapses so the launcher occupies a small footprint and
            cannot sit on top of an interactive control in the page beneath it.
            It expands on hover AND on keyboard focus, so the accessible name is
            never hidden from a keyboard user. */}
        <span
          className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
            open
              ? "max-w-[10rem] opacity-100"
              : "max-w-0 opacity-0 group-hover:max-w-[10rem] group-hover:opacity-100 group-focus-visible:max-w-[10rem] group-focus-visible:opacity-100"
          }`}
        >
          {open ? "Close assistant" : "Ask Raphael AI"}
        </span>
        <span className="sr-only">
          {open ? "Close assistant" : "Ask Raphael AI"}
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.aside
            id="ask-ai-panel"
            role="dialog"
            aria-label="Raphael AI research assistant"
            initial={reduced ? false : { opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-3 bottom-20 z-[59] flex max-h-[min(70vh,620px)] flex-col overflow-hidden rounded-xl border border-hairline-strong bg-elevated shadow-2xl sm:inset-x-auto sm:right-5 sm:w-[420px]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-4">
              <div>
                <h2 className="text-[14px] font-semibold text-ink">
                  Raphael AI
                </h2>
                <p className="mt-0.5 text-[11.5px] leading-snug text-ink-dim">
                  Research assistant over project documents.{" "}
                  <span className="text-cyan">
                    Not connected to the community chat.
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                className="rounded p-1 text-ink-dim transition-colors hover:text-ink"
              >
                <span className="sr-only">Close assistant</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M3.5 3.5l9 9M12.5 3.5l-9 9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </button>
            </div>

            <div
              ref={listRef}
              className="scroll-thin flex-1 space-y-4 overflow-y-auto px-5 py-4"
              aria-live="polite"
              aria-relevant="additions"
            >
              {turns.length === 0 ? (
                <div className="space-y-4">
                  <p className="text-[13px] leading-relaxed text-ink-muted">
                    Ask about the architecture, the blockers, or the research
                    provenance. Every answer cites a named document, and
                    anything the records do not establish is reported as not
                    established.
                  </p>
                  <ul className="space-y-1.5">
                    {STARTERS.map((s) => (
                      <li key={s}>
                        <button
                          type="button"
                          onClick={() => ask(s)}
                          className="w-full rounded-md border border-hairline px-3 py-2 text-left text-[12.5px] text-ink-muted transition-colors hover:border-hairline-strong hover:text-ink"
                        >
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                  {capabilities ? (
                    <p className="rounded-md border border-hairline bg-abyss/60 px-3 py-2 text-[11.5px] leading-relaxed text-ink-faint">
                      Mode:{" "}
                      <span className="font-mono text-ink-dim">
                        {capabilities.generativeAi
                          ? "generative"
                          : "retrieval-only"}
                      </span>
                      {!capabilities.generativeAi
                        ? " — no model provider is configured, so answers quote documents verbatim rather than generating text."
                        : " — answers are synthesised but can only cite sources retrieved server-side."}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {turns.map((turn) => (
                <div key={turn.id} className="space-y-2">
                  {turn.role === "user" ? (
                    <p className="ml-auto max-w-[85%] rounded-lg bg-elevated px-3.5 py-2 text-[13px] text-ink">
                      {turn.text}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <div
                        className={`space-y-2 rounded-lg border px-3.5 py-3 text-[13px] leading-relaxed ${
                          turn.error
                            ? "border-blocked/35 bg-blocked/[0.06] text-blocked"
                            : "border-hairline bg-abyss/70 text-ink-muted"
                        }`}
                      >
                        {turn.text
                          .split("\n")
                          .map((line, i) =>
                            line.trim() === "---" ? (
                              <hr key={i} className="my-3 border-hairline" />
                            ) : (
                              <p key={i}>{formatInline(line)}</p>
                            ),
                          )}
                      </div>

                      {turn.mode ? (
                        <span
                          className="chip border-hairline-strong bg-elevated text-ink-dim"
                          title={
                            turn.mode === "GENERATIVE"
                              ? "A language model wrote this answer from the project records it cited below."
                              : turn.mode === "GENERATIVE_UNGROUNDED"
                                ? "A language model wrote this answer, but the project records do not support it. No citations are shown because none apply."
                                : turn.citations && turn.citations.length > 0
                                  ? "No model was called. These are verbatim excerpts from the corpus."
                                  : "Nothing was retrieved, so no answer was generated."
                          }
                        >
                          {turn.mode === "GENERATIVE"
                            ? "model answered · from records"
                            : turn.mode === "GENERATIVE_UNGROUNDED"
                              ? "model answered · NOT from records"
                              : turn.citations && turn.citations.length > 0
                                ? "verbatim quotes · no model"
                                : "nothing retrieved · no answer"}
                        </span>
                      ) : null}

                      {turn.citations && turn.citations.length > 0 ? (
                        <details className="rounded-md border border-hairline bg-abyss/60 px-3 py-2">
                          <summary className="cursor-pointer text-[11.5px] font-medium text-ink-dim">
                            {turn.citations.length} source
                            {turn.citations.length === 1 ? "" : "s"}
                          </summary>
                          <ul className="mt-2 space-y-1.5">
                            {turn.citations.map((c) => (
                              <li
                                key={`${c.docId}-${c.section}`}
                                className="text-[11.5px] leading-snug"
                              >
                                <span className="font-mono text-cyan">
                                  {c.docTitle}
                                </span>
                                <span className="text-ink-faint">
                                  {" "}
                                  › {c.section}
                                </span>
                                <span className="ml-1.5 chip border-hairline text-ink-faint">
                                  {c.label.replace(/_/g, " ")}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      ) : null}

                      {turn.notice ? (
                        <p className="text-[11px] leading-relaxed text-ink-faint">
                          {turn.notice}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}

              {busy ? (
                <p className="text-[12.5px] text-ink-dim" role="status">
                  Asking the model…
                </p>
              ) : null}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void ask(question);
              }}
              className="flex gap-2 border-t border-hairline px-4 py-3"
            >
              <label htmlFor="ask-ai-input" className="sr-only">
                Ask a question about Raphael
              </label>
              <input
                ref={inputRef}
                id="ask-ai-input"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about the architecture or the evidence…"
                maxLength={1000}
                disabled={busy}
                className="min-w-0 flex-1 rounded-md border border-hairline bg-abyss px-3 py-2 text-[13px] text-ink placeholder:text-ink-faint focus:border-cyan/50 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={busy || !question.trim()}
                className="btn-glow shrink-0 rounded-md border border-cyan/40 bg-cyan/10 px-3.5 py-2 text-[13px] font-medium text-cyan disabled:opacity-40"
              >
                Ask
              </button>
            </form>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}

/** Renders `**bold**` spans without using dangerouslySetInnerHTML. */
function formatInline(line: string) {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-medium text-ink">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}
