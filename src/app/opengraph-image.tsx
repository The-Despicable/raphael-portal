import { ImageResponse } from "next/og";

/**
 * Social sharing card (LinkedIn, X, Slack, etc.).
 *
 * Rendered at request/build time by `next/og`, so it ships with the app and needs
 * no binary asset in the repository. Wording is deliberately limited to
 * substantiated, non-claiming text: the portal's name and its subject area. It
 * asserts no benchmark, adoption, affiliation, or research result.
 */

export const alt = "Raphael Portal — AI Systems & Security Research";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#04060c",
          backgroundImage:
            "radial-gradient(900px 500px at 12% -10%, rgba(34,211,238,0.20), transparent 60%), radial-gradient(800px 480px at 100% 110%, rgba(139,92,246,0.22), transparent 62%)",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 6,
              background: "linear-gradient(135deg, #22d3ee, #8b5cf6)",
            }}
          />
          <div
            style={{
              fontSize: 26,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "#7dd3fc",
            }}
          >
            Research Portfolio
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 84, fontWeight: 700, color: "#e8eefc", lineHeight: 1.05 }}>
            Raphael Portal
          </div>
          <div style={{ fontSize: 42, color: "#a9b6d4", lineHeight: 1.2 }}>
            AI Systems &amp; Security Research
          </div>
          <div style={{ fontSize: 26, color: "#6f7ea3", lineHeight: 1.35 }}>
            Documented architecture, evidence provenance, and an honest
            statement of what remains unresolved.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(148,163,184,0.22)",
            paddingTop: 26,
            fontSize: 24,
            color: "#8b9ac0",
          }}
        >
          <div>raphael-portal.vercel.app</div>
          <div>Ongoing research · not release-approved</div>
        </div>
      </div>
    ),
    size,
  );
}