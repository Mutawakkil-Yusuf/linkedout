import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fdf8f3",
        }}
      >
        <svg width="192" height="192" viewBox="0 0 100 100">
          <mask id="m">
            <rect x="4" y="4" width="92" height="92" rx="22" fill="#fff" />
            <rect x="70" y="38" width="40" height="24" rx="12" fill="#000" />
          </mask>
          <rect x="4" y="4" width="92" height="92" rx="22" fill="#e8571f" mask="url(#m)" />
        </svg>
      </div>
    ),
    { width: 192, height: 192 }
  );
}
