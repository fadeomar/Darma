import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./sections/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0,0,0,0.03)",
        xl: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.02)",
      },
      animation: {
        "pulse-category": "pulseGlow 2s infinite ease-in-out",
      },
      gridTemplateColumns: {
        "5": "repeat(5, minmax(0, 1fr))",
        "4": "repeat(4, minmax(0, 1fr))",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": {
            transform: "scale(1)",
            boxShadow: "0 0 5px rgba(0, 0, 0, 0.1)",
          },
          "50%": {
            transform: "scale(1.03  )",
            boxShadow: "0 0 12px rgba(255, 255, 255, 0.5)",
          },
        },
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
} satisfies Config;
