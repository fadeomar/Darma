import type { Config } from "tailwindcss";

export default {
  darkMode: ["selector", '[data-mode="dark"]'],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/sections/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/core/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0,0,0,0.03)",
        xl: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.02)",
        soft: "var(--positionX) var(--positionY) var(--blur) var(--darkColor), var(--positionXOpposite) var(--positionYOpposite) var(--blur) var(--lightColor)",
        "soft-inset":
          "inset var(--positionX) var(--positionY) var(--blur) var(--darkColor), inset var(--positionXOpposite) var(--positionYOpposite) var(--blur) var(--lightColor)",
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
        /* Legacy aliases — preserved for backward compatibility */
        background: "var(--background)",
        foreground: "var(--foreground)",
        textColor: "var(--textColor)",
        baseColor: "var(--baseColor)",
        darkColor: "var(--darkColor)",
        lightColor: "var(--lightColor)",
        /* Semantic design-system aliases */
        app: {
          bg: "var(--color-app-bg)",
          page: "var(--color-page-bg)",
        },
        surface: {
          base: "var(--color-surface-base)",
          raised: "var(--color-surface-raised)",
          subtle: "var(--color-surface-subtle)",
          inset: "var(--color-surface-inset)",
          overlay: "var(--color-surface-overlay)",
        },
        tx: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          tertiary: "var(--color-text-tertiary)",
          inverse: "var(--color-text-inverse)",
        },
        border: {
          subtle: "var(--color-border-subtle)",
          DEFAULT: "var(--color-border-default)",
          strong: "var(--color-border-strong)",
        },
        action: {
          primary: "var(--color-primary)",
          primaryHover: "var(--color-primary-hover)",
          accent: "var(--color-accent)",
        },
        control: {
          bg: "var(--color-control-bg)",
          hover: "var(--color-control-hover)",
          active: "var(--color-control-active)",
          track: "var(--color-control-track)",
        },
        preview: {
          bg: "var(--color-preview-bg)",
          bgStrong: "var(--color-preview-bg-strong)",
        },
        code: {
          bg: "var(--color-code-bg)",
          text: "var(--color-code-text)",
        },
      },
      borderRadius: {
        soft: "var(--radius)",
      },
    },
  },
  plugins: [],
} satisfies Config;
