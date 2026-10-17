import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1.25rem", lg: "2rem" }, screens: { "2xl": "1320px" } },
    extend: {
      colors: {
        ink: { DEFAULT: "#151514", soft: "#2A2927", muted: "#6B6862" },
        bone: { DEFAULT: "#F9F9F8", warm: "#F1EFEA", deep: "#E6E2D9" },
        sand: { DEFAULT: "#C9B79C", dark: "#9C8566" },
        clay: "#B5694B",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: { tightest: "-0.055em" },
      boxShadow: {
        card: "0 1px 2px rgba(21,21,20,0.04), 0 8px 24px -12px rgba(21,21,20,0.12)",
        lift: "0 24px 48px -24px rgba(21,21,20,0.28)",
      },
      keyframes: {
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
      },
      animation: { marquee: "marquee 40s linear infinite" },
    },
  },
  plugins: [],
};

export default config;
