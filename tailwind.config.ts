import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette pulled from the rocket logo: deep black + ice blue.
        ink: "#0a0a0b",
        panel: "#141417",
        edge: "#26262b",
        accent: "#8fc4ff",
        "accent-dim": "#5a90c9",
        muted: "#8a8a93",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
