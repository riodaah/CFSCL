import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Identidad CFS: rojo del logo y verde de la hoja/globo
        brand: {
          50: "#fdecec",
          100: "#fbd2d1",
          500: "#e3120b",
          600: "#c80f0a",
          700: "#a10d09",
        },
        leaf: {
          50: "#e8f3ec",
          100: "#cfe6d8",
          500: "#0c7438",
          600: "#0a6230",
          700: "#084d26",
          900: "#06301a",
        },
        ink: {
          50: "#f5f7f6",
          100: "#eceeed",
          200: "#dde1df",
          300: "#c3c9c6",
          400: "#8d9792",
          500: "#66706b",
          600: "#4b5450",
          700: "#343b38",
          800: "#232826",
          900: "#151917",
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
        display: ['"Archivo"', '"IBM Plex Sans"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(21,25,23,.04), 0 1px 3px rgba(21,25,23,.06)",
      },
    },
  },
  plugins: [],
};

export default config;
