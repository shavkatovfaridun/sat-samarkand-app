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
        blue: {
          DEFAULT: "#1B4FD8",
          deep:    "#1340B0",
          light:   "#EEF3FF",
          50:      "#F0F4FF",
          100:     "#E0EBFF",
        },
        label:  "#1C1C1E",
        "label-2": "rgba(60,60,67,0.60)",
        "label-3": "rgba(60,60,67,0.30)",
        bg:     "#F2F2F7",
        "bg-2": "#E5E5EA",
        fill:   "rgba(120,120,128,0.12)",
        sep:    "rgba(60,60,67,0.12)",
        ios: {
          green:  "#34C759",
          red:    "#FF3B30",
          orange: "#FF9500",
          blue:   "#007AFF",
        },
      },
      borderRadius: {
        "xl":  "12px",
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
      boxShadow: {
        card:    "0 1px 0 rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.07)",
        "card-sm":"0 1px 0 rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.05)",
        "card-lg":"0 2px 0 rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.10)",
        "tab-bar":"0 -1px 0 rgba(0,0,0,0.06)",
      },
      fontSize: {
        "2xs": ["10px", "14px"],
        "xs":  ["12px", "16px"],
        "sm":  ["14px", "20px"],
        "md":  ["15px", "22px"],
        "base":["16px", "24px"],
        "lg":  ["18px", "26px"],
        "xl":  ["20px", "28px"],
        "2xl": ["24px", "32px"],
        "3xl": ["30px", "38px"],
        "4xl": ["38px", "46px"],
        "5xl": ["48px", "1"],
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-top":    "env(safe-area-inset-top)",
      },
      backdropBlur: {
        xs: "4px",
        sm: "8px",
        DEFAULT: "12px",
        md: "16px",
        lg: "24px",
        xl: "40px",
      },
    },
  },
  plugins: [],
};
export default config;
