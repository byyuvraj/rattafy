import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#000000",
        surface: {
          DEFAULT: "#111111",
          elevated: "#171717",
          subtle: "#1c1c1c",
          muted: "#262626",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.08)",
          hover: "rgba(255, 255, 255, 0.18)",
          focus: "rgba(255, 255, 255, 0.35)",
        },
        accent: {
          blue: "#4da2ff",
          green: "#22c55e",
          amber: "#f59e0b",
          gold: "#eab308",
        },
        foreground: {
          DEFAULT: "#ededed",
          secondary: "#a1a1a1",
          muted: "#737373",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      borderRadius: {
        card: "12px",
        btn: "8px",
      },
      boxShadow: {
        glow: "0 0 50px -10px rgba(77, 162, 255, 0.15)",
        card: "0 8px 30px rgba(0, 0, 0, 0.6)",
      },
      keyframes: {
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "pulse-subtle": "pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
