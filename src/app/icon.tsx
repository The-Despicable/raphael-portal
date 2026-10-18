import { ImageResponse } from "next/og";

/**
 * Favicon.
 *
 * A neutral geometric mark in the portal's own palette — no wordmark, no claim of
 * identity or affiliation. Generated from code so no binary asset is committed.
 */

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#04060c",
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            background: "linear-gradient(135deg, #22d3ee, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              background: "#04060c",
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}