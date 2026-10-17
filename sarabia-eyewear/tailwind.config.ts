import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1.25rem", lg: "2rem" }, screens: { "2xl": "1360px" } },
    extend: {
      colors: {
        // Fondo cinematográfico: negro azulado, en tres niveles de superficie.
        night: { DEFAULT: "#04070E", 2: "#0A1222", 3: "#111C33" },
        // Texto y superficies claras (blanco frío).
        paper: "#E9EFF9",
        // Acento: azul eléctrico de la luz de campaña.
        volt: { DEFAULT: "#2D6BFF", deep: "#1747D6", soft: "#5C8DFF", ice: "#A8C6FF" },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: { tightest: "-0.055em" },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.3), 0 18px 40px -24px rgba(0,0,0,0.7)",
        lift: "0 40px 80px -40px rgba(0,0,0,0.85)",
        glow: "0 12px 40px -12px rgba(45,107,255,0.75)",
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
