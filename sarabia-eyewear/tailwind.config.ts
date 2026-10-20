import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  // El contenedor se define en globals.css: gutter 20/24/32 px sin cambiar el ancho máximo de 1360 px.
  corePlugins: { container: false },
  theme: {
    extend: {
      colors: {
        // Sistema blanco de lujo: lienzo blanco con dos grises cálidos de apoyo y tinta casi negra.
        // Sin azul: el único color de la interfaz es el producto (y el verde de WhatsApp en su icono).
        canvas: { DEFAULT: "#FFFFFF", 2: "#F6F6F3", 3: "#ECECE7" },
        ink: { DEFAULT: "#0B0B0C", 2: "#1F1F22", 3: "#38383C" },
        // Texto secundario sobre blanco (5.4:1); para texto pequeño nunca menos que esto.
        mute: "#6A6A6F",
        whatsapp: { DEFAULT: "#25D366", ink: "#0E7A41" },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: { tightest: "-0.055em" },
      boxShadow: {
        // Sombras de estudio: suaves, cálidas y bajas (nada de halos)
        card: "0 1px 2px rgba(11,11,12,0.06), 0 12px 32px -18px rgba(11,11,12,0.22)",
        lift: "0 30px 60px -30px rgba(11,11,12,0.35)",
        float: "0 2px 6px rgba(11,11,12,0.06), 0 24px 48px -20px rgba(11,11,12,0.28)",
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
        // Indicación de scroll: una luz que baja por una línea fina.
        hint: { from: { transform: "translate3d(0,-100%,0)" }, to: { transform: "translate3d(0,200%,0)" } },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        float: "float 6s ease-in-out infinite",
        "float-shadow": "float-shadow 6s ease-in-out infinite",
        drift: "drift 22s ease-in-out infinite alternate",
        hint: "hint 1.8s cubic-bezier(0.65,0,0.35,1) infinite",
      },
    },
  },
  plugins: [
    // Variantes propias (no "screens": una pantalla "raw" desactiva todas las variantes max-*).
    plugin(({ addVariant }) => {
      // Teléfono en horizontal: el hero se reorganiza en dos columnas para caber en ~390 px de alto.
      addVariant("short", "@media (orientation: landscape) and (max-height: 500px)");
      // Pantalla ancha de verdad (no una tablet vertical de 1024 px): composiciones a dos columnas.
      addVariant("wide", "@media (min-width: 1024px) and (min-aspect-ratio: 11/10)");
    }),
  ],
};

export default config;
