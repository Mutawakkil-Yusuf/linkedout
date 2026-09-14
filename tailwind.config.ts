import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#fdf8f3",
        "paper-2": "#f7ece0",
        card: "#ffffff",
        ink: "#1c1613",
        "ink-2": "#4a3f38",
        muted: "#8a7a6d",
        line: "#efe4d6",
        "line-2": "#e6d8c6",
        flame: {
          DEFAULT: "#e8571f",
          hi: "#ff6a2c",
          deep: "#c94410",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "Menlo", "monospace"],
      },
      borderRadius: { card: "18px", soft: "14px" },
      boxShadow: { card: "0 1px 2px rgba(28,22,19,0.04)" },
    },
  },
  plugins: [],
} satisfies Config;
