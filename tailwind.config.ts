import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        terrain: {
          night: "var(--color-terrain-night)",
          deep: "var(--color-terrain-deep)",
          surface: "var(--color-terrain-surface)",
          mist: "var(--color-terrain-mist)",
          stone: "var(--color-terrain-stone)",
        },
        trail: {
          DEFAULT: "var(--color-trail)",
          glow: "var(--color-trail-glow)",
        },
        summit: "var(--color-summit)",
        sky: "var(--color-sky)",
        sunrise: "var(--color-sunrise)",
        snow: "var(--color-snow)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        elevated: "var(--shadow-elevated)",
      },
      backdropBlur: {
        glass: "20px",
      },
    },
  },
  plugins: [],
};

export default config;
