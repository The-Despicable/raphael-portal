"use client";

import { useCallback, useEffect, useState } from "react";
import { Flag, Star } from "lucide-react";
import type { ComponentKey, ReviewCategory, ReviewPublic } from "@/lib/types";
import { componentLabels } from "@/content/research";

const CATEGORIES: { value: ReviewCategory; label: string }[] = [
  { value: "PROJECT_OVERVIEW", label: "Project overview" },
  { value: "ARCHITECTURE", label: "Architecture" },
  { value: "RESEARCH_LIBRARY", label: "Research library" },
  { value: "DOCUMENTATION", label: "Documentation" },
  { value: "CONTRIBUTION_EXPERIENCE", label: "Contribution experience" },
  { value: "OTHER", label: "Other" },
];

const COMPONENTS = Object.keys(componentLabels) as ComponentKey[];

const PAGE_SIZE = 6;

/**
 * Reviews and feedback.
 *
 * LABELING RULE
 * -------------
 * Every published review is shown as visitor feedback. The list header says so,
 * and no aggregate average is displayed anywhere. A star average across
 * anonymous, unmoderated submissions would read as a project metric, and it is
 * not one.
 */
export function Reviews() {
  const [reviews, setReviews] = useState<ReviewPublic[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadedMore, setLoadedMore] = useState(false);

  const load = useCallback(
    async (nextOffset: number, replace: boolean) => {
      try {
        const res = await fetch(`/api/reviews?limit=${PAGE_SIZE}&offset=${nextOffset}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setReviews((prev) => (replace ? (data.items ?? []) : [...prev, ...(data.items ?? [])]));
        setTotal(data.total ?? 0);
        setNotice(data.notice ?? null);
        setOffset(nextOffset);
        setLoadedMore(true);
      } catch {
        setNotice("Could not load reviews. The server may be unavailable.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    // First statement awaits, so no state is set synchronously in the effect.
    (async () => {
      await Promise.resolve();
      if (!cancelled) await load(0, true);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* ---------------- list ---------------- */}
      <div className="space-y-4">
        <div className="surface p-5">
          <h3 className="text-[14px] font-semibold text-ink">Visitor feedback</h3>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">
            These are <span className="text-ink">user-generated reviews</span> from anonymous guests.
            They are not scientific validation, not an official project position, and not an
            endorsement. No aggregate score is shown, because an average over anonymous unmoderated
            submissions would misrepresent itself as a project metric.
          </p>
          {notice ? (
            <p className="mt-3 rounded-md border border-conditional/30 bg-conditional/[0.05] px-3 py-2 text-[12px] leading-relaxed text-ink-muted">
              {notice}
            </p>
          ) : null}
        </div>

        {loading ? (
          <p className="py-8 text-center text-[13px] text-ink-dim" role="status">
            Loading reviews…
          </p>
        ) : reviews.length === 0 ? (
          <div className="surface flex flex-col items-center gap-2 px-6 py-12 text-center">
            <p className="text-[14px] font-medium text-ink">No published reviews yet.</p>
            <p className="max-w-sm text-[13px] leading-relaxed text-ink-muted">
              Nothing is fabricated to fill this space. Be the first to leave honest feedback.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {reviews.map((r) => (
              <li key={r.id}>
                <article className="surface p-5 transition-colors hover:border-hairline-strong">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      {r.nickname ? (
                        <>
                          <span
                            aria-hidden
                            className="flex size-6 items-center justify-center rounded-full border text-[10px] font-semibold"
                            style={{
                              color: "#22d3ee",
                              borderColor: "#22d3ee55",
                              background: "#22d3ee14",
                            }}
                          >
                            {r.nickname.trim()[0]?.toUpperCase()}
                          </span>
                          <span className="text-[12.5px] text-ink-muted">{r.nickname}</span>
                        </>
                      ) : (
                        <span className="text-[12.5px] text-ink-faint">Anonymous</span>
                      )}
                      <time dateTime={r.createdAt} className="font-mono text-[10.5px] text-ink-faint">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </time>
                    </div>

                    <div className="flex items-center gap-3">
                      {r.rating ? <Rating value={r.rating} /> : null}
                      <button
                        type="button"
                        onClick={async () => {
                          const reason = window.prompt("Why are you reporting this review?");
                          if (!reason) return;
                          await fetch("/api/reports", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ targetKind: "REVIEW", targetId: r.id, reason }),
                          }).catch(() => null);
                          setNotice("Report recorded. Thank you.");
                        }}
                        className="rounded p-1 text-ink-faint transition-colors hover:text-blocked"
                        title="Report this review"
                      >
                        <Flag size={12} aria-hidden />
                        <span className="sr-only">Report review</span>
                      </button>
                    </div>
                  </div>

                  <h4 className="mt-3 text-[14px] font-semibold text-ink">{r.title}</h4>
                  <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-muted">
                    {r.body}
                  </p>

                  <div className="mt-3.5 flex flex-wrap gap-2">
                    <span className="rounded-full border border-hairline px-2.5 py-1 text-[10.5px] uppercase tracking-[0.06em] text-ink-dim">
                      {r.category.replaceAll("_", " ").toLowerCase()}
                    </span>
                    {r.component ? (
                      <span className="rounded-full border border-hairline px-2.5 py-1 text-[10.5px] uppercase tracking-[0.06em] text-ink-dim">
                        {componentLabels[r.component]}
                      </span>
                    ) : null}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}

        {loadedMore && offset + PAGE_SIZE < total ? (
          <button
            type="button"
            onClick={() => void load(offset + PAGE_SIZE, false)}
            className="w-full rounded-md border border-hairline px-4 py-2.5 text-[13px] text-ink-muted transition-colors hover:border-hairline-strong hover:text-ink"
          >
            Load more reviews ({total - offset - PAGE_SIZE} remaining)
          </button>
        ) : null}
      </div>

      {/* ---------------- form ---------------- */}
      <ReviewForm />
    </div>
  );
}

/** Rating display is text-backed, never colour-only. */
function Rating({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-1" title={`${value} out of 5`}>
      <span className="sr-only">{value} out of 5</span>
      <span aria-hidden className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={11}
            className={i <= value ? "fill-conditional text-conditional" : "text-ink-faint"}
          />
        ))}
      </span>
      <span aria-hidden className="font-mono text-[10.5px] text-ink-dim">
        {value}/5
      </span>
    </span>
  );
}

function ReviewForm() {
  const [rating, setRating] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "busy" }
    | { kind: "ok"; notice: string }
    | { kind: "error"; message: string; fields?: Record<string, string> }
  >({ kind: "idle" });

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ kind: "busy" });

    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.get("title"),
          body: data.get("body"),
          rating,
          category: data.get("category"),
          component: data.get("component") || null,
        }),
      });
      const payload = await res.json();

      if (!res.ok) {
        setState({
          kind: "error",
          message: payload?.error ?? "Submission failed.",
          fields: payload?.fields,
        });
        return;
      }

      setState({ kind: "ok", notice: payload.notice });
      e.currentTarget.reset();
      setRating(null);
    } catch {
      setState({ kind: "error", message: "Could not reach the server. Nothing was submitted." });
    }
  }

  const field = (name: string) => (state.kind === "error" ? state.fields?.[name] : undefined);
  const shown = hover ?? rating;

  return (
    <form onSubmit={submit} className="surface flex flex-col gap-4 p-5" noValidate>
      <div>
        <h3 className="text-[14px] font-semibold text-ink">Leave feedback</h3>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-dim">
          Uses your guest nickname. No account required. Your nickname is shown on the published
          review.
        </p>
      </div>

      <fieldset>
        <legend className="mb-2 text-[11.5px] text-ink-dim">
          Rating <span className="text-ink-faint">(optional)</span>
        </legend>
        <div
          className="flex items-center gap-1.5"
          onMouseLeave={() => setHover(null)}
          role="radiogroup"
          aria-label="Optional rating out of five"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} out of 5`}
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(rating === n ? null : n)}
              className="rounded p-0.5 transition-transform hover:scale-110"
            >
              <Star
                size={18}
                className={
                  n <= (shown ?? 0) ? "fill-conditional text-conditional" : "text-ink-faint"
                }
              />
            </button>
          ))}
          <span className="ml-2 font-mono text-[11px] text-ink-faint">
            {rating ? `${rating}/5` : "not rated"}
          </span>
        </div>
      </fieldset>

      <div>
        <label htmlFor="rev-title" className="mb-1.5 block text-[11.5px] text-ink-dim">
          Title
        </label>
        <input
          id="rev-title"
          name="title"
          required
          minLength={3}
          maxLength={120}
          aria-invalid={Boolean(field("title"))}
          className={`w-full rounded-md border bg-abyss px-3 py-2.5 text-[13.5px] text-ink focus:outline-none ${
            field("title") ? "border-blocked/60" : "border-hairline focus:border-cyan/50"
          }`}
        />
        {field("title") ? (
          <p className="mt-1.5 text-[12px] text-blocked">{field("title")}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="rev-body" className="mb-1.5 block text-[11.5px] text-ink-dim">
          Feedback
        </label>
        <textarea
          id="rev-body"
          name="body"
          required
          minLength={10}
          maxLength={4000}
          rows={5}
          placeholder="What is accurate? What is missing? What did this site get wrong?"
          aria-invalid={Boolean(field("body"))}
          className={`w-full resize-y rounded-md border bg-abyss px-3 py-2.5 text-[13.5px] text-ink placeholder:text-ink-faint focus:outline-none ${
            field("body") ? "border-blocked/60" : "border-hairline focus:border-cyan/50"
          }`}
        />
        {field("body") ? <p className="mt-1.5 text-[12px] text-blocked">{field("body")}</p> : null}
      </div>

      <div>
        <label htmlFor="rev-category" className="mb-1.5 block text-[11.5px] text-ink-dim">
          Category
        </label>
        <select
          id="rev-category"
          name="category"
          defaultValue="PROJECT_OVERVIEW"
          className="w-full rounded-md border border-hairline bg-abyss px-3 py-2.5 text-[13.5px] text-ink focus:border-cyan/50 focus:outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="rev-component" className="mb-1.5 block text-[11.5px] text-ink-dim">
          Component <span className="text-ink-faint">(optional)</span>
        </label>
        <select
          id="rev-component"
          name="component"
          defaultValue=""
          className="w-full rounded-md border border-hairline bg-abyss px-3 py-2.5 text-[13.5px] text-ink focus:border-cyan/50 focus:outline-none"
        >
          <option value="">No specific component</option>
          {COMPONENTS.map((c) => (
            <option key={c} value={c}>
              {componentLabels[c]}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={state.kind === "busy"}
        className="btn-glow rounded-md border border-cyan/40 bg-cyan/10 px-4 py-2.5 text-[13.5px] font-medium text-cyan disabled:opacity-50"
      >
        {state.kind === "busy" ? "Submitting…" : "Submit feedback"}
      </button>

      <div aria-live="polite">
        {state.kind === "ok" ? (
          <p className="rounded-md border border-ready/35 bg-ready/[0.07] px-3 py-2.5 text-[12.5px] leading-relaxed text-ready">
            {state.notice}
          </p>
        ) : null}
        {state.kind === "error" ? (
          <p className="rounded-md border border-blocked/35 bg-blocked/[0.07] px-3 py-2.5 text-[12.5px] leading-relaxed text-blocked">
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}