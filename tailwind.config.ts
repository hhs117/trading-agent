import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          blue: "#0071E3",
          green: "#34C759",
          orange: "#FF9500",
          red: "#FF3B30",
          gray: {
            50: "#F5F5F7",
            100: "#E8E8ED",
            200: "#D2D2D7",
            300: "#86868B",
            900: "#1D1D1F",
          },
        },
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
      },
      boxShadow: {
        soft: "0 1px 3px 0 rgba(0,0,0,0.04), 0 1px 2px 0 rgba(0,0,0,0.03)",
        card: "0 4px 16px -2px rgba(0,0,0,0.06), 0 2px 4px -1px rgba(0,0,0,0.03)",
        hover: "0 8px 24px -4px rgba(0,0,0,0.1), 0 4px 8px -2px rgba(0,0,0,0.04)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Inter",
          "PingFang SC",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
