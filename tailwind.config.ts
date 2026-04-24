import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // LogBlock colors - using CSS variables for dark mode support
        "lb-base": "var(--lb-base, #f5f0e6)",
        "lb-surface": "var(--lb-surface, #ebe5d5)",
        "lb-surface-2": "var(--lb-surface-2, #dfd8c8)",
        "lb-border": "var(--lb-border, rgba(168, 143, 112, 0.4))",
        "lb-text": "var(--lb-text, #4a3f35)",
        "lb-text-muted": "var(--lb-text-muted, #8b7d6b)",
        "lb-accent-green": "var(--lb-accent-green, #c49a6c)",
        "lb-accent-green-dark": "var(--lb-accent-green-dark, #a67c52)",
        "lb-neon-purple": "var(--lb-neon-purple, #dfd8c8)",
        "lb-mid-purple": "var(--lb-mid-purple, #c49a6c)",
        "lb-action-orange": "var(--lb-action-orange, #b86b4a)",
        "lb-danger-brown": "var(--lb-danger-brown, #8b5a3c)",
        "lb-hover": "var(--lb-hover, #d4c9b5)",
      },
      fontFamily: {
        display: ["Commissioner", "system-ui", "sans-serif"],
        body: ["Commissioner", "system-ui", "sans-serif"],
        brand: ['"Coiny"', "cursive", "sans-serif"],
        mono: ['"Google Sans Code"', "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
  darkMode: "class",
} satisfies Config;
