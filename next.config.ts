import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Next 16 unified caching model. This implies:
   *   - `export const dynamic` / `revalidate` / `runtime` segment options are
   *     REMOVED. Pages that need per-request data opt in via `cookies()`,
   *     `headers()` or `searchParams`.
   *   - PPR is the default behaviour.
   */
  cacheComponents: true,
  partialPrefetching: true,

  /**
   * Pin the Turbopack root to this project.
   *
   * Without this, Turbopack walks up and finds a stray package-lock.json in the
   * parent home directory, warns about it, and can resolve modules against the
   * wrong tree. Pinning the root removes that class of ambiguity entirely.
   */
  turbopack: {
    root: import.meta.dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;