import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  // El contenedor se define en globals.css: gutter 20/24/32 px sin cambiar el ancho máximo de 1360 px.
  corePlugins: { container: false },
  theme: {
    extend: {
      colors: {
        // Fondo: tinta azul casi negra, en tres niveles de superficie.
        night: { DEFAULT: "#03050B", 2: "#070B16", 3: "#0C1324" },
        // Texto (blanco frío).
        paper: "#EEF2F8",
        // Luz de campaña. DEFAULT es el cobalto del CTA de acento; ice, el azul claro de detalles.
        volt: { DEFAULT: "#2F5BEA", deep: "#1B47C9", soft: "#86A8FF", ice: "#B9CCFF" },
        // Blanco hielo: botón principal, foco y brillos especulares.
        ice: "#E8EEFF",
        cobalt: { 950: "#050E2E", 800: "#0B2470", 600: "#1B47C9", 500: "#2F5BEA" },
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
        glow: "0 12px 28px -12px rgba(27,71,201,0.8)",
      },
      keyframes: {
        marquee: { from: { transform: "translate3d(0,0,0)" }, to: { transform: "translate3d(-50%,0,0)" } },
        // Levitación y su sombra de contacto: sólo transform/opacity (las anima el compositor).
        float: { "0%, 100%": { transform: "translate3d(0,0,0)" }, "50%": { transform: "translate3d(0,-12px,0)" } },
        "float-shadow": {
          "0%, 100%": { transform: "scale3d(1,1,1)", opacity: "0.9" },
          "50%": { transform: "scale3d(0.86,0.8,1)", opacity: "0.55" },
        },
        drift: {
          from: { transform: "translate3d(-1.5%,1%,0) scale(1)" },
          to: { transform: "translate3d(2%,-1.5%,0) scale(1.06)" },
        },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        float: "float 6s ease-in-out infinite",
        "float-shadow": "float-shadow 6s ease-in-out infinite",
        drift: "drift 22s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [],
};

export default config;
