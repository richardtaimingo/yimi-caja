import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1.25rem", lg: "2rem" }, screens: { "2xl": "1360px" } },
    extend: {
      colors: {
        // Fondo editorial: negro con un matiz ciruela, en tres niveles de superficie.
        night: { DEFAULT: "#120D10", 2: "#1B1418", 3: "#261D22" },
        // Texto y superficies claras.
        paper: "#F6F1EA",
        // Acento: amarillo intenso de los bloques de color.
        sun: { DEFAULT: "#F6B40E", deep: "#DE9E00", soft: "#FFD45C" },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "Times New Roman", "serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: { tightest: "-0.055em" },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.3), 0 18px 40px -24px rgba(0,0,0,0.7)",
        lift: "0 40px 80px -40px rgba(0,0,0,0.85)",
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
