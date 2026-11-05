/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#16834a",
          foreground: "#ffffff",
        },
        navy: {
          DEFAULT: "#174a7e",
          foreground: "#ffffff",
        },
        success: {
          DEFAULT: "#17804a",
          foreground: "#ffffff",
        },
        warning: {
          DEFAULT: "#b45309",
          foreground: "#ffffff",
        },
        info: {
          DEFAULT: "#1f6fb2",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#b42318",
          foreground: "#ffffff",
        },
        background: "#ffffff",
        foreground: "#17251e",
        card: "#ffffff",
        "card-foreground": "#17251e",
        popover: "#ffffff",
        "popover-foreground": "#17251e",
        muted: "#f5f7f6",
        "muted-foreground": "#5b6b62",
        border: "#dfe8e2",
        input: "#dfe8e2",
        ring: "#16834a",
        mint: "#eaf5ee",
        sky: "#eff4fa",
        sand: "#f5f7f6",
        secondary: {
          DEFAULT: "#eff4fa",
          foreground: "#174a7e",
        },
        chart: {
          1: "#16834a",
          2: "#174a7e",
          3: "#1f6fb2",
          4: "#b45309",
          5: "#5b6b62",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xs: "calc(1px * var(--radius-xs))",
        sm: "calc(2px * var(--radius-sm))",
        md: "calc(3px * var(--radius-md))",
        lg: "calc(4px * var(--radius-lg))",
        xl: "calc(6px * var(--radius-xl))",
        "2xl": "calc(8px * var(--radius-2xl))",
        "3xl": "calc(12px * var(--radius-3xl))",
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
}