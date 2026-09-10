import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--tl-bg)",
        foreground: "var(--tl-fg)",
        surface: "var(--tl-surface)",
        "surface-2": "var(--tl-surface-2)",
        border: "var(--tl-border)",
        muted: "var(--tl-muted)",
        blue: {
          DEFAULT: "var(--tl-blue)",
          light: "var(--tl-blue-light)",
          dim: "var(--tl-blue-dim)",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
