"use client";

import { useState } from "react";
import { componentLabels } from "@/content/research";
import type { ComponentKey } from "@/lib/types";

const COMPONENTS = Object.keys(componentLabels) as ComponentKey[];

/**
 * Suggest-a-paper form.
 *
 * Submissions are validated server-side by /api/suggestions. This component
 * performs the same constraints client-side purely to give fast feedback, and
 * treats the server as authoritative on every field.
 */
export function SuggestPaperForm() {
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "busy" }
    | { kind: "ok"; notice: string }
    | { kind: "error"; message: string; fields?: Record<string, string> }
  >({ kind: "idle" });

  const [form, setForm] = useState({
    title: "",
    identifier: "",
    relevance: "",
    component: "" as ComponentKey | "",
    rationale: "",
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: "busy" });

    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          identifier: form.identifier,
          relevance: form.relevance,
          component: form.component || null,
          rationale: form.rationale,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setState({ kind: "error", message: data?.error ?? "Submission failed.", fields: data?.fields });
        return;
      }

      setState({ kind: "ok", notice: data.notice });
      setForm({ title: "", identifier: "", relevance: "", component: "", rationale: "" });
    } catch {
      setState({ kind: "error", message: "Could not reach the server. Nothing was submitted." });
    }
  }

  const field = (name: string) => state.kind === "error" ? state.fields?.[name] : undefined;

  return (
    <form onSubmit={submit} className="surface flex flex-col gap-4 p-6" noValidate>
      <Field
        id="sug-title"
        label="Paper title"
        error={field("title")}
        value={form.title}
        onChange={(v) => set("title", v)}
        maxLength={200}
        required
      />
      <Field
        id="sug-identifier"
        label="DOI, arXiv ID, or official URL"
        error={field("identifier")}
        value={form.identifier}
        onChange={(v) => set("identifier", v)}
        maxLength={200}
        required
      />
      <Field
        id="sug-relevance"
        label="Proposed relevance"
        textarea
        error={field("relevance")}
        value={form.relevance}
        onChange={(v) => set("relevance", v)}
        maxLength={1000}
        required
      />

      <div>
        <label htmlFor="sug-component" className="mb-1.5 block text-[12px] text-ink-dim">
          Related architecture component <span className="text-ink-faint">(optional)</span>
        </label>
        <select
          id="sug-component"
          value={form.component}
          onChange={(e) => set("component", e.target.value as ComponentKey | "")}
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

      <Field
        id="sug-rationale"
        label="Explanation and supporting reference"
        textarea
        error={field("rationale")}
        value={form.rationale}
        onChange={(v) => set("rationale", v)}
        maxLength={2000}
        required
      />

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={state.kind === "busy"}
          className="btn-glow rounded-md border border-cyan/40 bg-cyan/10 px-4 py-2.5 text-[13.5px] font-medium text-cyan disabled:opacity-50"
        >
          {state.kind === "busy" ? "Submitting…" : "Submit suggestion"}
        </button>
        <span className="text-[11.5px] text-ink-faint">
          Submitted as awaiting review. Never auto-published.
        </span>
      </div>

      <div aria-live="polite">
        {state.kind === "ok" ? (
          <p className="rounded-md border border-ready/35 bg-ready/[0.07] px-3 py-2.5 text-[13px] leading-relaxed text-ready">
            {state.notice}
          </p>
        ) : null}
        {state.kind === "error" ? (
          <p className="rounded-md border border-blocked/35 bg-blocked/[0.07] px-3 py-2.5 text-[13px] leading-relaxed text-blocked">
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  textarea = false,
  maxLength,
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  textarea?: boolean;
  maxLength?: number;
  required?: boolean;
}) {
  const shared = `w-full rounded-md border bg-abyss px-3 py-2.5 text-[13.5px] text-ink placeholder:text-ink-faint focus:outline-none ${
    error ? "border-blocked/60" : "border-hairline focus:border-cyan/50"
  }`;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[12px] text-ink-dim">
        {label}
        {!required ? <span className="text-ink-faint"> (optional)</span> : null}
      </label>
      {textarea ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          rows={3}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${shared} resize-y`}
        />
      ) : (
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={shared}
        />
      )}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-[12px] text-blocked">
          {error}
        </p>
      ) : null}
    </div>
  );
}