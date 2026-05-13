import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sat: {
          blue: "#1B4FD8",
          "blue-dark": "#1340B0",
          "blue-light": "#EEF3FF",
          gold: "#F59E0B",
          bg: "#F5F7FF",
          card: "#FFFFFF",
          text: "#1A2340",
          muted: "#6B7B9C",
          border: "#E2E8F5",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 1px 4px 0 rgba(27,79,216,0.06), 0 4px 16px 0 rgba(27,79,216,0.08)",
        "card-sm": "0 1px 3px 0 rgba(27,79,216,0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
